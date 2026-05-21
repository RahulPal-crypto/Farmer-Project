const express = require("express");
const router = express.Router();

const {
  addProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getNearbyProducts,
  getMyProducts,
} = require("../controllers/productController");
const { protect, authorize } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.get("/", getProducts);
router.get("/nearby", getNearbyProducts);

router.use(protect);
router.use(authorize("farmer"));

router.get("/my", getMyProducts);
router.post("/", upload.single("image"), addProduct);
router.put("/:id", upload.single("image"), updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
