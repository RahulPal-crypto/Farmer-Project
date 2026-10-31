import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { getBackendBaseUrl } from "../services/api";

// Web Audio API dual-tone chime
const playNotificationChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.15);
    gain2.gain.setValueAtTime(0.3, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.65);
  } catch (err) {
    console.warn("Chime audio could not play:", err);
  }
};

export default function VoiceOrderAssistant({ onOrderAccepted, onOrderRejected, availableOrders = [] }) {
  const { user, token } = useAuth();
  const { isHindi } = useLanguage();

  const [isEnabled, setIsEnabled] = useState(() => {
    try {
      return localStorage.getItem("krishisetu_voice_bot_enabled") !== "false";
    } catch {
      return true;
    }
  });

  const [activeOrder, setActiveOrder] = useState(null);
  const [stage, setStage] = useState("idle"); // idle | announcing | listening | confirmed | rejected | error
  const [transcript, setTranscript] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  const toggleEnabled = () => {
    setIsEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("krishisetu_voice_bot_enabled", String(next));
      } catch (e) {}
      if (!next) {
        cancelVoiceFlow();
      }
      return next;
    });
  };

  const cancelVoiceFlow = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setActiveOrder(null);
    setStage("idle");
    setTranscript("");
    setStatusMessage("");
  }, []);

  // Text-To-Speech helper
  const speakText = useCallback(
    (text, onFinished) => {
      if (!window.speechSynthesis) {
        if (onFinished) onFinished();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = isHindi ? "hi-IN" : "en-IN";
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const selectedVoice =
        voices.find((v) => v.lang.startsWith("hi") || v.lang === "hi-IN") ||
        voices.find((v) => v.lang.startsWith("en-IN")) ||
        voices[0];

      if (selectedVoice) utterance.voice = selectedVoice;

      utterance.onend = () => {
        if (onFinished) onFinished();
      };
      utterance.onerror = () => {
        if (onFinished) onFinished();
      };

      window.speechSynthesis.speak(utterance);
    },
    [isHindi]
  );

  // Intent parsing (Positive vs Negative keywords)
  const parseVoiceIntent = (text) => {
    if (!text) return null;
    const lower = text.toLowerCase().trim();

    // Affirmative / Accept keywords
    const positiveRegex = /(हाँ|हां|स्वीकार|करो|यस|सही|पक्का|कन्फर्म|ले लो|yes|accept|ok|okay|haan|sweekar|ha|accept it)/i;
    // Negative / Reject keywords
    const negativeRegex = /(नहीं|ना|रद्द|नो|मत|कैंसिल|अस्वीकार|no|reject|cancel|nahi|na|cancel it)/i;

    if (positiveRegex.test(lower)) return "accept";
    if (negativeRegex.test(lower)) return "reject";
    return null;
  };

  // Start Voice Listening loop
  const startListening = useCallback(
    (order) => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setStatusMessage(
          isHindi
            ? "ब्राउज़र में वॉयस रिकॉग्निशन समर्थित नहीं है। नीचे दिए बटनों का उपयोग करें।"
            : "Voice recognition not supported in this browser. Please use buttons below."
        );
        setStage("listening");
        return;
      }

      try {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = isHindi ? "hi-IN" : "en-IN";
        recognition.continuous = false;
        recognition.interimResults = true;

        setStage("listening");
        setStatusMessage(isHindi ? "🎧 सुन रहे हैं... कृपया 'हाँ' या 'ना' बोलें" : "🎧 Listening... Speak 'Yes' or 'No'");

        recognition.onresult = (event) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);

          const intent = parseVoiceIntent(currentTranscript);
          if (intent === "accept") {
            try {
              recognition.stop();
            } catch (e) {}
            handleAccept(order);
          } else if (intent === "reject") {
            try {
              recognition.stop();
            } catch (e) {}
            handleReject(order);
          }
        };

        recognition.onerror = (event) => {
          console.warn("Speech recognition error:", event?.error);
          if (event?.error === "no-speech") {
            setStatusMessage(
              isHindi ? "कोई आवाज़ नहीं सुनाई दी। बटन दबाकर उत्तर दें।" : "No speech detected. Use buttons below."
            );
          } else {
            setStatusMessage(
              isHindi ? "माइक परमिशन या त्रुटि। बटन का उपयोग करें।" : "Mic error. Use buttons below."
            );
          }
        };

        recognition.onend = () => {
          // If ended without intent, allow manual click
        };

        recognition.start();

        // Safety timeout: 12 seconds
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setStatusMessage(
            isHindi
              ? "समय समाप्त। कृपया नीचे दिए 'स्वीकार' या 'अस्वीकार' बटन पर क्लिक करें।"
              : "Listening timed out. Please tap Accept or Reject below."
          );
        }, 12000);
      } catch (err) {
        console.warn("Speech recognition start failed:", err);
        setStage("listening");
      }
    },
    [isHindi]
  );

  // Full Order Announcement workflow
  const processIncomingOrder = useCallback(
    (order) => {
      if (!isEnabled || !order) return;

      setActiveOrder(order);
      setStage("announcing");
      setTranscript("");
      playNotificationChime();

      const farmerName = user?.storeName || (isHindi ? "किसान" : "Farmer");
      const customerName = order.customer?.storeName || (isHindi ? "ग्राहक" : "Customer");
      const itemCount = order.items?.length || 1;
      const firstItem = order.items?.[0]?.product?.name || order.items?.[0]?.name || (isHindi ? "फसल" : "produce");
      const total = Number(order.totalPrice || order.total || 0).toFixed(0);

      const announcementHindi = `नमस्ते ${farmerName} जी! ${customerName} से ${itemCount} सामग्री, जैसे ${firstItem} का नया ऑर्डर आया है, कुल राशि ₹${total} है। क्या आप यह ऑर्डर स्वीकार करते हैं? 'हाँ' या 'ना' बोलें।`;
      const announcementEnglish = `Hello ${farmerName}! New order from ${customerName} for ${itemCount} items including ${firstItem}, total Rs. ${total}. Do you accept this order? Speak Yes or No.`;

      const speech = isHindi ? announcementHindi : announcementEnglish;
      setStatusMessage(isHindi ? "📢 नया ऑर्डर घोषित हो रहा है..." : "📢 Announcing new order...");

      // Wait a moment for chime to finish then speak
      setTimeout(() => {
        speakText(speech, () => {
          // Trigger listening
          startListening(order);
        });
      }, 500);
    },
    [isEnabled, isHindi, user?.storeName, speakText, startListening]
  );

  // Accept Action
  const handleAccept = useCallback(
    async (order) => {
      setStage("confirmed");
      setStatusMessage(isHindi ? "✅ ऑर्डर स्वीकार कर लिया गया है!" : "✅ Order Accepted!");
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      const confirmSpeech = isHindi
        ? "ऑर्डर स्वीकार कर लिया गया है। कृपया ताज़ा तुड़ाई व पैकिंग शुरू करें।"
        : "Order accepted successfully! Please start harvest and packaging.";

      speakText(confirmSpeech, () => {
        setTimeout(() => {
          cancelVoiceFlow();
        }, 2500);
      });

      if (onOrderAccepted && order) {
        onOrderAccepted(order);
      }
    },
    [isHindi, speakText, cancelVoiceFlow, onOrderAccepted]
  );

  // Reject Action
  const handleReject = useCallback(
    async (order) => {
      setStage("rejected");
      setStatusMessage(isHindi ? "❌ ऑर्डर अस्वीकार कर दिया गया है।" : "❌ Order Rejected.");
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      const rejectSpeech = isHindi ? "ऑर्डर रद्द कर दिया गया है।" : "Order has been declined.";

      speakText(rejectSpeech, () => {
        setTimeout(() => {
          cancelVoiceFlow();
        }, 2500);
      });

      if (onOrderRejected && order) {
        onOrderRejected(order);
      }
    },
    [isHindi, speakText, cancelVoiceFlow, onOrderRejected]
  );

  // Socket.IO Listener for Real-time New Orders
  useEffect(() => {
    if (!token || !isEnabled || user?.role !== "farmer") return;

    const socket = io(getBackendBaseUrl(), {
      auth: { token },
    });

    socket.on("order:new", (newOrder) => {
      processIncomingOrder(newOrder);
    });

    socket.on("notification:new", (notif) => {
      if (notif.type === "order" && notif.metadata?.orderId && !activeOrder) {
        // Fallback if full order:new wasn't caught
        const matched = availableOrders.find((o) => o._id === notif.metadata.orderId);
        if (matched) {
          processIncomingOrder(matched);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, isEnabled, user?.role, processIncomingOrder, activeOrder, availableOrders]);

  // Demo Trigger for Instant Testing
  const handleTestDemoOrder = () => {
    const demoOrder = {
      _id: "demo_" + Date.now(),
      isDemo: true,
      customer: {
        storeName: "Rahul Pal (कानपुर)",
        phone: "6307512296",
      },
      items: [
        { name: "Desi Tomato (देसी टमाटर)", quantity: 2, price: 40 },
        { name: "Fresh Potato (आलू)", quantity: 1, price: 25 },
      ],
      totalPrice: 105,
      deliveryAddress: {
        street: "Chaubepur Road, Near Shiv Temple",
        city: "Kanpur",
        deliverySlot: "Morning Harvest (7:00 AM - 10:00 AM)",
      },
    };
    processIncomingOrder(demoOrder);
  };

  return (
    <>
      {/* Floating Header Banner / Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-3 sm:px-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <span className="text-xl">🎙️</span>
            {isEnabled && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-black text-emerald-950">
                {isHindi ? "किसान इंटरैक्टिव वॉयस IVR" : "Farmer Interactive Voice IVR"}
              </p>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  isEnabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                }`}
              >
                {isEnabled ? (isHindi ? "सक्रिय (ON)" : "ACTIVE") : (isHindi ? "बंद (OFF)" : "OFF")}
              </span>
            </div>
            <p className="text-xs text-emerald-800/80">
              {isHindi
                ? "नया ऑर्डर आने पर बोलकर सुनाएगा और 'हाँ' बोलने पर तुरंत स्वीकार करेगा।"
                : "Speaks incoming orders out loud; say 'Yes' to accept hands-free."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Test Button */}
          <button
            type="button"
            onClick={handleTestDemoOrder}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500 bg-white px-3.5 py-1.5 text-xs font-black text-emerald-700 shadow-xs hover:bg-emerald-50 active:scale-95 transition"
            title="बोलकर ऑर्डर स्वीकारने का लाइव टेस्ट करें"
          >
            <span>🧪</span>
            <span>{isHindi ? "वॉयस टेस्ट करें" : "Test Voice Order"}</span>
          </button>

          {/* Toggle Button */}
          <button
            type="button"
            onClick={toggleEnabled}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-xs ${
              isEnabled ? "bg-emerald-700 text-white hover:bg-emerald-800" : "bg-slate-300 text-slate-700 hover:bg-slate-400"
            }`}
          >
            {isEnabled ? (isHindi ? "वॉयस चालू" : "Voice Enabled") : (isHindi ? "चालू करें" : "Enable Voice")}
          </button>
        </div>
      </div>

      {/* Full-Screen / Floating Voice Dialogue Modal */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border-2 border-emerald-400 bg-white p-6 sm:p-8 shadow-2xl animate-scale-up">
            {/* Close / Dismiss */}
            <button
              type="button"
              onClick={cancelVoiceFlow}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              title="बंद करें"
            >
              ✕
            </button>

            {/* Header with animated sound wave */}
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-4xl text-white shadow-lg shadow-emerald-500/30">
                {stage === "announcing" ? "📢" : stage === "listening" ? "🎙️" : stage === "confirmed" ? "✅" : "❌"}
              </div>

              {/* Pulsing sound wave animation */}
              {stage === "listening" && (
                <div className="mt-4 flex items-center justify-center gap-1.5">
                  <span className="h-6 w-1.5 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.3s]"></span>
                  <span className="h-10 w-1.5 animate-bounce rounded-full bg-emerald-600 [animation-delay:-0.15s]"></span>
                  <span className="h-14 w-1.5 animate-bounce rounded-full bg-emerald-700"></span>
                  <span className="h-10 w-1.5 animate-bounce rounded-full bg-emerald-600 [animation-delay:-0.15s]"></span>
                  <span className="h-6 w-1.5 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.3s]"></span>
                </div>
              )}

              <h2 className="mt-3 text-2xl font-black text-slate-900">
                {stage === "announcing"
                  ? isHindi ? "नया फसल ऑर्डर आया है!" : "Incoming Farm Order!"
                  : stage === "listening"
                  ? isHindi ? "सुन रहे हैं... 'हाँ' या 'ना' बोलें" : "Listening... Say 'Yes' or 'No'"
                  : stage === "confirmed"
                  ? isHindi ? "ऑर्डर स्वीकार कर लिया गया! 🎉" : "Order Accepted! 🎉"
                  : isHindi ? "ऑर्डर अस्वीकार कर दिया गया" : "Order Declined"}
              </h2>

              <p className="mt-1 text-sm font-bold text-emerald-700">{statusMessage}</p>
            </div>

            {/* Live Voice Transcript pill */}
            {transcript && (
              <div className="mt-4 rounded-2xl border border-emerald-300 bg-emerald-50/80 p-3 text-center">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  {isHindi ? "आपकी आवाज़ पहचानी गई:" : "Heard Your Voice:"}
                </p>
                <p className="mt-0.5 text-base font-black text-emerald-950">"{transcript}"</p>
              </div>
            )}

            {/* Order Brief Box */}
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-bold">{isHindi ? "ग्राहक:" : "Customer:"}</span>
                <span className="font-black text-slate-900">{activeOrder.customer?.storeName || "Customer"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-bold">{isHindi ? "कुल राशि:" : "Total Price:"}</span>
                <span className="font-black text-emerald-800 text-lg">
                  ₹{Number(activeOrder.totalPrice || activeOrder.total || 0).toFixed(0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 border-t border-slate-200 pt-2">
                <span>{isHindi ? "सामग्री:" : "Items:"}</span>
                <span className="font-semibold text-slate-800">
                  {activeOrder.items
                    ?.map((it) => `${it.product?.name || it.name} (${it.quantity || 1})`)
                    .join(", ")}
                </span>
              </div>
              {activeOrder.deliveryAddress?.street && (
                <div className="text-[11px] text-slate-500 border-t border-slate-200/60 pt-1.5">
                  📍 {activeOrder.deliveryAddress.street}, {activeOrder.deliveryAddress.city}
                </div>
              )}
            </div>

            {/* Manual Backup Buttons in case of loud tractor / farm noise */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleAccept(activeOrder)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-black text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700 active:scale-95 transition"
              >
                <span>✅</span>
                <span>{isHindi ? "हाँ, स्वीकार करें" : "Yes, Accept"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleReject(activeOrder)}
                className="flex items-center justify-center gap-2 rounded-2xl border border-rose-300 bg-white py-3.5 text-sm font-bold text-rose-600 hover:bg-rose-50 active:scale-95 transition"
              >
                <span>❌</span>
                <span>{isHindi ? "ना, रद्द करें" : "No, Reject"}</span>
              </button>
            </div>

            <p className="mt-3 text-center text-[11px] text-slate-400">
              {isHindi
                ? "माइक चालू है। आप सीधे 'हाँ' बोल सकते हैं या स्क्रीन पर टैप कर सकते हैं।"
                : "Microphone is active. Speak 'Yes' or tap the button directly."}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

