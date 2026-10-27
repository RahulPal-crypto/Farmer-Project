function FreshnessBadge({ harvestDate, className = "" }) {
  if (!harvestDate) return null;

  const harvestTime = new Date(harvestDate).getTime();
  if (Number.isNaN(harvestTime)) return null;

  const now = Date.now();
  const diffMs = now - harvestTime;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  // Freshness categorization
  if (diffHours < 12) {
    const hoursLabel = diffHours <= 1 ? "Just now" : `${diffHours}h ago`;
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-gradient-to-r from-emerald-500 to-green-600 px-2.5 py-0.5 text-[11px] font-black text-white shadow-xs shadow-emerald-500/20 ${className}`}
        title={`Harvested ${hoursLabel} (${new Date(harvestDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
        </span>
        <span>Harvested Today ({hoursLabel})</span>
      </span>
    );
  }

  if (diffHours < 24) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 ${className}`}
        title={`Harvested on ${new Date(harvestDate).toLocaleDateString()}`}
      >
        <span>🌱</span>
        <span>Harvested Today</span>
      </span>
    );
  }

  if (diffDays === 1 || diffHours < 48) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold text-teal-800 ${className}`}
        title={`Harvested on ${new Date(harvestDate).toLocaleDateString()}`}
      >
        <span>🌾</span>
        <span>Harvested Yesterday</span>
      </span>
    );
  }

  if (diffDays <= 4) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-900 ${className}`}
        title={`Harvested on ${new Date(harvestDate).toLocaleDateString()}`}
      >
        <span>🚜</span>
        <span>Harvested {diffDays} days ago</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 ${className}`}
    >
      <span>🗓️</span>
      <span>Harvested {new Date(harvestDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
    </span>
  );
}

export default FreshnessBadge;

