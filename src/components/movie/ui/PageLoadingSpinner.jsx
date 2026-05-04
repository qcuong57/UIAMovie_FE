// src/components/movie/ui/PageLoadingSpinner.jsx
import React from "react";
import { motion } from "framer-motion";
import { C, GLOBAL_STYLES } from "./movieConstants";

/**
 * PageLoadingSpinner — spinner full-screen dùng khi trang đang fetch dữ liệu.
 * Dùng thay cho khối loading inline trong MovieDetailPage / TvShowDetailPage.
 */
const PageLoadingSpinner = () => (
  <div
    style={{
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: C.bg,
    }}
  >
    <style>{GLOBAL_STYLES}</style>
    <motion.div
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        border: `3px solid ${C.accent}`,
        borderTopColor: "transparent",
      }}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.85, ease: "linear" }}
    />
  </div>
);

export default PageLoadingSpinner;