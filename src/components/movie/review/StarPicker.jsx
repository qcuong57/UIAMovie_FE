// src/components/movie/shared/review/StarPicker.jsx
import React, { useState } from "react";
import {
  Star,
} from "lucide-react";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { C, FONT_TITLE } from "../../../context/homeTokens";
import { ratingWord } from "./reviewUtils";

// ── StarPicker ─────────────────────────────────────────────────────────────
const StarPicker = ({ value, onChange }) => {
  const isMobile = useIsMobile();
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;
  const size = isMobile ? 22 : 26;
  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Điểm đánh giá"
        style={{ display: "flex", gap: isMobile ? 0 : 2, marginLeft: -3 }}
        onMouseLeave={() => setHovered(0)}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} điểm`}
            className="rv-star"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHovered(n)}
          >
            <Star
              size={size}
              style={{
                color: n <= shown ? C.gold : "rgba(255,255,255,0.18)",
                fill: n <= shown ? C.gold : "none",
                transition: "color .1s, fill .1s",
              }}
            />
          </button>
        ))}
      </div>
      <p style={{ height: 20, marginTop: 6, fontSize: 13, color: C.textDim }}>
        {shown > 0 ? (
          <>
            <b style={{ fontFamily: FONT_TITLE, color: C.gold }}>{shown}/10</b>&nbsp;{" "}
            {ratingWord(shown)}
          </>
        ) : (
          "Chọn điểm từ 1 đến 10"
        )}
      </p>
    </div>
  );
};

export default StarPicker;
