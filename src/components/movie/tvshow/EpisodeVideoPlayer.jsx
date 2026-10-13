// src/components/tvshow/EpisodeVideoPlayer.jsx
// Wrapper tập phim: thêm next-episode, resume theo giây (chỉ khi đúng tập), lưu tiến độ theo GIÂY.
import React from "react";
import { useLocation } from "react-router-dom";
import VideoPlayer from "../player/VideoPlayer";
import NextEpisodeCountdown from "./NextEpisodeCountdown";
import playbackService from "../../../services/playbackService";
import tvShowService from "../../../services/tvShowService";
import episodeSubtitleService from "../../../services/episodeSubtitleService";
import useResumeOffer, { toResumeSeconds, toStartAt, resumeLog } from "../../../hooks/useResumeOffer";
import { flushEpisodeProgress } from "../../../services/watchProgressFlush";
import { C } from "../ui/movieConstants";

// Normalize bất kỳ TMDB size nào → w1280
const tmdbImg = (url) => (url ? url.replace(/\/t\/p\/[^/]+\//, "/t/p/w1280/") : url);

export default function EpisodeVideoPlayer({
  episode,
  tvShow,
  nextEpisode = null,
  onNextEpisode = null,
  isFreeUser = true,
  isLoggedIn = true,
}) {
  const location = useLocation();
  const resumeSeconds = toResumeSeconds({
    seconds:
      location.state?.resumeEpisodeId === episode?.id ? (location.state?.resumeSeconds ?? 0) : 0,
    completed: location.state?.isCompleted,
  });

  // Không có resume từ Lịch sử xem (hoặc sai tập) → hỏi server; player chỉ load sau khi có câu trả lời
  const { seconds: offer, loaded } = useResumeOffer({
    enabled: isLoggedIn && resumeSeconds === 0 && !!tvShow?.id && !!episode?.id,
    id: episode?.id,
    load: async () => {
      const res = await tvShowService.getWatchHistory();
      const list = Array.isArray(res) ? res : res?.data ?? [];
      const same = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();
      const h = list.find((x) => same(x.tvShowId, tvShow.id) && same(x.episodeId, episode.id));
      if (!h) {
        resumeLog("KHÔNG có bản ghi cho tập này", { tvShowId: tvShow.id, episodeId: episode.id, soBanGhi: list.length });
        return 0;
      }
      resumeLog("bản ghi tìm thấy", h);
      return toResumeSeconds({
        seconds: h.progressSeconds,
        totalSec: h.durationSeconds > 0 ? h.durationSeconds : (h.episodeRuntime ?? episode.runtime ?? 0) * 60,
        completed: h.isCompleted,
      }, "tập");
    },
  });

  // Tự phát tiếp (không popup), lùi vài giây cho người xem nhớ ngữ cảnh
  const startAt = toStartAt(resumeSeconds > 0 ? resumeSeconds : offer);

  return (
    <VideoPlayer
      key={episode?.id} // đổi tập → remount → lưu tiến độ tập cũ đúng
      playbackKey={loaded && tvShow?.id && episode?.id ? `${tvShow.id}:${episode.id}` : null} // chờ lịch sử xong mới load
      playbackLoader={() => playbackService.getEpisodePlayback(tvShow.id, episode.id)}
      adContent={{ type: "Episode", id: episode?.id, parentId: tvShow?.id }}
      isFreeUser={isFreeUser}
      subtitleService={episodeSubtitleService}
      subtitleOwnerId={episode?.id}
      backdropUrl={tmdbImg(episode?.stillUrl ?? tvShow?.backdropUrl ?? null)}
      accent={C.accent}
      fallbackDurationSec={episode?.runtime ? episode.runtime * 60 : 0}
      resumeSeconds={startAt}
      skipMarkers={episode}
      onHeartbeat={(secs) =>
        playbackService.sendEpisodeHeartbeat(tvShow.id, episode.id, secs)
      }
      onHeartbeatFlush={(secs) =>
        playbackService.flushEpisodeHeartbeat(tvShow.id, episode.id, secs)
      }
      onFlushProgress={({ seconds, completed, durationSeconds }) => {
        if (!isLoggedIn) return;
        flushEpisodeProgress({
          tvShowId: tvShow.id,
          episodeId: episode.id,
          seconds,
          durationSeconds,
          completed,
        });
      }}
      onSaveProgress={({ seconds, completed, durationSeconds }) =>
        tvShowService.updateWatchProgress({
          tvShowId: tvShow.id,
          episodeId: episode.id,
          progressSeconds: seconds,
          durationSeconds, // duration thật từ player (không dùng runtime TMDB)
          isCompleted: completed,
        })
      }
      renderOverlay={({ isAd, secondsLeft }) =>
        nextEpisode && onNextEpisode && !isAd ? (
          <NextEpisodeCountdown
            nextEpisode={nextEpisode}
            secondsLeft={secondsLeft}
            countdownSecs={10}
            onNext={onNextEpisode}
            onDismiss={() => {}}
          />
        ) : null
      }
    />
  );
}