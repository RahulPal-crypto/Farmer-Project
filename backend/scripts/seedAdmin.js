require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI not defined in .env");
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    const adminEmail = "admin@farmer.com";
    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      admin.role = "admin";
      admin.password = "admin123";
      admin.storeName = "Master Admin";
      admin.phone = "9876543210";
      await admin.save();
      console.log(`Existing user updated to Admin: ${adminEmail}`);
    } else {
      admin = await User.create({
        storeName: "Master Admin",
        email: adminEmail,
        password: "admin123",
        role: "admin",
        phone: "9876543210",
        whatsappPhone: "9876543210",
        isWhatsappSameAsPhone: true,
        location: {
          type: "Point",
          coordinates: [77.209, 28.6139], // Delhi
        },
      });
      console.log(`Admin account created successfully: ${adminEmail}`);
    }

    console.log("------------------------------------------");
    console.log("ADMIN LOGIN CREDENTIALS:");
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: admin123`);
    console.log(`Role:     ${admin.role}`);
    console.log("------------------------------------------");

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin account:", error.message);
    process.exit(1);
  }
};

seedAdmin();

