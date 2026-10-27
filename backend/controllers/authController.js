const jwt = require("jsonwebtoken");

const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const parseCoordinates = (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return [lng, lat];
};

const registerUser = asyncHandler(async (req, res) => {
  const {
    storeName,
    email,
    password,
    role,
    phone,
    whatsappPhone,
    isWhatsappSameAsPhone,
    latitude,
    longitude,
  } = req.body;

  if (!storeName || !email || !password || !role || !phone) {
    res.status(400);
    throw new Error("Please provide all required registration fields");
  }

  if (!["farmer", "customer"].includes(role)) {
    res.status(400);
    throw new Error("Role must be either farmer or customer");
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters long");
  }

  const coordinates = parseCoordinates(latitude, longitude);

  if (!coordinates) {
    res.status(400);
    throw new Error("Valid latitude and longitude are required");
  }

  const userExists = await User.findOne({ email: email.toLowerCase() });

  if (userExists) {
    res.status(409);
    throw new Error("User already exists with this email");
  }

  const sameAsPhone = isWhatsappSameAsPhone !== undefined ? Boolean(isWhatsappSameAsPhone) : true;
  const resolvedWhatsapp = sameAsPhone ? phone : whatsappPhone || "";

  const user = await User.create({
    storeName,
    email,
    password,
    role,
    phone,
    whatsappPhone: resolvedWhatsapp,
    isWhatsappSameAsPhone: sameAsPhone,
    location: {
      type: "Point",
      coordinates,
    },
  });

  res.status(201).json({
    message: "User registered successfully",
    user: {
      id: user._id,
      storeName: user.storeName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      whatsappPhone: user.whatsappPhone,
      isWhatsappSameAsPhone: user.isWhatsappSameAsPhone,
      location: user.location,
    },
    token: generateToken(user._id),
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  res.json({
    message: "Login successful",
    user: {
      id: user._id,
      storeName: user.storeName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      location: user.location,
    },
    token: generateToken(user._id),
  });
});

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json({
    user: {
      id: user._id,
      storeName: user.storeName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      whatsappPhone: user.whatsappPhone || "",
      isWhatsappSameAsPhone: user.isWhatsappSameAsPhone ?? true,
      location: user.location,
      averageRating: user.averageRating,
      reviewCount: user.reviewCount,
      isVerifiedFarmer: user.isVerifiedFarmer || false,
      verificationStatus: user.verificationStatus || "unverified",
      verificationDocuments: user.verificationDocuments || [],
      verificationNotes: user.verificationNotes || "",
      createdAt: user.createdAt,
    },
  });
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const {
    storeName,
    phone,
    whatsappPhone,
    isWhatsappSameAsPhone,
    latitude,
    longitude,
    currentPassword,
    newPassword,
  } = req.body;

  if (storeName && storeName.trim()) {
    user.storeName = storeName.trim();
  }

  if (phone && phone.trim()) {
    user.phone = phone.trim();
  }

  if (isWhatsappSameAsPhone !== undefined) {
    user.isWhatsappSameAsPhone = Boolean(isWhatsappSameAsPhone);
    if (user.isWhatsappSameAsPhone) {
      user.whatsappPhone = user.phone;
    } else if (whatsappPhone !== undefined) {
      user.whatsappPhone = whatsappPhone ? whatsappPhone.trim() : "";
    }
  } else if (whatsappPhone !== undefined) {
    user.whatsappPhone = whatsappPhone ? whatsappPhone.trim() : "";
  }

  if (latitude !== undefined && longitude !== undefined && latitude !== "" && longitude !== "") {
    const coordinates = parseCoordinates(latitude, longitude);
    if (!coordinates) {
      res.status(400);
      throw new Error("Invalid latitude or longitude coordinates");
    }
    user.location = {
      type: "Point",
      coordinates,
    };
  }

  if (newPassword) {
    if (!currentPassword) {
      res.status(400);
      throw new Error("Current password is required to set a new password");
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      res.status(400);
      throw new Error("Incorrect current password");
    }

    if (newPassword.length < 6) {
      res.status(400);
      throw new Error("New password must be at least 6 characters long");
    }

    user.password = newPassword;
  }

  const updatedUser = await user.save();

  res.json({
    message: "Profile updated successfully",
    user: {
      id: updatedUser._id,
      storeName: updatedUser.storeName,
      email: updatedUser.email,
      role: updatedUser.role,
      phone: updatedUser.phone,
      whatsappPhone: updatedUser.whatsappPhone || "",
      isWhatsappSameAsPhone: updatedUser.isWhatsappSameAsPhone ?? true,
      location: updatedUser.location,
      averageRating: updatedUser.averageRating,
      reviewCount: updatedUser.reviewCount,
      isVerifiedFarmer: updatedUser.isVerifiedFarmer || false,
      verificationStatus: updatedUser.verificationStatus || "unverified",
      createdAt: updatedUser.createdAt,
    },
  });
});

const submitFarmerVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.role !== "farmer") {
    res.status(403);
    throw new Error("Only farmers can submit grower verification credentials");
  }

  const { docType, docNumber, docUrl, notes } = req.body;
  if (!docType || !docNumber) {
    res.status(400);
    throw new Error("Document type and document number are required");
  }

  user.verificationDocuments.push({
    docType,
    docNumber,
    docUrl: docUrl || "",
    submittedAt: new Date(),
  });

  user.verificationStatus = "pending";
  if (notes) {
    user.verificationNotes = notes;
  }

  await user.save();

  res.json({
    message: "Verification documents submitted successfully. Verification status is now pending admin review.",
    verificationStatus: user.verificationStatus,
    isVerifiedFarmer: user.isVerifiedFarmer,
  });
});

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  submitFarmerVerification,
};
