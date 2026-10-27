import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="mt-10 border-t border-emerald-100 bg-white">
      <div className="mx-auto grid max-w-7xl 2xl:max-w-[1536px] 3xl:max-w-[1780px] gap-8 px-3.5 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1.1fr] lg:px-8 2xl:px-10">
        <div>
          <Link to="/" className="flex items-center gap-2 text-2xl font-black text-emerald-700 tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white text-base shadow-xs">
              🌱
            </span>
            <span>KrishiSetu</span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              कृषिसेतु
            </span>
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">
            A digital bridge empowering Indian farmers with direct customer trade, real-time APMC Mandi rates, live
            weather advisories, and voice-assisted commerce.
          </p>
          <div className="mt-5 flex gap-4 text-sm font-bold text-emerald-700">
            <span className="cursor-pointer hover:underline">Instagram</span>
            <span className="cursor-pointer hover:underline">Facebook</span>
            <span className="cursor-pointer hover:underline">LinkedIn</span>
          </div>
        </div>

        <div>
          <h3 className="font-black text-slate-900">Company</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
            <li>
              <Link to="/about" className="hover:text-emerald-700 hover:underline">
                About KrishiSetu
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-emerald-700 hover:underline">
                Contact Us
              </Link>
            </li>
            <li>
              <Link to="/help" className="hover:text-emerald-700 hover:underline">
                Help & Kisan Support
              </Link>
            </li>
            <li>
              <Link to="/signup" className="hover:text-emerald-700 hover:underline">
                Farmer Onboarding
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-black text-slate-900">Policies</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
            <li>
              <Link to="/terms" className="hover:text-emerald-700 hover:underline">
                Terms & Conditions
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-emerald-700 hover:underline">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/refund" className="hover:text-emerald-700 hover:underline">
                Refund Policy
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-emerald-700 hover:underline">
                Order Support
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-black text-slate-900">Get Fresh Updates</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Subscribe for harvest alerts, APMC Mandi price swings, and nearby farmer listings.
          </p>
          <div className="mt-4 flex gap-2">
            <input
              type="email"
              placeholder="Email address"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
            />
            <button type="button" className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700 transition">
              Join
            </button>
          </div>
        </div>
      </div>

      {/* Developer Credit & Copyright Banner */}
      <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-4 sm:py-5">
        <div className="mx-auto flex max-w-7xl 2xl:max-w-[1536px] flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-slate-600">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} <span className="font-bold text-slate-900">KrishiSetu (कृषिसेतु)</span>. Live listings, farmer-managed stock, transparent Mandi pricing.
          </p>

          <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-xs border border-emerald-200">
            <span className="text-sm">👨‍💻</span>
            <span className="text-slate-600">Designed & Developed with ❤️ by</span>
            <span className="font-black text-emerald-800 text-sm tracking-tight">Rahul Pal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
