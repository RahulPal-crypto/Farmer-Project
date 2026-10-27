import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api, { getApiErrorMessage } from "../../services/api";
import ErrorAlert from "../../components/ErrorAlert";
import LoadingSpinner from "../../components/LoadingSpinner";

const CURATED_PLANS = [
  {
    id: "veggie-box",
    name: "Weekly 5kg Seasonal Veggie Box",
    icon: "🥕",
    tagline: "Farm-to-kitchen essentials harvested Sunday afternoon",
    items: "Tomatoes, Potatoes, Onions, Spinach, Seasonal Greens, Green Chillies, Ginger",
    frequency: "weekly",
    preferredDay: "Monday",
    price: 350,
    badge: "Most Popular",
  },
  {
    id: "fruit-basket",
    name: "Orchard Fresh Fruit Basket (3kg)",
    icon: "🍎",
    tagline: "Naturally ripened, sweet seasonal fruits from regional orchards",
    items: "Apples, Bananas, Seasonal Citrus, Papaya, Guavas",
    frequency: "weekly",
    preferredDay: "Wednesday",
    price: 420,
    badge: "Vitamin Rich",
  },
  {
    id: "daily-milk",
    name: "Daily Farm Fresh A2 Milk (1L)",
    icon: "🥛",
    tagline: "Grass-fed cow milk delivered before 7:30 AM every morning",
    items: "1L Pure Unadulterated Chilled Raw Milk in glass/biodegradable pouch",
    frequency: "daily",
    preferredDay: "Every Morning",
    price: 65,
    badge: "100% Pure",
  },
  {
    id: "staples-sack",
    name: "Monthly Grain & Pulse Sack (10kg)",
    icon: "🌾",
    tagline: "Stone-ground chakki flour & hand-cleaned unpolished pulses",
    items: "5kg Whole Sharbati Wheat Flour, 2kg Basmati Rice, 3kg Mixed Dals",
    frequency: "monthly",
    preferredDay: "1st of Month",
    price: 950,
    badge: "Monthly Value",
  },
];

