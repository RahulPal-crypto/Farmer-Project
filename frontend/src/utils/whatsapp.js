/**
 * Clean & Format phone number for WhatsApp deep-linking.
 * Ensures 10-digit Indian numbers are automatically formatted with country code '91',
 * preventing WhatsApp "Phone number shared via url is invalid" errors.
 */
export const cleanWhatsAppNumber = (phone) => {
  if (!phone) return "";
  let digits = String(phone).replace(/[^\d]/g, "");

  // If Indian mobile with leading 0 (e.g., 09876543210 -> 9876543210)
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // 10-digit Indian mobile numbers need '91' prefix for wa.me
  if (digits.length === 10) {
    return `91${digits}`;
  }

  return digits;
};

/**
 * Builds a direct wa.me link with pre-encoded message.
 */
export const formatWhatsAppUrl = (phone, message) => {
  const cleaned = cleanWhatsAppNumber(phone);
  if (!cleaned) return "";
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message || "")}`;
};

/**
 * Formats a clean itemized receipt message to send to the farmer upon order placement.
 */
export const buildCustomerToFarmerOrderText = ({ order, farmer, customer }) => {
  const customerName = customer?.storeName || customer?.name || "Customer";
  const customerPhone = order?.deliveryAddress?.whatsappPhone || order?.deliveryAddress?.contactPhone || customer?.whatsappPhone || customer?.phone || "";
  const orderId = order?._id ? String(order._id).slice(-6).toUpperCase() : "N/A";
  const fullOrderId = order?._id || "";

  const itemsList = (order?.items || [])
    .map((item) => `• ${item.name} x ${item.quantity} - Rs. ${(item.price * item.quantity).toFixed(0)}`)
    .join("\n");

  const address = order?.deliveryAddress?.street
    ? `${order.deliveryAddress.street}, ${order.deliveryAddress.city} (${order.deliveryAddress.pincode})`
    : "Local delivery";

  const slot = order?.deliveryAddress?.deliverySlot || "Standard Any-Time";
  const notes = order?.deliveryAddress?.notes ? `\n*Note:* ${order.deliveryAddress.notes}` : "";

  return `🚜 *New Farm Order Placed!* 🌾\n\n` +
    `Hello ${farmer?.storeName || "Farmer"},\n` +
    `I have placed Order *#${orderId}* on Farmer Marketplace!\n\n` +
    `*Customer Details:*\n` +
    `• Name: ${customerName}\n` +
    `• Phone: ${customerPhone}\n\n` +
    `*Produce Ordered:*\n${itemsList}\n\n` +
    `*Total Bill:* Rs. ${Number(order?.discountedTotalPrice || order?.totalPrice || 0).toFixed(0)} (${String(order?.paymentMethod || "cod").toUpperCase()})\n` +
    `*Preferred Slot:* ${slot}\n` +
    `*Delivery Address:* ${address}${notes}\n\n` +
    `Full Order Ref: #${fullOrderId}\n` +
    `Please confirm the order & let me know when fresh harvest begins!`;
};

/**
 * Formats an order status update message from farmer to customer.
 */
export const buildFarmerToCustomerStatusText = ({ order, status, farmer, customer }) => {
  const customerName = customer?.storeName || customer?.name || "Customer";
  const farmerName = farmer?.storeName || "Your Local Farmer";
  const orderId = order?._id ? String(order._id).slice(-6).toUpperCase() : "N/A";

  if (status === "accepted") {
    return `🚜 *Order Accepted & Harvest Started!* 🌿\n\n` +
      `Hello ${customerName},\n` +
      `Your order *#${orderId}* has been confirmed by *${farmerName}*.\n` +
      `We are preparing your fresh farm harvest for doorstep dispatch!\n\n` +
      `Thank you for supporting our local farm!`;
  }

  if (status === "delivered") {
    return `✅ *Fresh Harvest Delivered!* 🧺\n\n` +
      `Hello ${customerName},\n` +
      `Order *#${orderId}* has been delivered to your doorstep by *${farmerName}*.\n` +
      `Hope you enjoy the farm-fresh produce! Please rate your experience on Farmer Marketplace.`;
  }

  if (status === "rejected") {
    return `⚠️ *Order Update from Farm*\n\n` +
      `Hello ${customerName},\n` +
      `Regarding order *#${orderId}*, unfortunately *${farmerName}* could not fulfill it at this moment due to harvest/stock constraints.\n` +
      `Please check nearby farms on the marketplace.`;
  }

  return `🔔 *Order Status Update*\n\nHello ${customerName}, your farm order *#${orderId}* status is now: *${status}*.`;
};

