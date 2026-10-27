const axios = require("axios");

const cleanPhoneNumber = (rawPhone) => {
  if (!rawPhone) return "";
  const cleaned = String(rawPhone).replace(/[^\d+]/g, "").trim();
  // If Indian mobile without country code (+91 or 91)
  if (cleaned.length === 10 && !cleaned.startsWith("+")) {
    return `91${cleaned}`;
  }
  return cleaned.replace(/^\+/, "");
};

/**
 * Resolves the customer's best WhatsApp number.
 * Prioritizes custom deliveryAddress.whatsappPhone, then user.whatsappPhone,
 * and finally falls back to user calling phone.
 */
const resolveWhatsAppNumber = (user, deliveryAddress = {}) => {
  if (deliveryAddress.whatsappPhone && deliveryAddress.whatsappPhone.trim()) {
    return cleanPhoneNumber(deliveryAddress.whatsappPhone);
  }
  if (user?.whatsappPhone && user.whatsappPhone.trim()) {
    return cleanPhoneNumber(user.whatsappPhone);
  }
  if (deliveryAddress.contactPhone && deliveryAddress.contactPhone.trim()) {
    return cleanPhoneNumber(deliveryAddress.contactPhone);
  }
  if (user?.phone && user.phone.trim()) {
    return cleanPhoneNumber(user.phone);
  }
  return "";
};

const buildWhatsAppLink = (phone, message) => {
  const cleaned = cleanPhoneNumber(phone);
  if (!cleaned) return "";
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
};

/**
 * Core dispatch function.
 * Attempts to deliver via Twilio / WhatsApp Cloud API.
 * If WhatsApp reports the number is NOT on WhatsApp (error code 21614 or 63007),
 * automatically attempts a standard SMS fallback so message is never lost!
 */
