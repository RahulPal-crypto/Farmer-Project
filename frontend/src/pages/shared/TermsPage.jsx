import { useState } from "react";

function TermsPage() {
  const [activeTab, setActiveTab] = useState("terms");

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-6">
      <div className="text-center">
        <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">Platform Policies & Legal Terms</h1>
        <p className="mt-2 text-sm text-slate-500">
          Transparency and trust are at the foundation of the Farmer Market ecosystem.
        </p>
      </div>

      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("terms")}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition ${
            activeTab === "terms"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Terms of Service
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("privacy")}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition ${
            activeTab === "privacy"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Privacy Policy
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("refund")}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition ${
            activeTab === "refund"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Refund & Return Policy
        </button>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8 text-sm leading-7 text-slate-600 space-y-6">
        {activeTab === "terms" && (
          <>
            <h2 className="text-xl font-black text-slate-900">1. Acceptance of Terms</h2>
            <p>
              By accessing and placing orders through Farmer Market, customers and registered farmers agree to abide by these Terms of Service. Farmer Market provides technology infrastructure to connect agricultural producers with end consumers.
            </p>

            <h2 className="text-xl font-black text-slate-900">2. Farmer Responsibilities & Produce Quality</h2>
            <p>
              Farmers are responsible for accurate stock quantities, honest representation of harvest freshness, and adherence to safe agricultural practices. Listed prices must accurately represent unit pricing per kilogram or standard bundle.
            </p>

            <h2 className="text-xl font-black text-slate-900">3. Orders, Payments & Fulfillment</h2>
            <p>
              Orders placed on Farmer Market are fulfilled directly by the grower within designated regional delivery radii. Payments can be settled online through encrypted gateways or through Cash on Delivery (COD) upon physical handover.
            </p>
          </>
        )}

        {activeTab === "privacy" && (
          <>
            <h2 className="text-xl font-black text-slate-900">1. Information We Collect</h2>
            <p>
              We collect your name, phone number, email address, and delivery coordinates solely to enable local proximity matching and facilitate farm-to-door deliveries.
            </p>

            <h2 className="text-xl font-black text-slate-900">2. Data Security & Storage</h2>
            <p>
              User passwords are encrypted with industry-standard salted hashing (bcrypt). We never sell your personal contact information to third-party marketing brokers.
            </p>

            <h2 className="text-xl font-black text-slate-900">3. Location Information</h2>
            <p>
              Location coordinates are used strictly to calculate proximity distances between farms and customers, and are never tracked continuously in the background.
            </p>
          </>
        )}

        {activeTab === "refund" && (
          <>
            <h2 className="text-xl font-black text-slate-900">1. Perishable Goods Guarantee</h2>
            <p>
              Because produce is fresh and perishable, inspect items upon delivery. If produce is damaged, sub-standard, or incomplete, report the issue immediately through the Order Chat with the farmer or email our support hotline within 12 hours of delivery.
            </p>

            <h2 className="text-xl font-black text-slate-900">2. Order Rejections & Cancellations</h2>
            <p>
              If a farmer rejects an order due to crop shortage or weather complications, any prepaid online amount is reversed to the original payment source within 3-5 business days, and customer stock reservations are cancelled without penalty.
            </p>

            <h2 className="text-xl font-black text-slate-900">3. How to Request Assistance</h2>
            <p>
              For unresolved disputes between buyer and seller, contact our regional support hub at support@farmermarket.local with your Order ID.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default TermsPage;

