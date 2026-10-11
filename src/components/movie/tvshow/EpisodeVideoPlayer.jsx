// src/components/tvshow/EpisodeVideoPlayer.jsx
// Wrapper tập phim: thêm next-episode, resume theo giây (chỉ khi đúng tập), lưu tiến độ theo GIÂY.
import React from "react";
import { useLocation } from "react-router-dom";
import VideoPlayer from "../player/VideoPlayer";
import NextEpisodeCountdown from "./NextEpisodeCountdown";
import playbackService from "../../../services/playbackService";
import tvShowService from "../../../services/tvShowService";
import episodeSubtitleService from "../../../services/episodeSubtitleService";
import useResumeOffer, { toResumeSeconds, resumeLog } from "../../../hooks/useResumeOffer";
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

  // Không có resume từ Lịch sử xem (hoặc sai tập) → hỏi server, hiện popup "xem tiếp"
  const resumeOffer = useResumeOffer({
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
        totalSec: (h.episodeRuntime ?? episode.runtime ?? 0) * 60,
        completed: h.isCompleted,
      }, "tập");
    },
  });

  return (
    <VideoPlayer
      key={episode?.id} // đổi tập → remount → lưu tiến độ tập cũ đúng
      playbackKey={tvShow?.id && episode?.id ? `${tvShow.id}:${episode.id}` : null}
      playbackLoader={() => playbackService.getEpisodePlayback(tvShow.id, episode.id)}
      adContent={{ type: "Episode", id: episode?.id, parentId: tvShow?.id }}
      isFreeUser={isFreeUser}
      subtitleService={episodeSubtitleService}
      subtitleOwnerId={episode?.id}
      backdropUrl={tmdbImg(episode?.stillUrl ?? tvShow?.backdropUrl ?? null)}
      accent={C.accent}
      fallbackDurationSec={episode?.runtime ? episode.runtime * 60 : 0}
      resumeSeconds={0} // luôn để popup hỏi; vị trí do popup quyết định
      resumeOffer={resumeSeconds > 0 ? resumeSeconds : resumeOffer}
      skipMarkers={episode}
      onHeartbeat={(secs) =>
        playbackService.sendEpisodeHeartbeat(tvShow.id, episode.id, secs)
      }
      onHeartbeatFlush={(secs) =>
        playbackService.flushEpisodeHeartbeat(tvShow.id, episode.id, secs)
      }
      onSaveProgress={({ seconds, completed }) =>
        tvShowService.updateWatchProgress({
          tvShowId: tvShow.id,
          episodeId: episode.id,
          progressSeconds: seconds,
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