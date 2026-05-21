export default function PageHeader({ title, subtitle, subtitleClassName = "" }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-brand-navy">{title}</h1>
      {subtitle && (
        <p className={`text-sm text-gray-500 mt-1 ${subtitleClassName}`}>{subtitle}</p>
      )}
    </div>
  );
}
