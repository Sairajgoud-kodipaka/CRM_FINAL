/**
 * Modal Context
 * 
 * Global state management for modal visibility to control MobileNav display.
 * When any modal is open, MobileNav should be hidden to prevent button overlap.
 */

'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

interface ModalContextType {
  isAnyModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [openModals, setOpenModals] = useState<Set<string>>(new Set());

  const openModal = useCallback(() => {
    setOpenModals(prev => {
      const newSet = new Set(prev);
      newSet.add(`modal-${Date.now()}-${Math.random()}`);
      return newSet;
    });
  }, []);

  const closeModal = useCallback(() => {
    setOpenModals(prev => {
      const newSet = new Set(prev);
      const firstModal = Array.from(newSet)[0];
      if (firstModal) {
        newSet.delete(firstModal);
      }
      return newSet;
    });
  }, []);

  const isAnyModalOpen = openModals.size > 0;

  const contextValue = useMemo(() => ({
    isAnyModalOpen,
    openModal,
    closeModal,
  }), [isAnyModalOpen, openModal, closeModal]);

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    // Return a fallback object when ModalProvider is not available
    if (process.env.NODE_ENV === 'development') {
      console.warn('useModal is being used outside of ModalProvider. Modal state management will not work.');
    }
    return {
      isAnyModalOpen: false,
      openModal: () => {},
      closeModal: () => {},
    };
  }
  return context;
}
