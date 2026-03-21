// src/components/common/BackButton.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Nút quay lại dùng chung cho toàn app.
 *
 * Props:
 *  - label   {string}   — nhãn hiển thị, mặc định "Quay lại"
 *  - onClick {Function} — override hành động click (mặc định navigate(-1))
 *  - style   {object}   — style bổ sung nếu cần
 */
const BackButton = ({ label = 'Quay lại', onClick, style = {} }) => {
  const navigate = useNavigate();
  const handleClick = onClick ?? (() => navigate(-1));

  return (
    <motion.button
      whileHover={{ x: -2 }}
      whileTap={{ scale: 0.94 }}
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 16px',
        borderRadius: 40,
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.10)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        cursor: 'pointer',
        color: 'rgba(255,255,255,0.85)',
        outline: 'none',
        ...style,
      }}
    >
      <ChevronLeft size={16} color="currentColor" />
      <span
        style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: 13,
          fontWeight: 500,
          lineHeight: 1,
        }}
      >
        {label}
      </span>
    </motion.button>
  );
};

export default BackButton;