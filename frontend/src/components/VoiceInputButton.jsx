import { useState, useRef, useEffect } from "react";

function VoiceInputButton({ onVoiceInput, placeholderHint = "Speak to type...", className = "" }) {
  const [isListening, setIsListening] = useState(false);
  const [lang, setLang] = useState("hi-IN");
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = lang;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript?.trim();
        if (transcript) {
          onVoiceInput?.(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
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
  }, [lang, onVoiceInput]);

  const toggleListening = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Google Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = lang;
        recognitionRef.current.start();
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={toggleListening}
        className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition ${
          isListening
            ? "bg-rose-500 text-white animate-pulse shadow-xs"
            : "border border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300"
        } ${className}`}
        title={isListening ? "Listening... bolna band karein ya click karein" : "Bolkar likhein (Voice Dictation)"}
      >
        <span>{isListening ? "🔴" : "🎙️"}</span>
        <span className="hidden sm:inline">
          {isListening ? "Listening..." : "Speak"}
        </span>
      </button>
    </div>
  );
}

export default VoiceInputButton;

