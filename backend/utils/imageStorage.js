const fs = require("fs/promises");
const path = require("path");
const { v2: cloudinary } = require("cloudinary");

const getEnvValue = (name) => process.env[name]?.trim();

const hasCloudinaryConfig = () =>
  Boolean(
    getEnvValue("CLOUDINARY_CLOUD_NAME") &&
      getEnvValue("CLOUDINARY_API_KEY") &&
      getEnvValue("CLOUDINARY_API_SECRET")
  );

const configureCloudinary = () => {
  if (!hasCloudinaryConfig()) {
    return false;
  }

  cloudinary.config({
    cloud_name: getEnvValue("CLOUDINARY_CLOUD_NAME"),
    api_key: getEnvValue("CLOUDINARY_API_KEY"),
    api_secret: getEnvValue("CLOUDINARY_API_SECRET"),
  });

  return true;
};

const removeLocalFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {}
};

/**
 * Stores an uploaded image.
 * Tries Cloudinary first when configured.
 * If Cloudinary is not configured or throws a network / authentication error,
 * safely falls back to local static file serving under /uploads.
 */
const storeUploadedImage = async (file) => {
  if (!file) {
    return "";
  }

  const localRelativePath = `/uploads/${path.basename(file.path)}`;

  if (!configureCloudinary()) {
    return localRelativePath;
  }

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "farmer-marketplace/products",
      resource_type: "image",
    });

    // Remove local copy only after Cloudinary upload succeeds
    await removeLocalFile(file.path);

    return result.secure_url;
  } catch (error) {
    console.warn(
      "Cloudinary upload failed, falling back to local static file serving:",
      error.message || error
    );
    // Keep local file intact so the user's uploaded product image remains accessible
    return localRelativePath;
  }
};

module.exports = {
  storeUploadedImage,
  hasCloudinaryConfig,
};
