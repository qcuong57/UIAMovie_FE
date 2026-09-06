// src/components/home/coming-soon/ComingSoonCard.jsx
import React from "react";
import MovieCard from "../../movie/MovieCard";
import { C } from "../../../context/homeTokens";
import { getReleaseLabel } from "../../../utils/releaseDateUtils";

export default function ComingSoonCard({ item, accentColor = C.gold, cardWidth }) {
  return (
    <MovieCard
      movie={item}
      variant="comingSoon"
      accentColor={accentColor}
      releaseLabel={getReleaseLabel(item)}
      cardWidth={cardWidth}
    />
  );
}