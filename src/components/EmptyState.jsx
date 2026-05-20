export default function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="text-center py-20">
      {icon && (
        <div className="flex justify-center mb-4 text-gray-300">
          {icon}
        </div>
      )}
      <p className="text-gray-500">{title}</p>
      {subtitle && (
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
