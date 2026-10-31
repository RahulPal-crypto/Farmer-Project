import { createContext, useContext, useState, useCallback } from "react";

const LanguageContext = createContext();

// Common Indian Crops & Produce Translations
export const produceTranslations = {
  tomato: "टमाटर",
  tomatoes: "टमाटर",
  potato: "आलू",
  potatoes: "आलू",
  onion: "प्याज़",
  onions: "प्याज़",
  wheat: "गेहूँ",
  sharbati: "शरबती गेहूँ",
  rice: "चावल",
  basmati: "बासमती चावल",
  garlic: "लहसुन",
  ginger: "अदरक",
  carrot: "गाजर",
  spinach: "पालक",
  cauliflower: "फूलगोभी",
  cabbage: "पत्तागोभी",
  chilli: "हरी मिर्च",
  peas: "मटर",
  brinjal: "बैंगन",
  eggplant: "बैंगन",
  ladyfinger: "भिंडी",
  okra: "भिंडी",
  bottle: "लौकी",
  gourd: "लौकी / तोरई",
  pumpkin: "कद्दू / सीताफल",
  radish: "मूली",
  coriander: "धनिया",
  mint: "पुदीना",
  mango: "आम",
  apple: "सेब",
  banana: "केला",
  guava: "अमरूद",
  papaya: "पपीता",
  pomegranate: "अनार",
  milk: "दूध",
  cow: "गाय का दूध",
  buffalo: "भैंस का दूध",
  ghee: "शुद्ध देसी घी",
  paneer: "ताज़ा पनीर",
  curd: "ताज़ा दही",
  butter: "मक्खन",
  mustard: "सरसों / राई",
  chana: "चना दाल",
  gram: "चना",
  moong: "मूंग दाल",
  urad: "उड़द दाल",
  arhar: "अरहर / तुअर दाल",
  turmeric: "हल्दी",
  honey: "शुद्ध शहद",
};

