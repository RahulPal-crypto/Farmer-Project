import { useState } from "react";

import ErrorAlert from "../../components/ErrorAlert";
import { getApiErrorMessage } from "../../services/api";
import { addProduct } from "../../services/productService";

const initialForm = {
  name: "",
  price: "",
  quantity: "",
  category: "",
  latitude: "28.6139",
  longitude: "77.2090",
};

function AddProductPage() {
  const [formData, setFormData] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    setSuccess("");
    setError("");
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        payload.append(key, value);
      });

      if (imageFile) {
        payload.append("image", imageFile);
      }

      await addProduct(payload);
      setSuccess("Product added successfully.");
      setFormData(initialForm);
      setImageFile(null);
    } catch (error) {
      setError(getApiErrorMessage(error, "Unable to add product"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm md:p-8">
      <h1 className="text-3xl font-bold text-slate-900">Add Product</h1>
      <p className="mt-2 text-sm text-slate-500">Create a new listing for your farm inventory.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <ErrorAlert message={error} />
        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Product name"
            required
            className="rounded-2xl border border-slate-200 px-4 py-3"
          />
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            placeholder="Category"
            required
            className="rounded-2xl border border-slate-200 px-4 py-3"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="Price"
            required
            className="rounded-2xl border border-slate-200 px-4 py-3"
          />
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="Quantity"
            required
            className="rounded-2xl border border-slate-200 px-4 py-3"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            type="text"
            name="latitude"
            value={formData.latitude}
            onChange={handleChange}
            placeholder="Latitude"
            required
            className="rounded-2xl border border-slate-200 px-4 py-3"
          />
          <input
            type="text"
            name="longitude"
            value={formData.longitude}
            onChange={handleChange}
            placeholder="Longitude"
            required
            className="rounded-2xl border border-slate-200 px-4 py-3"
          />
        </div>

        <input
          type="file"
          accept="image/*"
          onChange={(event) => setImageFile(event.target.files?.[0] || null)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-70"
        >
          {loading ? "Saving..." : "Add Product"}
        </button>
      </form>
    </div>
  );
}

export default AddProductPage;
