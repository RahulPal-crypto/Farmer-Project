require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const {
  sendCustomerOrderPlacedEmail,
  sendFarmerNewOrderEmail,
  sendCustomerOrderStatusEmail,
} = require("../services/emailService");

async function runTest() {
  console.log("--------------------------------------------------");
  console.log("🧪 Testing KrishiSetu Background Automated Email Service");
  console.log("--------------------------------------------------");

  const mockCustomer = {
    name: "Aman Sharma",
    storeName: "Aman Sharma",
    email: "customer.test@gmail.com",
    phone: "9876543210",
  };

  const mockFarmer = {
    name: "Ramu Kisan",
    storeName: "Ramu Organic Farm",
    email: "farmer.test@gmail.com",
    phone: "9123456789",
  };

  const mockOrder = {
    _id: "671e35a90123456789abcdef",
    totalPrice: 450,
    paymentMethod: "cod",
    items: [
      { name: "Desi Hybrid Tamatar", quantity: 5, unit: "kg", price: 30 },
      { name: "Fresh Aloo", quantity: 10, unit: "kg", price: 20 },
      { name: "Organic Sharbati Gehun", quantity: 5, unit: "kg", price: 20 },
    ],
    deliveryAddress: {
      street: "Sector 14, Main Road",
      city: "Kanpur",
      state: "Uttar Pradesh",
      pincode: "208001",
      phone: "9876543210",
    },
  };

  console.log("\n1. Testing Customer Order Confirmation Email...");
  const res1 = await sendCustomerOrderPlacedEmail({
    customer: mockCustomer,
    order: mockOrder,
    farmer: mockFarmer,
  });
  console.log("Result 1:", res1);

  console.log("\n2. Testing Farmer New Order Alert Email...");
  const res2 = await sendFarmerNewOrderEmail({
    farmer: mockFarmer,
    customer: mockCustomer,
    order: mockOrder,
  });
  console.log("Result 2:", res2);

  console.log("\n3. Testing Customer Live Status Update Email (shipped)...");
  const res3 = await sendCustomerOrderStatusEmail({
    customer: mockCustomer,
    order: mockOrder,
    farmer: mockFarmer,
    status: "shipped",
  });
  console.log("Result 3:", res3);

  console.log("\n4. Testing Customer Live Status Update Email (delivered)...");
  const res4 = await sendCustomerOrderStatusEmail({
    customer: mockCustomer,
    order: mockOrder,
    farmer: mockFarmer,
    status: "delivered",
  });
  console.log("Result 4:", res4);

  console.log("\n✅ All Email Test Triggers executed successfully!");
  process.exit(0);
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

