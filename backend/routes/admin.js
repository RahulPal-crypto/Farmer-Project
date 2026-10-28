const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  adminDeleteProduct,
  monitorOrders,
  getFarmerVerifications,
  reviewFarmerVerification,
  updateUserRole,
  toggleUserStatus,
  triggerMandiSync,
  getPlatformAnalytics,
  sendTestEmail,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);
router.use(authorize("admin"));

router.get("/analytics", getPlatformAnalytics);
router.get("/users", getAllUsers);
router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/status", toggleUserStatus);
router.get("/orders", monitorOrders);
router.delete("/product/:id", adminDeleteProduct);
router.get("/farmers/verifications", getFarmerVerifications);
router.put("/farmers/:farmerId/verification", reviewFarmerVerification);
router.post("/sync-mandi-prices", triggerMandiSync);
router.post("/test-email", sendTestEmail);

module.exports = router;
