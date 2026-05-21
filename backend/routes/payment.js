const express = require("express");
const router = express.Router();

const { createRazorpayOrder, verifyRazorpayPayment } = require("../controllers/paymentController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);
router.use(authorize("customer"));

router.post("/razorpay/order", createRazorpayOrder);
router.post("/razorpay/verify", verifyRazorpayPayment);

module.exports = router;
