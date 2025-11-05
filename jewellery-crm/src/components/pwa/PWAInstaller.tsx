'use client';

import { useEffect, useRef, useState } from 'react';

export function PWAInstaller() {
  const deferredPromptRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onLoad = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      }
    };
    window.addEventListener('load', onLoad);

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setIsReady(true);
      window.dispatchEvent(new CustomEvent('pwa-ready'));
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const handleAppInstall = async () => {
      const prompt = deferredPromptRef.current;
      if (!prompt) return;
      prompt.prompt();
      await prompt.userChoice;
      deferredPromptRef.current = null;
      setIsReady(false);
    };
    window.addEventListener('app-install', handleAppInstall);

    return () => {
      window.removeEventListener('load', onLoad);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('app-install', handleAppInstall);
    };
  }, []);

  return null;
}