function SubscriptionsPage() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [subscribingPlan, setSubscribingPlan] = useState(null);
  const [processing, setProcessing] = useState(false);

  const [address, setAddress] = useState({
    street: "",
    city: "",
    pincode: "",
    notes: "",
  });

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      setError("");
      const endpoint = user?.role === "farmer" ? "/subscriptions/farmer" : "/subscriptions/my";
      const { data } = await api.get(endpoint);
      setSubscriptions(data.subscriptions || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load subscriptions"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, [user?.role]);

  const handleOpenSubscribeModal = (plan) => {
    setError("");
    setActionSuccess("");
    setSubscribingPlan(plan);
  };

  const handleConfirmSubscription = async (e) => {
    e.preventDefault();
    if (!address.street.trim() || !address.city.trim() || !address.pincode.trim()) {
      setError("Please fill out complete delivery address (Street, City, Pincode)");
      return;
    }

    try {
      setProcessing(true);
      setError("");
      await api.post("/subscriptions", {
        planName: subscribingPlan.name,
        frequency: subscribingPlan.frequency,
        preferredDay: subscribingPlan.preferredDay,
        pricePerDelivery: subscribingPlan.price,
        deliveryAddress: address,
      });

      setActionSuccess(`🎉 Subscribed to ${subscribingPlan.name}! Your recurring deliveries are now scheduled.`);
      setSubscribingPlan(null);
      await loadSubscriptions();
    } catch (err) {
      setError(getApiErrorMessage(err, "Subscription creation failed"));
    } finally {
      setProcessing(false);
    }
  };

  const handleStatusChange = async (subscriptionId, nextStatus) => {
    try {
      setError("");
      await api.patch(`/subscriptions/${subscriptionId}/status`, { status: nextStatus });
      setActionSuccess(`Subscription status changed to: ${nextStatus}`);
      await loadSubscriptions();
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err) {
      setError(getApiErrorMessage(err, `Unable to update subscription to ${nextStatus}`));
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading subscription farm boxes..." />;
  }

  const isFarmerView = user?.role === "farmer";

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-300 backdrop-blur-xs">
            📦 Recurring Farm Deliveries
          </span>
          <h1 className="mt-3 text-3xl font-black md:text-4xl">
            {isFarmerView ? "Farm Box Subscriber Hub" : "Weekly Subscription Farm Box"}
          </h1>
          <p className="mt-2 text-sm text-slate-300 md:text-base">
            {isFarmerView
              ? "View and manage all recurring box subscribers. Prepare weekly harvest batches with guaranteed predictable revenue."
              : "Subscribe to farm-curated recurring boxes delivered direct to your door. Enjoy the freshest harvests with automatic doorstep delivery."}
          </p>
        </div>
      </div>

      <ErrorAlert message={error} />

      {actionSuccess && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-bold text-emerald-800 shadow-xs">
          {actionSuccess}
        </div>
      )}

      {/* Customer View: Curated Subscription Plans */}
      {!isFarmerView && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">Curated Farm Box Plans</h2>
              <p className="text-xs text-slate-500">Pick a recurring plan. Pause, resume, or cancel anytime with 1 click.</p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {CURATED_PLANS.map((plan) => (
              <div
                key={plan.id}
                className="flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-4xl">{plan.icon}</span>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-800">
                      {plan.badge}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-black text-slate-900">{plan.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">{plan.tagline}</p>

                  <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                    <strong className="block font-bold text-slate-800">Includes:</strong>
                    <p className="mt-0.5">{plan.items}</p>
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-black text-emerald-700">Rs. {plan.price}</span>
                      <span className="text-xs text-slate-400"> / {plan.frequency}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{plan.preferredDay}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenSubscribeModal(plan)}
                    className="mt-4 w-full rounded-2xl bg-emerald-600 py-2.5 text-xs font-black text-white transition hover:bg-emerald-700"
                  >
                    Subscribe & Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Existing Subscriptions Table / Cards */}
      <section className="space-y-4">
        <h2 className="text-xl font-black text-slate-900">
          {isFarmerView ? "Recurring Subscribers" : "My Active Subscriptions"}
        </h2>

        {subscriptions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <span className="text-4xl">📦</span>
            <h3 className="mt-3 text-base font-bold text-slate-800">
              {isFarmerView ? "No active subscribers yet" : "No subscriptions active"}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {isFarmerView
                ? "When customers subscribe to your recurring boxes, they will show up here."
                : "Subscribe to a weekly box above to enjoy automated fresh harvest deliveries."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {subscriptions.map((sub) => {
              const statusColor =
                sub.status === "active"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                  : sub.status === "paused"
                  ? "bg-amber-100 text-amber-800 border-amber-200"
                  : "bg-slate-100 text-slate-600 border-slate-200";

              return (
                <div key={sub._id} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{sub.planName}</h3>
                      <p className="text-xs text-slate-500">
                        {isFarmerView
                          ? `Customer: ${sub.customer?.storeName || "Customer"} (${sub.customer?.phone || "N/A"})`
                          : `Farm: ${sub.farmer?.storeName || "Local Farm"}`}
                      </p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${statusColor}`}>
                      {sub.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <span className="text-slate-400 font-bold uppercase">Cadence</span>
                      <p className="mt-0.5 text-sm font-black capitalize text-slate-800">{sub.frequency} ({sub.preferredDay})</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <span className="text-slate-400 font-bold uppercase">Price / Drop</span>
                      <p className="mt-0.5 text-sm font-black text-emerald-700">Rs. {sub.pricePerDelivery}</p>
                    </div>
                  </div>

                  {sub.deliveryAddress?.street && (
                    <div className="mt-3 rounded-2xl bg-slate-50/80 p-3 text-xs text-slate-600">
                      <span className="font-bold text-slate-700">📍 Destination: </span>
                      <span>
                        {sub.deliveryAddress.street}, {sub.deliveryAddress.city} - {sub.deliveryAddress.pincode}
                      </span>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <span className="text-slate-400">
                      Next Drop:{" "}
                      <strong className="text-slate-700">
                        {new Date(sub.nextDeliveryDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </strong>
                    </span>

                    <div className="flex items-center gap-2">
                      {sub.status === "active" ? (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(sub._id, "paused")}
                          className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-1 font-bold text-amber-800 hover:bg-amber-100"
                        >
                          Pause
                        </button>
                      ) : sub.status === "paused" ? (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(sub._id, "active")}
                          className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1 font-bold text-emerald-800 hover:bg-emerald-100"
                        >
                          Resume
                        </button>
                      ) : null}

                      {sub.status !== "cancelled" && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(sub._id, "cancelled")}
                          className="rounded-xl border border-red-200 px-3 py-1 font-bold text-red-600 hover:bg-red-50"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Subscribe Confirmation Modal */}
      {subscribingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-2xl">{subscribingPlan.icon}</span>
                <h3 className="mt-1 text-lg font-black text-slate-900">{subscribingPlan.name}</h3>
                <p className="text-xs text-slate-500">
                  Rs. {subscribingPlan.price} / {subscribingPlan.frequency} ({subscribingPlan.preferredDay})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubscribingPlan(null)}
                className="text-sm font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmSubscription} className="mt-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Doorstep Delivery Address *
              </p>

              <div>
                <input
                  type="text"
                  required
                  placeholder="Street / House / Colony"
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="City"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
                <input
                  type="text"
                  required
                  placeholder="Pincode"
                  value={address.pincode}
                  onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Delivery Instructions / Gate Code (Optional)"
                  value={address.notes}
                  onChange={(e) => setAddress({ ...address, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="mt-5 rounded-2xl bg-emerald-50 p-3 text-xs text-emerald-800">
                <p className="font-bold">✨ Zero Commitment</p>
                <p className="mt-0.5">Pay on delivery or online. Pause or cancel anytime before dispatch day.</p>
              </div>

              <div className="mt-4 flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSubscribingPlan(null)}
                  className="flex-1 rounded-2xl border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 rounded-2xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60"
                >
                  {processing ? "Setting up..." : "Confirm Subscription"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubscriptionsPage;

