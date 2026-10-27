import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";

function VoiceSearchButton({ onVoiceResult, className = "" }) {
  const { language, setLanguage, handleVoiceCommand, t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [lang, setLang] = useState(language === "hi" ? "hi-IN" : "en-IN");
  const [transcriptLive, setTranscriptLive] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const recognitionRef = useRef(null);

  // Sync internal recognition lang if global language changes
  useEffect(() => {
    setLang(language === "hi" ? "hi-IN" : "en-IN");
  }, [language]);

  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = lang;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscriptLive("");
        setToastMessage(
          lang === "hi-IN"
            ? "सुन रहे हैं... बोलिए (उदा: 'टमाटर', 'दूध', या 'Hindi me karo')"
            : "Listening... speak (e.g. 'Tomatoes', 'Milk', or 'Hindi mein karo')"
        );
      };

      recognition.onresult = (event) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscriptLive(currentTranscript);

        // If final result
        if (event.results[event.results.length - 1].isFinal) {
          const finalClean = currentTranscript.trim();
          if (finalClean) {
            // 1. Check if user gave a Voice Language Command ("Website ko Hindi mein karo")
            const handled = handleVoiceCommand(finalClean);
            if (handled) {
              setIsListening(false);
              setTranscriptLive("");
              setToastMessage(
                language === "en"
                  ? "🌐 Switched to Hindi!"
                  : "🌐 Switched to English!"
              );
              setTimeout(() => setToastMessage(""), 3500);
              return;
            }

            // 2. Otherwise execute normal product search
            onVoiceResult?.(finalClean);
            setToastMessage(`${t("voice_search_for", "Searched for:")} "${finalClean}"`);
            setTimeout(() => setToastMessage(""), 3500);
          }
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setToastMessage("Microphone permission denied. Please allow mic in browser settings.");
        } else if (event.error === "no-speech") {
          setToastMessage("No voice detected. Please speak closer to microphone.");
        } else {
          setToastMessage("Voice search error. Please try typing.");
        }
        setTimeout(() => setToastMessage(""), 4000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      try {
        recognitionRef.current?.abort();
      } catch (e) {
        // ignore
      }
    };
  }, [lang, onVoiceResult, handleVoiceCommand, language, t]);

  const toggleListening = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) {
      alert(
        "Voice Search is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Android Chrome."
      );
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        // ignore
      }
      setIsListening(false);
    } else {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.lang = lang;
          recognitionRef.current.start();
        }
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        setIsListening(false);
      }
    }
  };

  return (
    <div className="relative inline-flex items-center">
      {/* Mic Trigger Button */}
      <button
        type="button"
        onClick={toggleListening}
        className={`relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl transition-all duration-300 ${
          isListening
            ? "bg-rose-500 text-white shadow-lg shadow-rose-500/40 scale-105"
            : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95"
        } ${className}`}
        aria-label={isListening ? "Stop listening" : "Voice search"}
        title={
          isListening
            ? "Listening... click to stop"
            : "Search by voice (बोलकर खोजें / भाषा बदलें)"
        }
      >
        {isListening ? (
          <span className="relative flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex h-4 w-4 items-center justify-center text-xs">
              🎙️
            </span>
          </span>
        ) : (
          <span className="text-sm sm:text-base">🎙️</span>
        )}
      </button>

      {/* Floating Active Voice Listening Bar / Tooltip */}
      {(isListening || toastMessage) && (
        <div className="absolute top-12 right-0 sm:left-1/2 sm:-translate-x-1/2 z-50 w-72 sm:w-84 rounded-2xl border border-emerald-200 bg-white p-3.5 shadow-2xl backdrop-blur-md animate-fade-in">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isListening ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                }`}
              />
              <span className="text-xs font-black text-slate-800">
                {isListening ? "Listening Now..." : "Voice Assistant"}
              </span>
            </div>

            {/* Language Switcher in Voice Tooltip */}
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => {
                  setLang("hi-IN");
                  setLanguage("hi");
                }}
                className={`rounded px-1.5 py-0.5 transition ${
                  lang === "hi-IN"
                    ? "bg-emerald-700 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => {
                  setLang("en-IN");
                  setLanguage("en");
                }}
                className={`rounded px-1.5 py-0.5 transition ${
                  lang === "en-IN"
                    ? "bg-emerald-700 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Eng
              </button>
            </div>
          </div>

          <div className="mt-2.5 text-center">
            {transcriptLive ? (
              <p className="text-sm font-black text-emerald-800 italic">
                "{transcriptLive}"
              </p>
            ) : (
              <p className="text-xs text-slate-600 font-medium">
                {toastMessage ||
                  (lang === "hi-IN"
                    ? "उपज का नाम बोलें या 'Hindi mein karo' बोलें"
                    : "Speak produce name or 'Hindi mein karo'")}
              </p>
            )}
          </div>

          {/* Quick Voice Command Hint */}
          <div className="mt-2 rounded-xl bg-emerald-50/80 px-2.5 py-1 text-[11px] text-emerald-900 flex items-center justify-center gap-1">
            <span>💡</span>
            <span>
              {language === "hi"
                ? "बोले: 'English mein karo' भाषा बदलने हेतु"
                : "Say: 'Website ko Hindi mein karo'"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default VoiceSearchButton;
