// src/components/movie/film/MovieVideoPlayer.jsx
// Wrapper phim lẻ: chỉ khai báo khác biệt (nguồn playback, lưu tiến độ theo PHÚT, resume theo phút).
import React from "react";
import { useLocation } from "react-router-dom";
import VideoPlayer from "../player/VideoPlayer";
import playbackService from "../../../services/playbackService";
import movieService from "../../../services/movieService";
import movieSubtitleService from "../../../services/movieSubtitleService";
import { C } from "../ui/movieConstants";

export default function MovieVideoPlayer({ movie, isFreeUser = true }) {
  const location = useLocation();
  const resumeSeconds = (location.state?.resumeMinutes ?? 0) * 60;

  return (
    <VideoPlayer
      key={movie?.id} // đổi phim → remount → lưu tiến độ phim cũ đúng
      playbackKey={movie?.id ?? null}
      playbackLoader={() => playbackService.getMoviePlayback(movie.id)}
      adContent={{ type: "Movie", id: movie?.id }}
      isFreeUser={isFreeUser}
      subtitleService={movieSubtitleService}
      subtitleOwnerId={movie?.id}
      backdropUrl={movie?.backdropUrl}
      accent={C.accent}
      fallbackDurationSec={movie?.duration ? movie.duration * 60 : 0}
      resumeSeconds={resumeSeconds}
      skipMarkers={movie}
      onSaveProgress={({ seconds, completed }) => {
        const mins = Math.floor(seconds / 60); // API phim lưu theo phút
        if (mins < 1) return;
        return movieService.updateWatchProgress(movie.id, mins, completed);
      }}
    />
  );
}