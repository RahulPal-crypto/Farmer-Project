function VerifiedFarmerBadge({ isVerified, className = "" }) {
  if (!isVerified) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50/90 px-2 py-0.5 text-[10px] font-extrabold text-blue-700 shadow-2xs ${className}`}
      title="Verified Local Grower (Land Record / Organic KYC Verified)"
    >
      <svg
        className="h-3 w-3 text-blue-600"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 1a.75.75 0 01.65.375l1.6 2.772 3.14.456a.75.75 0 01.416 1.28l-2.272 2.215.536 3.127a.75.75 0 01-1.088.791L10 10.542l-2.808 1.474a.75.75 0 01-1.088-.79l.536-3.128-2.272-2.215a.75.75 0 01.416-1.28l3.14-.456 1.6-2.772A.75.75 0 0110 1z"
          clipRule="evenodd"
        />
      </svg>
      <span>Verified Farm</span>
    </span>
  );
}

export default VerifiedFarmerBadge;

