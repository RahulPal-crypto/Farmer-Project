import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import EmptyState from "../../components/EmptyState";
import ErrorAlert from "../../components/ErrorAlert";
import MarketplaceSkeleton from "../../components/MarketplaceSkeleton";
import ProductCard from "../../components/ProductCard";
import QuickViewModal from "../../components/QuickViewModal";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { getApiErrorMessage, getAssetUrl } from "../../services/api";
import { fetchProducts, fetchAllProducts } from "../../services/productService";
import { DEFAULT_LOCATION, getCurrentCoordinates } from "../../utils/location";
import {
  FaAppleAlt,
  FaArrowRight,
  FaBoxOpen,
  FaCarrot,
  FaFilter,
  FaGlassWhiskey,
  FaLeaf,
  FaLocationArrow,
  FaMapMarkerAlt,
  FaPagelines,
  FaSearch,
  FaSeedling,
  FaShieldAlt,
  FaTractor,
  FaTruck,
  FaUsers,
} from "react-icons/fa";

const defaultFilters = {
  latitude: DEFAULT_LOCATION.latitude,
  longitude: DEFAULT_LOCATION.longitude,
  radius: "20",
  category: "",
  minPrice: "",
  maxPrice: "",
};

const categories = [
  {
    name: "Vegetables",
    icon: FaCarrot,
    description: "Fresh and healthy vegetables from local farms",
    image: "/images/categories/vegetables.png",
  },
  {
    name: "Fruits",
    icon: FaAppleAlt,
    description: "Seasonal and organic fruits straight from farms",
    image: "/images/categories/fruits.png",
  },
  {
    name: "Dairy",
    icon: FaGlassWhiskey,
    description: "Pure milk, cheese, curd and other dairy products",
    image: "/images/categories/dairy.png",
  },
  {
    name: "Grains",
    icon: FaSeedling,
    description: "Healthy grains and pulses for your daily needs",
    image: "/images/categories/grains.png",
  },
  {
    name: "Organic",
    icon: FaLeaf,
    description: "100% organic products for a healthy lifestyle",
    image: "/images/categories/organic.png",
  },
  {
    name: "Herbs",
    icon: FaPagelines,
    description: "Fresh herbs and spices to add flavor to life",
    image: "/images/categories/herbs.png",
  },
];

const statIcons = [FaTractor, FaUsers, FaBoxOpen, FaMapMarkerAlt];

const trustHighlights = [
  [
    FaTractor,
    "Farmer Listings",
    "Products are shown from the live marketplace database",
  ],
  [
    FaShieldAlt,
    "Secure Payments",
    "Checkout is connected through Razorpay order flow",
  ],
  [
    FaTruck,
    "Order Tracking",
    "Customers can follow purchases and chat with farmers",
  ],
  [
    FaMapMarkerAlt,
    "Location Filters",
    "Browse products by category, price, and nearby farms",
  ],
];

function CustomerHomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [filters, setFilters] = useState(defaultFilters);
  const [browseAll, setBrowseAll] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");
        let data;
        if (browseAll) {
          data = await fetchAllProducts({ category: filters.category, minPrice: filters.minPrice, maxPrice: filters.maxPrice });
        } else {
          data = await fetchProducts(filters);
        }

        setProducts(data.products || []);
      } catch (error) {
        setError(getApiErrorMessage(error, "Unable to fetch nearby products"));
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [filters]);

  const sortedProducts = useMemo(() => {
    const nextProducts = [...products];

    if (sortBy === "price-low") {
      return nextProducts.sort(
        (a, b) => Number(a.price || 0) - Number(b.price || 0),
      );
    }

    if (sortBy === "nearest") {
      return nextProducts.sort(
        (a, b) => Number(a.distanceInKm || 999) - Number(b.distanceInKm || 999),
      );
    }

    if (sortBy === "rating") {
      return nextProducts.sort(
        (a, b) =>
          Number(b.averageRating || b.rating || 0) -
          Number(a.averageRating || a.rating || 0),
      );
    }

    return nextProducts;
  }, [products, sortBy]);

  const categorySummaries = useMemo(() => {
    const counts = products.reduce((totals, product) => {
      const category = product.category || "Other";
      totals[category] = (totals[category] || 0) + 1;
      return totals;
    }, {});

    return categories.map((category) => ({
      ...category,
      count: counts[category.name] || 0,
    }));
  }, [products]);

  const topFarmers = useMemo(() => {
    const farmersById = new Map();

    products.forEach((product) => {
      const farmerKey =
        product.farmer?._id || product.farmerName || product.farmer?.storeName;

      if (!farmerKey) {
        return;
      }

      const current = farmersById.get(farmerKey) || {
        name: product.farmer?.storeName || product.farmerName || "Local Farmer",
        categories: new Set(),
        productCount: 0,
        nearestDistance: product.distanceInKm,
        ratingTotal: 0,
        ratingCount: 0,
      };

      current.productCount += 1;

      if (product.category) {
        current.categories.add(product.category);
      }

      if (
        product.distanceInKm !== undefined &&
        (current.nearestDistance === undefined ||
          Number(product.distanceInKm) < Number(current.nearestDistance))
      ) {
        current.nearestDistance = product.distanceInKm;
      }

      const rating = Number(product.averageRating || product.rating || 0);
      if (rating > 0) {
        current.ratingTotal += rating;
        current.ratingCount += 1;
      }

      farmersById.set(farmerKey, current);
    });

    return Array.from(farmersById.values())
      .map((farmer) => ({
        ...farmer,
        averageRating: farmer.ratingCount
          ? farmer.ratingTotal / farmer.ratingCount
          : 0,
        categoryLabel:
          Array.from(farmer.categories).slice(0, 2).join(", ") ||
          "Fresh produce",
      }))
      .sort(
        (a, b) =>
          b.averageRating - a.averageRating || b.productCount - a.productCount,
      )
      .slice(0, 3);
  }, [products]);

  const marketplaceStats = useMemo(() => {
    const farmerCount = new Set(
      products
        .map(
          (product) =>
            product.farmer?._id ||
            product.farmerName ||
            product.farmer?.storeName,
        )
        .filter(Boolean),
    ).size;
    const inStockCount = products.filter(
      (product) => Number(product.quantity || 0) > 0,
    ).length;
    const nearestDistance = products.reduce((nearest, product) => {
      if (product.distanceInKm === undefined) {
        return nearest;
      }

      const distance = Number(product.distanceInKm);
      return nearest === null || distance < nearest ? distance : nearest;
    }, null);

    return [
      [String(products.length), "Live Products"],
      [String(farmerCount), "Active Farmers"],
      [String(inStockCount), "In Stock Today"],
      [
        nearestDistance === null ? "Set" : `${nearestDistance.toFixed(1)} km`,
        nearestDistance === null ? "Your Location" : "Nearest Farm",
      ],
    ];
  }, [products]);

  const handleChange = (event) => {
    setFilters((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handlePriceRangeChange = (event) => {
    const [minPrice = "", maxPrice = ""] = event.target.value.split("-");

    setFilters((current) => ({
      ...current,
      minPrice,
      maxPrice,
    }));
  };

  const handleUseCurrentLocation = async () => {
    try {
      setLocating(true);
      setError("");
      const coordinates = await getCurrentCoordinates();
      setFilters((current) => ({ ...current, ...coordinates }));
    } catch (error) {
      setError(error.message);
    } finally {
      setLocating(false);
    }
  };

  const openQuickView = (product) => {
    setQuickViewProduct(product);
    setRecentlyViewed((current) =>
      [product, ...current.filter((item) => item._id !== product._id)].slice(
        0,
        4,
      ),
    );
  };

  const handleModalAddToCart = (product) => {
    if (user?.role !== "customer") {
      navigate("/login");
      return;
    }

    addToCart(product);
  };

  const priceRangeValue =
    filters.minPrice || filters.maxPrice
      ? `${filters.minPrice}-${filters.maxPrice}`
      : "";

  return (
    <div className="max-w-full space-y-6 overflow-hidden bg-slate-50 pb-10">
      <section
        className="overflow-hidden rounded-[1.25rem] bg-emerald-950 text-white shadow-xl shadow-emerald-950/20"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(1, 38, 24, 0.98) 0%, rgba(1, 38, 24, 0.86) 37%, rgba(1, 38, 24, 0.3) 64%, rgba(1, 38, 24, 0.02) 100%), url('/images/farmer-hero.png')",
          backgroundColor: "#022c1c",
          backgroundPosition: "center right",
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
        }}
      >
        <div className="px-5 py-4 sm:px-8 sm:py-3 lg:px-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-lime-400/15 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-lime-300 ring-1 ring-lime-300/20">
              <FaMapMarkerAlt className="text-sm text-white" />
              Local farm marketplace
            </div>
            <h1 className="mt-3 max-w-2xl text-3xl font-black leading-tight sm:text-4xl lg:text-[2.8rem]">
              Fresh groceries from local farmers, listed{" "}
              <span className="text-lime-400">near you.</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50 sm:text-base">
              Shop vegetables, fruits, dairy, grains, and organic produce from
              listings added by real farmers in your service area.
            </p>

            <div className="mt-4 grid max-w-2xl gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <label className="flex h-11 min-w-0 items-center gap-3 rounded-xl bg-white px-4 shadow-lg shadow-emerald-950/20">
                <FaSearch className="shrink-0 text-lg text-slate-400" />
                <input
                  type="search"
                  name="category"
                  value={filters.category}
                  onChange={handleChange}
                  placeholder="Search tomatoes, dairy, grains, organic..."
                  className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-500"
                />
              </label>
              <a
                href="#products"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-lime-500 px-6 text-sm font-black text-emerald-950 shadow-lg shadow-lime-950/20 hover:bg-lime-400"
              >
                Browse Products
              </a>
            </div>

            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locating}
                className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/5 px-4 py-2 text-sm font-black text-white backdrop-blur hover:bg-white/15 disabled:opacity-70"
              >
                <FaLocationArrow />
                {locating ? "Finding farms..." : "Explore Nearby Farms"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setBrowseAll((b) => !b);
                  // reset geo filters when browsing all
                  if (!browseAll) setFilters((current) => ({ ...current, latitude: undefined, longitude: undefined }));
                }}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black ${
                  browseAll ? "bg-lime-400 text-emerald-950" : "border border-white/70 bg-white/5 text-white"
                }`}
              >
                <FaBoxOpen />
                {browseAll ? "Browsing All" : "Browse All"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilters(defaultFilters);
                  setBrowseAll(false);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-black text-emerald-800 shadow-lg shadow-emerald-950/10 hover:bg-emerald-50"
              >
                <FaFilter />
                Reset Filters
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-emerald-950/45 p-3 shadow-2xl shadow-emerald-950/25 backdrop-blur-md lg:mt-6">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {marketplaceStats.map(([value, label], index) => {
                const StatIcon = statIcons[index] || FaBoxOpen;

                return (
                  <div
                    key={label}
                    className="flex items-center gap-3 border-white/10 px-2 py-1 lg:border-r lg:last:border-r-0"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime-500 text-sm text-white shadow-lg shadow-lime-950/20">
                      <StatIcon />
                    </span>
                    <div>
                      <p className="text-xl font-black leading-none text-white">
                        {value}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-emerald-50 sm:text-sm">
                        {label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {trustHighlights.map(([Icon, title, text]) => (
          <article
            key={title}
            className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-lime-50 text-emerald-700">
                <Icon className="text-xl" />
              </div>

              {/* Content */}
              <div>
                <h3 className="font-bold text-slate-900">{title}</h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-lg shadow-slate-200/60 sm:p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-slate-950">
              Shop by Category
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Browse fresh products from a wide range of categories
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setFilters((current) => ({ ...current, category: "" }))
            }
            className="inline-flex items-center gap-2 rounded-full px-1 text-sm font-black text-emerald-700 hover:text-emerald-800"
          >
            View all categories
            <FaArrowRight className="text-xs" />
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          {categorySummaries.map((category) => {
            const CategoryIcon = category.icon;
            const isSelected = filters.category === category.name;

            return (
              <button
                key={category.name}
                type="button"
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    category: category.name,
                  }))
                }
                className={`group flex h-full flex-col rounded-2xl border bg-white p-3 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-slate-200/80 ${
                  isSelected
                    ? "border-emerald-400 ring-2 ring-emerald-100"
                    : "border-slate-100"
                }`}
              >
                <div className="h-36 w-full overflow-hidden rounded-xl bg-emerald-50 sm:h-40">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <CategoryIcon className="shrink-0 text-base text-emerald-600" />
                    <p className="truncate font-black text-slate-900">
                      {category.name}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-lime-100 px-3 py-1 text-xs font-black text-emerald-700">
                    {category.count}
                  </span>
                </div>
                <p className="mt-3 min-h-12 text-sm font-medium leading-6 text-slate-500">
                  {category.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <ErrorAlert message={error} />

      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/60">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
          <label className="grid gap-1 text-sm font-bold text-slate-500">
            Category
            <select
              name="category"
              value={filters.category}
              onChange={handleChange}
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 font-semibold text-slate-800 outline-none"
            >
              <option value="">All Categories</option>
              {categorySummaries.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-bold text-slate-500">
            Price
            <select
              value={priceRangeValue}
              onChange={handlePriceRangeChange}
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 font-semibold text-slate-800 outline-none"
            >
              <option value="">All Prices</option>
              <option value="0-25">Under Rs. 25</option>
              <option value="25-50">Rs. 25 - Rs. 50</option>
              <option value="50-100">Rs. 50 - Rs. 100</option>
              <option value="100-">Above Rs. 100</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-bold text-slate-500">
            Distance
            <select
              name="radius"
              value={filters.radius}
              onChange={handleChange}
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 font-semibold text-slate-800 outline-none"
            >
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
              <option value="20">Within 20 km</option>
              <option value="50">Within 50 km</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-bold text-slate-500">
            Sort By
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 font-semibold text-slate-800 outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="nearest">Nearest Farms</option>
              <option value="price-low">Price Low to High</option>
              <option value="rating">Top Rated</option>
            </select>
          </label>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={locating}
            className="h-12 rounded-xl border border-emerald-500 px-6 text-sm font-black text-emerald-700 hover:bg-emerald-50 md:mt-6 xl:min-w-48"
          >
            {locating ? "Locating..." : "Use My Location"}
          </button>
        </div>
      </section>

      <section id="products" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-slate-950">
              Featured Products
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Rated, filtered, and ready for cart.
            </p>
          </div>
          <span className="rounded-full bg-lime-100 px-4 py-2 text-xs font-black text-lime-700">
            {products.length} live{" "}
            {products.length === 1 ? "listing" : "listings"}
          </span>
        </div>
        {loading ? (
          <MarketplaceSkeleton />
        ) : sortedProducts.length === 0 ? (
          <EmptyState
            title="No products found"
            description="There are no live farmer listings for these filters yet. Add products from a farmer account or try a wider search radius."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setFilters(defaultFilters)}
                  className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700"
                >
                  Clear Filters
                </button>
                <Link
                  to={
                    user?.role === "farmer" ? "/farmer/add-product" : "/signup"
                  }
                  className="rounded-2xl border border-emerald-200 px-5 py-3 text-sm font-black text-emerald-700 hover:bg-emerald-50"
                >
                  {user?.role === "farmer" ? "Add Product" : "Become a Seller"}
                </Link>
              </div>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {sortedProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onQuickView={openQuickView}
              />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl bg-emerald-700 p-6 text-white">
          <p className="text-sm font-black uppercase tracking-wide text-lime-200">
            Marketplace Activity
          </p>
          <h2 className="mt-3 text-3xl font-black">
            Real listings update as farmers add inventory.
          </h2>
          <p className="mt-3 text-sm leading-6 text-emerald-50">
            Product cards, stock, prices, farmer names, and locations come from
            the backend marketplace data.
          </p>
          <a
            href="#products"
            className="mt-5 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-black text-emerald-700"
          >
            View Listings
          </a>
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">Active Farmers</h2>
          <div className="mt-4 space-y-3">
            {topFarmers.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                Farmer profiles will appear here once products are listed.
              </p>
            ) : (
              topFarmers.map((farmer) => (
                <div
                  key={farmer.name}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
                >
                  <div>
                    <p className="font-black text-slate-900">{farmer.name}</p>
                    <p className="text-sm text-slate-500">
                      {farmer.categoryLabel}
                      {farmer.nearestDistance !== undefined
                        ? ` - ${farmer.nearestDistance} km`
                        : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-black text-amber-700">
                    {farmer.averageRating
                      ? `${farmer.averageRating.toFixed(1)}/5`
                      : `${farmer.productCount} items`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {recentlyViewed.length > 0 && (
        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">
            Recently Viewed
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recentlyViewed.map((product) => {
              const imageUrl = product.imageUrl || getAssetUrl(product.image);

              return (
                <button
                  key={product._id}
                  type="button"
                  onClick={() => openQuickView(product)}
                  className="rounded-2xl border border-slate-100 p-3 text-left hover:border-emerald-200"
                >
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="h-24 w-full rounded-xl object-cover"
                  />
                  <p className="mt-3 font-black text-slate-900">
                    {product.name}
                  </p>
                  <p className="text-sm font-bold text-emerald-700">
                    Rs. {product.price}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="text-3xl font-black">Never miss a fresh harvest.</h2>
            <p className="mt-2 text-sm text-slate-300">
              Get local product updates, new arrivals, and weekly grocery
              reminders.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Email address"
              className="min-w-0 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            />
            <button
              type="button"
              className="rounded-xl bg-lime-500 px-5 py-3 text-sm font-black text-emerald-950"
            >
              Subscribe
            </button>
          </div>
        </div>
      </section>

      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleModalAddToCart}
        onToggleWishlist={toggleWishlist}
        wishlisted={
          quickViewProduct ? isWishlisted(quickViewProduct._id) : false
        }
      />
    </div>
  );
}

export default CustomerHomePage;
