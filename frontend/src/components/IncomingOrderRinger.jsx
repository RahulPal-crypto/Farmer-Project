import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import api, { getBackendBaseUrl } from "../services/api";
import { updateOrderStatus } from "../services/orderService";

// Real Telephone Dual-Tone Ringtone Synthesizer (Web Audio API)
class TelephoneRinger {
  constructor() {
    this.audioCtx = null;
    this.intervalId = null;
    this.isPlaying = false;
  }

  init() {
    if (typeof window === "undefined") return;
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        try {
          this.audioCtx = new AudioCtx();
        } catch (e) {
          console.warn("AudioContext initialization warning:", e);
        }
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
  }

  // Play a single ring burst (two telephone pulses: 440Hz + 480Hz)
  playRingBurst() {
    this.init();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;

      // Pulse 1 (0.0s to 0.4s)
      this.createDualTone(440, 480, now, 0.4);

      // Pulse 2 (0.6s to 1.0s)
      this.createDualTone(440, 480, now + 0.6, 0.4);
    } catch (err) {
      console.warn("Ring burst error:", err);
    }
  }

  createDualTone(freq1, freq2, startTime, duration) {
    if (!this.audioCtx) return;
    try {
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(freq1, startTime);
      osc2.frequency.setValueAtTime(freq2, startTime);

      gain.gain.setValueAtTime(0.35, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + duration);
      osc2.stop(startTime + duration);
    } catch (e) {
      console.warn("Tone creation error:", e);
    }
  }

  // Start continuous telephone ringing (repeats every 2.5 seconds)
  start() {
    if (this.isPlaying) return;
    this.init();
    this.isPlaying = true;

    // First ring immediately
    this.playRingBurst();

    // Repeat ring burst every 2.5s
    this.intervalId = setInterval(() => {
      if (this.isPlaying) {
        this.playRingBurst();
      }
    }, 2500);
  }

  // Stop ringing immediately
  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Play upbeat success chime
  playSuccessChime() {
    this.init();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.25, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.35);
      });
    } catch (e) {}
  }
}

const ringer = new TelephoneRinger();

