// src/components/ui/Input.jsx

import React, { useState } from 'react';
import { Search, X, Eye, EyeOff } from 'lucide-react';

/**
 * Input — text input và search bar
 *
 * @prop {'text'|'password'|'email'|'search'} type
 * @prop {string} label        — label hiện phía trên
 * @prop {string} placeholder
 * @prop {string} value
 * @prop {function} onChange   — callback(value: string)
 * @prop {function} onSearch   — callback(value) khi nhấn Enter hoặc icon search (chỉ dùng với type="search")
 * @prop {function} onClear    — callback khi bấm X xóa text
 * @prop {string} error        — message lỗi hiện phía dưới
 * @prop {ReactNode} icon      — icon bên trái (override mặc định)
 * @prop {'sm'|'md'|'lg'} size
 * @prop {boolean} disabled
 * @prop {string} className
 *
 * @example
 * // Search bar
 * <Input
 *   type="search"
 *   placeholder="Tìm phim..."
 *   value={query}
 *   onChange={setQuery}
 *   onSearch={handleSearch}
 * />
 *
 * // Password input
 * <Input type="password" label="Mật khẩu" value={pw} onChange={setPw} />
 *
 * // Input có lỗi
 * <Input label="Email" value={email} onChange={setEmail} error="Email không hợp lệ" />
 */

const sizeStyles = {
  sm: 'h-9 text-sm px-3',
  md: 'h-11 text-sm px-4',
  lg: 'h-13 text-base px-4',
};

const Input = ({
  type = 'text',
  label,
  placeholder,
  value = '',
  onChange,
  onSearch,
  onClear,
  error,
  icon,
  size = 'md',
  disabled = false,
  className = '',
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isSearch = type === 'search';
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : isSearch ? 'text' : type;

  const hasLeftIcon = isSearch || icon;
  const hasRightAction = isSearch || isPassword;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && isSearch) onSearch?.(value);
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-300">{label}</label>
      )}

      <div className="relative flex items-center">
        {/* Icon trái */}
        {hasLeftIcon && (
          <span className="absolute left-3 text-gray-400 pointer-events-none">
            {icon || <Search size={16} />}
          </span>
        )}

        <input
          type={inputType}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
          className={[
            'w-full rounded-lg bg-gray-800 border text-white placeholder-gray-500 outline-none transition-colors',
            error ? 'border-red-500 focus:border-red-400' : 'border-gray-700 focus:border-red-500',
            disabled ? 'opacity-50 cursor-not-allowed' : '',
            sizeStyles[size],
            hasLeftIcon ? 'pl-9' : '',
            hasRightAction ? 'pr-9' : '',
          ].join(' ')}
          {...rest}
        />

        {/* Icon phải */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-gray-400 hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}

        {isSearch && value && (
          <button
            type="button"
            onClick={() => { onChange?.(''); onClear?.(); }}
            className="absolute right-3 text-gray-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
};

export default Input;