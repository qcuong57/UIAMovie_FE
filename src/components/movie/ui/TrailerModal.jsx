// src/components/movie/shared/TrailerModal.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { C } from './movieConstants';

const TrailerModal = ({ trailerKey, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClose}
    style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(12px)',
    }}
  >
    <motion.div
      initial={{ scale: 0.88, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      onClick={e => e.stopPropagation()}
      style={{
        width: '90vw', maxWidth: 960,
        aspectRatio: '16/9',
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: `0 40px 100px rgba(0,0,0,0.9), 0 0 0 1px ${C.border}`,
      }}
    >
      <iframe
        src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
        allow="autoplay; fullscreen"
        allowFullScreen
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        title="Trailer"
      />
      <button onClick={onClose}
        style={{
          position: 'absolute', top: 12, right: 12,
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(0,0,0,0.7)', border: `1px solid ${C.border}`,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff',
        }}>
        <X size={16} />
      </button>
    </motion.div>
  </motion.div>
);

export default TrailerModal;