const nodemailer = require("nodemailer");

/**
 * Configure email transporter
 * Supports Gmail App Passwords, Custom SMTP, or falls back to simulation mode
 */
const getTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  // If custom SMTP host is specified
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });
  }

  // Default: Gmail SMTP
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user,
      pass,
    },
  });
};

/**
 * Core dispatch function
 */
const sendMailAsync = async ({ to, subject, html, text }) => {
  if (!to) {
    console.warn("[Email Service] No recipient email specified.");
    return { success: false, reason: "No recipient email" };
  }

  const transporter = getTransporter();
  const userEmail = process.env.EMAIL_USER || "palrahul860478@gmail.com";
  let fromHeader = process.env.EMAIL_FROM || `"KrishiSetu" <${userEmail}>`;
  if (typeof fromHeader === "string") {
    fromHeader = fromHeader.trim().replace(/^"|"$/g, "");
  }

  if (!transporter) {
    console.log(`[Email Simulation] Real email skipped (EMAIL_USER / EMAIL_PASS not in .env).`);
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: fromHeader,
      replyTo: userEmail,
      to,
      subject,
      text: text || "KrishiSetu Order Notification",
      html,
    });
    console.log(`[Email Dispatched] Successfully sent email to ${to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Error] Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Helper to build responsive HTML wrapper
 */
const emailWrapper = ({ title, preheader, contentHtml }) => {
  const clientUrl = process.env.CLIENT_URL || "https://farmer-project-gamma.vercel.app";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; }
    .container { max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #047857 0%, #065f46 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 8px 0 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .body { padding: 32px 24px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin: 20px 0; }
    .table { width: 100%; border-collapse: collapse; margin-top: 14px; }
    .table th { text-align: left; padding: 10px 8px; border-bottom: 2px solid #cbd5e1; font-size: 12px; text-transform: uppercase; color: #64748b; }
    .table td { padding: 12px 8px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .total-row { font-weight: 800; font-size: 16px; color: #047857; }
    .btn { display: inline-block; background-color: #047857; color: #ffffff !important; padding: 14px 28px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 14px; margin-top: 20px; text-align: center; }
    .footer { background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader || title}
  </div>
  <div class="container">
    <div class="header">
      <span class="badge">🌱 KrishiSetu • कृषिसेतु</span>
      <h1>${title}</h1>
    </div>
    <div class="body">
      ${contentHtml}
    </div>
    <div class="footer">
      <p style="margin: 0 0 8px;"><strong>KrishiSetu (कृषिसेतु)</strong> — Direct Farm Marketplace</p>
      <p style="margin: 0;">Connecting Local Indian Farmers Directly with Consumers • Zero Middlemen</p>
      <p style="margin: 12px 0 0;"><a href="${clientUrl}" style="color: #047857; text-decoration: none; font-weight: bold;">Visit KrishiSetu Website</a></p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * 1. Automatic Email: Customer Order Confirmation
 */
const sendCustomerOrderPlacedEmail = async ({ customer, order, farmer }) => {
  const recipientEmail = customer?.email || order?.deliveryAddress?.email;
  if (!recipientEmail) return;

  const orderShortId = order._id.toString().slice(-6).toUpperCase();
  const clientUrl = process.env.CLIENT_URL || "https://farmer-project-gamma.vercel.app";
  const items = order.items || [];
  const farmerName = farmer?.storeName || farmer?.name || "Local Farmer";

  const itemsRows = items
    .map(
      (item) => `
    <tr>
      <td><strong>${item.name || "Farm Produce"}</strong></td>
      <td style="text-align: center;">${item.quantity} ${item.unit || "kg"}</td>
      <td style="text-align: right;">₹${item.price}</td>
      <td style="text-align: right; font-weight: bold;">₹${item.price * item.quantity}</td>
    </tr>`
    )
    .join("");

  const address = order.deliveryAddress || {};
  const fullAddress = [address.street, address.city, address.state, address.pincode].filter(Boolean).join(", ");

  const contentHtml = `
    <p style="font-size: 16px; margin-top: 0;">
      Namaste <strong>${customer.storeName || customer.name || "Customer"}</strong>,
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      Aapka order successfully confirm ho gaya hai! Kisan <strong>${farmerName}</strong> ko aapke order ka alert bhej diya gaya hai.
    </p>

    <div class="card">
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <div>
          <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold;">Order ID</span>
          <p style="margin: 2px 0 0; font-weight: 800; font-size: 16px; color: #047857;">#${orderShortId}</p>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold;">Payment Mode</span>
          <p style="margin: 2px 0 0; font-weight: 700; font-size: 14px; text-transform: uppercase;">${order.paymentMethod === "online" ? "Online Paid ✓" : "Cash on Delivery (COD)"}</p>
        </div>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Fasal / Item</th>
            <th style="text-align: center;">Matra (Qty)</th>
            <th style="text-align: right;">Bhav (Rate)</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
          <tr class="total-row">
            <td colspan="3" style="text-align: right; padding-top: 14px;">Total Amount:</td>
            <td style="text-align: right; padding-top: 14px; font-size: 18px;">₹${order.totalPrice}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="background: #f1f5f9; padding: 16px; border-radius: 12px; font-size: 13px; line-height: 1.5;">
      <p style="margin: 0 0 6px;"><strong>📍 Delivery Address:</strong> ${fullAddress || "Registered Customer Location"}</p>
      <p style="margin: 0;"><strong>🚜 Producer Farm:</strong> ${farmerName} ${farmer?.phone ? `(📞 ${farmer.phone})` : ""}</p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${clientUrl}/orders" class="btn">View & Track Order Live</a>
    </div>
  `;

  return sendMailAsync({
    to: recipientEmail,
    subject: `🌱 Order Confirmed! #${orderShortId} • KrishiSetu`,
    html: emailWrapper({
      title: "Order Placed Successfully",
      preheader: `Aapka order #${orderShortId} confirm ho gaya hai! Total: ₹${order.totalPrice}`,
      contentHtml,
    }),
  });
};

