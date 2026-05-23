import { useEffect } from 'react';
import { onForegroundMessage } from '../services/firebase';
import toast from 'react-hot-toast';

/**
 * Listens for foreground FCM messages and shows a toast notification.
 * Mount this once at the top level (e.g. in App.js).
 */
export function useForegroundNotifications() {
  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      const { title, body } = payload.notification || {};
      toast.custom(
        (t) => (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              background: '#1e2130',
              border: '1px solid #f97316',
              borderRadius: 12,
              padding: '14px 16px',
              maxWidth: 360,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              opacity: t.visible ? 1 : 0,
              transform: t.visible ? 'translateY(0)' : 'translateY(-8px)',
              transition: 'all 0.3s ease',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#e0e4f0', fontSize: 14, fontWeight: 600, margin: '0 0 3px' }}>
                {title}
              </p>
              <p style={{ color: '#9da3b8', fontSize: 12, margin: 0, lineHeight: 1.5 }}>{body}</p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#5a5f75',
                cursor: 'pointer',
                padding: 0,
                fontSize: 16,
              }}
            >
              ×
            </button>
          </div>
        ),
        { duration: 6000, position: 'top-right' },
      );
    });

    return () => unsubscribe();
  }, []);
}
