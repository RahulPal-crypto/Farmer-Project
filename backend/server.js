const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const chatRoutes = require("./routes/chat");
const groupOrderRoutes = require("./routes/groupOrder");
const notificationRoutes = require("./routes/notification");
const paymentRoutes = require("./routes/payment");
const productRoutes = require("./routes/product");
const orderRoutes = require("./routes/order");
const reviewRoutes = require("./routes/review");
const uploadRoutes = require("./routes/upload");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { initSocket } = require("./socket");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
initSocket(server);

const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = allowedOrigins.length
  ? {
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("Not allowed by CORS"));
      },
    }
  : {};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({
    message: "Farmer-to-Customer Marketplace API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/group-orders", groupOrderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/uploads", uploadRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
