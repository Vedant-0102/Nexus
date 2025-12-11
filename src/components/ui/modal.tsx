import React from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { Button } from './button';

export type ModalType = 'info' | 'success' | 'warning' | 'error';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  showCancel?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  showCancel = false,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-green-500" size={48} />;
      case 'warning':
        return <AlertTriangle className="text-yellow-500" size={48} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={48} />;
      default:
        return <Info className="text-blue-500" size={48} />;
    }
  };

  const getHeaderColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-4 border-b ${getHeaderColor()}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getIcon()}
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          {showCancel && (
            <Button onClick={onClose} variant="outline">
              {cancelText}
            </Button>
          )}
          <Button onClick={handleConfirm} className="min-w-[80px]">
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Hook for easy modal usage
export const useModal = () => {
  const [modalState, setModalState] = React.useState<{
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

  return {
    modalState,
    closeModal,
    alert,
    confirm,
    success,
    error,
    Modal: () => (
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onConfirm={modalState.onConfirm}
        showCancel={modalState.showCancel}
      />
    ),
  };
};
