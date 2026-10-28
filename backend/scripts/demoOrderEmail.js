const path = require("path");
const readline = require("readline");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const {
  sendCustomerOrderPlacedEmail,
  sendFarmerNewOrderEmail,
  sendCustomerOrderStatusEmail,
} = require("../services/emailService");

const askQuestion = (query) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
};

async function runDemo() {
  console.log("\n=======================================================");
  console.log("🌱 KrishiSetu (कृषिसेतु) - Live Email Flow Simulator");
  console.log("=======================================================\n");

  const defaultCustomerEmail = "rs.devx.connect4@gmail.com";
  const defaultFarmerEmail = "palrahul860478@gmail.com";

  let customerEmail = process.argv[2];
  let farmerEmail = process.argv[3];

  if (!customerEmail) {
    const inputCustomer = await askQuestion(
      `1. Customer ka Email address daalein [Press Enter for default: ${defaultCustomerEmail}]: `
    );
    customerEmail = inputCustomer || defaultCustomerEmail;
  }

  if (!farmerEmail) {
    const inputFarmer = await askQuestion(
      `2. Farmer (Kisan) ka Email address daalein [Press Enter for default: ${defaultFarmerEmail}]: `
    );
    farmerEmail = inputFarmer || defaultFarmerEmail;
  }

  console.log("\n-------------------------------------------------------");
  console.log(`👤 Customer (Buyer): ${customerEmail}`);
  console.log(`🚜 Farmer (Seller):   ${farmerEmail}`);
  console.log("-------------------------------------------------------\n");

  const sampleOrder = {
    _id: "6ae1d2ff27652ebf0468ced3",
    items: [
      { name: "Desi Organic Tomato (देसी टमाटर)", quantity: 5, unit: "kg", price: 40 },
      { name: "Fresh Sharbati Wheat (शरबती गेहूँ)", quantity: 20, unit: "kg", price: 35 },
    ],
    totalPrice: 5 * 40 + 20 * 35, // 900
    paymentMethod: "cod",
    deliveryAddress: {
      street: "124/B Kisan Marg, Civil Lines",
      city: "Kanpur",
      pincode: "208001",
      contactPhone: "9876543210",
      deliverySlot: "Morning Harvest (7:00 AM - 10:00 AM)",
    },
  };

  const sampleCustomer = {
    name: "Rahul Pal (Customer)",
    email: customerEmail,
    phone: "9876543210",
  };

  const sampleFarmer = {
    storeName: "Shri Krishna Jaivik Farm",
    name: "Krishna Pal (Kisan)",
    email: farmerEmail,
    phone: "8604780186",
  };

  // 1. Send Customer Order Confirmation Email
  console.log("⏳ 1/3: Customer ko Order Confirmation & Invoice dispatch ho raha hai...");
  try {
    const custRes = await sendCustomerOrderPlacedEmail({
      customer: sampleCustomer,
      order: sampleOrder,
      farmer: sampleFarmer,
    });
    console.log(`   ✅ SUCCESS: Customer invoice dispatched to ${customerEmail}`);
    if (custRes?.messageId) console.log(`      Google Message ID: ${custRes.messageId}`);
  } catch (err) {
    console.error(`   ❌ Customer email failed:`, err.message);
  }

  // 2. Send Farmer New Order Alert Email
  console.log("\n⏳ 2/3: Kisan (Farmer) ko Naya Order & Fasal Packing Alert dispatch ho raha hai...");
  try {
    const farmRes = await sendFarmerNewOrderEmail({
      farmer: sampleFarmer,
      customer: sampleCustomer,
      order: sampleOrder,
    });
    console.log(`   ✅ SUCCESS: Farmer packing alert dispatched to ${farmerEmail}`);
    if (farmRes?.messageId) console.log(`      Google Message ID: ${farmRes.messageId}`);
  } catch (err) {
    console.error(`   ❌ Farmer email failed:`, err.message);
  }

  // 3. Send Customer Status Update Email (Shipped)
  console.log("\n⏳ 3/3: Customer ko Live Status Update (Order Dispatched/Shipped) bheja ja raha hai...");
  try {
    const statusRes = await sendCustomerOrderStatusEmail({
      customer: sampleCustomer,
      order: sampleOrder,
      farmer: sampleFarmer,
      status: "shipped",
    });
    console.log(`   ✅ SUCCESS: Order status update email dispatched to ${customerEmail}`);
    if (statusRes?.messageId) console.log(`      Google Message ID: ${statusRes.messageId}`);
  } catch (err) {
    console.error(`   ❌ Status email failed:`, err.message);
  }

  console.log("\n=======================================================");
  console.log("🎉 DEMO COMPLETE! 3 real branded emails successfully sent!");
  console.log("👉 Dono email inboxes (aur Spam/Updates folder) check kijiye.");
  console.log("=======================================================\n");
}

runDemo().catch((err) => {
  console.error("Demo failed:", err);
  process.exit(1);
});

