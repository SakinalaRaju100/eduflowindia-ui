/* eslint-disable no-undef */
// public/firebase-messaging-sw.js
// This file MUST live in the public/ folder at the root of your React app.
// It handles background push notifications when the browser tab is not focused.

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// ⚠️  Replace with your actual Firebase config values
// These must match your .env REACT_APP_FIREBASE_* variables
firebase.initializeApp({
  apiKey: 'AIzaSyC2fR-iGKA8TsyuNY5co1axyvqrUbQK_18',
  authDomain: 'rajuproject1-1b60f.firebaseapp.com',
  projectId: 'rajuproject1-1b60f',
  storageBucket: 'rajuproject1-1b60f.firebasestorage.app',
  messagingSenderId: '741892597965',
  appId: '1:741892597965:web:708d358b5deeb98d08e184',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);

  const { title, body, icon } = payload.notification || {};

  self.registration.showNotification(title || 'New Notification', {
    body: body || '',
    // icon: icon || "/logo192.png",
    // badge: "/badge.png",
    tag: payload.data?.tag || 'fcm-notification',
    data: payload.data || {},
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  });
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new tab
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    }),
  );
});
