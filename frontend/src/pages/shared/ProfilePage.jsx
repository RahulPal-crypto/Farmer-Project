import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api, { getApiErrorMessage } from "../../services/api";
import ErrorAlert from "../../components/ErrorAlert";
import LoadingSpinner from "../../components/LoadingSpinner";

function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [geoLocating, setGeoLocating] = useState(false);

  const [formData, setFormData] = useState({
    storeName: "",
    email: "",
    phone: "",
    whatsappPhone: "",
    isWhatsappSameAsPhone: true,
    latitude: "",
    longitude: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [stats, setStats] = useState({
    role: "",
    createdAt: null,
    averageRating: 0,
    reviewCount: 0,
  });

  const [verification, setVerification] = useState({
    isVerifiedFarmer: false,
    verificationStatus: "unverified",
    verificationNotes: "",
    docType: "Kisan Credit Card (KCC)",
    docNumber: "",
    docUrl: "",
    notes: "",
  });
  const [submittingKyc, setSubmittingKyc] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await api.get("/auth/profile");
        const profile = data.user;

        setFormData((prev) => ({
          ...prev,
          storeName: profile.storeName || "",
          email: profile.email || "",
          phone: profile.phone || "",
          whatsappPhone: profile.whatsappPhone || "",
          isWhatsappSameAsPhone: profile.isWhatsappSameAsPhone ?? true,
          latitude: profile.location?.coordinates?.[1] ?? "",
          longitude: profile.location?.coordinates?.[0] ?? "",
        }));

        setStats({
          role: profile.role || user?.role || "customer",
          createdAt: profile.createdAt,
          averageRating: profile.averageRating || 0,
          reviewCount: profile.reviewCount || 0,
        });

        setVerification((prev) => ({
          ...prev,
          isVerifiedFarmer: profile.isVerifiedFarmer || false,
          verificationStatus: profile.verificationStatus || "unverified",
          verificationNotes: profile.verificationNotes || "",
        }));
      } catch (err) {
        setError(getApiErrorMessage(err, "Unable to load profile"));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.role]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setGeoLocating(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        }));
        setGeoLocating(false);
      },
      (geoError) => {
        setError(`Unable to detect GPS coordinates: ${geoError.message}`);
        setGeoLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (formData.newPassword) {
      if (!formData.currentPassword) {
        setError("Please enter your current password to set a new password.");
        return;
      }
      if (formData.newPassword.length < 6) {
        setError("New password must be at least 6 characters long.");
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError("New password and confirmation do not match.");
        return;
      }
    }

    try {
      setSaving(true);
      const payload = {
        storeName: formData.storeName,
        phone: formData.phone,
        whatsappPhone: formData.whatsappPhone,
        isWhatsappSameAsPhone: formData.isWhatsappSameAsPhone,
        latitude: formData.latitude !== "" ? Number(formData.latitude) : undefined,
        longitude: formData.longitude !== "" ? Number(formData.longitude) : undefined,
      };

      if (formData.newPassword) {
        payload.currentPassword = formData.currentPassword;
        payload.newPassword = formData.newPassword;
      }

      const { data } = await api.put("/auth/profile", payload);
      updateUser(data.user);

      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update profile"));
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyFarmerSubmit = async (e) => {
    e.preventDefault();
    if (!verification.docNumber.trim()) {
      setError("Please provide your document identification / registration number.");
      return;
    }

    try {
      setSubmittingKyc(true);
      setError("");
      const { data } = await api.post("/auth/verify-farmer", {
        docType: verification.docType,
        docNumber: verification.docNumber,
        docUrl: verification.docUrl,
        notes: verification.notes,
      });

      setVerification((prev) => ({
        ...prev,
        verificationStatus: data.verificationStatus,
        isVerifiedFarmer: data.isVerifiedFarmer,
      }));
      setSuccessMessage("KYC credentials submitted! Pending administrator review.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to submit verification"));
    } finally {
      setSubmittingKyc(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading profile details..." />;
  }

  const roleBadgeColor =
    stats.role === "farmer"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : stats.role === "admin"
      ? "bg-purple-100 text-purple-800 border-purple-200"
      : "bg-blue-100 text-blue-800 border-blue-200";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-2xl font-black text-white shadow-md shadow-emerald-500/20">
              {formData.storeName ? formData.storeName.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">{formData.storeName || "User Account"}</h1>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${roleBadgeColor}`}>
                  {stats.role}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">{formData.email}</p>
            </div>
          </div>

          {stats.role === "farmer" && (
            <div className="flex items-center gap-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Farm Rating</p>
                <p className="text-lg font-black text-emerald-700">★ {stats.averageRating.toFixed(1)} / 5.0</p>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <p className="text-xs font-bold text-slate-400 uppercase">Reviews</p>
                <p className="text-lg font-black text-slate-900">{stats.reviewCount}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ErrorAlert message={error} />

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 shadow-xs">
          ✅ {successMessage}
        </div>
      )}

      {/* Farmer Verification KYC Section */}
      {stats.role === "farmer" && (
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🛡️</span>
                <h2 className="text-lg font-bold text-slate-900">Grower Verification Badge</h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Verified farmers receive a blue "Verified Farm" badge on product cards to build buyer trust.
              </p>
            </div>
            <div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${
                  verification.isVerifiedFarmer
                    ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                    : verification.verificationStatus === "pending"
                    ? "border-amber-300 bg-amber-100 text-amber-800"
                    : verification.verificationStatus === "rejected"
                    ? "border-red-300 bg-red-100 text-red-800"
                    : "border-slate-300 bg-slate-100 text-slate-700"
                }`}
              >
                <span>{verification.isVerifiedFarmer ? "🛡️ Verified Grower" : verification.verificationStatus}</span>
              </span>
            </div>
          </div>

          {verification.isVerifiedFarmer ? (
            <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-900">
              <p className="font-bold">✨ Your Farm is Verified</p>
              <p className="mt-1">
                Your farm credentials have been verified by platform administrators. All your product listings proudly feature the Verified Local Grower shield badge.
              </p>
            </div>
          ) : verification.verificationStatus === "pending" ? (
            <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-xs font-semibold text-amber-900">
              <p className="font-bold">⏳ Verification Under Review</p>
              <p className="mt-1">
                Your credentials have been submitted and are being reviewed by administrators. Once approved, the Verified Grower badge will appear on your store.
              </p>
            </div>
          ) : (
            <form onSubmit={handleVerifyFarmerSubmit} className="mt-4 space-y-4">
              <p className="text-xs font-bold text-slate-700">Submit Land Record or Kisan Credit Card for Verification:</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Document Type *
                  </label>
                  <select
                    value={verification.docType}
                    onChange={(e) => setVerification({ ...verification, docType: e.target.value })}
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Kisan Credit Card (KCC)">Kisan Credit Card (KCC)</option>
                    <option value="Land Record (7/12 Extract / Patta)">Land Record (7/12 Extract / Patta)</option>
                    <option value="Organic Farming Certificate">Organic Farming Certificate</option>
                    <option value="APMC Mandi Trader / Farmer Pass">APMC Mandi Farmer Pass</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Registration / Certificate Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KCC-MH-9481902"
                    value={verification.docNumber}
                    onChange={(e) => setVerification({ ...verification, docNumber: e.target.value })}
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Document Image URL / Cloud Link (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={verification.docUrl}
                    onChange={(e) => setVerification({ ...verification, docUrl: e.target.value })}
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingKyc}
                  className="rounded-2xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-60"
                >
                  {submittingKyc ? "Submitting..." : "Submit for Verification"}
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* Edit Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Details */}
        <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-lg font-bold text-slate-900">Personal & Store Information</h2>
          <p className="mt-1 text-xs text-slate-500">
            Keep your contact details up to date for smooth buyer-farmer communication.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                {stats.role === "farmer" ? "Farm / Store Name" : "Display Name"} *
              </label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.isWhatsappSameAsPhone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isWhatsappSameAsPhone: e.target.checked,
                      whatsappPhone: e.target.checked ? formData.phone : formData.whatsappPhone,
                    })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>💬 WhatsApp number is the same as my calling phone number</span>
              </label>

              {!formData.isWhatsappSameAsPhone && (
                <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950">
                    Alternate WhatsApp Number (For Automated Order & Dispatch Updates)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210 (WhatsApp registered mobile)"
                    value={formData.whatsappPhone}
                    onChange={(e) => setFormData({ ...formData, whatsappPhone: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-emerald-700">
                    All automated order placement, status changes, and dispatch alerts will be sent here.
                  </p>
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={formData.email}
                className="mt-1.5 w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500"
              />
              <p className="mt-1 text-[11px] text-slate-400">Account login email cannot be changed.</p>
            </div>
          </div>
        </section>

        {/* Location & GPS */}
        <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Location & Coordinates</h2>
              <p className="mt-1 text-xs text-slate-500">
                Coordinates are used for radius filtering, farm distance calculations, and delivery proximity.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={geoLocating}
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
            >
              <span>📍</span>
              {geoLocating ? "Detecting..." : "Detect Current GPS"}
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 18.5204"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 73.8567"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Change Password (Optional) */}
        <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-lg font-bold text-slate-900">Security & Password</h2>
          <p className="mt-1 text-xs text-slate-500">
            Leave blank if you do not wish to change your current password.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Current Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                New Password
              </label>
              <input
                type="password"
                placeholder="Min 6 characters"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="Repeat new password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-emerald-600 px-8 py-3.5 font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? "Saving Changes..." : "Save Profile Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProfilePage;

