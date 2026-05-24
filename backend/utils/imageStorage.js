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

const storeUploadedImage = async (file) => {
  if (!file) {
    return "";
  }

  if (!configureCloudinary()) {
    return `/uploads/${path.basename(file.path)}`;
  }

  const result = await cloudinary.uploader.upload(file.path, {
    folder: "farmer-marketplace/products",
    resource_type: "image",
  });

  await removeLocalFile(file.path);

  return result.secure_url;
};

module.exports = {
  storeUploadedImage,
};
