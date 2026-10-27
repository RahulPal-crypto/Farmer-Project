import { useState } from "react";
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaClock, FaCheckCircle } from "react-icons/fa";

function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "General Inquiry",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10 py-6">
      <div className="text-center">
        <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">Get In Touch</h1>
        <p className="mt-2 text-sm text-slate-500">
          Have questions about an order, seller onboarding, or regional deliveries? Our team is here to help.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-black text-slate-900">Support Information</h2>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <FaPhoneAlt />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">Direct Helpline</p>
                <p className="font-semibold text-slate-800">+91 1800 200 4567</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <FaEnvelope />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">Email Support</p>
                <p className="font-semibold text-slate-800">support@farmermarket.local</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <FaMapMarkerAlt />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">Operations Hub</p>
                <p className="font-semibold text-slate-800">Kisan Bhawan, New Delhi, India</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <FaClock />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">Customer Support Hours</p>
                <p className="font-semibold text-slate-800">Monday - Saturday: 7:00 AM - 8:00 PM</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-emerald-800 p-6 text-white shadow-md">
            <h3 className="font-black text-lg">Are you a Farmer?</h3>
            <p className="mt-2 text-xs leading-5 text-emerald-100">
              Need assistance listing your harvest or setting up regional delivery? Speak with our dedicated Farmer Onboarding coordinator.
            </p>
            <p className="mt-3 text-xs font-bold text-lime-300">farmer-help@farmermarket.local</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
          {submitted ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center text-center space-y-4">
              <FaCheckCircle className="text-5xl text-emerald-600" />
              <h2 className="text-2xl font-bold text-slate-900">Message Received!</h2>
              <p className="max-w-md text-sm text-slate-500">
                Thank you for reaching out, {form.name}. Our regional support team will review your inquiry and get back to you within 24 hours.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setForm({ name: "", email: "", phone: "", subject: "General Inquiry", message: "" });
                }}
                className="mt-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-xl font-black text-slate-900">Send Us a Message</h2>
              <p className="text-xs text-slate-500">Fill out the form below and we'll respond promptly.</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-slate-600">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Email Address</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g. ramesh@example.com"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-slate-600">Phone Number</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Inquiry Topic</label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Order Tracking / Delivery">Order Tracking / Delivery</option>
                    <option value="Farmer Registration">Farmer Registration</option>
                    <option value="Payment / Refund Issue">Payment / Refund Issue</option>
                    <option value="Technical Bug Report">Technical Bug Report</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">Message / Query Details</label>
                <textarea
                  rows={4}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="How can we assist you today?"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 shadow-sm transition"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ContactPage;

