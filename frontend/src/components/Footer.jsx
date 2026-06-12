function Footer() {
  return (
    <footer className="mt-10 border-t border-emerald-100 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1.1fr] lg:px-8">
        <div>
          <h2 className="text-2xl font-black text-emerald-700">Farmer Market</h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">
            A local marketplace connecting customers with farmer-managed listings, current stock, and transparent
            prices from the app database.
          </p>
          <div className="mt-5 flex gap-3 text-sm font-bold text-emerald-700">
            <span>Instagram</span>
            <span>Facebook</span>
            <span>LinkedIn</span>
          </div>
        </div>

        <div>
          <h3 className="font-black text-slate-900">Company</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>About Us</li>
            <li>Contact Us</li>
            <li>Help Center</li>
            <li>Farmer Onboarding</li>
          </ul>
        </div>

        <div>
          <h3 className="font-black text-slate-900">Policies</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>Terms & Conditions</li>
            <li>Privacy Policy</li>
            <li>Refund Policy</li>
            <li>Order Support</li>
          </ul>
        </div>

        <div>
          <h3 className="font-black text-slate-900">Get Fresh Updates</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Subscribe for product updates, harvest alerts, and nearby farmer listings.
          </p>
          <div className="mt-4 flex gap-2">
            <input
              type="email"
              placeholder="Email address"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
            />
            <button type="button" className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white">
              Join
            </button>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-100 px-4 py-4 text-center text-xs font-medium text-slate-500">
        Copyright 2026 Farmer Market. Live listings, farmer-managed stock, transparent prices.
      </div>
    </footer>
  );
}

export default Footer;
