import { Link } from "react-router-dom";
import { FaTractor, FaHandshake, FaSeedling, FaShieldAlt } from "react-icons/fa";

function AboutPage() {
  const pillars = [
    {
      icon: FaTractor,
      title: "Direct From Local Farms",
      description:
        "Every listing comes directly from local registered growers. No warehouses, no multi-day storage—just farm-fresh harvest delivered directly to your doorstep.",
    },
    {
      icon: FaHandshake,
      title: "Fair Farmer Compensation",
      description:
        "Traditional supply chains take up to 60% of crop value in middleman margins. Our platform connects producers directly with consumers so farmers earn what they deserve.",
    },
    {
      icon: FaSeedling,
      title: "Transparent Mandi Benchmarks",
      description:
        "We integrate official government market price benchmarks so buyers and sellers have complete visibility into fair, honest regional crop pricing.",
    },
    {
      icon: FaShieldAlt,
      title: "Community Group Buying",
      description:
        "Neighbors can pool demand together to unlock bulk wholesale discounts, reducing delivery carbon footprints and making organic food affordable.",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-12 py-6">
      <section className="rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-lime-700 p-8 text-white shadow-xl md:p-12">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-lime-300">Our Mission</p>
        <h1 className="mt-3 text-3xl font-black sm:text-5xl">
          Empowering farmers. Delivering freshness.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-emerald-100">
          KrishiSetu (कृषिसेतु) is built to bridge the gap between agricultural producers and local communities. By cutting out intermediaries, we ensure families get wholesome harvest while farmers gain direct financial independence.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            to="/"
            className="rounded-2xl bg-white px-6 py-3 text-sm font-black text-emerald-900 shadow-md hover:bg-emerald-50"
          >
            Explore Fresh Listings
          </Link>
          <Link
            to="/signup"
            className="rounded-2xl border border-white/40 px-6 py-3 text-sm font-bold text-white hover:bg-white/10"
          >
            Join as a Producer
          </Link>
        </div>
      </section>

      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">Why KrishiSetu?</h2>
          <p className="mt-2 text-sm text-slate-500">
            A technology-driven ecosystem designed for transparent agriculture.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="flex gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Icon className="text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{pillar.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{pillar.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-black text-slate-900">How It Works</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">
              1
            </span>
            <h3 className="font-bold text-slate-900">Farmer Lists Harvest</h3>
            <p className="text-xs text-slate-500 leading-5">
              Verified farmers post available produce with photos, inventory quantities, and farm location.
            </p>
          </div>
          <div className="space-y-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">
              2
            </span>
            <h3 className="font-bold text-slate-900">Local Customers Order</h3>
            <p className="text-xs text-slate-500 leading-5">
              Buyers search nearby farms, compare prices with government mandi rates, and place individual or group orders.
            </p>
          </div>
          <div className="space-y-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">
              3
            </span>
            <h3 className="font-bold text-slate-900">Direct Delivery & Chat</h3>
            <p className="text-xs text-slate-500 leading-5">
              Farmers coordinate delivery directly with real-time order chat and secure payment options (Online or COD).
            </p>
          </div>
        </div>
      </section>

      {/* Meet The Developer Section */}
      <section className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-lime-50/40 p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-emerald-700 text-3xl font-black text-white shadow-lg shadow-emerald-700/25">
            RP
          </div>
          <div className="text-center sm:text-left flex-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-800">
              <span>👨‍💻</span> Lead Developer & Architect
            </div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black text-slate-950">Rahul Pal</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 max-w-2xl">
              Architected and engineered KrishiSetu to solve real-world supply chain inefficiencies in Indian agriculture. 
              Built with full-stack MERN architecture, geospatial GIS indexing, live Web Speech API recognition, and automated Open-Meteo agri-weather advisory.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="rounded-xl bg-white px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200">React</span>
              <span className="rounded-xl bg-white px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200">Node.js</span>
              <span className="rounded-xl bg-white px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200">MongoDB Geospatial</span>
              <span className="rounded-xl bg-white px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200">Web Speech API</span>
              <span className="rounded-xl bg-white px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200">Tailwind CSS</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutPage;

