const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const User = require("./models/User");
const Order = require("./models/Order");
const ChatMessage = require("./models/ChatMessage");
const { createNotification } = require("./utils/notificationHelper");

let ioInstance;

const buildRoomName = (orderId) => `order:${orderId}`;

const emitToUser = (userId, eventName, payload) => {
  if (!ioInstance || !userId) {
    return;
  }

  ioInstance.to(`user:${userId.toString()}`).emit(eventName, payload);
};

const initSocket = (server) => {
  const allowedOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  ioInstance = new Server(server, {
    cors: {
      origin: allowedOrigins.length ? allowedOrigins : "*",
    },
  });

  ioInstance.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication token is required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return next(new Error("Socket user not found"));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Socket authentication failed"));
    }
  });

  ioInstance.on("connection", (socket) => {
    socket.join(`user:${socket.user._id.toString()}`);

    socket.on("chat:join", async ({ orderId }) => {
      const order = await Order.findById(orderId);

      if (!order) {
        socket.emit("chat:error", { message: "Order not found" });
        return;
      }

      const isParticipant =
        order.customer.toString() === socket.user._id.toString() ||
        order.farmer.toString() === socket.user._id.toString();

      if (!isParticipant) {
        socket.emit("chat:error", { message: "You cannot join this room" });
        return;
      }

      socket.join(buildRoomName(orderId));
      socket.emit("chat:joined", { orderId });
    });

    socket.on("chat:message", async ({ orderId, message }) => {
      try {
        if (!message || !message.trim()) {
          socket.emit("chat:error", { message: "Message is required" });
          return;
        }

        const order = await Order.findById(orderId);

        if (!order) {
          socket.emit("chat:error", { message: "Order not found" });
          return;
        }

        const senderId = socket.user._id.toString();
        const isParticipant =
          order.customer.toString() === senderId || order.farmer.toString() === senderId;

        if (!isParticipant) {
          socket.emit("chat:error", { message: "You cannot message this room" });
          return;
        }

        const receiverId =
          order.customer.toString() === senderId ? order.farmer.toString() : order.customer.toString();

        const chatMessage = await ChatMessage.create({
          order: order._id,
          sender: socket.user._id,
          receiver: receiverId,
          message: message.trim(),
        });

        const populatedMessage = await chatMessage.populate("sender", "storeName role");

        ioInstance.to(buildRoomName(orderId)).emit("chat:message", populatedMessage);

        const notification = await createNotification({
          user: receiverId,
          type: "chat",
          title: "New message",
          message: `You received a new message for order ${order._id}.`,
          metadata: {
            orderId: order._id,
            chatMessageId: chatMessage._id,
          },
        });

        emitToUser(receiverId, "notification:new", notification);
      } catch (error) {
        socket.emit("chat:error", { message: error.message || "Unable to send message" });
      }
    });
  });

  return ioInstance;
};

module.exports = {
  initSocket,
  emitToUser,
  buildRoomName,
};