export const translateProduceName = (name, isHindi) => {
  if (!name || !isHindi) return name;
  const lower = name.toLowerCase();
  for (const [key, hi] of Object.entries(produceTranslations)) {
    if (lower.includes(key)) {
      // If it's already mixed or pure English, append or replace
      return `${hi} (${name})`;
    }
  }
  return name;
};

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
    hero_badge: "Local Farm Marketplace",
    hero_title_prefix: "Fresh groceries from local farmers, listed",
    hero_title_highlight: "near you.",
    hero_subtitle: "Shop vegetables, fruits, dairy, grains, and organic produce from listings added by real farmers in your service area.",
    search_placeholder: "Search tomatoes, dairy, grains, organic...",
    btn_browse_products: "Browse Products",
    btn_explore_nearby: "Explore Nearby Farms",
    btn_finding_farms: "Finding farms...",
    btn_reset_filters: "Reset Filters",

    // Filters & Sorting
    filter_search_label: "Search Produce",
    filter_category_label: "Produce Category",
    filter_radius_label: "Farm Radius",
    filter_price_label: "Price Range",
    filter_sort_label: "Sort Produce",
    filter_radius_all: "Any Distance",
    filter_radius_5: "Within 5 km (Super Local)",
    filter_radius_10: "Within 10 km",
    filter_radius_20: "Within 20 km",
    filter_radius_50: "Within 50 km",
    filter_price_all: "All Prices",
    filter_price_under_50: "Under ₹50",
    filter_price_50_100: "₹50 - ₹100",
    filter_price_100_200: "₹100 - ₹200",
    filter_price_200_plus: "₹200+",
    filter_sort_featured: "Featured & Recent",
    filter_sort_newest: "Newest Harvest First",
    filter_sort_price_low: "Price: Low to High",
    filter_sort_price_high: "Price: High to Low",
    filter_sort_distance: "Distance: Nearest First",
    filter_sort_rating: "Highest Rating",

    // Categories
    cat_all: "All Categories",
    cat_vegetables: "Vegetables",
    cat_fruits: "Fruits",
    cat_dairy: "Dairy",
    cat_grains: "Grains",
    cat_organic: "Organic",
    cat_herbs: "Herbs & Spices",
    cat_section_title: "Browse by Fresh Category",
    cat_section_subtitle: "Choose a category to find nearby farm produce harvested fresh daily.",

    // Sections & Stats
    section_verified_farmers: "Verified Local Farmers",
    section_verified_subtitle: "Top-rated farms cultivating and harvesting within your delivery radius.",
    section_fresh_produce: "Fresh Produce Listings",
    section_fresh_subtitle: "Direct from farm to your kitchen with transparent Mandi-backed pricing.",
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

    // Empty States
    empty_no_products_title: "No farm produce found matching your filters",
    empty_no_products_desc: "Try increasing the delivery radius or clearing active search keywords.",

    // Farmer Dashboard
    farmer_dash_workspace: "Farmer Workspace",
    farmer_dash_banner_title: "Manage inventory, orders, reviews, and sales from one dashboard.",
    farmer_dash_banner_subtitle: "Keep listings fresh, track low stock, accept orders quickly, and build trust through customer ratings.",
    farmer_stat_listed: "Products Listed",
    farmer_stat_orders: "Orders Received",
    farmer_stat_pending: "Pending Orders",
    farmer_stat_sales: "Estimated Sales",
    farmer_btn_add_product: "+ Add Product",
    farmer_btn_view_orders: "View Orders",
    farmer_sec_mandi_benchmark: "Market Price Benchmark",
    farmer_sec_mandi_desc: "Current government Mandi rates for your listed commodities.",
    farmer_sec_inventory: "Inventory Tracking",
    farmer_sec_inventory_healthy: "Inventory looks healthy. No low-stock alerts.",
    farmer_sec_inventory_left: "left in stock",
    farmer_sec_sales_analytics: "Sales Analytics",
    farmer_sec_acceptance_rate: "Acceptance Rate",
    farmer_sec_avg_rating: "Avg. Customer Rating",
    farmer_sec_reviews: "Customer Reviews",
    farmer_sec_reviews_recent: "Recent feedback from delivered orders.",
    farmer_sec_reviews_empty: "No reviews yet. Reviews appear once orders are delivered.",

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

    // Orders (Customer & Farmer)
    orders_page_title: "My Orders",
    orders_page_subtitle: "Track live harvest orders, chat with growers, and monitor delivery.",
    farmer_orders_title: "Order Management",
    farmer_orders_subtitle: "Accept, reject, pack, and deliver fresh harvest orders from one queue.",
    order_status_pending: "Pending",
    order_status_accepted: "Accepted & Packing",
    order_status_rejected: "Cancelled / Rejected",
    order_status_delivered: "Delivered",
    order_btn_accept: "Accept Order",
    order_btn_reject: "Reject",
    order_btn_mark_delivered: "Mark Delivered",
    order_btn_chat: "In-App Chat",
    order_btn_whatsapp: "WhatsApp",
    order_btn_route_map: "View Route Map",
    order_slot_label: "Harvest / Delivery Window:",
    order_destination_label: "Customer Destination & Contact:",

    // Cart & Checkout
    cart_title: "Shopping Cart",
    cart_subtitle: "Review fresh items, adjust quantity, and checkout with secure payment.",
    cart_summary_title: "Order Summary",
    cart_subtotal: "Subtotal",
    cart_delivery: "Delivery",
    cart_delivery_desc: "Coordinated directly by farmer",
    cart_total: "Total",
    cart_btn_checkout: "Proceed to Checkout",
    checkout_title: "Checkout",
    checkout_delivery_details: "Delivery Address & Contact",
    checkout_street: "Street / Colony / Landmark",
    checkout_city: "City / Town",
    checkout_pincode: "Pincode",
    checkout_contact_phone: "Contact Calling Number",
    checkout_whatsapp_phone: "WhatsApp Number (for live harvest alerts)",
    checkout_slot_title: "Choose Harvest / Delivery Slot",
    checkout_slot_morning: "Morning Harvest (7:00 AM - 10:00 AM)",
    checkout_slot_evening: "Evening Fresh Dispatch (4:00 PM - 7:00 PM)",
    checkout_slot_anytime: "Standard Any-Time (Within 24 Hours)",
    checkout_payment_mode: "Payment Method",
    checkout_pay_cod: "Cash on Delivery (COD)",
    checkout_pay_online: "Online Payment (UPI, Card, NetBanking)",
    checkout_btn_place_order: "Place Farm Order",

    // Chat
    chat_title: "Order Chat",
    chat_order_id: "Order ID:",
    chat_back_to_orders: "Back to orders",
    chat_empty: "No messages yet.",
    chat_input_placeholder: "Type a message...",
    chat_send_btn: "Send",

    // Profile & KYC
    profile_title: "Profile & Settings",
    profile_farm_rating: "Farm Rating",
    profile_reviews: "Reviews",
    profile_grower_verification: "Grower Verification Badge",
    profile_grower_verification_desc: "Verified farmers receive a blue 'Verified Farm' badge on product cards to build buyer trust.",
    profile_verified_grower: "Verified Grower",
    profile_under_review: "Verification Under Review",
    profile_unverified: "Unverified",
    profile_submit_kyc_title: "Submit Land Record or Kisan Credit Card for Verification:",
    profile_doc_type: "Document Type",
    profile_doc_number: "Registration / Certificate Number",
    profile_doc_url: "Document Image URL / Cloud Link (Optional)",
    profile_submit_btn: "Submit for Verification",
    profile_personal_title: "Personal & Store Information",
    profile_personal_desc: "Keep your contact details up to date for smooth buyer-farmer communication.",
    profile_store_name: "Farm / Store Name",
    profile_display_name: "Display Name",
    profile_phone: "Phone Number",
    profile_whatsapp_same: "WhatsApp number is the same as my calling phone number",
    profile_whatsapp_alt: "Alternate WhatsApp Number (For Automated Order Updates)",
    profile_email: "Email Address",
    profile_email_locked: "Account login email cannot be changed.",
    profile_location_title: "Location & Coordinates",
    profile_location_desc: "Coordinates are used for radius filtering, farm distance calculations, and delivery proximity.",
    profile_detect_gps: "Detect Current GPS",
    profile_detecting: "Detecting...",
    profile_latitude: "Latitude",
    profile_longitude: "Longitude",
    profile_security_title: "Security & Password",
    profile_security_desc: "Leave blank if you do not wish to change your current password.",
    profile_current_password: "Current Password",
    profile_new_password: "New Password",
    profile_confirm_password: "Confirm New Password",
    profile_save_btn: "Save Profile Changes",
    profile_saving_btn: "Saving Changes...",

    // Extended Checkout
    checkout_order_placed_title: "Order Placed Successfully!",
    checkout_order_placed_desc: "Your direct farm harvest order has been sent to the local grower(s).",
    checkout_total_payable: "Total Payable:",
    checkout_harvest_slot: "Harvest / Delivery Slot:",
    checkout_whatsapp_dispatch_title: "Instant WhatsApp Dispatch (Direct to Grower):",
    checkout_send_whatsapp_btn: "Send Order on WhatsApp",
    checkout_goto_orders: "Go to My Orders",
    checkout_continue_shopping: "Continue Shopping",
    checkout_multi_farm_title: "Multi-Farm Order",
    checkout_multi_farm_desc: "Your cart has items from multiple farms. They will be automatically split so each farmer fulfills their produce directly to you.",
    checkout_items_by_farm: "Items by Farm",
    checkout_delivery_notes_label: "Delivery Notes / Instructions (Optional)",
    checkout_delivery_notes_placeholder: "e.g. Landmark near water tank, call before arriving",
    checkout_placing_order: "Placing order...",
    checkout_opening_payment: "Opening payment...",

    // My Products Management
    prod_mgmt_title: "Product Management",
    prod_mgmt_desc: "Update listings, prices, activation status, and inventory levels.",
    prod_mgmt_empty_title: "No products listed",
    prod_mgmt_empty_desc: "Add your first product to start selling.",
    prod_mgmt_edit: "Edit",
    prod_mgmt_save: "Save Changes",
    prod_mgmt_cancel: "Cancel",
    prod_mgmt_delete: "Delete",
    prod_mgmt_status_active: "Active (Visible in Market)",
    prod_mgmt_status_inactive: "Hidden (Out of Season)",

    // Footer
    footer_motto: "A digital bridge empowering Indian farmers with direct customer trade, real-time APMC Mandi rates, live weather advisories, and voice-assisted commerce.",
    footer_company: "Company",
    footer_about: "About KrishiSetu",
    footer_contact: "Contact Us",
    footer_help: "Help & Kisan Support",
    footer_farmer_onboarding: "Farmer Onboarding",
    footer_policies: "Policies",
    footer_terms: "Terms & Conditions",
    footer_privacy: "Privacy Policy",
    footer_refund: "Refund Policy",
    footer_order_support: "Order Support",
    footer_updates_title: "Get Fresh Updates",
    footer_updates_desc: "Subscribe for harvest alerts, APMC Mandi price swings, and nearby farmer listings.",
    footer_developer_credit: "Designed & Developed with ❤️ by",

    // Voice & Language Toast
    voice_switched_to_hi: "भाषा बदलकर हिन्दी कर दी गई है। (Switched to Hindi)",
    voice_switched_to_en: "Language switched to English.",
    voice_listening: "Listening... बोलिए",
    voice_search_for: "Searched for:",
  },

  hi: {
    // Navigation
    brand_name: "कृषिसेतु",
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

    // Filters & Sorting
    filter_search_label: "फसल / उत्पाद खोजें",
    filter_category_label: "उपज की श्रेणी",
    filter_radius_label: "खेत की दूरी",
    filter_price_label: "मूल्य दायरा",
    filter_sort_label: "क्रमबद्ध करें (Sort)",
    filter_radius_all: "कोई भी दूरी (सभी)",
    filter_radius_5: "5 किमी के भीतर (अति-नज़दीक)",
    filter_radius_10: "10 किमी के भीतर",
    filter_radius_20: "20 किमी के भीतर",
    filter_radius_50: "50 किमी के भीतर",
    filter_price_all: "सभी दाम",
    filter_price_under_50: "₹50 से कम",
    filter_price_50_100: "₹50 - ₹100",
    filter_price_100_200: "₹100 - ₹200",
    filter_price_200_plus: "₹200 से अधिक",
    filter_sort_featured: "प्रमुख एवं हालिया",
    filter_sort_newest: "ताज़ा कटाई सबसे पहले",
    filter_sort_price_low: "दाम: कम से ज़्यादा",
    filter_sort_price_high: "दाम: ज़्यादा से कम",
    filter_sort_distance: "दूरी: सबसे नज़दीकी खेत",
    filter_sort_rating: "सर्वश्रेष्ठ रेटिंग",

    // Categories
    cat_all: "सभी श्रेणियां",
    cat_vegetables: "ताज़ा सब्ज़ियां",
    cat_fruits: "ताज़ा फल",
    cat_dairy: "दूध व डेयरी",
    cat_grains: "अनाज व दालें",
    cat_organic: "जैविक उत्पाद",
    cat_herbs: "जड़ी-बूटी व मसाले",
    cat_section_title: "ताज़ा श्रेणियों अनुसार खोजें",
    cat_section_subtitle: "रोज़ाना ताज़ा तोड़ी गई फसलों को श्रेणी चुनकर सीधे किसानों से खरीदें।",

    // Sections & Stats
    section_verified_farmers: "सत्यापित स्थानीय किसान",
    section_verified_subtitle: "आपके क्षेत्र में ताज़ा फसल उगाने और आपूर्ति करने वाले शीर्ष किसान।",
    section_fresh_produce: "ताज़ा फसल सूची",
    section_fresh_subtitle: "सीधे खेत से आपकी रसोई तक, सरकारी मंडी भाव से सस्ती और बिचौलिया-मुक्त।",
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
    prod_add_to_cart: "थैले (कार्ट) में जोड़ें",
    prod_in_cart: "थैले में जोड़ा गया",
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

    // Empty States
    empty_no_products_title: "इस फ़िल्टर से मिलता कोई उत्पाद नहीं मिला",
    empty_no_products_desc: "कृपया खेत की दूरी का दायरा बढ़ाएं या खोजे गए शब्दों को हटाएं।",

    // Farmer Dashboard
    farmer_dash_workspace: "किसान कार्यक्षेत्र (डैशबोर्ड)",
    farmer_dash_banner_title: "अपनी फसलें, ऑर्डर्स, समीक्षाएं और बिक्री एक ही स्थान से प्रबंधित करें।",
    farmer_dash_banner_subtitle: "उपज ताज़ा रखें, कम स्टॉक पर नज़र रखें, ऑर्डर्स तुरंत स्वीकारें और ग्राहकों का भरोसा जीतें।",
    farmer_stat_listed: "सूचीबद्ध फसलें",
    farmer_stat_orders: "कुल प्राप्त ऑर्डर्स",
    farmer_stat_pending: "लंबित ऑर्डर्स",
    farmer_stat_sales: "अनुमानित कुल बिक्री",
    farmer_btn_add_product: "+ नई फसल जोड़ें",
    farmer_btn_view_orders: "ऑर्डर्स देखें",
    farmer_sec_mandi_benchmark: "मंडी भाव बेंचमार्क",
    farmer_sec_mandi_desc: "आपकी सूचीबद्ध फसलों के लिए ताज़ा सरकारी मंडी दरें।",
    farmer_sec_inventory: "स्टॉक ट्रैकिंग",
    farmer_sec_inventory_healthy: "स्टॉक की स्थिति अच्छी है। कोई कमी नहीं।",
    farmer_sec_inventory_left: "स्टॉक शेष",
    farmer_sec_sales_analytics: "बिक्री विश्लेषण",
    farmer_sec_acceptance_rate: "ऑर्डर स्वीकृति दर",
    farmer_sec_avg_rating: "औसत ग्राहक रेटिंग",
    farmer_sec_reviews: "ग्राहक समीक्षाएं",
    farmer_sec_reviews_recent: "डिलीवर किए गए ऑर्डर्स पर ग्राहकों की ताज़ा राय।",
    farmer_sec_reviews_empty: "अभी कोई समीक्षा नहीं है। ऑर्डर डिलीवर होने के बाद ग्राहक रेटिंग देंगे।",

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

    // Orders (Customer & Farmer)
    orders_page_title: "मेरे ऑर्डर्स",
    orders_page_subtitle: "अपने लाइव फसल ऑर्डर्स ट्रैक करें, किसान से बात करें और डिलीवरी स्थिति देखें।",
    farmer_orders_title: "ऑर्डर प्रबंधन",
    farmer_orders_subtitle: "प्राप्त फसल ऑर्डर्स को स्वीकारें, पैक करें और ग्राहकों तक डिलीवर करें।",
    order_status_pending: "लंबित (Pending)",
    order_status_accepted: "स्वीकृत व पैकिंग जारी",
    order_status_rejected: "रद्द / अस्वीकृत",
    order_status_delivered: "सफलतापूर्वक डिलीवर",
    order_btn_accept: "ऑर्डर स्वीकार करें",
    order_btn_reject: "अस्वीकार करें",
    order_btn_mark_delivered: "डिलीवर हो गया मार्क करें",
    order_btn_chat: "सीधी चैट करें",
    order_btn_whatsapp: "व्हाट्सएप करें",
    order_btn_route_map: "रास्ता (मैप) देखें",
    order_slot_label: "फसल तोड़ाई व डिलीवरी समय:",
    order_destination_label: "ग्राहक का पता व संपर्क:",

    // Cart & Checkout
    cart_title: "खरीदारी का थैला (Cart)",
    cart_subtitle: "ताज़ा उत्पादों की जांच करें, मात्रा बदलें और सुरक्षित ऑर्डर करें।",
    cart_summary_title: "ऑर्डर सारांश",
    cart_subtotal: "उप-योग (Subtotal)",
    cart_delivery: "डिलीवरी",
    cart_delivery_desc: "किसान द्वारा सीधे प्रबंधित",
    cart_total: "कुल भुगतान राशि",
    cart_btn_checkout: "चेकआउट के लिए आगे बढ़ें",
    checkout_title: "चेकआउट",
    checkout_delivery_details: "डिलीवरी का पता व संपर्क विवरण",
    checkout_street: "गली, मोहल्ला या लैंडमार्क",
    checkout_city: "शहर / कस्बा",
    checkout_pincode: "पिनकोड",
    checkout_contact_phone: "कॉलिंग संपर्क नंबर",
    checkout_whatsapp_phone: "व्हाट्सएप नंबर (लाइव फसल अपडेट्स हेतु)",
    checkout_slot_title: "फसल तुड़ाई व डिलीवरी का समय चुनें",
    checkout_slot_morning: "सुबह की ताज़ा तुड़ाई (7:00 AM - 10:00 AM)",
    checkout_slot_evening: "शाम की ताज़ा डिलीवरी (4:00 PM - 7:00 PM)",
    checkout_slot_anytime: "मानक कभी भी (24 घंटे के भीतर)",
    checkout_payment_mode: "भुगतान का माध्यम",
    checkout_pay_cod: "कैश ऑन डिलीवरी (सामान मिलने पर नकद)",
    checkout_pay_online: "ऑनलाइन भुगतान (UPI, कार्ड, नेटबैंकिंग)",
    checkout_btn_place_order: "ऑर्डर कन्फर्म करें",

    // Chat
    chat_title: "ऑर्डर चैट (बातचीत)",
    chat_order_id: "ऑर्डर आईडी:",
    chat_back_to_orders: "ऑर्डर्स पर वापस जाएं",
    chat_empty: "अभी कोई संदेश नहीं है।",
    chat_input_placeholder: "संदेश लिखें...",
    chat_send_btn: "भेजें",

    // Profile & KYC
    profile_title: "प्रोफ़ाइल एवं सेटिंग्स",
    profile_farm_rating: "खेत रेटिंग",
    profile_reviews: "समीक्षाएं",
    profile_grower_verification: "किसान सत्यापन बैज (KYC)",
    profile_grower_verification_desc: "सत्यापित किसानों के उत्पादों पर 'सत्यापित खेत' का नीला बैज दिखता है जिससे ग्राहकों का भरोसा बढ़ता है।",
    profile_verified_grower: "🛡️ सत्यापित किसान",
    profile_under_review: "सत्यापन समीक्षाधीन है",
    profile_unverified: "असत्यापित",
    profile_submit_kyc_title: "सत्यापन हेतु खतौनी (जमीन का पर्चा) या किसान क्रेडिट कार्ड जमा करें:",
    profile_doc_type: "दस्तावेज़ का प्रकार",
    profile_doc_number: "पंजीकरण / प्रमाण-पत्र संख्या",
    profile_doc_url: "दस्तावेज़ फोटो / लिंक (वैकल्पिक)",
    profile_submit_btn: "सत्यापन हेतु जमा करें",
    profile_personal_title: "व्यक्तिगत व स्टोर जानकारी",
    profile_personal_desc: "ग्राहक और किसान के बीच सुगम संपर्क के लिए अपना विवरण अद्यतन रखें।",
    profile_store_name: "खेत / दुकान का नाम",
    profile_display_name: "नाम (Display Name)",
    profile_phone: "फ़ोन नंबर",
    profile_whatsapp_same: "व्हाट्सएप नंबर मेरे कॉलिंग नंबर के समान है",
    profile_whatsapp_alt: "वैकल्पिक व्हाट्सएप नंबर (ऑर्डर अपडेट्स हेतु)",
    profile_email: "ईमेल पता",
    profile_email_locked: "खाते का ईमेल बदला नहीं जा सकता।",
    profile_location_title: "लोकेशन व निर्देशांक (GPS)",
    profile_location_desc: "निर्देशांकों का उपयोग दूरी गणना और नज़दीकी खेत खोजने में होता है।",
    profile_detect_gps: "📍 वर्तमान GPS लोकेशन पहचानें",
    profile_detecting: "लोकेशन पहचानी जा रही है...",
    profile_latitude: "अक्षांश (Latitude)",
    profile_longitude: "देशांतर (Longitude)",
    profile_security_title: "सुरक्षा एवं पासवर्ड",
    profile_security_desc: "यदि पासवर्ड नहीं बदलना चाहते तो इसे खाली छोड़ दें।",
    profile_current_password: "वर्तमान पासवर्ड",
    profile_new_password: "नया पासवर्ड",
    profile_confirm_password: "नए पासवर्ड की पुष्टि करें",
    profile_save_btn: "प्रोफ़ाइल सुरक्षित करें",
    profile_saving_btn: "सुरक्षित किया जा रहा है...",

    // Extended Checkout
    checkout_order_placed_title: "ऑर्डर सफलतापूर्वक दर्ज हो गया! 🎉",
    checkout_order_placed_desc: "आपकी ताज़ा फसल का ऑर्डर संबंधित स्थानीय किसान(नों) को भेज दिया गया है।",
    checkout_total_payable: "कुल देय राशि:",
    checkout_harvest_slot: "फसल तुड़ाई व डिलीवरी समय:",
    checkout_whatsapp_dispatch_title: "तुरंत व्हाट्सएप भेजें (सीधे किसान को):",
    checkout_send_whatsapp_btn: "व्हाट्सएप पर ऑर्डर भेजें",
    checkout_goto_orders: "मेरे ऑर्डर्स देखें",
    checkout_continue_shopping: "और खरीदारी करें",
    checkout_multi_farm_title: "विभिन्न खेतों का संयुक्त ऑर्डर",
    checkout_multi_farm_desc: "आपके थैले में विभिन्न खेतों की फसलें हैं। इन्हें अलग-अलग ऑर्डर में विभाजित किया जाएगा ताकि प्रत्येक किसान अपनी ताज़ा उपज आप तक सीधे पहुंचा सके।",
    checkout_items_by_farm: "खेत अनुसार फसलें",
    checkout_delivery_notes_label: "डिलीवरी निर्देश / पता विवरण (वैकल्पिक)",
    checkout_delivery_notes_placeholder: "उदा. पानी की टंकी के पास, आने से पहले कॉल करें",
    checkout_placing_order: "ऑर्डर दर्ज हो रहा है...",
    checkout_opening_payment: "पेमेंट गेटवे खुल रहा है...",

    // My Products Management
    prod_mgmt_title: "मेरी फसल प्रबंधन",
    prod_mgmt_desc: "अपनी सूचीबद्ध फसलों के भाव, मात्रा और उपलब्धता अपडेट करें।",
    prod_mgmt_empty_title: "कोई फसल सूचीबद्ध नहीं है",
    prod_mgmt_empty_desc: "बेचने के लिए अपनी पहली ताज़ा फसल जोड़ें।",
    prod_mgmt_edit: "संपादित करें",
    prod_mgmt_save: "परिवर्तन सुरक्षित करें",
    prod_mgmt_cancel: "रद्द करें",
    prod_mgmt_delete: "हटाएं",
    prod_mgmt_status_active: "सक्रिय (मार्केट में लाइव)",
    prod_mgmt_status_inactive: "छुपा हुआ (सीज़न समाप्त)",

    // Footer
    footer_motto: "भारतीय किसानों को सीधे ग्राहकों से जोड़ने, वास्तविक मंडी भाव, लाइव मौसम सलाह और सुगम व्यापार का डिजिटल सेतु।",
    footer_company: "कंपनी",
    footer_about: "कृषिसेतु के बारे में",
    footer_contact: "संपर्क करें",
    footer_help: "सहायता व किसान हेल्पलाइन",
    footer_farmer_onboarding: "किसान पंजीकरण",
    footer_policies: "नीतियां",
    footer_terms: "नियम व शर्तें",
    footer_privacy: "गोपनीयता नीति",
    footer_refund: "वापसी नीति",
    footer_order_support: "ऑर्डर सहायता",
    footer_updates_title: "ताज़ा अपडेट्स पाएं",
    footer_updates_desc: "फसल तैयार होने के अलर्ट, मंडी भाव के उतार-चढ़ाव और नज़दीकी किसानों की जानकारी पाएं।",
    footer_developer_credit: "❤️ से डिज़ाइन और डेवलप किया गया द्वारा",

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
  const handleVoiceCommand = useCallback(
    (rawTranscript) => {
      if (!rawTranscript) return false;
      const clean = rawTranscript.toLowerCase().trim();

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
    },
    [setLanguage, speakFeedback]
  );

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
        translateProduce: (name) => translateProduceName(name, language === "hi"),
      }}
    >
      {children}
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
