// src/components/movie/film/MovieVideoPlayer.jsx
// Wrapper phim lẻ: chỉ khai báo khác biệt (nguồn playback, lưu tiến độ, resume + popup "xem tiếp").
import React from "react";
import { useLocation } from "react-router-dom";
import VideoPlayer from "../player/VideoPlayer";
import playbackService from "../../../services/playbackService";
import movieService from "../../../services/movieService";
import movieSubtitleService from "../../../services/movieSubtitleService";
import useResumeOffer, { toResumeSeconds, resumeLog, MIN_RESUME_SEC } from "../../../hooks/useResumeOffer";
import { C } from "../ui/movieConstants";

export default function MovieVideoPlayer({ movie, isFreeUser = true, isLoggedIn = true }) {
  const location = useLocation();
  // Đi từ trang Lịch sử xem: đã có vị trí → phát tiếp luôn, không hỏi
  const resumeSeconds = toResumeSeconds({
    seconds: location.state?.resumeSeconds ?? (location.state?.resumeMinutes ?? 0) * 60,
    completed: location.state?.isCompleted,
  });

  // Vào từ nơi khác: hỏi server xem user đã xem tới đâu rồi mới hiện popup
  const resumeOffer = useResumeOffer({
    enabled: isLoggedIn && !!movie?.id, // luôn lấy từ server để có số giây chính xác
    id: movie?.id,
    load: async () => {
      const res = await movieService.getWatchHistory();
      const list = Array.isArray(res) ? res : res?.data ?? [];
      const h = list.find((x) => String(x.movieId).toLowerCase() === String(movie.id).toLowerCase());
      if (!h) {
        resumeLog("KHÔNG có bản ghi cho phim này", { movieId: movie.id, soBanGhi: list.length, mau: list.slice(0, 3).map((x) => x.movieId) });
        return 0;
      }
      resumeLog("bản ghi tìm thấy", h);
      return toResumeSeconds({
        seconds: h.progressSeconds > 0 ? h.progressSeconds : (h.progressMinutes ?? 0) * 60,
        // ưu tiên thời lượng phim (phút → giây); h.duration có thể sai đơn vị ở bản ghi cũ
        totalSec: movie.duration ? movie.duration * 60 : h.duration ?? 0,
        completed: h.isCompleted,
      }, "phim");
    },
  });

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
      resumeSeconds={0} // luôn để popup hỏi; vị trí do popup quyết định
      resumeOffer={resumeOffer > 0 ? resumeOffer : resumeSeconds}
      skipMarkers={movie}
      onHeartbeat={(secs) => playbackService.sendMovieHeartbeat(movie.id, secs)}
      onHeartbeatFlush={(secs) => playbackService.flushMovieHeartbeat(movie.id, secs)}
      onSaveProgress={({ seconds, completed, durationSeconds }) => {
        // Lưu theo giây (trước đây làm tròn xuống phút → resume lệch tới 59s)
        if (seconds < MIN_RESUME_SEC && !completed) return;
        return movieService.updateWatchProgress(movie.id, Math.floor(seconds / 60), completed, {
          progressSeconds: Math.floor(seconds),
          // ưu tiên thời lượng video thật từ player; fallback runtime TMDB
          durationSeconds:
            durationSeconds > 0 ? durationSeconds : movie.duration ? movie.duration * 60 : undefined,
        });
      }}
    />
  );
}