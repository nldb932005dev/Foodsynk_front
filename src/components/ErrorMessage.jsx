export default function ErrorMessage({ message }) {
  if (!message) return null;

  return (
    <div role="alert" className="rounded-xl border border-brand-error/30 bg-brand-error/10 px-4 py-3 text-sm text-brand-error">
      {message}
    </div>
  );
}
