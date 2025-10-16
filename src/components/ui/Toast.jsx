import { useEffect } from "react";

// display temp message when user add videos in My Videos
const Toast = ({ id, message, duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <div className="bg-slate-800 text-white px-4 py-2 rounded shadow-lg mb-2 animate-slide-in max-w-xs break-words">
      {message}
    </div>
  );
};

// position temp message bottom right
export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end space-y-2 z-50">
      {toasts.map((t) => (
        <Toast
          key={t.id}
          id={t.id}
          message={t.message}
          duration={t.duration}
          onClose={removeToast}
        />
      ))}
    </div>
  );
};
