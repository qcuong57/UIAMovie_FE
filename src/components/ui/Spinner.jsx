// src/components/ui/Spinner.jsx

import React from "react";
import { motion } from "framer-motion";

/**
 * Spinner — loading indicator
 *
 * @prop {'sm'|'md'|'lg'} size
 * @prop {'red'|'white'|'gray'} color
 * @prop {boolean} fullScreen  — căn giữa toàn màn hình
 * @prop {string} className
 *
 * @example
 * // Inline
 * <Spinner size="sm" color="white" />
 *
 * // Full page loading
 * <Spinner fullScreen />
 */

const sizeStyles = {
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-3",
  lg: "w-12 h-12 border-4",
};

const colorStyles = {
  red: "border-red-600 border-t-transparent",
  white: "border-white border-t-transparent",
  gray: "border-gray-400 border-t-transparent",
};

const Spinner = ({
  size = "md",
  color = "red",
  fullScreen = false,
  className = "",
}) => {
  const spinner = (
    <motion.div
      className={[
        "rounded-full",
        sizeStyles[size],
        colorStyles[color],
        className,
      ].join(" ")}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
    />
  );

  if (fullScreen) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default Spinner;
