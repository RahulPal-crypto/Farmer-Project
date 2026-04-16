function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3 shadow-sm">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>
    </div>
  );
}

export default LoadingSpinner;
