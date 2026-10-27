#!/usr/bin/env node
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { dispatchMessage, sendCustomerOrderPlacedAlert } = require("../services/whatsappService");

const targetPhone = process.argv[2] || "919876543210";

console.log("------------------------------------------------------------------");
console.log(`Testing WhatsApp Notification System for: +${targetPhone}`);
console.log("------------------------------------------------------------------");

const hasTwilioKeys = Boolean(
  process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_NUMBER
);

if (hasTwilioKeys) {
  console.log("✓ Twilio credentials detected in backend/.env!");
  console.log("Attempting live WhatsApp dispatch via Twilio API...");
} else {
  console.log("ℹ Twilio keys are not yet configured in backend/.env.");
  console.log("Running in simulation mode (Free instant test link generated).");
}

const mockCustomer = {
  storeName: "Test Buyer",
  phone: targetPhone,
  whatsappPhone: targetPhone,
};

const mockFarmer = {
  storeName: "Green Harvest Organics",
  phone: "919811122233",
};

const mockOrder = {
  _id: "ORD-" + Math.floor(1000 + Math.random() * 9000),
  items: [
    { name: "Fresh Organic Tomatoes", quantity: 2, price: 35 },
    { name: "Farm Spinach", quantity: 1, price: 20 },
  ],
  totalPrice: 90,
  deliveryAddress: {
    street: "Flat 402, Green Avenue",
    city: "Pune",
    pincode: "411001",
  },
};

(async () => {
  try {
    const result = await sendCustomerOrderPlacedAlert({
      customer: mockCustomer,
      order: mockOrder,
      farmer: mockFarmer,
    });

    console.log("\nDispatch Result:", result);
    console.log("\n✓ You can copy & paste the 'Direct 1-Click Action' link above into your browser to send it directly to WhatsApp right now!");
  } catch (err) {
    console.error("Test failed:", err.message || err);
  }
})();

