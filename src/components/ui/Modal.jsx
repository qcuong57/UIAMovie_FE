// src/components/ui/Modal.jsx

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Modal — dialog overlay tái sử dụng
 *
 * @prop {boolean} isOpen
 * @prop {function} onClose
 * @prop {string} title
 * @prop {ReactNode} children     — nội dung body
 * @prop {ReactNode} footer       — nội dung footer (nút action...)
 * @prop {'sm'|'md'|'lg'|'xl'|'full'} size
 * @prop {boolean} closeOnOverlay — click ngoài để đóng (default: true)
 * @prop {boolean} showCloseBtn   — hiện nút X góc trên phải (default: true)
 *
 * @example
 * // Confirm dialog
 * <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="Xác nhận xóa?" size="sm"
 *   footer={
 *     <>
 *       <Button variant="ghost" onClick={() => setShowConfirm(false)}>Hủy</Button>
 *       <Button variant="danger" onClick={handleDelete}>Xóa</Button>
 *     </>
 *   }
 * >
 *   Bạn có chắc muốn xóa phim này khỏi danh sách?
 * </Modal>
 *
 * // Trailer modal
 * <Modal isOpen={showTrailer} onClose={closeTrailer} title="Trailer" size="xl">
 *   <iframe src={trailerUrl} ... />
 * </Modal>
 */

const sizeStyles = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-3xl',
  full: 'max-w-screen-xl mx-4',
};

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlay = true,
  showCloseBtn = true,
}) => {
  // Đóng bằng ESC
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Khóa scroll khi modal mở
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeOnOverlay ? onClose : undefined}
          />

          {/* Panel */}
          <motion.div
            className={[
              'relative z-10 w-full bg-gray-900 border border-gray-700 rounded-xl shadow-2xl flex flex-col',
              sizeStyles[size],
            ].join(' ')}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || showCloseBtn) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
                {title && (
                  <h2 className="text-lg font-bold text-white">{title}</h2>
                )}
                {showCloseBtn && (
                  <button
                    onClick={onClose}
                    className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="px-6 py-5 text-gray-300 overflow-y-auto">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-700">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;