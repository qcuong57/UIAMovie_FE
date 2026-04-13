// src/pages/MovieDetailPage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipForward,
  SkipBack,
  Info,
  Star,
  Calendar,
  Clock,
  Award,
} from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import movieService from "../../services/movieService";
import PersonScrollRow from "../../components/movie/Personscrollrow";
import ReviewSection from "../../components/movie/Reviewsection";
import BackButton from "../../components/common/BackButton";

// ── Shared components ──────────────────────────────────────────
import {
  C,
  toSlug,
  GLOBAL_STYLES,
} from "../../components/movie/ui/movieConstants";
import SectionTitle from "../../components/movie/ui/SectionTitle";
import StatPill from "../../components/movie/ui/StatPill";
import StarRating from "../../components/movie/ui/StarRating";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

// ── PersonCard — chữ nhật kiểu TMDB ────────────────────────────
const PersonCard = ({ person, isDirector = false }) => {
  const [err, setErr] = useState(false);
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 340, damping: 26 }}
      onClick={() =>
        person.name &&
        navigate(`/person/${toSlug(person.name)}`, { state: { actor: person } })
      }
      style={{
        width: 140,
        flexShrink: 0,
        borderRadius: 10,
        overflow: "hidden",
        background: C.card,
        border: `1px solid ${C.borderBright}`,
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        cursor: person.name ? "pointer" : "default",
      }}
    >
      {/* Ảnh — tỉ lệ 2:3 như TMDB */}
      <div
        style={{
          width: "100%",
          aspectRatio: "2/3",
          background: "#1a1a1a",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {person.profileUrl && !err ? (
          <img
            src={person.profileUrl}
            alt={person.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 15%",
            }}
            onError={() => setErr(true)}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: C.surfaceMid,
            }}
          >
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" fill="#3a3a3a" />
              <path
                d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
                stroke="#3a3a3a"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "12px 12px 14px" }}>
        <p
          style={{
            fontFamily: "'Nunito',sans-serif",
            fontSize: 13,
            fontWeight: 700,
            color: C.text,
            lineHeight: 1.35,
            marginBottom: 4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {person.name || "Chưa có tên"}
        </p>

        {isDirector ? (
          <p
            style={{
              fontFamily: "'Nunito',sans-serif",
              fontSize: 11.5,
              color: C.textSub,
              fontStyle: "italic",
            }}
          >
            Đạo diễn
          </p>
        ) : person.character ? (
          <p
            style={{
              fontFamily: "'Nunito',sans-serif",
              fontSize: 11.5,
              color: C.textSub,
              fontStyle: "italic",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.4,
            }}
          >
            {person.character}
          </p>
        ) : null}
      </div>
    </motion.div>
  );
};

