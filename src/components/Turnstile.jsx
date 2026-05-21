import { useEffect, useRef } from 'react';

export default function Turnstile({ onToken }) {
  const ref = useRef(null);
  const widgetId = useRef(null);

  useEffect(() => {
    function render() {
      if (!window.turnstile || !ref.current) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
        callback: (token) => onToken(token),
        'error-callback': () => onToken(''),
        'expired-callback': () => onToken(''),
      });
    }
    if (window.turnstile) render();
    else {
      const i = setInterval(() => {
        if (window.turnstile) { clearInterval(i); render(); }
      }, 200);
      return () => clearInterval(i);
    }
    return () => {
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
      }
    };
  }, [onToken]);

  return <div ref={ref} className="my-3" />;
}
