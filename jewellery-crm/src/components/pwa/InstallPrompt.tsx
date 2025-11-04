"use client";

import React, { useEffect, useState } from 'react';

// A small floating button that appears when the PWA install prompt is available
// Shows only if the browser fires `beforeinstallprompt` and user hasn't dismissed it.
export function PWAInstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onBeforeInstall = (e: any) => {
      // Prevent the mini-infobar on mobile
      e.preventDefault();
      setDeferred(e);
      setVisible(true);
    };

    const onAppInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall as any);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall as any);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  if (!visible || !deferred) return null;

  const handleInstall = async () => {
    try {
      deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome !== 'accepted') {
        // If user dismissed, don't show again this session
        setVisible(false);
      }
      setDeferred(null);
    } catch (_) {
      setVisible(false);
    }
  };

  const handleClose = () => setVisible(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white shadow-xl rounded-xl border p-3 flex items-center gap-3">
        <div className="hidden sm:block text-sm text-gray-700">Install this app for quicker access</div>
        <button
          onClick={handleInstall}
          className="bg-blue-600 text-white text-sm px-3 py-2 rounded-md hover:bg-blue-700"
        >
          Install
        </button>
        <button
          onClick={handleClose}
          aria-label="Dismiss install prompt"
          className="text-gray-500 hover:text-gray-700 px-2"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
