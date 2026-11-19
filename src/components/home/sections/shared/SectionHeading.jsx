// src/components/home/sections/shared/SectionHeading.jsx
// Tiêu đề section: y hệt MovieRow (vạch màu nhấn bên trái, subtitle mờ cạnh tên).
import React from 'react';
import { Sparkles } from 'lucide-react';
import SectionBadge from '../../SectionBadge';
import { C, FONT_DISPLAY } from '../../../../context/homeTokens';

export default function SectionHeading({ title, subtitle, accent, isMobile, right }) {
  return (
    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <h2
          style={{
            fontFamily: FONT_DISPLAY, fontSize: isMobile ? 15 : 20, fontWeight: 700, color: C.text,
            letterSpacing: '-0.01em', lineHeight: 1, borderLeft: `2.5px solid ${accent}`,
            paddingLeft: 11, margin: 0,
          }}
        >
          {title}
        </h2>
        {subtitle && !isMobile && (
          <SectionBadge icon={Sparkles} text={subtitle} color={accent} />
        )}
      </div>
      {right}
    </div>
  );
}