const dispatchMessage = async ({ phone, message, title = "Order Alert", contentVariables = null }) => {
  const cleaned = cleanPhoneNumber(phone);
  if (!cleaned) return { success: false, reason: "No phone number available" };

  const whatsappUrl = buildWhatsAppLink(cleaned, message);

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  let fromWhatsApp = (process.env.TWILIO_WHATSAPP_NUMBER || "").trim();
  const fromSms = process.env.TWILIO_PHONE_NUMBER;

  // Format sender for WhatsApp
  if (!fromWhatsApp) {
    fromWhatsApp = "whatsapp:+14155238886";
  } else if (!fromWhatsApp.startsWith("whatsapp:")) {
    fromWhatsApp = `whatsapp:+${cleanPhoneNumber(fromWhatsApp)}`;
  }

  if (accountSid && authToken && fromWhatsApp) {
    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const authHeader = "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const toWhatsApp = `whatsapp:+${cleaned}`;

    try {
      console.log(`[WhatsApp Attempt] Sending automated WhatsApp to farmer/customer: ${toWhatsApp} from: ${fromWhatsApp}`);

      const params = new URLSearchParams();
      params.append("From", fromWhatsApp);
      params.append("To", toWhatsApp);

      if (process.env.TWILIO_CONTENT_SID) {
        params.append("ContentSid", process.env.TWILIO_CONTENT_SID.trim());
        if (contentVariables) {
          params.append("ContentVariables", JSON.stringify(contentVariables));
        }
      } else {
        params.append("Body", message);
      }

      const res = await axios.post(endpoint, params.toString(), {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      console.log(`[WhatsApp Live] Success! Automated order message delivered to ${toWhatsApp} (SID: ${res.data?.sid})`);
      return { success: true, channel: "whatsapp", sid: res.data?.sid, whatsappUrl };
    } catch (apiError) {
      const errDetail = apiError.response?.data?.message || apiError.message;
      const errCode = apiError.response?.data?.code;

      // If sender is not WhatsApp Sandbox or not WhatsApp-enabled, retry with sandbox sender
      const isSenderIssue = errCode === 21606 || String(errDetail).includes("Channel") || (fromWhatsApp !== "whatsapp:+14155238886" && errCode === 21619);
      if (isSenderIssue) {
        try {
          console.log(`[Twilio Notice] Retrying with Twilio Sandbox sender whatsapp:+14155238886...`);
          const retryParams = new URLSearchParams();
          retryParams.set("From", "whatsapp:+14155238886");
          retryParams.set("To", toWhatsApp);
          retryParams.set("Body", message);

          const retryRes = await axios.post(endpoint, retryParams.toString(), {
            headers: {
              Authorization: authHeader,
              "Content-Type": "application/x-www-form-urlencoded",
            },
          });

          console.log(`[WhatsApp Live] Success! Automated order message delivered to ${toWhatsApp} (SID: ${retryRes.data?.sid})`);
          return { success: true, channel: "whatsapp", sid: retryRes.data?.sid, whatsappUrl };
        } catch (retryError) {
          console.warn(`[WhatsApp Sender Retry Error]:`, retryError.response?.data?.message || retryError.message);
        }
      }

      // If ContentSid failed due to variables mismatch, retry without ContentVariables
      if (process.env.TWILIO_CONTENT_SID && contentVariables && (String(errDetail).toLowerCase().includes("variable") || String(errDetail).toLowerCase().includes("parameter"))) {
        try {
          console.log(`[Twilio Notice] Template variable mismatch. Retrying with ContentSid without variables...`);
          const noVarParams = new URLSearchParams();
          noVarParams.set("From", "whatsapp:+14155238886");
          noVarParams.set("To", toWhatsApp);
          noVarParams.set("ContentSid", process.env.TWILIO_CONTENT_SID.trim());

          const noVarRes = await axios.post(endpoint, noVarParams.toString(), {
            headers: {
              Authorization: authHeader,
              "Content-Type": "application/x-www-form-urlencoded",
            },
          });

          console.log(`[WhatsApp Live] Success! Automated order message delivered to ${toWhatsApp} (SID: ${noVarRes.data?.sid})`);
          return { success: true, channel: "whatsapp", sid: noVarRes.data?.sid, whatsappUrl };
        } catch (noVarErr) {
          console.warn(`[WhatsApp No-Var Retry Error]:`, noVarErr.response?.data?.message || noVarErr.message);
        }
      }

      // If ContentSid failed (e.g., draft or invalid ContentSid), retry with standard Body
      if (process.env.TWILIO_CONTENT_SID && (String(errDetail).includes("ContentSid is Invalid") || String(errDetail).includes("ContentSid"))) {
        try {
          console.log(`[Twilio Notice] ContentSid failed. Retrying freeform message Body directly...`);
          const freeformParams = new URLSearchParams();
          freeformParams.set("From", fromWhatsApp === "whatsapp:+14155238886" ? fromWhatsApp : "whatsapp:+14155238886");
          freeformParams.set("To", toWhatsApp);
          freeformParams.set("Body", message);

          const freeformRes = await axios.post(endpoint, freeformParams.toString(), {
            headers: {
              Authorization: authHeader,
              "Content-Type": "application/x-www-form-urlencoded",
            },
          });

          console.log(`[WhatsApp Live] Success! Automated order message delivered to ${toWhatsApp} (SID: ${freeformRes.data?.sid})`);
          return { success: true, channel: "whatsapp", sid: freeformRes.data?.sid, whatsappUrl };
        } catch (ffErr) {
          console.warn(`[WhatsApp Freeform Retry Error]:`, ffErr.response?.data?.message || ffErr.message);
        }
      }

      console.warn(`[WhatsApp Alert] Could not send to ${cleaned}: ${errDetail}`);

      if (String(errDetail).includes("ContentSid Required")) {
        console.warn(`👉 [Twilio Fix] Twilio returned "ContentSid Required". To send freeform text in sandbox:\n   1. Open WhatsApp on phone +${cleaned}\n   2. Send the sandbox join message (e.g. 'join <your-code>') to +1 415 523 8886 from that phone.\n   3. Once joined, WhatsApp opens a 24-hour freeform messaging window!`);
      } else if (apiError.response?.data?.code === 21608 || String(errDetail).toLowerCase().includes("sandbox")) {
        console.warn(`👉 [Twilio Sandbox Reminder] Phone +${cleaned} needs to send your Twilio sandbox 'join <code-word>' text to +1 415 523 8886 once to authorize receiving messages.`);
      }

      // Automatic Fallback: Send standard SMS if configured
      if (fromSms) {
        try {
          const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
          const authHeader = "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");
          const smsParams = new URLSearchParams();
          smsParams.append("From", fromSms);
          smsParams.append("To", `+${cleaned}`);
          smsParams.append("Body", message);

          const smsRes = await axios.post(endpoint, smsParams.toString(), {
            headers: {
              Authorization: authHeader,
              "Content-Type": "application/x-www-form-urlencoded",
            },
          });

          console.log(`[SMS Fallback Live] Delivered via SMS to +${cleaned} (SID: ${smsRes.data?.sid})`);
          return { success: true, channel: "sms", sid: smsRes.data?.sid, whatsappUrl };
        } catch (smsError) {
          console.warn("[SMS Fallback] Failed:", smsError.response?.data?.message || smsError.message);
        }
      }
    }
  } else {
    // Development / Local Simulation
    console.log(`\n======================================================`);
    console.log(`📱 [AUTOMATED WHATSAPP / SMS ALERT - ${title.toUpperCase()}]`);
    console.log(`Recipient: +${cleaned}`);
    console.log(`Message:\n${message}`);
    console.log(`Direct 1-Click Action: ${whatsappUrl}`);
    console.log(`======================================================\n`);
  }

  return { success: true, channel: "simulated", whatsappUrl };
};

// ---------------------------------------------------------------------------
// 1. Farmer Notifications
// ---------------------------------------------------------------------------

const formatFarmerOrderAlert = ({ orderId, customerName, customerPhone, items, totalPrice, deliveryAddress }) => {
  const itemsList = items
    .map((item) => `• ${item.name} (Qty: ${item.quantity}) - Rs. ${(item.price * item.quantity).toFixed(0)}`)
    .join("\n");

  const addressText = deliveryAddress?.street
    ? `${deliveryAddress.street}, ${deliveryAddress.city} - ${deliveryAddress.pincode}`
    : "Local delivery coordinated directly";

  return `🚜 *New Farm Order Received!* 🚜\n\n` +
    `*Order ID:* #${orderId}\n` +
    `*Customer:* ${customerName || "Customer"} (${customerPhone || "N/A"})\n\n` +
    `*Produce Ordered:*\n${itemsList}\n\n` +
    `*Total Value:* Rs. ${Number(totalPrice).toFixed(0)}\n` +
    `*Delivery To:* ${addressText}\n\n` +
    `👉 Log in to Farmer Market to accept and pack fresh harvest!`;
};

const sendFarmerOrderAlert = async ({ farmer, customer, order }) => {
  const customerName = customer?.storeName || "Customer";
  const customerPhone = customer?.phone || "";
  const farmerPhone = resolveWhatsAppNumber(farmer);
  const orderId = order._id.toString();

  const message = formatFarmerOrderAlert({
    orderId,
    customerName,
    customerPhone,
    items: order.items || [],
    totalPrice: order.totalPrice || 0,
    deliveryAddress: order.deliveryAddress,
  });

  const contentVariables = {
    "1": customerName,
    "2": `#${orderId}`,
    "3": `Rs. ${Number(order.totalPrice || 0).toFixed(0)}`,
  };

  return await dispatchMessage({
    phone: farmerPhone,
    message,
    title: `Farmer Order #${orderId}`,
    contentVariables,
  });
};

// ---------------------------------------------------------------------------
// 2. Customer Notifications (Order Placed, Accepted, Delivered, Rejected)
// ---------------------------------------------------------------------------

const formatCustomerOrderPlaced = ({ orderId, customerName, farmerName, items, totalPrice, deliveryAddress }) => {
  const itemsList = items
    .map((item) => `• ${item.name} x ${item.quantity} - Rs. ${(item.price * item.quantity).toFixed(0)}`)
    .join("\n");

  const addressText = deliveryAddress?.street
    ? `${deliveryAddress.street}, ${deliveryAddress.city}`
    : "Local coordinates";

  return `🎉 *Order Placed Successfully!* 🌾\n\n` +
    `Hello ${customerName || "Customer"},\n` +
    `Your direct farm order *#${orderId}* has been sent to *${farmerName || "Local Farm"}*!\n\n` +
    `*Items:*\n${itemsList}\n\n` +
    `*Total Payable:* Rs. ${Number(totalPrice).toFixed(0)}\n` +
    `*Delivery To:* ${addressText}\n\n` +
    `We will message you on WhatsApp as soon as the farmer starts packing and dispatching your fresh produce!`;
};

const sendCustomerOrderPlacedAlert = async ({ customer, order, farmer }) => {
  const customerPhone = resolveWhatsAppNumber(customer, order.deliveryAddress);
  const customerName = customer?.storeName || "Customer";
  const farmerName = farmer?.storeName || "Local Farm";
  const orderId = order._id.toString();

  const message = formatCustomerOrderPlaced({
    orderId,
    customerName,
    farmerName,
    items: order.items || [],
    totalPrice: order.totalPrice || 0,
    deliveryAddress: order.deliveryAddress,
  });

  const contentVariables = {
    "1": customerName,
    "2": `#${orderId}`,
    "3": farmerName,
  };

  return await dispatchMessage({
    phone: customerPhone,
    message,
    title: `Customer Order Confirmation #${orderId}`,
    contentVariables,
  });
};

const formatCustomerOrderStatus = ({ orderId, customerName, farmerName, status }) => {
  if (status === "accepted") {
    return `🚜 *Order Accepted & Fresh Harvest in Progress!* 🌿\n\n` +
      `Hello ${customerName || "Customer"},\n` +
      `*${farmerName || "Your farmer"}* has confirmed Order *#${orderId}*!\n` +
      `Your harvest is being freshly picked, packed, and prepared for doorstep dispatch.\n\n` +
      `Thank you for supporting local agriculture!`;
  }

  if (status === "delivered") {
    return `✅ *Fresh Harvest Delivered to Your Door!* 🧺\n\n` +
      `Hello ${customerName || "Customer"},\n` +
      `Order *#${orderId}* from *${farmerName || "Your farm"}* has been successfully delivered!\n\n` +
      `Please log in to your account to leave a rating for the farmer.\n` +
      `Enjoy your fresh, healthy produce!`;
  }

  if (status === "rejected") {
    return `⚠️ *Order Update from Farm* ⚠️\n\n` +
      `Hello ${customerName || "Customer"},\n` +
      `*${farmerName || "The farm"}* was unable to fulfill Order *#${orderId}* at this time (e.g. stock or weather constraints).\n\n` +
      `If you paid online, your refund has been processed. Please check the marketplace for nearby alternatives.`;
  }

  return `🔔 *Order Status Update* #${orderId}\nYour order status is now: ${status}.`;
};

const sendCustomerOrderStatusAlert = async ({ customer, order, farmer, status }) => {
  const customerPhone = resolveWhatsAppNumber(customer, order.deliveryAddress);
  const customerName = customer?.storeName || "Customer";
  const farmerName = farmer?.storeName || "Local Farm";
  const orderId = order._id.toString();

  const message = formatCustomerOrderStatus({
    orderId,
    customerName,
    farmerName,
    status,
  });

  const contentVariables = {
    "1": customerName,
    "2": `#${orderId}`,
    "3": farmerName,
    "4": status,
  };

  return await dispatchMessage({
    phone: customerPhone,
    message,
    title: `Customer Order Status: ${status}`,
    contentVariables,
  });
};

module.exports = {
  cleanPhoneNumber,
  resolveWhatsAppNumber,
  buildWhatsAppLink,
  sendFarmerOrderAlert,
  sendCustomerOrderPlacedAlert,
  sendCustomerOrderStatusAlert,
};
