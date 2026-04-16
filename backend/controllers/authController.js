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
  const { storeName, email, password, role, phone, latitude, longitude } = req.body;

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

  const user = await User.create({
    storeName,
    email,
    password,
    role,
    phone,
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

module.exports = {
  registerUser,
  loginUser,
};
