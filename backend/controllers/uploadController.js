const asyncHandler = require("../middleware/asyncHandler");
const { storeUploadedImage } = require("../utils/imageStorage");

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Image file is required");
  }

  const imageUrl = await storeUploadedImage(req.file);

  res.status(201).json({
    message: "Image uploaded successfully",
    imageUrl,
    file: req.file.filename,
  });
});

module.exports = {
  uploadImage,
};
