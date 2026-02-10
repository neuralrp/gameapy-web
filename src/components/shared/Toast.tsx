import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
}

export function Toast({ message, type, show }: ToastProps) {
  useEffect(() => {
    const toastElement = document.querySelector('.toast');
    if (toastElement) {
      if (show) {
        toastElement.classList.add('show');
      } else {
        toastElement.classList.remove('show');
      }
    }
  }, [show]);

  return (
    <div className={`toast ${type}`}>
      {message}
    </div>
  );
}
