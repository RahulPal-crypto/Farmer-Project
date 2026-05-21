const express = require("express");
const router = express.Router();

const { addReview, getFarmerReviews } = require("../controllers/reviewController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/farmer/:farmerId", getFarmerReviews);

router.use(protect);
router.post("/", authorize("customer"), addReview);

module.exports = router;
