import { createContext, useContext, useState, useEffect, useCallback } from "react";

const LanguageContext = createContext();

export const translations = {
  en: {
    // Navigation
    brand_name: "KrishiSetu",
    nav_home: "Home",
    nav_cart: "Cart",
    nav_wishlist: "Wishlist",
    nav_orders: "Orders",
    nav_group_orders: "Group Orders",
    nav_subscriptions: "Farm Boxes 📦",
    nav_dashboard: "Dashboard",
    nav_my_products: "My Products",
    nav_orders_received: "Orders Received",
    nav_subscribers: "Subscribers 📦",
    nav_add_product: "+ Add Produce",
    nav_admin: "Admin",
    nav_login: "Login",
    nav_signup: "Register",
    nav_logout: "Logout",
    nav_profile: "Profile",

    // Hero & Search
    hero_badge: "Local farm marketplace",
    hero_title_prefix: "Fresh groceries from local farmers, listed",
    hero_title_highlight: "near you.",
    hero_subtitle: "Shop vegetables, fruits, dairy, grains, and organic produce from listings added by real farmers in your service area.",
    search_placeholder: "Search tomatoes, dairy, grains, organic...",
    btn_browse_products: "Browse Products",
    btn_explore_nearby: "Explore Nearby Farms",
    btn_finding_farms: "Finding farms...",
    btn_reset_filters: "Reset Filters",

    // Categories
    cat_all: "All Produce",
    cat_vegetables: "Vegetables",
    cat_fruits: "Fruits",
    cat_grains: "Grains",
    cat_dairy: "Dairy",
    cat_organic: "Organic",

    // Sections & Stats
    section_verified_farmers: "Verified Local Farmers",
    section_fresh_produce: "Fresh Produce Listings",
    section_weather_title: "Live Weather & Smart Agri Advisory",
    section_mandi_title: "Govt Mandi Benchmark Rates",
    stat_fresh_harvest: "Fresh Harvests Daily",
    stat_verified_growers: "Verified Farmers",
    stat_direct_pricing: "Direct Farm Pricing",
    stat_fast_delivery: "Zero Middlemen",

    // Product Card & Modal
    prod_direct_farm: "Direct Farm",
    prod_sold_by: "Sold by",
    prod_per_kg: "/ kg",
    prod_add_to_cart: "Add to Cart",
    prod_in_cart: "In Cart",
    prod_out_of_stock: "Sold Out",
    prod_available_harvest: "Available for Harvest",
    prod_rating: "Rating",
    prod_stock: "Stock",
    prod_distance: "Distance",
    prod_save_for_later: "Save for Later",
    prod_saved_wishlist: "Saved in Wishlist",
    prod_listen: "Suniye (Listen)",
    prod_stop: "Stop",
    prod_harvested_today: "Harvested Today",
    prod_fresh_harvest: "Fresh Harvest",
    prod_govt_benchmark: "Government Mandi Benchmark:",
    prod_save_amount: "Save",
    prod_above_mandi: "Premium vs Mandi",

    // Farmer Add Product
    farmer_add_title: "Add New Crop Produce",
    farmer_add_desc: "List your fresh harvest, connect with local buyers, and compare rates against APMC Mandi prices.",
    farmer_crop_name: "Produce / Crop Name",
    farmer_category: "Category",
    farmer_price: "Your Price (₹ per kg / unit)",
    farmer_quantity: "Available Stock Quantity (kg / units)",
    farmer_mandi_select: "🏛️ Government Mandi Benchmark Crop",
    farmer_mandi_hint: "Matching this links APMC Mandi rates to display savings badge to customers.",
    farmer_auto_detect: "Auto-Detect from Produce Name & Category",
    farmer_location_title: "Farm Location Coordinates",
    farmer_pinpoint: "📍 Pinpoint Current Location",
    farmer_submit_btn: "Publish Produce Listing",
    farmer_speak: "Speak",
    farmer_listening: "Listening...",

    // Voice & Language Toast
    voice_switched_to_hi: "भाषा बदलकर हिन्दी कर दी गई है। (Switched to Hindi)",
    voice_switched_to_en: "Language switched to English.",
    voice_listening: "Listening... बोलिए",
    voice_search_for: "Searched for:",
  },

  hi: {
    // Navigation
    brand_name: "कृषिसेतु (KrishiSetu)",
    nav_home: "होम",
    nav_cart: "थैला (कार्ट)",
    nav_wishlist: "पसंदीदा",
    nav_orders: "मेरे ऑर्डर्स",
    nav_group_orders: "सामूहिक ऑर्डर",
    nav_subscriptions: "फ़ार्म बॉक्स 📦",
    nav_dashboard: "डैशबोर्ड",
    nav_my_products: "मेरी फसलें",
    nav_orders_received: "प्राप्त ऑर्डर्स",
    nav_subscribers: "ग्राहक सूची 📦",
    nav_add_product: "+ फसल जोड़ें",
    nav_admin: "एडमिन",
    nav_login: "लॉगिन",
    nav_signup: "रजिस्टर करें",
    nav_logout: "लॉगआउट",
    nav_profile: "प्रोफाइल",

    // Hero & Search
    hero_badge: "स्थानीय किसान मंडी",
    hero_title_prefix: "स्थानीय किसानों से ताज़ा उपज, सीधे आपके",
    hero_title_highlight: "नज़दीक।",
    hero_subtitle: "सब्ज़ियां, फल, अनाज, दूध और जैविक उत्पाद सीधे अपने क्षेत्र के असली किसानों से बिना किसी बिचौलिये के उचित दाम पर खरीदें।",
    search_placeholder: "टमाटर, आलू, दूध, अनाज, ताज़ा सब्ज़ियां खोजें...",
    btn_browse_products: "उपज देखें",
    btn_explore_nearby: "नज़दीकी खेत खोजें",
    btn_finding_farms: "खेत खोज रहे हैं...",
    btn_reset_filters: "फ़िल्टर हटाएं",

    // Categories
    cat_all: "सभी उत्पाद",
    cat_vegetables: "ताज़ा सब्ज़ियां",
    cat_fruits: "ताज़ा फल",
    cat_grains: "अनाज व दालें",
    cat_dairy: "दूध व डेयरी",
    cat_organic: "जैविक (ऑर्गेनिक)",

    // Sections & Stats
    section_verified_farmers: "सत्यापित स्थानीय किसान",
    section_fresh_produce: "ताज़ा फसल सूची",
    section_weather_title: "लाइव मौसम व स्मार्ट कृषि सलाह",
    section_mandi_title: "सरकारी मंडी भाव (APMC)",
    stat_fresh_harvest: "रोज़ाना ताज़ा कटाई",
    stat_verified_growers: "सत्यापित किसान",
    stat_direct_pricing: "सीधा किसान मूल्य",
    stat_fast_delivery: "बिचौलिया मुक्त",

    // Product Card & Modal
    prod_direct_farm: "सीधे खेत से",
    prod_sold_by: "विक्रेता किसान:",
    prod_per_kg: "/ किग्रा",
    prod_add_to_cart: "कार्ट में जोड़ें",
    prod_in_cart: "कार्ट में है",
    prod_out_of_stock: "स्टॉक समाप्त",
    prod_available_harvest: "ताज़ा कटाई हेतु उपलब्ध",
    prod_rating: "रेटिंग",
    prod_stock: "उपलब्ध मात्रा",
    prod_distance: "दूरी",
    prod_save_for_later: "पसंदीदा में रखें",
    prod_saved_wishlist: "पसंदीदा में सुरक्षित",
    prod_listen: "सुनिए (ऑडियो)",
    prod_stop: "रोकें",
    prod_harvested_today: "आज ही तोड़ा गया",
    prod_fresh_harvest: "ताज़ा फसल",
    prod_govt_benchmark: "सरकारी मंडी भाव तुलना:",
    prod_save_amount: "बचत",
    prod_above_mandi: "मंडी से ऊपर (प्रीमियम)",

    // Farmer Add Product
    farmer_add_title: "नई फसल / उपज जोड़ें",
    farmer_add_desc: "अपनी ताज़ा फसल सूचीबद्ध करें, नज़दीकी खरीदारों से जुड़ें, और APMC मंडी भाव से तुलना करें।",
    farmer_crop_name: "फसल / उपज का नाम",
    farmer_category: "श्रेणी (कैटेगरी)",
    farmer_price: "आपका दाम (₹ प्रति किग्रा / इकाई)",
    farmer_quantity: "उपलब्ध कुल मात्रा (किग्रा / इकाई)",
    farmer_mandi_select: "🏛️ सरकारी मंडी बेंचमार्क फसल",
    farmer_mandi_hint: "इससे ग्राहक को सरकारी मंडी भाव और आपकी बचत का बैज दिखेगा।",
    farmer_auto_detect: "फसल के नाम से स्वतः पहचानें (अनुशंसित)",
    farmer_location_title: "खेत की लोकेशन (निर्देशांक)",
    farmer_pinpoint: "📍 वर्तमान लोकेशन ऑटो-सेट करें",
    farmer_submit_btn: "फसल बाज़ार में जोड़ें",
    farmer_speak: "बोलें",
    farmer_listening: "सुन रहे हैं...",

    // Voice & Language Toast
    voice_switched_to_hi: "जी, वेबसाइट की भाषा बदलकर हिन्दी कर दी गई है।",
    voice_switched_to_en: "Language switched to English successfully.",
    voice_listening: "सुन रहे हैं... बोलिए",
    voice_search_for: "खोजा गया:",
  },
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem("app_language") || "en";
    } catch {
      return "en";
    }
  });

  const [voiceToast, setVoiceToast] = useState("");

  const setLanguage = useCallback((lang) => {
    const validLang = lang === "hi" ? "hi" : "en";
    setLanguageState(validLang);
    try {
      localStorage.setItem("app_language", validLang);
      document.documentElement.lang = validLang;
    } catch {
      // ignore
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "en" ? "hi" : "en");
  }, [language, setLanguage]);

  // Audio Speech Confirmation
  const speakFeedback = useCallback((text, targetLang = "hi-IN") => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = targetLang;
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Smart Voice Intent Recognizer
  // Detects: "website ko hindi mein karo", "hindi me badlo", "english me karo", etc.
  const handleVoiceCommand = useCallback((rawTranscript) => {
    if (!rawTranscript) return false;
    const clean = rawTranscript.toLowerCase().trim();

    // Check Hindi switch intent
    const isHindiIntent =
      clean.includes("hindi mein") ||
      clean.includes("hindi me") ||
      clean.includes("hindi karo") ||
      clean.includes("hindi language") ||
      clean.includes("hindi bhasha") ||
      clean.includes("hindi me badlo") ||
      clean.includes("hindi mein badlo") ||
      clean.includes("convert to hindi") ||
      clean.includes("switch to hindi") ||
      clean === "hindi" ||
      clean === "हिन्दी";

    if (isHindiIntent) {
      setLanguage("hi");
      const msg = "जी, वेबसाइट की भाषा बदलकर हिन्दी कर दी गई है।";
      setVoiceToast("🌐 भाषा बदली: हिन्दी (Switched to Hindi)");
      speakFeedback(msg, "hi-IN");
      setTimeout(() => setVoiceToast(""), 4500);
      return true;
    }

    // Check English switch intent
    const isEnglishIntent =
      clean.includes("english mein") ||
      clean.includes("english me") ||
      clean.includes("english karo") ||
      clean.includes("english language") ||
      clean.includes("english me badlo") ||
      clean.includes("english mein badlo") ||
      clean.includes("convert to english") ||
      clean.includes("switch to english") ||
      clean.includes("angrezi") ||
      clean === "english";

    if (isEnglishIntent) {
      setLanguage("en");
      const msg = "Website language switched to English.";
      setVoiceToast("🌐 Language Switched: English");
      speakFeedback(msg, "en-IN");
      setTimeout(() => setVoiceToast(""), 4500);
      return true;
    }

    return false;
  }, [setLanguage, speakFeedback]);

  // Translation helper function
  const t = useCallback(
    (key, fallback = "") => {
      const langDict = translations[language] || translations.en;
      if (langDict[key] !== undefined) {
        return langDict[key];
      }
      if (translations.en[key] !== undefined) {
        return translations.en[key];
      }
      return fallback || key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        handleVoiceCommand,
        speakFeedback,
        voiceToast,
        isHindi: language === "hi",
      }}
    >
      {children}
      {/* Global floating voice intent toast */}
      {voiceToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-emerald-950 px-4 py-3 text-sm font-black text-white shadow-2xl ring-2 ring-lime-400 animate-bounce">
          <span className="text-base">🎙️</span>
          <span>{voiceToast}</span>
        </div>
      )}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

