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
        const yesterday = hist.history && hist.history.length >= 2 ? hist.history[hist.history.length - 2].modalPrice : null;
        setData({ current, yesterday });
      } catch (err) {
        setError("Market price not available");
      }
    };
    load();
    return () => (mounted = false);
  }, [commodityKey]);

  if (!commodityKey) return null;

  if (error) return <div className="text-sm text-red-500">{error}</div>;
  if (!data) return <div className="text-sm text-slate-500">Loading market price...</div>;

  const modal = data.current.modalPrice;
  const unit = data.current.unit || "kg";
  const save = modal && productPrice ? Math.max(0, modal - productPrice) : null;
  const change = data.yesterday && modal ? Math.round(((modal - data.yesterday) / data.yesterday) * 100) : null;

  return (
    <div className="mt-2 flex items-center gap-3 text-sm">
      <div className="text-sm text-slate-700">
        Market: <span className="font-black">Rs. {modal?.toFixed(2) || "-"}/{unit}</span>
      </div>
      {save !== null && (
        <div className="text-sm text-slate-600">You Save: <span className="font-black">Rs. {save.toFixed(2)}/{unit}</span></div>
      )}
      {change !== null && (
        <div className={`text-sm font-black ${change >= 0 ? "text-emerald-600" : "text-red-600"}`}>
          {change >= 0 ? `▲ ${change}%` : `▼ ${Math.abs(change)}%`}
        </div>
      )}
    </div>
  );
}

export default MarketPriceBadge;
