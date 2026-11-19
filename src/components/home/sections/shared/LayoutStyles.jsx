// src/components/home/sections/shared/LayoutStyles.jsx
// CSS dùng chung cho các layout (focus ring, hover hàng, ẩn thanh cuộn). Biến --hsl-accent do từng section đặt.
import React from 'react';

const CSS = `
.hsl-link{outline:none}
.hsl-link:focus-visible{outline:2px solid var(--hsl-accent,#fff);outline-offset:3px}
.hsl-row{transition:background .2s ease}
.hsl-row:hover,.hsl-row:focus-visible,.hsl-row[aria-current="true"]{background:rgba(255,255,255,.08)}
.hsl-rail{scrollbar-width:none;-ms-overflow-style:none}
.hsl-rail::-webkit-scrollbar{display:none}
`;

export default function LayoutStyles() {
  return <style>{CSS}</style>;
}
