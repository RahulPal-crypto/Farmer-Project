const express = require("express");
const router = express.Router();

const {
  createSubscription,
  getMySubscriptions,
  getFarmerSubscriptions,
  updateSubscriptionStatus,
} = require("../controllers/subscriptionController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, createSubscription);
router.get("/my", protect, getMySubscriptions);
router.get("/farmer", protect, authorize("farmer", "admin"), getFarmerSubscriptions);
router.patch("/:id/status", protect, updateSubscriptionStatus);

module.exports = router;

