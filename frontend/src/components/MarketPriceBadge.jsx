import { useEffect, useState } from "react";
import { getCurrentPrice, getPriceHistory } from "../services/marketPriceService";

function MarketPriceBadge({ commodityKey, productPrice }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (!commodityKey) return;
        const current = await getCurrentPrice(commodityKey);
        const hist = await getPriceHistory(commodityKey, 2);
        if (!mounted) return;
        const yesterday = hist?.history && hist.history.length >= 2 ? hist.history[hist.history.length - 2].modalPrice : null;
        setData({ current, yesterday });
      } catch (err) {
        setError("Market price not available");
      }
    };
    load();
    return () => (mounted = false);
  }, [commodityKey]);

  if (!commodityKey || error || !data?.current?.modalPrice) {
    return null;
  }

  const modal = data.current.modalPrice;
  const unit = data.current.unit || "kg";
  const save = modal && productPrice ? Math.max(0, modal - productPrice) : null;
  const change = data.yesterday && modal ? Math.round(((modal - data.yesterday) / data.yesterday) * 100) : null;

  return (
    <div
      className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]"
      title={`Government Mandi Benchmark: ₹${modal.toFixed(0)}/${unit} (${data.current.market || "APMC"})`}
    >
      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700 border border-slate-200/60">
        <span>🏛️ Govt:</span>
        <span className="font-bold text-slate-900">₹{modal.toFixed(0)}/{unit}</span>
      </span>

      {save !== null && save > 0 ? (
        <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 font-black text-emerald-800 border border-emerald-200">
          Save ₹{save.toFixed(0)}
        </span>
      ) : null}

      {change !== null && change !== 0 && (
        <span
          className={`font-bold px-1.5 py-0.5 rounded-md text-[10px] ${
            change >= 0
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
          title="Compared to yesterday's mandi modal price"
        >
          {change >= 0 ? `▲ ${change}%` : `▼ ${Math.abs(change)}%`}
        </span>
      )}
    </div>
  );
}

export default MarketPriceBadge;