/**
 * 2. Automatic Email: Farmer New Order Alert
 */
const sendFarmerNewOrderEmail = async ({ farmer, customer, order }) => {
  const recipientEmail = farmer?.email;
  if (!recipientEmail) return;

  const orderShortId = order._id.toString().slice(-6).toUpperCase();
  const clientUrl = process.env.CLIENT_URL || "https://farmer-project-gamma.vercel.app";
  const items = order.items || [];
  const customerName = customer?.storeName || customer?.name || "Customer";

  const itemsList = items
    .map(
      (item) => `
      <li style="margin-bottom: 8px;">
        <strong>${item.quantity} ${item.unit || "kg"}</strong> ${item.name || "Produce"} — 
        <span style="color: #047857; font-weight: bold;">₹${item.price * item.quantity}</span>
      </li>`
    )
    .join("");

  const address = order.deliveryAddress || {};
  const fullAddress = [address.street, address.city, address.state, address.pincode].filter(Boolean).join(", ");

  const contentHtml = `
    <p style="font-size: 16px; margin-top: 0;">
      Ram Ram Kisan Bhai <strong>${farmer.storeName || farmer.name || ""}</strong>,
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      Aapki khet ki taaza fasal ke liye naya order prapt hua hai! Kripya taaza mal pack karein.
    </p>

    <div class="card">
      <h3 style="margin-top: 0; color: #047857;">📦 Pack Karne Hetu Fasal:</h3>
      <ul style="padding-left: 20px; font-size: 15px; margin-bottom: 0;">
        ${itemsList}
      </ul>
      <p style="margin-top: 14px; margin-bottom: 0; font-size: 16px; font-weight: bold; color: #0f172a;">
        Kul Rashi (Earnings): <span style="color: #047857;">₹${order.totalPrice}</span> 
        <span style="font-size: 12px; font-weight: normal; color: #64748b;">(${order.paymentMethod === "online" ? "Online Paid" : "Cash on Delivery"})</span>
      </p>
    </div>

    <div style="background: #f1f5f9; padding: 16px; border-radius: 12px; font-size: 13px; line-height: 1.5;">
      <p style="margin: 0 0 6px;"><strong>👤 Kharidar (Customer):</strong> ${customerName}</p>
      <p style="margin: 0 0 6px;"><strong>📞 Phone:</strong> ${customer?.phone || address?.phone || "N/A"}</p>
      <p style="margin: 0;"><strong>📍 Delivery Pata:</strong> ${fullAddress || "Customer Address"}</p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${clientUrl}/farmer/orders" class="btn">Kisan Dashboard Par Order Manage Karein</a>
    </div>
  `;

  return sendMailAsync({
    to: recipientEmail,
    subject: `🚜 Naya Order Aaya Hai! (Order #${orderShortId}) • KrishiSetu`,
    html: emailWrapper({
      title: "Naya Order Prapt Hua",
      preheader: `Kisan bhai, naya order mila hai: ₹${order.totalPrice} #${orderShortId}`,
      contentHtml,
    }),
  });
};

