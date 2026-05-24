import { useEffect, useState } from "react";

import EmptyState from "../../components/EmptyState";
import ErrorAlert from "../../components/ErrorAlert";
import LoadingSpinner from "../../components/LoadingSpinner";
import ProductCard from "../../components/ProductCard";
import { getApiErrorMessage } from "../../services/api";
import { fetchProducts } from "../../services/productService";
import { DEFAULT_LOCATION, getCurrentCoordinates } from "../../utils/location";

const defaultFilters = {
  latitude: DEFAULT_LOCATION.latitude,
  longitude: DEFAULT_LOCATION.longitude,
  radius: "20",
  category: "",
  minPrice: "",
  maxPrice: "",
};

function CustomerHomePage() {
  const [filters, setFilters] = useState(defaultFilters);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  const handleUseCurrentLocation = async () => {
    try {
      setLocating(true);
      setError("");
      const coordinates = await getCurrentCoordinates();
      setFilters((current) => ({
        ...current,
        ...coordinates,
      }));
    } catch (error) {
      setError(error.message);
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchProducts(filters);
        setProducts(data.products || []);
      } catch (error) {
        setError(getApiErrorMessage(error, "Unable to fetch nearby products"));
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [filters]);

  const handleChange = (event) => {
    setFilters((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-6 rounded-[2rem] bg-gradient-to-r from-slate-900 via-emerald-900 to-emerald-700 p-8 text-white lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-100">Fresh from farms</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight">Discover nearby produce from trusted local farmers.</h1>
          <p className="mt-4 max-w-2xl text-sm text-emerald-50">
            Filter by price, category, and distance, then add fresh vegetables, fruits, and staples directly to your cart.
          </p>
        </div>

        <div className="grid gap-3 rounded-[1.5rem] bg-white/10 p-4 backdrop-blur">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              name="latitude"
              value={filters.latitude}
              onChange={handleChange}
              placeholder="Latitude"
              className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-emerald-50 focus:outline-none"
            />
            <input
              type="text"
              name="longitude"
              value={filters.longitude}
              onChange={handleChange}
              placeholder="Longitude"
              className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-emerald-50 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={locating}
            className="rounded-2xl border border-white/30 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {locating ? "Finding location..." : "Use Current Location"}
          </button>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              name="category"
              value={filters.category}
              onChange={handleChange}
              placeholder="Category"
              className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-emerald-50 focus:outline-none"
            />
            <input
              type="number"
              name="radius"
              value={filters.radius}
              onChange={handleChange}
              placeholder="Distance in km"
              className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-emerald-50 focus:outline-none"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="number"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleChange}
              placeholder="Min price"
              className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-emerald-50 focus:outline-none"
            />
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleChange}
              placeholder="Max price"
              className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-emerald-50 focus:outline-none"
            />
          </div>
        </div>
      </section>

      <ErrorAlert message={error} />

      {loading ? (
        <LoadingSpinner label="Finding nearby produce..." />
      ) : products.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Try a different distance, category, or price range to discover more farms."
        />
      ) : (
        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </section>
      )}
    </div>
  );
}

export default CustomerHomePage;
