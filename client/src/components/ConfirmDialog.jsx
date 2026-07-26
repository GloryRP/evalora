/**
 * ConfirmDialog - Reusable styled confirmation modal
 * Replaces window.confirm() across all admin pages
 */
import { AlertTriangle, Trash2 } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',  // 'danger' | 'warning'
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
        style={{ animation: 'confirmPop .22s cubic-bezier(.34,1.56,.64,1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Icon */}
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isDanger ? 'bg-red-50' : 'bg-amber-50'}`}>
          {isDanger
            ? <Trash2 size={28} className="text-red-500" />
            : <AlertTriangle size={28} className="text-amber-500" />}
        </div>

        {/* Text */}
        <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">{title}</h3>
        <p className="text-sm text-[#5C5C5C] mb-6 leading-relaxed">{message}</p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-[#5C5C5C] hover:bg-gray-50 transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition ${isDanger ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes confirmPop {
          from { opacity: 0; transform: scale(0.88) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ConfirmDialog;
