export default function ConfirmModal({ open, title, message, confirmText = "Eliminar", cancelText = "Cancelar", onConfirm, onCancel, loading = false }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!loading ? onCancel : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-in">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="h-14 w-14 rounded-full bg-brand-coral/10 flex items-center justify-center">
            <svg className="w-7 h-7 text-brand-coral" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
        </div>

        <h3 className="text-lg font-bold text-brand-navy text-center">
          {title}
        </h3>
        <p className="text-sm text-gray-500 text-center mt-2">
          {message}
        </p>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-brand-coral px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Eliminando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
