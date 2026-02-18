export default function LoadingSpinner({ text = "Cargando..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-green-light border-t-brand-green" />
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}
