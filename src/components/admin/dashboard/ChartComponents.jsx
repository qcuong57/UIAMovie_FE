// src/components/admin/dashboard/ChartComponents.jsx
import React from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { T, FONT_BODY as FONT, FONT_TITLE } from "../../../context/adminTokens";

export const AXIS_TICK = { fontFamily: FONT, fontSize: 11, fill: T.textMuted };

// ── Tooltip ────────────────────────────────────────────────────────────────────
export const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: T.text, borderRadius: 10, padding: "10px 14px",
      boxShadow: T.shadowLg, fontFamily: FONT, minWidth: 130,
    }}>
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", margin: "0 0 6px", fontWeight: 600 }}>
        {label ?? payload[0]?.payload?.label}
      </p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 14, marginBottom: 3 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>{p.name}</span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "#fff" }}>{Number(p.value).toLocaleString("vi-VN")}</span>
        </div>
      ))}
    </div>
  );
};

// ── Thanh ngang (thể loại, trạng thái…) ───────────────────────────────────────
// Nhãn đầy đủ nằm bên trái thay cho cột dọc bị cắt "Hành độ…"; chiều cao tự theo số hàng.
export const HBarChart = ({ data, name = "Số lượng", labelWidth = 112, rowHeight = 28 }) => (
  <ResponsiveContainer width="100%" height={Math.max(140, data.length * rowHeight + 16)}>
    <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 0 }} barCategoryGap="24%">
      <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
      <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
      <YAxis type="category" dataKey="label" width={labelWidth} tick={AXIS_TICK} axisLine={false} tickLine={false} interval={0} />
      <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
      <Bar dataKey="value" name={name} radius={[0, 4, 4, 0]}>
        {data.map((d) => <Cell key={d.label} fill={d.color} fillOpacity={0.88} />)}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

// ── Donut + chú giải có phần trăm ─────────────────────────────────────────────
export const GenreDonut = ({ slices }) => {
  const total = slices.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
        <PieChart width={132} height={132}>
          <Pie data={slices} dataKey="value" nameKey="label" cx={61} cy={61} innerRadius={42} outerRadius={60} strokeWidth={2} stroke={T.surface}>
            {slices.map((d) => <Cell key={d.label} fill={d.color} fillOpacity={0.9} />)}
          </Pie>
        </PieChart>
      </div>
      {slices.map((d) => (
        <div key={d.label} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
          padding: "7px 0", borderBottom: `1px solid ${T.border}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: d.color, flexShrink: 0 }} />
            <span style={{ fontFamily: FONT, fontSize: 12.5, color: T.textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {d.label}
            </span>
          </div>
          <span style={{ fontFamily: FONT_TITLE, fontSize: 13, fontWeight: 700, color: T.text, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
            {d.value}
            <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 11.5, color: T.textMuted, marginLeft: 6 }}>
              {Math.round((d.value / total) * 100)}%
            </span>
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Sao ───────────────────────────────────────────────────────────────────────
export const StarDisplay = ({ rating, max = 5, size = 11 }) => {
  const full = Math.floor(rating ?? 0);
  const half = (rating ?? 0) - full >= 0.5;
  return (
    <span role="img" aria-label={`${rating ?? 0} trên ${max} sao`} style={{ display: "inline-flex", gap: 1 }}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} aria-hidden="true" style={{
          fontSize: size,
          color: i < full || (i === full && half) ? "#F59E0B" : "#D1D5DB",
          opacity: i < full ? 1 : i === full && half ? 0.6 : 0.3,
        }}>★</span>
      ))}
    </span>
  );
};
