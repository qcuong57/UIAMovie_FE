// src/components/ui/Button.jsx

import React from 'react';
import { motion } from 'framer-motion';
import Spinner from './Spinner';

/**
 * Button — reusable button component
 *
 * @prop {'primary'|'secondary'|'ghost'|'danger'} variant
 * @prop {'sm'|'md'|'lg'} size
 * @prop {boolean} loading     — hiện spinner, disable click
 * @prop {boolean} disabled
 * @prop {ReactNode} icon      — icon bên trái label
 * @prop {boolean} iconRight   — đẩy icon sang phải
 * @prop {string} className    — override class nếu cần
 * @prop {function} onClick
 * @prop {ReactNode} children
 *
 * @example
 * <Button variant="primary" size="md" icon={<Play size={16} />} onClick={handlePlay}>
 *   Play
 * </Button>
 */

const variantStyles = {
  primary:   'bg-white text-black hover:bg-gray-200',
  secondary: 'bg-white/20 text-white hover:bg-white/30 border border-white/30',
  ghost:     'bg-transparent text-gray-300 hover:text-white hover:bg-white/10',
  danger:    'bg-red-600 text-white hover:bg-red-700',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-6 py-2.5 text-sm gap-2',
  lg: 'px-8 py-3 text-base gap-2',
};

const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconRight = false,
  className = '',
  onClick,
  children,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      onClick={onClick}
      disabled={isDisabled}
      whileHover={!isDisabled ? { scale: 1.05 } : {}}
      whileTap={!isDisabled ? { scale: 0.95 } : {}}
      className={[
        'inline-flex items-center justify-center font-bold rounded-lg transition-colors',
        variantStyles[variant],
        sizeStyles[size],
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        className,
      ].join(' ')}
      {...rest}
    >
      {loading && <Spinner size="sm" />}
      {!loading && icon && !iconRight && icon}
      {children}
      {!loading && icon && iconRight && icon}
    </motion.button>
  );
};

export default Button;