// src/components/admin/dashboard/GenreDonutCard.jsx
import React, { useState } from "react";
import { ACCENT, ACCENT4 } from "../../../context/adminTokens";
import { GenreDonut } from "./ChartComponents";
import { Card } from "./Card";

/** Thể loại + Free/Premium. Nhận SỐ ĐẾM (không nhận cả mảng phim) nên card không phụ thuộc kích thước dữ liệu. */
export const GenreDonutCard = ({
  donutSlices, movieCount, showCount, moviePremiumCount, showPremiumCount,
  loading, error, onRetry,
}) => {
  const [tab, setTab] = useState("genres");

  const premiumSlices = [
    { label: "Phim Free", value: movieCount - moviePremiumCount, color: ACCENT },
    { label: "Phim Premium", value: moviePremiumCount, color: "#a7f3d0" },
    { label: "Show Free", value: showCount - showPremiumCount, color: ACCENT4 },
    { label: "Show Premium", value: showPremiumCount, color: "#FDE68A" },
  ].filter((s) => s.value > 0);

  const slices = tab === "genres" ? donutSlices : premiumSlices;

  return (
    <Card
      title="Cơ cấu nội dung"
      loading={loading}
      error={error}
      onRetry={onRetry}
      skeletonRows={6}
      isEmpty={slices.length === 0}
      tabs={[
        { key: "genres", label: "Thể loại", count: donutSlices.length },
        { key: "premium", label: "Free / Premium", count: premiumSlices.length },
      ]}
      activeTab={tab}
      onTabChange={setTab}
    >
      <GenreDonut slices={slices} />
    </Card>
  );
};
