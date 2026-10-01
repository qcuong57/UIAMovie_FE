// src/components/movie/shared/review/EpisodeSelector.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
} from "lucide-react";
import { C } from "../../../context/homeTokens";
import { epLabelOf } from "./reviewUtils";

// ── EpisodeSelector ────────────────────────────────────────────────────────
// episodes = [{ id, seasonNumber, episodeNumber, title }]
const EpisodeSelector = ({ episodes, selectedId, onSelect }) => {
  const [open, setOpen] = useState(false);
  const selected = episodes.find((e) => e.id === selectedId);

  // Group by season
  const seasons = episodes.reduce((acc, ep) => {
    const s = ep.seasonNumber ?? 1;
    if (!acc[s]) acc[s] = [];
    acc[s].push(ep);
    return acc;
  }, {});

  return (
    <div style={{ position: "relative", marginBottom: 12 }}>
      <button
        type="button"
        className="rv-field"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          borderRadius: 12,
          cursor: "pointer",
          color: selected ? C.text : C.textDim,
          fontSize: 14,
          textAlign: "left",
        }}
      >
        <span>
          {selected ? epLabelOf(selected) : "Chọn tập bạn muốn đánh giá"}
        </span>
        <ChevronDown
          size={16}
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
            flexShrink: 0,
            color: C.textDim,
          }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              zIndex: 50,
              background: C.card,
              border: `1px solid ${C.borderBright}`,
              borderRadius: 12,
              maxHeight: 260,
              overflowY: "auto",
              padding: "4px 0",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            }}
          >
            {Object.entries(seasons).map(([seasonNum, eps]) => (
              <div key={seasonNum}>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.textDim,
                    padding: "8px 16px 4px",
                  }}
                >
                  Phần {seasonNum}
                </p>
                {eps.map((ep) => (
                  <button
                    key={ep.id}
                    type="button"
                    role="option"
                    aria-selected={ep.id === selectedId}
                    onClick={() => {
                      onSelect(ep.id);
                      setOpen(false);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 16px",
                      background: ep.id === selectedId ? C.accentSoft : "none",
                      border: "none",
                      cursor: "pointer",
                      color: ep.id === selectedId ? C.accent : C.textSub,
                      fontSize: 13.5,
                    }}
                    onMouseEnter={(e) => {
                      if (ep.id !== selectedId)
                        e.currentTarget.style.background =
                          "rgba(255,255,255,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      if (ep.id !== selectedId)
                        e.currentTarget.style.background = "none";
                    }}
                  >
                    <span style={{ fontWeight: 700, marginRight: 8 }}>
                      E{ep.episodeNumber}
                    </span>
                    {ep.title || `Tập ${ep.episodeNumber}`}
                  </button>
                ))}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EpisodeSelector;
