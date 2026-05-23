import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIzaSyC2fR-iGKA8TsyuNY5co1axyvqrUbQK_18',
  authDomain: 'rajuproject1-1b60f.firebaseapp.com',
  projectId: 'rajuproject1-1b60f',
  storageBucket: 'rajuproject1-1b60f.firebasestorage.app',
  messagingSenderId: '741892597965',
  appId: '1:741892597965:web:708d358b5deeb98d08e184',
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

/**
 * Request notification permission and return the FCM token.
 * Returns null if permission denied or browser unsupported.
 */
export async function requestFCMToken() {
  console.log('first');
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn('Notification permission denied');
    return null;
  }

  try {
    const token = await getToken(messaging, {
      vapidKey:
        'BH1pzHYIkXDjUNX-9ttxdw60PqjJ9E24vIfKIZ5n_xp-uO3oh3c0Ducm8xjr3yy8tj-F3-qrbIu0cwr3hOUcES0',
    });
    return token;
  } catch (err) {
    console.error('Error getting FCM token:', err);
    return null;
  }
}

/**
 * Listen for foreground messages.
 * @param {Function} callback - called with the message payload
 */
export function onForegroundMessage(callback) {
  return onMessage(messaging, callback);
}

export { messaging };
export default app;
