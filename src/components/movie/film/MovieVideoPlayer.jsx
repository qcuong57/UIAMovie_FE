// src/components/movie/film/MovieVideoPlayer.jsx
// Wrapper phim lẻ: chỉ khai báo khác biệt (nguồn playback, lưu tiến độ, resume + popup "xem tiếp").
import React from "react";
import { useLocation } from "react-router-dom";
import VideoPlayer from "../player/VideoPlayer";
import playbackService from "../../../services/playbackService";
import movieService from "../../../services/movieService";
import movieSubtitleService from "../../../services/movieSubtitleService";
import useResumeOffer, { toResumeSeconds, toStartAt, resumeLog, MIN_RESUME_SEC } from "../../../hooks/useResumeOffer";
import { flushMovieProgress } from "../../../services/watchProgressFlush";
import { C } from "../ui/movieConstants";

export default function MovieVideoPlayer({ movie, isFreeUser = true, isLoggedIn = true }) {
  const location = useLocation();
  // Đi từ trang Lịch sử xem: đã có vị trí → phát tiếp luôn, không hỏi
  const resumeSeconds = toResumeSeconds({
    seconds: location.state?.resumeSeconds ?? (location.state?.resumeMinutes ?? 0) * 60,
    completed: location.state?.isCompleted,
  });

  // Vào từ nơi khác: hỏi server xem user đã xem tới đâu; player chỉ load sau khi có câu trả lời
  const { seconds: offer, loaded } = useResumeOffer({
    enabled: isLoggedIn && resumeSeconds === 0 && !!movie?.id,
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

  // Tự phát tiếp (không popup), lùi vài giây cho người xem nhớ ngữ cảnh
  const startAt = toStartAt(resumeSeconds > 0 ? resumeSeconds : offer);

  return (
    <VideoPlayer
      key={movie?.id} // đổi phim → remount → lưu tiến độ phim cũ đúng
      playbackKey={loaded ? movie?.id ?? null : null} // chờ lịch sử xong mới load, tránh ghi đè tiến độ cũ
      playbackLoader={() => playbackService.getMoviePlayback(movie.id)}
      adContent={{ type: "Movie", id: movie?.id }}
      isFreeUser={isFreeUser}
      subtitleService={movieSubtitleService}
      subtitleOwnerId={movie?.id}
      backdropUrl={movie?.backdropUrl}
      accent={C.accent}
      fallbackDurationSec={movie?.duration ? movie.duration * 60 : 0}
      resumeSeconds={startAt}
      skipMarkers={movie}
      onHeartbeat={(secs) => playbackService.sendMovieHeartbeat(movie.id, secs)}
      onHeartbeatFlush={(secs) => playbackService.flushMovieHeartbeat(movie.id, secs)}
      onFlushProgress={({ seconds, completed, durationSeconds }) => {
        if (!isLoggedIn || (seconds < MIN_RESUME_SEC && !completed)) return;
        flushMovieProgress({
          movieId: movie.id,
          seconds,
          completed,
          durationSeconds: durationSeconds > 0 ? durationSeconds : movie.duration ? movie.duration * 60 : undefined,
        });
      }}
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