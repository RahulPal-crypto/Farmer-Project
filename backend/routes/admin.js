const express = require("express");
const router = express.Router();

const { getAllUsers, adminDeleteProduct, monitorOrders } = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);
router.use(authorize("admin"));

router.get("/users", getAllUsers);
router.get("/orders", monitorOrders);
router.delete("/product/:id", adminDeleteProduct);

module.exports = router;