// ── VideoPlayer ─────────────────────────────────────────────────
const VideoPlayer = ({ movie }) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const videoRef = useRef(null);
  const wrapRef = useRef(null);
  const timerRef = useRef(null);
  const saveTimerRef = useRef(null);
  const progressRef = useRef(0);
  const hasResumedRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [duration, setDuration] = useState(0);
  const [show, setShow] = useState(true);
  const [vol, setVol] = useState(80);
  const [selSrc, setSelSrc] = useState(0);

  const resumeMinutes = location.state?.resumeMinutes ?? 0;

  const videoSources = React.useMemo(() => {
    if (!movie?.videos?.length) return [];
    const main = movie.videos.filter((v) => v.videoType === "main");
    const other = movie.videos.filter((v) => v.videoType !== "main");
    return [...main, ...other];
  }, [movie?.videos]);

  const videoUrl = videoSources[selSrc]?.videoUrl ?? null;
  const totalSec = duration || (movie?.duration ? movie.duration * 60 : 0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    setPlaying(false);
    setProgress(0);
    hasResumedRef.current = false;
    v.load();
  }, [videoUrl]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onTimeUpdate = () => {
      if (!v.duration) return;
      const pct = (v.currentTime / v.duration) * 100;
      setProgress(pct);
      progressRef.current = pct;
    };
    const onDurationChange = () => setDuration(v.duration || 0);
    const onProgress = () => {
      if (!v.duration || !v.buffered.length) return;
      setBuffered((v.buffered.end(v.buffered.length - 1) / v.duration) * 100);
    };
    const onEnded = () => {
      setPlaying(false);
      setShow(true);
      saveProgress(100, true);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onCanPlay = () => {
      if (hasResumedRef.current) return;
      if (resumeMinutes > 0) v.currentTime = resumeMinutes * 60;
      hasResumedRef.current = true;
    };

    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("durationchange", onDurationChange);
    v.addEventListener("progress", onProgress);
    v.addEventListener("ended", onEnded);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("canplay", onCanPlay);

    return () => {
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("durationchange", onDurationChange);
      v.removeEventListener("progress", onProgress);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("canplay", onCanPlay);
    };
  }, [videoUrl, resumeMinutes]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = muted ? 0 : vol / 100;
    v.muted = muted;
  }, [vol, muted]);

  const resetTimer = useCallback(() => {
    setShow(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShow(false);
    }, 3500);
  }, []);

  const saveProgress = useCallback(
    (pct, forceComplete = false) => {
      if (!movie?.id || pct < 1) return;
      const mins = Math.floor(
        ((pct / 100) * (videoRef.current?.duration ?? totalSec)) / 60,
      );
      movieService
        .updateWatchProgress(movie.id, mins, forceComplete || pct >= 95)
        .catch((e) => console.warn("[VideoPlayer] saveProgress:", e));
    },
    [movie?.id, totalSec],
  );

  useEffect(() => {
    if (!playing) {
      clearInterval(saveTimerRef.current);
      return;
    }
    saveTimerRef.current = setInterval(
      () => saveProgress(progressRef.current),
      30_000,
    );
    return () => clearInterval(saveTimerRef.current);
  }, [playing, saveProgress]);

  useEffect(
    () => () => {
      if (progressRef.current > 1 && movie?.id)
        movieService
          .updateWatchProgress(
            movie.id,
            Math.floor(((progressRef.current / 100) * totalSec) / 60),
            progressRef.current >= 95,
          )
          .catch(() => {});
    },
    [movie?.id],
  );

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  };
  const seek = (e) => {
    const v = videoRef.current;
    if (!v) return;
    const r = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - r.left) / r.width) * v.duration;
  };
  const skipSec = (sec) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + sec));
  };
  const toggleFullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    document.fullscreenElement
      ? document.exitFullscreen()
      : el.requestFullscreen?.();
  };

  // Local format: giây → H:MM:SS (khác với fmt trong movieConstants)
  const fmtSecs = (s) => {
    const h = Math.floor(s / 3600);
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(Math.floor(s % 60)).padStart(2, "0");
    return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`;
  };
  const curSec = Math.floor((progress / 100) * totalSec);

  if (!videoUrl)
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          borderRadius: 12,
          overflow: "hidden",
          aspectRatio: "16/9",
          background: "#111",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        {movie?.backdropUrl && (
          <img
            src={movie.backdropUrl}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.25,
              filter: "blur(4px)",
            }}
          />
        )}
        <div style={{ position: "relative", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🎬</div>
          <p
            style={{
              fontFamily: "'Nunito',sans-serif",
              fontSize: 15,
              fontWeight: 700,
              color: "rgba(255,255,255,0.7)",
              marginBottom: 6,
            }}
          >
            Chưa có video
          </p>
          <p
            style={{
              fontFamily: "'Nunito',sans-serif",
              fontSize: 12,
              color: "rgba(255,255,255,0.35)",
            }}
          >
            Admin cần upload video cho phim này
          </p>
        </div>
      </div>
    );

  return (
    <div
      ref={wrapRef}
      style={{
        position: "relative",
        width: "100%",
        borderRadius: 12,
        overflow: "hidden",
        aspectRatio: "16/9",
        background: "#000",
        cursor: show ? "default" : "none",
      }}
      onMouseMove={resetTimer}
      onMouseLeave={() => !videoRef.current?.paused && setShow(false)}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        preload="metadata"
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
        onClick={togglePlay}
      />

      {!playing && progress === 0 && movie?.backdropUrl && (
        <img
          src={movie.backdropUrl}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.5,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Center play button */}
      <AnimatePresence>
        {!playing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.28)",
              pointerEvents: "none",
            }}
          >
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              onClick={togglePlay}
              style={{
                width: 68,
                height: 68,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.95)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                pointerEvents: "all",
              }}
            >
              <Play
                size={28}
                fill="#000"
                color="#000"
                style={{ marginLeft: 3 }}
              />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls overlay */}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "0 20px 16px",
              background: "linear-gradient(transparent, rgba(0,0,0,0.9) 60%)",
            }}
          >
            {/* Seek bar */}
            <div
              style={{
                marginBottom: 12,
                position: "relative",
                height: 4,
                cursor: "pointer",
                paddingTop: 8,
                paddingBottom: 8,
                marginTop: -8,
                boxSizing: "content-box",
              }}
              onClick={seek}
            >
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 0,
                  right: 0,
                  height: 3,
                  marginTop: -1.5,
                  borderRadius: 2,
                  background: "rgba(255,255,255,0.15)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 0,
                  height: 3,
                  marginTop: -1.5,
                  width: `${buffered}%`,
                  borderRadius: 2,
                  background: "rgba(255,255,255,0.3)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 0,
                  height: 3,
                  marginTop: -1.5,
                  width: `${progress}%`,
                  borderRadius: 2,
                  background: C.accent,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: `${progress}%`,
                  transform: "translate(-50%,-50%)",
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "white",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? 10 : 16,
                }}
              >
                <button
                  onClick={() => skipSec(-10)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.7)",
                    padding: 0,
                    display: "flex",
                  }}
                >
                  <SkipBack size={18} />
                </button>
                <button
                  onClick={togglePlay}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "white",
                    padding: 0,
                    display: "flex",
                  }}
                >
                  {playing ? (
                    <Pause size={22} fill="white" />
                  ) : (
                    <Play size={22} fill="white" />
                  )}
                </button>
                <button
                  onClick={() => skipSec(10)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.7)",
                    padding: 0,
                    display: "flex",
                  }}
                >
                  <SkipForward size={18} />
                </button>

                {!isMobile ? (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <button
                      onClick={() => setMuted(!muted)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "rgba(255,255,255,0.8)",
                        padding: 0,
                        display: "flex",
                      }}
                    >
                      {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={muted ? 0 : vol}
                      onChange={(e) => {
                        setVol(+e.target.value);
                        if (+e.target.value > 0) setMuted(false);
                      }}
                      style={{
                        width: 72,
                        accentColor: "white",
                        cursor: "pointer",
                      }}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setMuted(!muted)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "rgba(255,255,255,0.8)",
                      padding: 0,
                      display: "flex",
                    }}
                  >
                    {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                )}

                <span
                  style={{
                    color: "rgba(255,255,255,0.65)",
                    fontSize: 12,
                    fontFamily: "'Nunito',sans-serif",
                    whiteSpace: "nowrap",
                  }}
                >
                  {fmtSecs(curSec)} / {fmtSecs(totalSec)}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {videoSources.length > 1 && (
                  <select
                    value={selSrc}
                    onChange={(e) => setSelSrc(+e.target.value)}
                    style={{
                      background: "rgba(0,0,0,0.6)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "white",
                      borderRadius: 4,
                      fontFamily: "'Nunito',sans-serif",
                      fontSize: 11,
                      padding: "3px 6px",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    {videoSources.map((s, i) => (
                      <option key={i} value={i}>
                        {s.quality ?? s.videoType ?? `Nguồn ${i + 1}`}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  onClick={toggleFullscreen}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.7)",
                    padding: 0,
                    display: "flex",
                  }}
                >
                  <Maximize size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
export default function MovieDetailPage() {
  const isMobile = useIsMobile();
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [dirs, setDirs] = useState([]);
  const [actors, setActors] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("cast");

  const [currentUser] = useState(() => {
    try {
      const r = localStorage.getItem("currentUser");
      return r ? JSON.parse(r) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setDirs([]);
        setActors([]);
        const [movieRes, trendingRes] = await Promise.all([
          movieService.getMovieById(id),
          movieService.getTrendingMovies().catch(() => ({ data: [] })),
        ]);
        const movieData = movieRes?.data ?? movieRes;
        setMovie(movieData);

        if (movieData?.directorDetail) {
          setDirs([
            {
              id:
                movieData.directorDetail.id ??
                movieData.directorDetail.personId ??
                null,
              name: movieData.directorDetail.name,
              profileUrl: movieData.directorDetail.profileUrl, // ← thêm dòng này
              biography: movieData.directorDetail.biography,
              birthday: movieData.directorDetail.birthday,
              placeOfBirth: movieData.directorDetail.placeOfBirth,
            },
          ]);
        } else if (movieData?.director) {
          setDirs([
            {
              id: movieData.directorId || null,
              name: movieData.director,
              profileUrl: null,
            },
          ]);
        }
        if (Array.isArray(movieData?.cast) && movieData.cast.length > 0) {
          setActors(
            movieData.cast
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((c) => ({
                id: c.id ?? c.personId ?? c.tmdbPersonId ?? null,
                tmdbPersonId: c.tmdbPersonId ?? c.personId ?? null,
                name: c.name,
                character: c.character,
                profileUrl: c.profileUrl,
                biography: c.biography ?? c.bio ?? null,
                birthday: c.birthday ?? c.dob ?? null,
                deathday: c.deathday ?? null,
                placeOfBirth: c.placeOfBirth ?? null,
                knownFor: c.knownForDepartment ?? c.knownFor ?? null,
                popularity: c.popularity ?? null,
                profileImages: c.profileImages ?? [],
                movies: c.movies ?? c.filmography ?? [],
              })),
          );
        }
        const tRaw = trendingRes?.data ?? trendingRes;
        const movies = Array.isArray(tRaw) ? tRaw : (tRaw?.movies ?? []);
        setRelated(
          movies
            .filter((x) => x.id !== id)
            .slice(0, 12)
            .map((x) => ({
              id: x.id,
              title: x.title,
              year: x.releaseDate
                ? new Date(x.releaseDate).getFullYear()
                : x.year,
              rating: x.rating,
              posterUrl: x.posterUrl,
            })),
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading)
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: C.bg,
        }}
      >
        <style>{GLOBAL_STYLES}</style>
        <motion.div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: `3px solid ${C.accent}`,
            borderTopColor: "transparent",
          }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.85, ease: "linear" }}
        />
      </div>
    );

  const year = movie?.releaseDate
    ? new Date(movie.releaseDate).getFullYear()
    : (movie?.year ?? "");
  const hasCast = dirs.length > 0 || actors.length > 0;
  const TABS = [
    { key: "cast", label: "Diễn viên & Đạo diễn" },
    { key: "reviews", label: "Đánh giá" },
    { key: "more", label: "Thêm thông tin" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        paddingTop: 56,
        overflowX: "hidden",
      }}
    >
      <style>{GLOBAL_STYLES}</style>

      {/* Nav */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(0,0,0,0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${C.border}`,
          padding: isMobile ? "0 16px" : "0 32px",
          height: 56,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <BackButton />
        <div style={{ flex: 1 }} />
      </div>

      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: isMobile ? "16px 16px 48px" : "32px 32px 64px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 40,
            alignItems: "flex-start",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          {/* ── LEFT ── */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              width: isMobile ? "100%" : "auto",
              overflow: "hidden",
            }}
          >
            {/* Video player */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.5 }}
            >
              <VideoPlayer movie={movie} />
            </motion.div>

            {/* Title block */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{ marginTop: 24, marginBottom: 28 }}
            >
              <h1
                style={{
                  fontFamily: "'Be Vietnam Pro',sans-serif",
                  fontSize: isMobile ? 22 : 38,
                  fontWeight: 900,
                  letterSpacing: "0.02em",
                  lineHeight: 1.2,
                  marginBottom: 16,
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                {movie?.title}
              </h1>

              {/* Meta pills — dùng StatPill như MovieInfoPage */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 16,
                  alignItems: "center",
                }}
              >
                {year && <StatPill icon={Calendar} label="Năm" value={year} />}
                {movie?.duration && (
                  <StatPill
                    icon={Clock}
                    label="Thời lượng"
                    value={`${movie.duration} phút`}
                  />
                )}
                {movie?.rating && (
                  <StatPill
                    icon={Star}
                    label="Đánh giá"
                    value={`${movie.rating.toFixed(1)} / 10`}
                  />
                )}
                {movie?.genres?.slice(0, isMobile ? 1 : 2).map((g) => (
                  <StatPill key={g} icon={Award} label="" value={g} />
                ))}
              </div>

              {movie?.description && (
                <p
                  style={{
                    fontFamily: "'Nunito',sans-serif",
                    fontSize: isMobile ? 13 : 14,
                    color: C.textSub,
                    lineHeight: 1.7,
                    maxWidth: 680,
                  }}
                >
                  {movie.description}
                </p>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/movie/${id}/info`)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 28px",
                    background: "white",
                    color: "black",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontFamily: "'Nunito',sans-serif",
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  <Info size={18} color="black" /> Thông tin
                </motion.button>
              </div>
            </motion.div>

            {/* ── TABS ── */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.2 }}
            >
              <div
                style={{
                  display: "flex",
                  borderBottom: `1px solid ${C.border}`,
                  marginBottom: 32,
                }}
              >
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    style={{
                      background: "none",
                      border: "none",
                      borderBottom: `2px solid ${tab === t.key ? C.accent : "transparent"}`,
                      padding: isMobile ? "10px 12px" : "12px 20px",
                      cursor: "pointer",
                      fontFamily: "'Nunito',sans-serif",
                      fontSize: isMobile ? 12 : 14,
                      fontWeight: tab === t.key ? 700 : 500,
                      color: tab === t.key ? C.text : C.textSub,
                      transition: "all 0.2s",
                      marginBottom: -1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {/* CAST */}
                {tab === "cast" && (
                  <motion.div
                    key="cast"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {!hasCast ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          padding: "60px 0",
                          gap: 14,
                        }}
                      >
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: "50%",
                            background: C.surfaceMid,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 28,
                          }}
                        >
                          🎭
                        </div>
                        <p
                          style={{
                            fontFamily: "'Nunito',sans-serif",
                            fontSize: 16,
                            fontWeight: 600,
                            color: C.textSub,
                          }}
                        >
                          Chưa có thông tin diễn viên
                        </p>
                        <p
                          style={{
                            fontFamily: "'Nunito',sans-serif",
                            fontSize: 13,
                            color: C.textDim,
                            textAlign: "center",
                            maxWidth: 300,
                            lineHeight: 1.6,
                          }}
                        >
                          Thử import lại từ TMDB để cập nhật.
                        </p>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 40,
                        }}
                      >
                        {/* Đạo diễn — dùng SectionTitle */}
                        {dirs.length > 0 && (
                          <div>
                            <SectionTitle>Đạo Diễn</SectionTitle>
                            <div style={{ display: "flex", gap: 16 }}>
                              {dirs.map((p, i) => (
                                <PersonCard key={i} person={p} isDirector />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Diễn viên — dùng SectionTitle */}
                        {actors.length > 0 && (
                          <div>
                            <SectionTitle>Diễn Viên Nổi Bật</SectionTitle>
                            <PersonScrollRow people={actors} />
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* REVIEWS */}
                {tab === "reviews" && (
                  <motion.div
                    key="reviews"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ReviewSection
                      movieId={id}
                      movieRating={movie?.rating}
                      voteCount={movie?.voteCount}
                      currentUser={currentUser}
                    />
                  </motion.div>
                )}

                {/* MORE — dùng SectionTitle + StarRating */}
                {tab === "more" && (
                  <motion.div
                    key="more"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SectionTitle>Thông Tin Chi Tiết</SectionTitle>

                    {/* Rating widget */}
                    {movie?.rating && (
                      <div style={{ marginBottom: 28 }}>
                        <StarRating
                          score={movie.rating}
                          votes={movie?.voteCount}
                        />
                      </div>
                    )}

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                        gap: "12px 40px",
                        maxWidth: 560,
                      }}
                    >
                      {[
                        ["Thể loại", movie?.genres?.join(", ") || "—"],
                        ["Năm phát hành", year || "—"],
                        [
                          "Thời lượng",
                          movie?.duration ? `${movie.duration} phút` : "—",
                        ],
                        [
                          "Điểm đánh giá",
                          movie?.rating
                            ? `${movie.rating.toFixed(1)} / 10`
                            : "—",
                        ],
                        ["Đạo diễn", dirs.map((d) => d.name).join(", ") || "—"],
                        [
                          "Diễn viên chính",
                          actors
                            .slice(0, 3)
                            .map((a) => a.name)
                            .join(", ") || "—",
                        ],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          style={{
                            borderBottom: `1px solid ${C.border}`,
                            paddingBottom: 12,
                          }}
                        >
                          <p
                            style={{
                              fontFamily: "'Nunito',sans-serif",
                              fontSize: 11,
                              color: C.textDim,
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              marginBottom: 4,
                            }}
                          >
                            {label}
                          </p>
                          <p
                            style={{
                              fontFamily: "'Nunito',sans-serif",
                              fontSize: 14,
                              color: C.text,
                              fontWeight: 500,
                            }}
                          >
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* ── RIGHT sidebar ── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.15 }}
            style={{
              width: isMobile ? "100%" : 280,
              flexShrink: 0,
              display: isMobile ? "none" : "flex",
              flexDirection: "column",
              gap: 28,
            }}
          >
            {movie?.posterUrl && (
              <div style={{ borderRadius: 8, overflow: "hidden" }}>
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  style={{ width: "100%", display: "block" }}
                />
              </div>
            )}

            {/* Đạo diễn sidebar */}
            {dirs.length > 0 && (
              <div>
                <p
                  style={{
                    fontFamily: "'Nunito',sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    color: C.textDim,
                    textTransform: "uppercase",
                    marginBottom: 16,
                  }}
                >
                  Đạo diễn
                </p>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {dirs.map((p, i) => (
                    <div
                      key={i}
                      onClick={() =>
                        p.name &&
                        navigate(`/person/${toSlug(p.name)}`, {
                          state: { actor: p },
                        })
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        cursor: p.name ? "pointer" : "default",
                      }}
                    >
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: "50%",
                          border: "1.5px solid rgba(255,255,255,0.12)",
                          overflow: "hidden",
                          background: C.surfaceMid,
                          flexShrink: 0,
                        }}
                      >
                        {p.profileUrl ? (
                          <img
                            src={p.profileUrl}
                            alt={p.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              objectPosition: "center 15%",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 18,
                              color: C.textDim,
                              fontFamily: "'Be Vietnam Pro',sans-serif",
                            }}
                          >
                            {p.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p
                          style={{
                            fontFamily: "'Nunito',sans-serif",
                            fontSize: 13,
                            fontWeight: 600,
                            color: C.text,
                          }}
                        >
                          {p.name}
                        </p>
                        <p
                          style={{
                            fontFamily: "'Nunito',sans-serif",
                            fontSize: 11,
                            color: C.textSub,
                            marginTop: 1,
                            fontStyle: "italic",
                          }}
                        >
                          Đạo diễn
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Diễn viên sidebar */}
            {actors.length > 0 ? (
              <div>
                <p
                  style={{
                    fontFamily: "'Nunito',sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    color: C.textDim,
                    textTransform: "uppercase",
                    marginBottom: 16,
                  }}
                >
                  Diễn viên chính
                </p>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {actors.slice(0, 6).map((p, i) => (
                    <div
                      key={i}
                      onClick={() =>
                        p.name &&
                        navigate(`/person/${toSlug(p.name)}`, {
                          state: { actor: p },
                        })
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        cursor: p.name ? "pointer" : "default",
                      }}
                    >
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: "50%",
                          border: "1.5px solid rgba(255,255,255,0.1)",
                          overflow: "hidden",
                          background: C.surfaceMid,
                          flexShrink: 0,
                        }}
                      >
                        {p.profileUrl ? (
                          <img
                            src={p.profileUrl}
                            alt={p.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              objectPosition: "center 15%",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 16,
                              color: C.textDim,
                              fontFamily: "'Be Vietnam Pro',sans-serif",
                            }}
                          >
                            {p.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            fontFamily: "'Nunito',sans-serif",
                            fontSize: 13,
                            fontWeight: 500,
                            color: C.text,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {p.name}
                        </p>
                        {p.character && (
                          <p
                            style={{
                              fontFamily: "'Nunito',sans-serif",
                              fontSize: 11,
                              color: C.textDim,
                              marginTop: 1,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              fontStyle: "italic",
                            }}
                          >
                            {p.character}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: 16,
                  background: C.surfaceMid,
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                }}
              >
                <p
                  style={{
                    fontFamily: "'Nunito',sans-serif",
                    fontSize: 12,
                    color: C.textDim,
                    textAlign: "center",
                  }}
                >
                  Chưa có thông tin diễn viên
                </p>
              </div>
            )}

            {/* Related */}
            {related.length > 0 && (
              <div>
                <p
                  style={{
                    fontFamily: "'Nunito',sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    color: C.textDim,
                    textTransform: "uppercase",
                    marginBottom: 16,
                  }}
                >
                  Có thể bạn thích
                </p>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {related.slice(0, 5).map((m) => (
                    <motion.div
                      key={m.id}
                      whileHover={{ x: 3 }}
                      onClick={() => navigate(`/movie/${m.id}`)}
                      style={{
                        display: "flex",
                        gap: 10,
                        cursor: "pointer",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 60,
                          height: 85,
                          borderRadius: 6,
                          overflow: "hidden",
                          background: C.surfaceMid,
                          flexShrink: 0,
                        }}
                      >
                        {m.posterUrl ? (
                          <img
                            src={m.posterUrl}
                            alt={m.title}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 20,
                            }}
                          >
                            🎬
                          </div>
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            fontFamily: "'Nunito',sans-serif",
                            fontSize: 13,
                            fontWeight: 500,
                            color: C.text,
                            marginBottom: 4,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {m.title}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {m.rating && (
                            <>
                              <Star
                                size={10}
                                style={{
                                  fill: "#f5c518",
                                  color: "#f5c518",
                                  flexShrink: 0,
                                }}
                              />
                              <span
                                style={{
                                  fontFamily: "'Nunito',sans-serif",
                                  fontSize: 11,
                                  color: "#f5c518",
                                }}
                              >
                                {m.rating.toFixed(1)}
                              </span>
                            </>
                          )}
                          {m.year && (
                            <span
                              style={{
                                fontFamily: "'Nunito',sans-serif",
                                fontSize: 11,
                                color: C.textDim,
                              }}
                            >
                              {m.year}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
