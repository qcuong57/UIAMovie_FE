// src/components/tvshow/EpisodeVideoPlayer.jsx
// Wrapper tập phim: thêm next-episode, resume theo giây (chỉ khi đúng tập), lưu tiến độ theo GIÂY.
import React from "react";
import { useLocation } from "react-router-dom";
import VideoPlayer from "../player/VideoPlayer";
import NextEpisodeCountdown from "./NextEpisodeCountdown";
import playbackService from "../../../services/playbackService";
import tvShowService from "../../../services/tvShowService";
import episodeSubtitleService from "../../../services/episodeSubtitleService";
import { C } from "../ui/movieConstants";

// Normalize bất kỳ TMDB size nào → w1280
const tmdbImg = (url) => (url ? url.replace(/\/t\/p\/[^/]+\//, "/t/p/w1280/") : url);

export default function EpisodeVideoPlayer({
  episode,
  tvShow,
  nextEpisode = null,
  onNextEpisode = null,
  isFreeUser = true,
}) {
  const location = useLocation();
  const resumeSeconds =
    location.state?.resumeEpisodeId === episode?.id ? (location.state?.resumeSeconds ?? 0) : 0;

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
      resumeSeconds={resumeSeconds}
      skipMarkers={episode}
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