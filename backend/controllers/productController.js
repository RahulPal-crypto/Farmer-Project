const mongoose = require("mongoose");

const Product = require("../models/Product");
const asyncHandler = require("../middleware/asyncHandler");
const { storeUploadedImage } = require("../utils/imageStorage");

const buildCoordinates = (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return [lng, lat];
};

const parseBoolean = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return Boolean(value);
};

const getPublicBaseUrl = (req) => {
  const configuredUrl = process.env.API_PUBLIC_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  return `${req.protocol}://${req.get("host")}`;
};

const buildImageUrl = (image, req) => {
  if (!image) {
    return "";
  }

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  const normalizedPath = image.startsWith("/") ? image : `/${image}`;
  return `${getPublicBaseUrl(req)}${normalizedPath}`;
};

const attachImageUrl = (product, req) => {
  const plainProduct = typeof product.toObject === "function" ? product.toObject() : product;

  return {
    ...plainProduct,
    imageUrl: buildImageUrl(plainProduct.image, req),
  };
};

const addProduct = asyncHandler(async (req, res) => {
  const { name, price, quantity, category, image, latitude, longitude } = req.body;

  if (!name || price === undefined || quantity === undefined || !category) {
    res.status(400);
    throw new Error("Name, price, quantity, and category are required");
  }

  const coordinates =
    latitude !== undefined && longitude !== undefined
      ? buildCoordinates(latitude, longitude)
      : req.user.location?.coordinates;

  if (!coordinates) {
    res.status(400);
    throw new Error("Valid product latitude and longitude are required");
  }

  const imageUrl = req.file ? await storeUploadedImage(req.file) : image || "";

  const product = await Product.create({
    farmer: req.user._id,
    name,
    price: Number(price),
    quantity: Number(quantity),
    category,
    image: imageUrl,
    location: {
      type: "Point",
      coordinates,
    },
  });

  res.status(201).json({
    message: "Product added successfully",
    product: attachImageUrl(product, req),
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid product id");
  }

  const product = await Product.findById(id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (product.farmer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only update your own products");
  }

  const { name, price, quantity, category, image, latitude, longitude } = req.body;

  if (latitude !== undefined || longitude !== undefined) {
    const coordinates = buildCoordinates(latitude, longitude);

    if (!coordinates) {
      res.status(400);
      throw new Error("Valid latitude and longitude are required");
    }

    product.location = {
      type: "Point",
      coordinates,
    };
  }

  product.name = name ?? product.name;
  product.price = price !== undefined ? Number(price) : product.price;
  product.quantity = quantity !== undefined ? Number(quantity) : product.quantity;
  product.category = category ?? product.category;
  product.image = req.file ? await storeUploadedImage(req.file) : image ?? product.image;
  product.isActive = req.body.isActive !== undefined ? parseBoolean(req.body.isActive) : product.isActive;

  const updatedProduct = await product.save();

  res.json({
    message: "Product updated successfully",
    product: attachImageUrl(updatedProduct, req),
  });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid product id");
  }

  const product = await Product.findById(id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (product.farmer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only delete your own products");
  }

  await product.deleteOne();

  res.json({ message: "Product deleted successfully" });
});

const getNearbyProducts = asyncHandler(async (req, res) => {
  const {
    latitude,
    longitude,
    radius = 10,
    category,
    minPrice,
    maxPrice,
    page = 1,
    limit = 10,
  } = req.query;

  const radiusInKm = Number(radius);
  const currentPage = Math.max(Number(page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const hasMinPrice = minPrice !== undefined && minPrice !== "";
  const hasMaxPrice = maxPrice !== undefined && maxPrice !== "";
  const minPriceValue = hasMinPrice ? Number(minPrice) : undefined;
  const maxPriceValue = hasMaxPrice ? Number(maxPrice) : undefined;

  if (Number.isNaN(radiusInKm)) {
    res.status(400);
    throw new Error("Valid radius is required");
  }

  const matchStage = {
    isActive: true,
  };

  if (category) {
    matchStage.category = new RegExp(`^${category}$`, "i");
  }

  if (hasMinPrice || hasMaxPrice) {
    matchStage.price = {};
    if (!Number.isNaN(minPriceValue)) {
      matchStage.price.$gte = minPriceValue;
    }
    if (!Number.isNaN(maxPriceValue)) {
      matchStage.price.$lte = maxPriceValue;
    }
  }

  const lat = latitude !== undefined ? Number(latitude) : undefined;
  const lng = longitude !== undefined ? Number(longitude) : undefined;

  if (latitude !== undefined || longitude !== undefined) {
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      res.status(400);
      throw new Error("Valid latitude and longitude are required");
    }

    const result = await Product.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [lng, lat],
          },
          distanceField: "distanceInMeters",
          maxDistance: radiusInKm * 1000,
          spherical: true,
          query: matchStage,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "farmer",
          foreignField: "_id",
          as: "farmer",
        },
      },
      { $unwind: "$farmer" },
      {
        $project: {
          name: 1,
          price: 1,
          quantity: 1,
          category: 1,
          image: 1,
          location: 1,
          createdAt: 1,
          distanceInMeters: 1,
          distanceInKm: {
            $round: [{ $divide: ["$distanceInMeters", 1000] }, 2],
          },
          farmer: {
            _id: "$farmer._id",
            storeName: "$farmer.storeName",
            phone: "$farmer.phone",
            email: "$farmer.email",
            averageRating: "$farmer.averageRating",
          },
        },
      },
      { $sort: { distanceInMeters: 1, createdAt: -1 } },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: (currentPage - 1) * pageSize }, { $limit: pageSize }],
        },
      },
    ]);

    const metadata = result[0]?.metadata?.[0] || { total: 0 };
    const products = (result[0]?.data || []).map((product) => attachImageUrl(product, req));

    res.json({
      message: "Nearby products fetched successfully",
      page: currentPage,
      limit: pageSize,
      total: metadata.total,
      totalPages: Math.ceil(metadata.total / pageSize),
      products,
    });
    return;
  }

  const total = await Product.countDocuments(matchStage);
  const products = await Product.find(matchStage)
    .populate("farmer", "storeName phone email averageRating")
    .sort({ createdAt: -1 })
    .skip((currentPage - 1) * pageSize)
    .limit(pageSize);

  res.json({
    message: "Products fetched successfully",
    page: currentPage,
    limit: pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
    products: products.map((product) => attachImageUrl(product, req)),
  });
});

const getProducts = asyncHandler(async (req, res) => getNearbyProducts(req, res));

const getMyProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ farmer: req.user._id })
    .populate("farmer", "storeName phone email averageRating")
    .sort({ createdAt: -1 });

  res.json({
    total: products.length,
    products: products.map((product) => attachImageUrl(product, req)),
  });
});

module.exports = {
  addProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getNearbyProducts,
  getMyProducts,
};
