import { useEffect } from "react";

// display temp message when user add videos in My Videos
const Toast = ({ id, message, Icon, iconColour, duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <div className="bg-slate-900/95 text-slate-50 px-4 py-2 sm:px-5 sm:py-3 rounded-lg shadow-lg mb-2 animate-slide-in max-w-xs sm:max-w-sm md:max-w-md w-full break-words flex items-center justify-between gap-3">
      <span className="text-sm sm:text-base leading-snug flex-1">{message}</span>
      {Icon && <Icon className={`size-5 sm:size-6 ${iconColour}`} />}
    </div>
  );
};

// position temp message bottom right
export const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed bottom-6 left-6 flex flex-col items-end space-y-2 z-50">
            {toasts.map((t) => (
        <Toast
          key={t.id}
          id={t.id}
          message={t.message}
          duration={t.duration}
          onClose={removeToast}
          Icon={t.Icon}
          iconColour={t.iconColour}
        />
      ))}
    </div>
  );
};
