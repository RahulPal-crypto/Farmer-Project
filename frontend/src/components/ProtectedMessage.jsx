function ProtectedMessage({ title, description }) {
  return (
    <div className="rounded-3xl bg-amber-50 p-6 text-amber-900 shadow-sm">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-amber-800">{description}</p>
    </div>
  );
}

export default ProtectedMessage;
