// src/components/ui/Badge.jsx

import React from 'react';
import { X } from 'lucide-react';

/**
 * Badge — label nhỏ dùng cho genre, status, tag...
 *
 * @prop {string} label
 * @prop {'default'|'primary'|'success'|'warning'|'danger'} variant
 * @prop {'sm'|'md'} size
 * @prop {boolean} removable  — hiện nút X để xóa
 * @prop {function} onRemove  — callback khi bấm X
 * @prop {string} className
 *
 * @example
 * // Genre tag
 * <Badge label="Action" variant="default" />
 *
 * // Removable filter tag
 * <Badge label="Horror" removable onRemove={() => removeGenre('Horror')} />
 *
 * // Status badge
 * <Badge label="Now Streaming" variant="success" />
 */

const variantStyles = {
  default: 'bg-gray-700/60 text-gray-300',
  primary: 'bg-red-600/20 text-red-400 border border-red-600/30',
  success: 'bg-green-600/20 text-green-400 border border-green-600/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  danger:  'bg-red-900/40 text-red-300 border border-red-700/30',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

const Badge = ({
  label,
  variant = 'default',
  size = 'sm',
  removable = false,
  onRemove,
  className = '',
}) => {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full font-medium',
        variantStyles[variant],
        sizeStyles[size],
        className,
      ].join(' ')}
    >
      {label}
      {removable && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
          className="hover:text-white transition-colors ml-0.5"
        >
          <X size={10} strokeWidth={3} />
        </button>
      )}
    </span>
  );
};

export default Badge;