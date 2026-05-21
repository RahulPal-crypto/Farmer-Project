const express = require("express");
const router = express.Router();

const { createGroupOrder, joinGroupOrder, listGroupOrders } = require("../controllers/groupOrderController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", listGroupOrders);
router.post("/", authorize("customer"), createGroupOrder);
router.post("/:groupOrderId/join", authorize("customer"), joinGroupOrder);

module.exports = router;
