import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Modal, ModalType } from '@/components/ui/modal';

interface ModalContextType {
  alert: (message: string, title?: string) => void;
  confirm: (message: string, onConfirm: () => void, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: ModalType;
    onConfirm?: () => void;
    showCancel?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showModal = (
    title: string,
    message: string,
    type: ModalType = 'info',
    onConfirm?: () => void,
    showCancel: boolean = false
  ) => {
    setModalState({
      isOpen: true,
      title,
      message,
      type,
      onConfirm,
      showCancel,
    });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const alert = (message: string, title: string = 'Alert') => {
    showModal(title, message, 'info');
  };

  const confirm = (message: string, onConfirm: () => void, title: string = 'Confirm') => {
    showModal(title, message, 'warning', onConfirm, true);
  };

  const success = (message: string, title: string = 'Success') => {
    showModal(title, message, 'success');
  };

  const error = (message: string, title: string = 'Error') => {
    showModal(title, message, 'error');
  };

  const warning = (message: string, title: string = 'Warning') => {
    showModal(title, message, 'warning');
  };

  const info = (message: string, title: string = 'Information') => {
    showModal(title, message, 'info');
  };

  return (
    <ModalContext.Provider value={{ alert, confirm, success, error, warning, info }}>
      {children}
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onConfirm={modalState.onConfirm}
        showCancel={modalState.showCancel}
      />
    </ModalContext.Provider>
  );
};

export const useGlobalModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useGlobalModal must be used within ModalProvider');
  }
  return context;
};

// Override native alert and confirm (optional - for legacy code)
export const overrideNativeDialogs = (modalContext: ModalContextType) => {
  if (typeof window !== 'undefined') {
    // Store original functions
    const originalAlert = window.alert;
    const originalConfirm = window.confirm;

    // Override alert
    window.alert = (message?: any) => {
      modalContext.alert(String(message || ''));
    };

    // Override confirm (returns Promise for async handling)
    const confirmOverride = (message?: string): boolean => {
      // This is a synchronous fallback - use modalContext.confirm for async
      console.warn('Native confirm() called. Use useGlobalModal().confirm() instead for better UX');
      return originalConfirm(message);
    };
    
    // Add async confirm method
    (window as any).confirmAsync = (message: string): Promise<boolean> => {
      return new Promise((resolve) => {
        modalContext.confirm(
          message,
          () => resolve(true),
          'Confirm'
        );
        // Note: This doesn't handle cancel - you should use the hook directly
      });
    };

    // Return cleanup function
    return () => {
      window.alert = originalAlert;
      window.confirm = originalConfirm;
      delete (window as any).confirmAsync;
    };
  }
};