/**
 * 3. Automatic Email: Customer Order Status Update
 */
const sendCustomerOrderStatusEmail = async ({ customer, order, farmer, status }) => {
  const recipientEmail = customer?.email || order?.deliveryAddress?.email;
  if (!recipientEmail) return;

  const orderShortId = order._id.toString().slice(-6).toUpperCase();
  const clientUrl = process.env.CLIENT_URL || "https://farmer-project-gamma.vercel.app";
  const farmerName = farmer?.storeName || farmer?.name || "Local Farmer";

  const statusConfig = {
    confirmed: {
      badge: "स्वीकृत (Confirmed)",
      color: "#0284c7",
      title: "Order Confirmed by Farmer",
      message: `Kisan <strong>${farmerName}</strong> ne aapka order confirm kar diya hai aur taaza fasal pack ki ja rahi hai!`,
    },
    shipped: {
      badge: "रवाना (Out for Delivery)",
      color: "#d97706",
      title: "Order Dispatched for Delivery",
      message: `Aapka order khet se nikal chuka hai aur jald hi aapke pate par deliver ho jayega. Kripya delivery ke liye tayyar rahein!`,
    },
    delivered: {
      badge: "सफलतापूर्वक प्राप्त (Delivered)",
      color: "#059669",
      title: "Order Delivered Successfully",
      message: `Aapka KrishiSetu order deliver kar diya gaya hai! Taaza fasal ka anand lein aur local kisano ko support karne ke liye shukriya.`,
    },
    cancelled: {
      badge: "रद्द (Cancelled)",
      color: "#dc2626",
      title: "Order Cancelled",
      message: `Aapka order #${orderShortId} cancel ho gaya hai. Kisi bhi query ke liye support team ya kisan se sampark karein.`,
    },
  };

  const currentStatus = statusConfig[status] || {
    badge: status.toUpperCase(),
    color: "#047857",
    title: `Order Status: ${status}`,
    message: `Aapke order ka status ab badal kar <strong>${status}</strong> ho gaya hai.`,
  };

  const contentHtml = `
    <p style="font-size: 16px; margin-top: 0;">
      Namaste <strong>${customer?.storeName || customer?.name || "Customer"}</strong>,
    </p>

    <div style="text-align: center; margin: 20px 0;">
      <span style="display: inline-block; background: ${currentStatus.color}; color: #ffffff; padding: 6px 18px; border-radius: 20px; font-size: 14px; font-weight: bold;">
        ${currentStatus.badge}
      </span>
      <h2 style="margin: 12px 0 6px; font-size: 20px; color: #0f172a;">${currentStatus.title}</h2>
      <p style="font-size: 15px; color: #475569; line-height: 1.6; max-width: 480px; margin: 0 auto;">
        ${currentStatus.message}
      </p>
    </div>

    <div class="card">
      <div style="display: flex; justify-content: space-between; font-size: 14px;">
        <span><strong>Order ID:</strong> #${orderShortId}</span>
        <span><strong>Total Amount:</strong> ₹${order.totalPrice}</span>
      </div>
      <p style="margin: 8px 0 0; font-size: 13px; color: #64748b;">
        Farmer: ${farmerName} ${farmer?.phone ? `(📞 ${farmer.phone})` : ""}
      </p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${clientUrl}/orders" class="btn">View Live Tracking</a>
    </div>
  `;

  return sendMailAsync({
    to: recipientEmail,
    subject: `📦 Order Update: ${currentStatus.title} (#${orderShortId}) • KrishiSetu`,
    html: emailWrapper({
      title: currentStatus.title,
      preheader: `Order #${orderShortId} status update: ${currentStatus.badge}`,
      contentHtml,
    }),
  });
};

module.exports = {
  sendCustomerOrderPlacedEmail,
  sendFarmerNewOrderEmail,
  sendCustomerOrderStatusEmail,
};

