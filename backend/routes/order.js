const express = require("express");
const router = express.Router();

const { createOrder, getMyOrders, getReceivedOrders, getOrderById, updateOrderStatus } = require("../controllers/orderController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/create", authorize("customer"), createOrder);
router.get("/my", authorize("customer"), getMyOrders);
router.get("/received", authorize("farmer"), getReceivedOrders);
router.get("/:id", getOrderById);
router.patch("/status", authorize("farmer"), updateOrderStatus);

module.exports = router;