export default function IncomingOrderRinger() {
  const { user, token } = useAuth();
  const { isHindi } = useLanguage();

  const [incomingOrder, setIncomingOrder] = useState(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [actionFeedback, setActionFeedback] = useState(null);

  const recognitionRef = useRef(null);
  const seenOrderIdsRef = useRef(new Set());
  const initialLoadDoneRef = useRef(false);
  const isAnsweringRef = useRef(false);
  isAnsweringRef.current = isAnswering;

  // Text-To-Speech announcement
  const speakAnnouncement = useCallback((text) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = "hi-IN";
      utt.rate = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const hi = voices.find((v) => v.lang && v.lang.startsWith("hi")) || voices[0];
      if (hi) utt.voice = hi;
      window.speechSynthesis.speak(utt);
    } catch (e) {
      console.warn("TTS error:", e);
    }
  }, []);

  // Stop Ringing & Speech
  const stopAllRinging = useCallback(() => {
    ringer.stop();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIncomingOrder(null);
    setIsAnswering(false);
    setVoiceTranscript("");
  }, []);

  // Accept Order
  const handleAccept = useCallback(
    async (order) => {
      if (!order || isAnsweringRef.current) return;
      setIsAnswering(true);
      ringer.stop();
      ringer.playSuccessChime();

      speakAnnouncement(
        isHindi
          ? "ऑर्डर स्वीकार कर लिया गया है। बधाई हो!"
          : "Order accepted successfully!"
      );

      try {
        if (!order.isDemo && order._id) {
          await updateOrderStatus({ orderId: order._id, status: "accepted" });
        }
        setActionFeedback({
          type: "success",
          message: isHindi ? "✅ ऑर्डर स्वीकार हो गया है!" : "✅ Order Accepted!",
        });
        setTimeout(() => {
          stopAllRinging();
        }, 2000);
      } catch (err) {
        console.warn("Error updating order status:", err);
        setActionFeedback({
          type: "error",
          message: isHindi ? "स्टेटस अपडेट करने में समस्या आई" : "Failed to update order status",
        });
        setTimeout(() => {
          stopAllRinging();
        }, 2500);
      }
    },
    [isHindi, speakAnnouncement, stopAllRinging]
  );

  // Reject Order
  const handleReject = useCallback(
    async (order) => {
      if (!order || isAnsweringRef.current) return;
      setIsAnswering(true);
      ringer.stop();

      speakAnnouncement(isHindi ? "ऑर्डर रद्द कर दिया गया।" : "Order declined.");

      try {
        if (!order.isDemo && order._id) {
          await updateOrderStatus({ orderId: order._id, status: "rejected" });
        }
        setActionFeedback({
          type: "rejected",
          message: isHindi ? "❌ ऑर्डर अस्वीकार कर दिया गया" : "❌ Order Declined",
        });
        setTimeout(() => {
          stopAllRinging();
        }, 2000);
      } catch (err) {
        console.warn("Error declining order:", err);
        setTimeout(() => {
          stopAllRinging();
        }, 2000);
      }
    },
    [isHindi, speakAnnouncement, stopAllRinging]
  );

  // Trigger Incoming Call Alert (Ringing + Modal + Speech)
  const triggerIncomingCall = useCallback(
    (order) => {
      if (!order) return;
      setIncomingOrder(order);
      setActionFeedback(null);
      setVoiceTranscript("");

      // Start ringing out loud immediately!
      try {
        ringer.start();
      } catch (e) {
        console.warn("Ringer start error:", e);
      }

      // Announce order in Hindi after 1.2s of ringing
      const customerName = order.customer?.storeName || (isHindi ? "ग्राहक" : "Customer");
      const total = Number(order.totalPrice || order.total || 0).toFixed(0);
      const itemsDesc = order.items
        ?.map((it) => `${it.name || it.product?.name || "फसल"} (${it.quantity || 1})`)
        .join(", ");

      const speech = isHindi
        ? `नया ऑर्डर आया है! ${customerName} से ${itemsDesc}, कुल ₹${total}। स्वीकार करने के लिए 'हाँ' बोलें या बटन दबाएं।`
        : `New order from ${customerName} for ${itemsDesc}, total Rs. ${total}. Say Yes to accept.`;

      setTimeout(() => {
        speakAnnouncement(speech);
      }, 1200);

      // Start listening to microphone for "हाँ" / "ना"
      const SpeechRecognition =
        typeof window !== "undefined"
          ? window.SpeechRecognition || window.webkitSpeechRecognition
          : null;

      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          recognitionRef.current = rec;
          rec.lang = "hi-IN";
          rec.continuous = true;
          rec.interimResults = true;

          rec.onresult = (event) => {
            let heard = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              heard += event.results[i][0].transcript;
            }
            setVoiceTranscript(heard);
            const lower = heard.toLowerCase();

            // Affirmative
            if (/(हाँ|हां|स्वीकार|करो|यस|yes|accept|ok|haan|sweekar)/i.test(lower)) {
              try {
                rec.stop();
              } catch (e) {}
              handleAccept(order);
            } else if (/(नहीं|ना|रद्द|नो|no|reject|cancel|nahi|na)/i.test(lower)) {
              try {
                rec.stop();
              } catch (e) {}
              handleReject(order);
            }
          };

          rec.start();
        } catch (e) {
          console.warn("Speech rec error:", e);
        }
      }
    },
    [isHindi, speakAnnouncement, handleAccept, handleReject]
  );

  // 1. Initial seed of existing order IDs so we only ring for NEW incoming orders
  useEffect(() => {
    if (!token || user?.role !== "farmer") return;

    let mounted = true;
    api
      .get("/orders/received")
      .then(({ data }) => {
        if (!mounted || !data?.orders) return;
        data.orders.forEach((o) => seenOrderIdsRef.current.add(String(o._id)));
        initialLoadDoneRef.current = true;
      })
      .catch(() => {
        initialLoadDoneRef.current = true;
      });

    return () => {
      mounted = false;
    };
  }, [token, user?.role]);

  // 2. High-speed 3.5s background polling fallback (Guaranteed automatic ring even if WebSocket drops!)
  useEffect(() => {
    if (!token || user?.role !== "farmer") return;

    const interval = setInterval(async () => {
      if (!initialLoadDoneRef.current || incomingOrder) return;

      try {
        const { data } = await api.get("/orders/received");
        if (!data?.orders) return;

        for (const o of data.orders) {
          const idStr = String(o._id);
          if (!seenOrderIdsRef.current.has(idStr)) {
            seenOrderIdsRef.current.add(idStr);
            // If it's a pending order, TRIGGER THE LOUD RING AUTOMATICALLY!
            if (o.status === "pending") {
              triggerIncomingCall(o);
              break;
            }
          }
        }
      } catch (err) {
        // silent polling error
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [token, user?.role, incomingOrder, triggerIncomingCall]);

  // 3. Real-time WebSocket connection to Render
  useEffect(() => {
    if (!token || user?.role !== "farmer") return;

    let socket;
    try {
      socket = io(getBackendBaseUrl(), {
        auth: { token },
        transports: ["websocket", "polling"],
      });

      socket.on("order:new", (order) => {
        // Direct real dynamic order from customer checkout
        if (order && !seenOrderIdsRef.current.has(String(order._id))) {
          seenOrderIdsRef.current.add(String(order._id));
          triggerIncomingCall(order);
        }
      });

      socket.on("notification:new", async (notif) => {
        if (notif?.type === "order" && notif?.metadata?.orderId && !incomingOrder) {
          const idStr = String(notif.metadata.orderId);
          if (!seenOrderIdsRef.current.has(idStr)) {
            seenOrderIdsRef.current.add(idStr);
            try {
              const { data } = await api.get(`/orders/${idStr}`);
              if (data?.order) {
                triggerIncomingCall(data.order);
              }
            } catch (err) {
              console.warn("Could not fetch real dynamic order:", err);
            }
          }
        }
      });
    } catch (err) {
      console.warn("Socket init error:", err);
    }

    return () => {
      if (socket) {
        try {
          socket.disconnect();
        } catch (e) {}
      }
    };
  }, [token, user?.role, triggerIncomingCall, incomingOrder]);

  // 4. Auto-unlock AudioContext on any interaction with window
  useEffect(() => {
    if (typeof window === "undefined") return;
    const unlockAudio = () => {
      ringer.init();
    };
    window.addEventListener("click", unlockAudio, { once: true });
    window.addEventListener("touchstart", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });
    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  // Dynamic Trigger for testing using real database records
  const triggerDynamicRing = async () => {
    try {
      // 1. Check if farmer has any real received orders in MongoDB
      const { data: orderData } = await api.get("/orders/received");
      if (orderData?.orders && orderData.orders.length > 0) {
        // Use the farmer's latest real order from the database!
        const latestRealOrder = orderData.orders[0];
        triggerIncomingCall(latestRealOrder);
        return;
      }

      // 2. If no orders exist yet, fetch the farmer's actual listed products from MongoDB
      const { data: prodData } = await api.get("/products/mine");
      if (prodData?.products && prodData.products.length > 0) {
        const p1 = prodData.products[0];
        const p2 = prodData.products[1] || null;
        const dynamicItems = [{ name: p1.name, quantity: 2, price: p1.price }];
        let total = p1.price * 2;
        if (p2) {
          dynamicItems.push({ name: p2.name, quantity: 1, price: p2.price });
          total += p2.price;
        }

        triggerIncomingCall({
          _id: "preview_" + Date.now(),
          isDemo: true,
          customer: {
            storeName: user?.storeName ? `Buyer for ${user.storeName}` : "Local Buyer",
            phone: user?.phone || "Customer",
          },
          items: dynamicItems,
          totalPrice: total,
          deliveryAddress: {
            street: "Direct Farm Proximity",
            city: user?.location?.city || (isHindi ? "स्थानीय सेवा क्षेत्र" : "Service Radius"),
            deliverySlot: "Morning Harvest (7:00 AM - 10:00 AM)",
          },
        });
        return;
      }

      // 3. Fallback preview
      triggerIncomingCall({
        _id: "demo_" + Date.now(),
        isDemo: true,
        customer: {
          storeName: "Rahul Pal (Verified Buyer)",
          phone: "+91 98765 43210",
        },
        items: [{ name: isHindi ? "ताज़ा जैविक टमाटर" : "Organic Tomatoes", quantity: 5, price: 40 }],
        totalPrice: 200,
        deliveryAddress: {
          city: user?.location?.city || "Varanasi",
          deliverySlot: "Morning Harvest (7:00 AM - 10:00 AM)",
        },
      });
    } catch (err) {
      console.warn("Could not load dynamic data from database:", err);
      triggerIncomingCall({
        _id: "demo_" + Date.now(),
        isDemo: true,
        customer: {
          storeName: "Rahul Pal",
          phone: "+91 98765 43210",
        },
        items: [{ name: isHindi ? "ताज़ा गेहूं" : "Fresh Wheat", quantity: 20, price: 35 }],
        totalPrice: 700,
        deliveryAddress: {
          city: "Regional Market",
          deliverySlot: "Standard Delivery",
        },
      });
    }
  };

  // Only render for logged-in farmers
  if (user?.role !== "farmer") {
    return null;
  }

  return (
    <>
      {/* Floating Bottom-Right Quick Test Pill for Farmer */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
        <button
          type="button"
          onClick={triggerDynamicRing}
          className="flex items-center gap-2 rounded-full border-2 border-emerald-500 bg-white px-4 py-2.5 text-xs font-black text-emerald-800 shadow-xl hover:bg-emerald-50 active:scale-95 transition"
          title="तुरंत घंटी बजाकर इनकमिंग कॉल टेस्ट करें"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
          </span>
          <span className="text-base">🔔</span>
          <span>{isHindi ? "टेस्ट कॉल रिंग बजाएं" : "Test Ring Sound"}</span>
        </button>
      </div>

      {/* FULL-SCREEN INCOMING ORDER CALL MODAL (RINGS CONTINUOUSLY!) */}
      {incomingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border-4 border-emerald-400 bg-white p-6 sm:p-8 shadow-2xl text-center animate-bounce-short">
            {/* Pulsing Ring Glow Effect */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center justify-center">
              <span className="absolute h-36 w-36 animate-ping rounded-full bg-emerald-400 opacity-30"></span>
              <span className="absolute h-28 w-28 animate-pulse rounded-full bg-emerald-500 opacity-40"></span>
            </div>

            {/* Calling Bell Icon */}
            <div className="relative mx-auto mt-2 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-lime-500 text-5xl text-white shadow-xl shadow-emerald-600/40 animate-pulse">
              📞
            </div>

            {/* Title & Ringing status */}
            <div className="mt-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-900 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-ping"></span>
                {isHindi ? "घंटी बज रही है... (RINGING)" : "INCOMING ORDER RINGING..."}
              </span>

              <h2 className="mt-2 text-2xl font-black text-slate-900">
                {incomingOrder.customer?.storeName || "Customer"}
              </h2>
              <p className="text-xs text-slate-500">
                {incomingOrder.deliveryAddress?.city
                  ? `📍 ${incomingOrder.deliveryAddress.city} • 📲 ${incomingOrder.customer?.phone || ""}`
                  : "Direct Farm Customer"}
              </p>
            </div>

            {/* Order Items & Total Box */}
            <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-left">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  {isHindi ? "कुल भुगतान राशि:" : "Total Amount:"}
                </span>
                <span className="text-xl font-black text-emerald-800">
                  ₹{Number(incomingOrder.totalPrice || incomingOrder.total || 0).toFixed(0)}
                </span>
              </div>

              <div className="mt-2 space-y-1">
                <p className="text-xs font-bold text-slate-700">{isHindi ? "ऑर्डर की गई फसलें:" : "Items Ordered:"}</p>
                <div className="max-h-24 overflow-y-auto space-y-1">
                  {incomingOrder.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-slate-600">
                      <span>• {it.name || it.product?.name || "Produce"}</span>
                      <span className="font-bold">x {it.quantity || 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Voice Detection Indicator */}
            {voiceTranscript && (
              <div className="mt-3 rounded-xl border border-emerald-300 bg-white p-2.5 text-xs text-emerald-900 font-bold">
                🎙️ {isHindi ? "माइक में सुना:" : "Heard:"} "{voiceTranscript}"
              </div>
            )}

            {/* Action Feedback */}
            {actionFeedback && (
              <div
                className={`mt-4 rounded-xl p-3 text-sm font-black ${
                  actionFeedback.type === "success"
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-rose-100 text-rose-900"
                }`}
              >
                {actionFeedback.message}
              </div>
            )}

            {/* Big Action Buttons (Accept vs Reject) */}
            <div className="mt-6 grid grid-cols-2 gap-3.5">
              <button
                type="button"
                disabled={isAnswering}
                onClick={() => handleAccept(incomingOrder)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-700 hover:to-emerald-800 active:scale-95 transition disabled:opacity-50"
              >
                <span className="text-xl">✅</span>
                <span>{isHindi ? "स्वीकार करें" : "Accept Order"}</span>
              </button>

              <button
                type="button"
                disabled={isAnswering}
                onClick={() => handleReject(incomingOrder)}
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-rose-300 bg-rose-50 py-4 text-base font-black text-rose-700 hover:bg-rose-100 active:scale-95 transition disabled:opacity-50"
              >
                <span className="text-xl">❌</span>
                <span>{isHindi ? "अस्वीकार" : "Reject"}</span>
              </button>
            </div>

            <p className="mt-4 text-[11px] text-slate-400">
              {isHindi
                ? "💡 टिप: आप अपने मुँह से 'हाँ' बोलकर भी इसे तुरंत स्वीकार कर सकते हैं।"
                : "💡 Tip: You can also say 'Yes' out loud to accept hands-free."}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
