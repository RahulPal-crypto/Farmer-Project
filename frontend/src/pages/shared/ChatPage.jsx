import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { io } from "socket.io-client";

import ErrorAlert from "../../components/ErrorAlert";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";
import { getApiErrorMessage } from "../../services/api";
import { fetchChatHistory } from "../../services/chatService";

function ChatPage() {
  const { orderId } = useParams();
  const { user, token } = useAuth();
  const socketRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadChat = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchChatHistory(orderId);
        setMessages(data.messages || []);
      } catch (error) {
        setError(getApiErrorMessage(error, "Unable to load chat"));
      } finally {
        setLoading(false);
      }
    };

    loadChat();
  }, [orderId]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const socket = io("http://localhost:5000", {
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("chat:join", { orderId });
    });

    socket.on("chat:message", (newMessage) => {
      setMessages((current) => [...current, newMessage]);
    });

    socket.on("chat:error", (payload) => {
      setError(payload?.message || "Chat error");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [orderId, token]);

  const handleSend = (event) => {
    event.preventDefault();

    if (!message.trim() || !socketRef.current) {
      return;
    }

    socketRef.current.emit("chat:message", {
      orderId,
      message,
    });
    setMessage("");
  };

  if (loading) {
    return <LoadingSpinner label="Loading chat..." />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Order Chat</h1>
          <p className="mt-1 text-sm text-slate-500">Order ID: {orderId}</p>
        </div>
        <Link to={user?.role === "farmer" ? "/farmer/orders" : "/orders"} className="text-sm font-semibold text-emerald-700">
          Back to orders
        </Link>
      </div>

      <ErrorAlert message={error} />

      <section className="min-h-96 rounded-3xl bg-white p-5 shadow-sm">
        {messages.length === 0 ? (
          <div className="flex min-h-64 items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500">
            No messages yet.
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((chatMessage) => {
              const isMine = chatMessage.sender?._id === user?.id;

              return (
                <div key={chatMessage._id || `${chatMessage.createdAt}-${chatMessage.message}`} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${isMine ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-800"}`}>
                    <p className="text-xs font-semibold opacity-80">{chatMessage.sender?.storeName || "User"}</p>
                    <p className="mt-1">{chatMessage.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <form onSubmit={handleSend} className="flex gap-3 rounded-3xl bg-white p-3 shadow-sm">
        <input
          type="text"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Type a message"
          className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        />
        <button type="submit" className="rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700">
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatPage;
