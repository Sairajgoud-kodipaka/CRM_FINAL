'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/ResponsiveDialog';

export function PWAInstallButton() {
  const [pwaReady, setPwaReady] = useState(false);
  const [open, setOpen] = useState(false);
  const deferredPromptRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setPwaReady(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const onClick = () => {
    if (pwaReady && deferredPromptRef.current) {
      const prompt = deferredPromptRef.current;
      prompt.prompt();
      prompt.userChoice.finally(() => {
        deferredPromptRef.current = null;
        setPwaReady(false);
      });
    } else {
      setOpen(true);
    }
  };

  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isChrome = /chrome|crios/.test(userAgent) && !/edge|edg|opr/.test(userAgent);
  const isAndroid = /android/.test(userAgent);

  return (
    <>
     
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title="Install on your device"
        description="Follow the steps below to add Jewellery CRM to your home screen."
        size="sm"
        contentClassName="space-y-4"
      >
        {pwaReady ? (
          <div className="space-y-3">
            <p className="text-sm">Tap the button below to install the app on your device.</p>
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                window.dispatchEvent(new Event('app-install'));
                setOpen(false);
              }}
            >
              Install now
            </Button>
          </div>
        ) : isIOS ? (
          <div className="space-y-2 text-sm">
            <p>1. Tap the Share icon (square with an up arrow) in Safari.</p>
            <p>2. Choose <b>Add to Home Screen</b>.</p>
            <p>3. Tap <b>Add</b> in the top-right corner.</p>
          </div>
        ) : isAndroid && isChrome ? (
          <div className="space-y-2 text-sm">
            <p>1. Tap the browser menu (⋮) in Chrome.</p>
            <p>2. Choose <b>Install app</b> or <b>Add to Home screen</b>.</p>
            <p>3. Confirm to install.</p>
            <p className="text-xs text-muted-foreground">Tip: After a short while, Chrome may show the install prompt automatically.</p>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <p>Open this site in your device's main browser and select <b>Install app</b> or <b>Add to Home screen</b> from the menu.</p>
          </div>
        )}
      </ResponsiveDialog>
    </>
  );
}


