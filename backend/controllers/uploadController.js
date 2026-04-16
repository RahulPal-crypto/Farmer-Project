const path = require("path");
const asyncHandler = require("../middleware/asyncHandler");

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Image file is required");
  }

  // Local storage works out of the box; swap with Cloudinary in production if needed.
  const imageUrl = `/uploads/${path.basename(req.file.path)}`;

  res.status(201).json({
    message: "Image uploaded successfully",
    imageUrl,
    file: req.file.filename,
  });
});

module.exports = {
  uploadImage,
};
