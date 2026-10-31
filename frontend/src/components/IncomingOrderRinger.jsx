import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { getBackendBaseUrl } from "../services/api";
import { updateOrderStatus } from "../services/orderService";

// Real Telephone Dual-Tone Ringtone Synthesizer (Web Audio API)
class TelephoneRinger {
  constructor() {
    this.audioCtx = null;
    this.intervalId = null;
    this.isPlaying = false;
  }

  init() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
  }

  // Play a single ring burst (two telephone pulses: 440Hz + 480Hz)
  playRingBurst() {
    if (!this.audioCtx) this.init();
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

  // Auto-unlock AudioContext on any interaction with window
  useEffect(() => {
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

  // Text-To-Speech
  const speakAnnouncement = useCallback((text) => {
    if (!window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = "hi-IN";
      utt.rate = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const hi = voices.find((v) => v.lang.startsWith("hi")) || voices[0];
      if (hi) utt.voice = hi;
      window.speechSynthesis.speak(utt);
    } catch (e) {}
  }, []);

  // Stop Ringing & Speech
  const stopAllRinging = useCallback(() => {
    ringer.stop();
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
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

  // Trigger Incoming Call Alert (Ringing + Screen + Speech)
  const triggerIncomingCall = useCallback(
    (order) => {
      if (!order) return;
      setIncomingOrder(order);
      setActionFeedback(null);
      setVoiceTranscript("");

      // Start ringing out loud immediately!
      ringer.start();

      // Announce order in Hindi after 1 second of ringing
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
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
              rec.stop();
              handleAccept(order);
            } else if (/(नहीं|ना|रद्द|नो|no|reject|cancel|nahi|na)/i.test(lower)) {
              rec.stop();
              handleReject(order);
            }
          };

          rec.start();
        } catch (e) {
          console.warn("Speech rec error:", e);
        }
      }
    },
    [isHindi, speakAnnouncement]
  );

  // Accept Order
  const handleAccept = async (order) => {
    setIsAnswering(true);
    ringer.stop();
    ringer.playSuccessChime();

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      speakAnnouncement(
        isHindi
          ? "ऑर्डर स्वीकार कर लिया गया है। बधाई हो!"
          : "Order accepted successfully!"
      );
    }

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
  };

  // Reject Order
  const handleReject = async (order) => {
    setIsAnswering(true);
    ringer.stop();

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      speakAnnouncement(isHindi ? "ऑर्डर रद्द कर दिया गया।" : "Order declined.");
    }

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
  };

  // Listen to incoming real-time socket events
  useEffect(() => {
    if (!token || user?.role !== "farmer") return;

    const socket = io(getBackendBaseUrl(), {
      auth: { token },
    });

    socket.on("order:new", (order) => {
      triggerIncomingCall(order);
    });

    socket.on("notification:new", (notif) => {
      if (notif.type === "order" && !incomingOrder) {
        triggerIncomingCall({
          _id: notif.metadata?.orderId,
          customer: { storeName: "Customer" },
          items: [{ name: notif.title || "Fresh Harvest Produce", quantity: 1 }],
          totalPrice: notif.message?.match(/\d+/)?.[0] || 50,
          deliveryAddress: { street: "Customer Destination", city: "Local Town" },
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user?.role, triggerIncomingCall, incomingOrder]);

  // Demo Trigger for instant testing
  const triggerDemoRing = () => {
    const demo = {
      _id: "demo_" + Date.now(),
      isDemo: true,
      customer: {
        storeName: "Rahul Pal (Customer)",
        phone: "6307512296",
      },
      items: [
        { name: isHindi ? "देसी टमाटर (Desi Tomato)" : "Desi Tomato", quantity: 2, price: 40 },
        { name: isHindi ? "ताज़ा आलू (Fresh Potato)" : "Fresh Potato", quantity: 1, price: 25 },
      ],
      totalPrice: 105,
      deliveryAddress: {
        street: "Chaubepur Road, Near Shiv Temple",
        city: "Kanpur",
        deliverySlot: "Morning Harvest (7:00 AM - 10:00 AM)",
      },
    };
    triggerIncomingCall(demo);
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
          onClick={triggerDemoRing}
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
