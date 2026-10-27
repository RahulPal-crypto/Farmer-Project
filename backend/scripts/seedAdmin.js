require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");

const ensureAdminUser = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@farmer.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      let modified = false;
      if (admin.role !== "admin") {
        admin.role = "admin";
        modified = true;
      }
      if (!admin.isActive) {
        admin.isActive = true;
        modified = true;
      }
      if (modified) {
        await admin.save();
        console.log(`[Auto-Seed] Updated role to admin for ${adminEmail}`);
      }
    } else {
      admin = await User.create({
        storeName: "Master Admin",
        email: adminEmail,
        password: adminPassword,
        role: "admin",
        phone: "9876543210",
        whatsappPhone: "9876543210",
        isWhatsappSameAsPhone: true,
        isActive: true,
        location: {
          type: "Point",
          coordinates: [77.209, 28.6139],
        },
      });
      console.log(`[Auto-Seed] Master Admin account created successfully: ${adminEmail}`);
    }
  } catch (error) {
    console.error("[Auto-Seed] Notice on admin verification:", error.message);
  }
};

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI not defined in .env");
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    await ensureAdminUser();

    console.log("------------------------------------------");
    console.log("ADMIN LOGIN CREDENTIALS:");
    console.log(`Email:    ${process.env.ADMIN_EMAIL || "admin@farmer.com"}`);
    console.log(`Password: ${process.env.ADMIN_PASSWORD || "admin123"}`);
    console.log("Role:     admin");
    console.log("------------------------------------------");

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin account:", error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  seedAdmin();
}

module.exports = { seedAdmin, ensureAdminUser };
