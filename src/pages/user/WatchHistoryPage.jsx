// src/pages/WatchHistoryPage.jsx
// Lịch sử xem — hợp nhất MovieWatchHistoryDTO + TvShowWatchHistoryDTO.
//
// UX principles:
// - History = nhật ký nội dung đã xem, không phải bản sao của Continue Watching.
// - Chỉ hiển thị progress % khi backend cung cấp duration thật.
// - Không tự bịa duration 90/45 phút.
// - Giữ nguyên API service và navigation state hiện có.
// - Optimistic delete + rollback khi request thất bại.
// - Filter nhẹ: Tất cả / Phim lẻ / Phim bộ / Chưa xem xong / Đã xem xong.
// - Search chỉ lọc dữ liệu đã tải, không tạo thêm request backend.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Film,
  History,
  Play,
  RotateCcw,
  Search,
  Trash2,
  Tv,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import movieService from '../../services/movieService';
import tvShowService from '../../services/tvShowService';
import BackButton from '../../components/common/BackButton';
import { C, FONT_DISPLAY, FONT_BODY, GOOGLE_FONTS } from '../../context/homeTokens';
import LoadingScreen from '../../components/ui/LoadingScreen';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'movie', label: 'Phim lẻ' },
  { value: 'tvshow', label: 'Phim bộ' },
  { value: 'unfinished', label: 'Đang xem' },
  { value: 'completed', label: 'Đã xem' },
];

const FALLBACK_POSTER = {
  movie: '🎬',
  tvshow: '📺',
};

const REDUCED_TRANSITION = { duration: 0.15, ease: 'easeOut' };
const ITEM_TRANSITION = { duration: 0.25, ease: 'easeOut' };

// ─────────────────────────────────────────────────────────────────────────────
// Formatting
// ─────────────────────────────────────────────────────────────────────────────

const toDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatTime = (value) => {
  const date = toDate(value);
  if (!date) return '--:--';

  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getDateKey = (value) => {
  const date = toDate(value);
  if (!date) return 'unknown';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatDateLabel = (value) => {
  const date = toDate(value);
  if (!date) return 'Khác';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.round((today - target) / 86400000);

  if (diff === 0) return 'Hôm nay';
  if (diff === 1) return 'Hôm qua';
  if (diff > 1 && diff <= 6) return `${diff} ngày trước`;
  if (diff >= 7 && diff <= 13) return 'Tuần trước';

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'long',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
};

const formatMinutes = (minutes) => {
  const value = Math.max(0, Math.floor(Number(minutes) || 0));
  if (!value) return null;

  const hours = Math.floor(value / 60);
  const mins = value % 60;

  if (hours && mins) return `${hours}g ${mins}p`;
  if (hours) return `${hours}g`;
  return `${mins}p`;
};

const formatSeconds = (seconds) => {
  const value = Math.max(0, Math.floor(Number(seconds) || 0));
  return formatMinutes(Math.floor(value / 60));
};

const getResponseItems = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

// ─────────────────────────────────────────────────────────────────────────────
// Normalization
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalize two backend DTOs into one render model.
 *
 * Movie:
 *   { id, movieId, movieTitle, posterUrl, watchedAt, progressMinutes, isCompleted }
 *
 * TV:
 *   { id, tvShowId, tvShowTitle, posterUrl, episodeId, seasonNumber,
 *     episodeNumber, episodeName, episodeRuntime, watchedAt,
 *     progressSeconds, isCompleted }
 */
const normalizeHistoryItem = (item, type) => {
  if (type === 'movie') {
    const progressMinutes = Math.max(0, Number(item.progressMinutes) || 0);

    return {
      ...item,
      _type: 'movie',
      _contentId: item.movieId,
      _historyId: item.id,
      _title: item.movieTitle || 'Không có tên',
      _subtitle: null,
      _progressSeconds: progressMinutes * 60,
      // Movie history DTO hiện không có duration → không giả định duration.
      _durationSeconds: null,
      _progressMinutes: progressMinutes,
      _dateKey: getDateKey(item.watchedAt),
    };
  }

  const progressSeconds = Math.max(0, Number(item.progressSeconds) || 0);
  const runtimeMinutes =
    item.episodeRuntime != null
      ? Math.max(0, Number(item.episodeRuntime) || 0)
      : null;

  return {
    ...item,
    _type: 'tvshow',
    _contentId: item.tvShowId,
    _historyId: item.id,
    _title: item.tvShowTitle || 'Không có tên',
    _subtitle: item.episodeNumber
      ? `${item.seasonNumber ? `S${item.seasonNumber} ` : ''}E${item.episodeNumber}${
          item.episodeName ? ` · ${item.episodeName}` : ''
        }`
      : null,
    _progressSeconds: progressSeconds,
    _durationSeconds:
      runtimeMinutes != null && runtimeMinutes > 0 ? runtimeMinutes * 60 : null,
    _progressMinutes: Math.floor(progressSeconds / 60),
    _dateKey: getDateKey(item.watchedAt),
  };
};

const getProgressPercent = (item) => {
  if (item.isCompleted) return 100;
  if (!item._durationSeconds || item._durationSeconds <= 0) return null;

  return Math.min(
    99,
    Math.max(
      0,
      Math.round((item._progressSeconds / item._durationSeconds) * 100),
    ),
  );
};

const getResumeState = (item) => {
  if (item._type === 'movie') {
    return {
      resumeMinutes: item.isCompleted ? 0 : item.progressMinutes ?? 0,
      isCompleted: Boolean(item.isCompleted),
    };
  }

  return {
    resumeEpisodeId: item.episodeId ?? null,
    resumeSeconds: item.isCompleted ? 0 : item.progressSeconds ?? 0,
    isCompleted: Boolean(item.isCompleted),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Small UI primitives
// ─────────────────────────────────────────────────────────────────────────────

function ProgressBar({ item }) {
  const percent = getProgressPercent(item);

  if (percent == null) return null;

  return (
    <div className="history-progress" aria-label={`${percent}% đã xem`}>
      <span
        className={`history-progress-fill ${item.isCompleted ? 'is-complete' : ''}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function TypeBadge({ type }) {
  const isTv = type === 'tvshow';

  return (
    <span className={`history-type-badge ${isTv ? 'is-tv' : ''}`}>
      {isTv ? <Tv size={10} /> : <Film size={10} />}
      {isTv ? 'TV' : 'PHIM'}
    </span>
  );
}

function Poster({ item }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="history-poster">
      {item.posterUrl && !failed ? (
        <img
          src={item.posterUrl}
          alt={item._title}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="history-poster-fallback" aria-hidden="true">
          {FALLBACK_POSTER[item._type]}
        </div>
      )}

      <TypeBadge type={item._type} />

      {item.isCompleted && (
        <span className="history-complete-badge" title="Đã xem xong">
          <Check size={11} strokeWidth={3} />
        </span>
      )}
    </div>
  );
}

function HistoryCard({ item, index, onDelete, onOpen, reducedMotion }) {
  const progress = getProgressPercent(item);
  const watchedText =
    item._progressMinutes > 0
      ? `${formatMinutes(item._progressMinutes)} đã xem`
      : 'Đã bắt đầu xem';

  const durationText =
    item._durationSeconds != null
      ? formatSeconds(item._durationSeconds)
      : null;

  return (
    <motion.article
      layout="position"
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 18 }}
      transition={
        reducedMotion
          ? REDUCED_TRANSITION
          : { ...ITEM_TRANSITION, delay: Math.min(index * 0.025, 0.18) }
      }
      className="history-card"
      onClick={() => onOpen(item)}
    >
      <Poster item={item} />

      <div className="history-card-content">
        <div className="history-card-heading">
          <div className="history-title-wrap">
            <h3 title={item._title}>{item._title}</h3>

            {item._subtitle && (
              <p title={item._subtitle}>{item._subtitle}</p>
            )}
          </div>

          <span className="history-time">
            <Clock3 size={12} />
            {formatTime(item.watchedAt)}
          </span>
        </div>

        <div className="history-meta">
          <span>{watchedText}</span>

          {item.isCompleted ? (
            <span className="history-status complete">
              <CheckCircle2 size={12} />
              Đã xem xong
            </span>
          ) : durationText ? (
            <span>{durationText} tổng thời lượng</span>
          ) : (
            <span>Đang xem</span>
          )}
        </div>

        <ProgressBar item={item} />
      </div>

      <div className="history-card-actions" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="history-play-button"
          title={item.isCompleted ? 'Xem lại' : 'Xem tiếp'}
          aria-label={item.isCompleted ? `Xem lại ${item._title}` : `Xem tiếp ${item._title}`}
          onClick={() => onOpen(item)}
        >
          <Play size={14} fill="currentColor" />
        </button>

        <button
          type="button"
          className="history-delete-button"
          title="Xóa khỏi lịch sử"
          aria-label={`Xóa ${item._title} khỏi lịch sử`}
          onClick={() => onDelete(item)}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.article>
  );
}

function DaySection({ label, items, onDelete, onOpen, reducedMotion }) {
  return (
    <section className="history-day-section">
      <div className="history-day-heading">
        <div className="history-day-title">
          <CalendarDays size={14} />
          <span>{label}</span>
        </div>

        <span className="history-day-count">
          {items.length} {items.length === 1 ? 'mục' : 'mục'}
        </span>
      </div>

      <div className="history-day-list">
        <AnimatePresence initial={false}>
          {items.map((item, index) => (
            <HistoryCard
              key={`${item._type}:${item._historyId}`}
              item={item}
              index={index}
              onDelete={onDelete}
              onOpen={onOpen}
              reducedMotion={reducedMotion}
            />
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

function EmptyState({ hasFilter, onBrowse, onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="history-empty"
    >
      <div className="history-empty-icon">
        {hasFilter ? <Search size={28} /> : <History size={30} />}
      </div>

      <h2>{hasFilter ? 'Không tìm thấy nội dung' : 'Chưa có lịch sử xem'}</h2>

      <p>
        {hasFilter
          ? 'Thử đổi từ khóa hoặc bộ lọc để xem thêm nội dung.'
          : 'Những bộ phim bạn đã xem sẽ được lưu lại tại đây.'}
      </p>

      <div className="history-empty-actions">
        {hasFilter && (
          <button type="button" className="history-secondary-button" onClick={onReset}>
            Xóa bộ lọc
          </button>
        )}

        <button type="button" className="history-primary-button" onClick={onBrowse}>
          Khám phá phim
        </button>
      </div>
    </motion.div>
  );
}

function ConfirmClearDialog({ count, onCancel, onConfirm }) {
  return (
    <motion.div
      className="history-dialog-layer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <motion.div
        className="history-dialog"
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="clear-history-title"
      >
        <div className="history-dialog-icon">
          <Trash2 size={18} />
        </div>

        <h2 id="clear-history-title">Xóa toàn bộ lịch sử?</h2>
        <p>
          Bạn sắp xóa {count} mục khỏi lịch sử xem. Hành động này không thể hoàn tác.
        </p>

        <div className="history-dialog-actions">
          <button type="button" className="history-secondary-button" onClick={onCancel}>
            Hủy
          </button>
          <button type="button" className="history-danger-button" onClick={onConfirm}>
            Xóa tất cả
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats
// ─────────────────────────────────────────────────────────────────────────────

function HistorySummary({ items }) {
  const stats = useMemo(() => {
    const movieCount = items.filter((item) => item._type === 'movie').length;
    const tvCount = items.filter((item) => item._type === 'tvshow').length;
    const completed = items.filter((item) => item.isCompleted).length;
    const minutes = items.reduce(
      (total, item) => total + (item._progressMinutes || 0),
      0,
    );

    return {
      total: items.length,
      movieCount,
      tvCount,
      completed,
      hours: Math.floor(minutes / 60),
      minutes: minutes % 60,
    };
  }, [items]);

  const statItems = [
    { label: 'Đã xem', value: stats.total, unit: 'mục' },
    { label: 'Phim lẻ', value: stats.movieCount, unit: 'phim' },
    { label: 'Phim bộ', value: stats.tvCount, unit: 'bộ' },
    {
      label: 'Thời gian xem',
      value: stats.hours > 0 ? stats.hours : stats.minutes,
      unit: stats.hours > 0 ? 'giờ' : 'phút',
    },
  ];

  return (
    <div className="history-summary" aria-label="Tổng quan lịch sử xem">
      {statItems.map((stat) => (
        <div className="history-summary-item" key={stat.label}>
          <div className="history-summary-value">
            {stat.value.toLocaleString('vi-VN')}
            <small>{stat.unit}</small>
          </div>
          <div className="history-summary-label">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function WatchHistoryPage() {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);

    try {
      const [movieResult, tvResult] = await Promise.allSettled([
        movieService.getWatchHistory(),
        tvShowService.getWatchHistory(),
      ]);

      const movies =
        movieResult.status === 'fulfilled'
          ? getResponseItems(movieResult.value)
          : [];

      const tvShows =
        tvResult.status === 'fulfilled'
          ? getResponseItems(tvResult.value)
          : [];

      if (movieResult.status === 'rejected') {
        console.warn(
          '[WatchHistory] movie history unavailable:',
          movieResult.reason,
        );
      }

      if (tvResult.status === 'rejected') {
        console.warn(
          '[WatchHistory] tvshow history unavailable:',
          tvResult.reason,
        );
      }

      const merged = [
        ...movies.map((item) => normalizeHistoryItem(item, 'movie')),
        ...tvShows.map((item) => normalizeHistoryItem(item, 'tvshow')),
      ].sort(
        (a, b) =>
          (toDate(b.watchedAt)?.getTime() || 0) -
          (toDate(a.watchedAt)?.getTime() || 0),
      );

      setHistory(merged);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filteredHistory = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi-VN');

    return history.filter((item) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'movie' && item._type === 'movie') ||
        (filter === 'tvshow' && item._type === 'tvshow') ||
        (filter === 'unfinished' && !item.isCompleted) ||
        (filter === 'completed' && item.isCompleted);

      if (!matchesFilter) return false;
      if (!keyword) return true;

      return (
        item._title.toLocaleLowerCase('vi-VN').includes(keyword) ||
        (item._subtitle || '').toLocaleLowerCase('vi-VN').includes(keyword)
      );
    });
  }, [history, filter, search]);

  const groupedHistory = useMemo(() => {
    const groups = new Map();

    filteredHistory.forEach((item) => {
      const key = item._dateKey;

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          label: formatDateLabel(item.watchedAt),
          items: [],
        });
      }

      groups.get(key).items.push(item);
    });

    return [...groups.values()];
  }, [filteredHistory]);

  const hasActiveFilter = filter !== 'all' || search.trim().length > 0;

  const resetFilters = useCallback(() => {
    setFilter('all');
    setSearch('');
  }, []);

  const openItem = useCallback(
    (item) => {
      navigate(
        item._type === 'movie'
          ? `/movie/${item._contentId}`
          : `/tvshow/${item._contentId}`,
        { state: getResumeState(item) },
      );
    },
    [navigate],
  );

  const deleteItem = useCallback(
    async (item) => {
      const previous = history;

      // Optimistic UI: thao tác xóa phản hồi ngay lập tức.
      setHistory((current) =>
        current.filter(
          (entry) =>
            !(
              entry._type === item._type &&
              entry._historyId === item._historyId
            ),
        ),
      );

      try {
        if (item._type === 'movie') {
          await movieService.deleteWatchHistory(item._historyId);
        } else {
          await tvShowService.deleteWatchHistory(item._historyId);
        }
      } catch (error) {
        console.warn('[WatchHistory] delete failed:', error);
        setHistory(previous);
      }
    },
    [history],
  );

  const clearAll = useCallback(async () => {
    if (!history.length) return;

    const previous = history;
    setBusy(true);
    setShowClearConfirm(false);
    setHistory([]);

    const results = await Promise.allSettled([
      movieService.clearWatchHistory(),
      tvShowService.clearWatchHistory(),
    ]);

    const failed = results.some((result) => result.status === 'rejected');

    if (failed) {
      console.warn('[WatchHistory] clear all partially failed:', results);
      setHistory(previous);
      // Đồng bộ lại với backend để tránh UI giữ trạng thái sai.
      await loadHistory();
    }

    setBusy(false);
  }, [history, loadHistory]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="watch-history-page">
      <style>{`
        ${GOOGLE_FONTS}

        .watch-history-page {
          --history-bg: #000;
          --history-surface: rgba(255,255,255,0.028);
          --history-surface-hover: rgba(255,255,255,0.055);
          --history-border: rgba(255,255,255,0.075);
          --history-border-hover: rgba(255,255,255,0.13);
          --history-muted: rgba(255,255,255,0.42);
          --history-dim: rgba(255,255,255,0.25);
          min-height: 100vh;
          padding-top: 68px;
          background:
            radial-gradient(circle at 50% -10%, rgba(229,24,30,0.075), transparent 34%),
            var(--history-bg);
          color: ${C.text};
        }

        .watch-history-shell {
          width: min(1040px, calc(100% - 32px));
          margin: 0 auto;
          padding: 28px 0 88px;
        }

        .history-back {
          margin-bottom: 28px;
        }

        .history-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 24px;
        }

        .history-heading {
          min-width: 0;
        }

        .history-kicker {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          color: rgba(255,255,255,0.38);
          font: 700 11px/1 ${FONT_BODY};
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .history-heading h1 {
          margin: 0;
          font: 800 clamp(26px, 4vw, 36px)/1.08 ${FONT_DISPLAY};
          letter-spacing: -0.025em;
          color: ${C.text};
        }

        .history-heading p {
          margin: 9px 0 0;
          color: var(--history-muted);
          font: 400 13px/1.6 ${FONT_BODY};
        }

        .history-clear-button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          flex: 0 0 auto;
          border: 1px solid var(--history-border);
          border-radius: 9px;
          padding: 9px 13px;
          background: rgba(255,255,255,0.025);
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          font: 700 12px/1 ${FONT_BODY};
          transition: .18s ease;
        }

        .history-clear-button:hover {
          border-color: rgba(229,24,30,.35);
          background: rgba(229,24,30,.08);
          color: #fff;
        }

        .history-clear-button:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        .history-summary {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          margin-bottom: 26px;
          overflow: hidden;
          border: 1px solid var(--history-border);
          border-radius: 13px;
          background: var(--history-surface);
        }

        .history-summary-item {
          min-width: 0;
          padding: 16px 18px;
          border-right: 1px solid var(--history-border);
        }

        .history-summary-item:last-child {
          border-right: 0;
        }

        .history-summary-value {
          color: ${C.text};
          font: 800 22px/1 ${FONT_DISPLAY};
        }

        .history-summary-value small {
          margin-left: 5px;
          color: var(--history-dim);
          font: 500 10px/1 ${FONT_BODY};
        }

        .history-summary-label {
          margin-top: 7px;
          color: var(--history-dim);
          font: 600 10px/1 ${FONT_BODY};
        }

        .history-toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 30px;
        }

        .history-search {
          position: relative;
          flex: 1;
          min-width: 0;
        }

        .history-search > svg {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,.3);
          pointer-events: none;
        }

        .history-search input {
          width: 100%;
          height: 40px;
          padding: 0 38px 0 38px;
          border: 1px solid var(--history-border);
          border-radius: 10px;
          outline: none;
          background: rgba(255,255,255,.025);
          color: ${C.text};
          font: 500 12px/1 ${FONT_BODY};
          transition: border-color .18s ease, background .18s ease;
        }

        .history-search input::placeholder {
          color: rgba(255,255,255,.25);
        }

        .history-search input:focus {
          border-color: rgba(255,255,255,.16);
          background: rgba(255,255,255,.04);
        }

        .history-search-clear {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 26px;
          height: 26px;
          display: grid;
          place-items: center;
          border: 0;
          border-radius: 50%;
          background: transparent;
          color: rgba(255,255,255,.35);
          cursor: pointer;
        }

        .history-filter-toggle {
          display: none;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          border: 1px solid var(--history-border);
          border-radius: 10px;
          background: rgba(255,255,255,.025);
          color: rgba(255,255,255,.55);
          cursor: pointer;
        }

        .history-filter-list {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 3px;
          border: 1px solid var(--history-border);
          border-radius: 11px;
          background: rgba(255,255,255,.018);
        }

        .history-filter {
          height: 32px;
          padding: 0 11px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: rgba(255,255,255,.38);
          cursor: pointer;
          font: 700 11px/1 ${FONT_BODY};
          white-space: nowrap;
          transition: .18s ease;
        }

        .history-filter:hover {
          color: rgba(255,255,255,.75);
        }

        .history-filter.active {
          background: rgba(255,255,255,.09);
          color: #fff;
        }

        .history-day-section {
          margin-bottom: 30px;
        }

        .history-day-heading {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
          padding: 0 4px;
        }

        .history-day-title {
          display: flex;
          align-items: center;
          gap: 7px;
          color: rgba(255,255,255,.5);
          font: 800 11px/1 ${FONT_BODY};
          letter-spacing: .06em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .history-day-title svg {
          color: rgba(255,255,255,.25);
        }

        .history-day-heading::after {
          content: "";
          height: 1px;
          flex: 1;
          background: linear-gradient(90deg, rgba(255,255,255,.07), transparent);
        }

        .history-day-count {
          color: rgba(255,255,255,.22);
          font: 500 10px/1 ${FONT_BODY};
          white-space: nowrap;
        }

        .history-day-list {
          display: grid;
          gap: 3px;
        }

        .history-card {
          display: flex;
          align-items: center;
          gap: 15px;
          min-width: 0;
          padding: 10px;
          border: 1px solid transparent;
          border-radius: 12px;
          background: transparent;
          cursor: pointer;
          transition: background .18s ease, border-color .18s ease;
        }

        .history-card:hover {
          border-color: var(--history-border);
          background: var(--history-surface);
        }

        .history-poster {
          position: relative;
          width: 58px;
          height: 82px;
          flex: 0 0 58px;
          overflow: hidden;
          border-radius: 8px;
          background: #151515;
          box-shadow: 0 4px 18px rgba(0,0,0,.28);
        }

        .history-poster img,
        .history-poster-fallback {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .history-poster-fallback {
          display: grid;
          place-items: center;
          font-size: 20px;
          background: linear-gradient(145deg, #171717, #0d0d0d);
        }

        .history-type-badge {
          position: absolute;
          top: 5px;
          left: 5px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 3px 5px;
          border-radius: 4px;
          background: rgba(0,0,0,.68);
          color: #fff;
          font: 800 8px/1 ${FONT_BODY};
          letter-spacing: .04em;
          backdrop-filter: blur(5px);
        }

        .history-type-badge.is-tv {
          background: rgba(70,70,85,.82);
        }

        .history-complete-badge {
          position: absolute;
          right: 5px;
          bottom: 5px;
          display: grid;
          place-items: center;
          width: 17px;
          height: 17px;
          border-radius: 50%;
          background: #46d369;
          color: #06120a;
          box-shadow: 0 2px 8px rgba(0,0,0,.35);
        }

        .history-card-content {
          min-width: 0;
          flex: 1;
        }

        .history-card-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          min-width: 0;
        }

        .history-title-wrap {
          min-width: 0;
        }

        .history-title-wrap h3 {
          overflow: hidden;
          margin: 0;
          color: ${C.text};
          font: 750 14px/1.35 ${FONT_DISPLAY};
          letter-spacing: -.01em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .history-title-wrap p {
          overflow: hidden;
          margin: 3px 0 0;
          color: rgba(255,255,255,.38);
          font: 600 11px/1.35 ${FONT_BODY};
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .history-time {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          flex: 0 0 auto;
          padding-top: 1px;
          color: rgba(255,255,255,.27);
          font: 600 10px/1 ${FONT_BODY};
        }

        .history-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 9px;
          color: rgba(255,255,255,.3);
          font: 500 10px/1.3 ${FONT_BODY};
        }

        .history-status {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .history-status.complete {
          color: #46d369;
        }

        .history-progress {
          height: 3px;
          margin-top: 10px;
          overflow: hidden;
          border-radius: 99px;
          background: rgba(255,255,255,.075);
        }

        .history-progress-fill {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: ${C.accent};
          transition: width .35s ease;
        }

        .history-progress-fill.is-complete {
          background: #46d369;
        }

        .history-card-actions {
          display: flex;
          align-items: center;
          gap: 7px;
          flex: 0 0 auto;
          opacity: 0;
          transform: translateX(4px);
          transition: opacity .18s ease, transform .18s ease;
        }

        .history-card:hover .history-card-actions,
        .history-card:focus-within .history-card-actions {
          opacity: 1;
          transform: translateX(0);
        }

        .history-play-button,
        .history-delete-button {
          display: grid;
          place-items: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          transition: transform .16s ease, background .16s ease, border-color .16s ease;
        }

        .history-play-button {
          border: 0;
          background: #fff;
          color: #050505;
        }

        .history-delete-button {
          border: 1px solid rgba(229,24,30,.28);
          background: rgba(229,24,30,.07);
          color: ${C.accent};
        }

        .history-play-button:hover,
        .history-delete-button:hover {
          transform: scale(1.06);
        }

        .history-delete-button:hover {
          border-color: rgba(229,24,30,.5);
          background: rgba(229,24,30,.14);
        }

        .history-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 430px;
          margin: 55px auto 0;
          padding: 48px 24px;
          text-align: center;
          border: 1px solid var(--history-border);
          border-radius: 16px;
          background: linear-gradient(145deg, rgba(255,255,255,.032), rgba(255,255,255,.012));
        }

        .history-empty-icon {
          display: grid;
          place-items: center;
          width: 64px;
          height: 64px;
          margin-bottom: 18px;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 50%;
          background: rgba(255,255,255,.035);
          color: rgba(255,255,255,.28);
        }

        .history-empty h2 {
          margin: 0;
          color: ${C.text};
          font: 800 19px/1.3 ${FONT_DISPLAY};
        }

        .history-empty p {
          margin: 9px 0 0;
          color: rgba(255,255,255,.32);
          font: 400 12px/1.7 ${FONT_BODY};
        }

        .history-empty-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 22px;
        }

        .history-primary-button,
        .history-secondary-button,
        .history-danger-button {
          min-height: 36px;
          padding: 0 15px;
          border-radius: 9px;
          cursor: pointer;
          font: 700 11px/1 ${FONT_BODY};
        }

        .history-primary-button {
          border: 0;
          background: ${C.accent};
          color: #fff;
        }

        .history-secondary-button {
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(255,255,255,.025);
          color: rgba(255,255,255,.65);
        }

        .history-danger-button {
          border: 0;
          background: ${C.accent};
          color: #fff;
        }

        .history-dialog-layer {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(0,0,0,.7);
          backdrop-filter: blur(8px);
        }

        .history-dialog {
          width: min(380px, 100%);
          padding: 22px;
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 15px;
          background: #171717;
          box-shadow: 0 24px 80px rgba(0,0,0,.65);
        }

        .history-dialog-icon {
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          margin-bottom: 14px;
          border-radius: 10px;
          background: rgba(229,24,30,.1);
          color: ${C.accent};
        }

        .history-dialog h2 {
          margin: 0;
          color: #fff;
          font: 800 17px/1.3 ${FONT_DISPLAY};
        }

        .history-dialog p {
          margin: 8px 0 0;
          color: rgba(255,255,255,.4);
          font: 400 12px/1.65 ${FONT_BODY};
        }

        .history-dialog-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 20px;
        }

        @media (max-width: 760px) {
          .watch-history-shell {
            width: min(100% - 24px, 680px);
            padding-top: 20px;
          }

          .history-header {
            align-items: flex-start;
          }

          .history-toolbar {
            flex-wrap: wrap;
          }

          .history-filter-toggle {
            display: inline-flex;
          }

          .history-filter-list {
            display: none;
            width: 100%;
            overflow-x: auto;
            order: 3;
          }

          .history-filter-list.open {
            display: flex;
          }

          .history-filter {
            flex: 0 0 auto;
          }

          .history-search {
            order: 1;
          }

          .history-filter-toggle {
            order: 2;
          }

          .history-summary-item {
            padding: 13px 8px;
            text-align: center;
          }

          .history-summary-value {
            font-size: 18px;
          }

          .history-summary-value small {
            display: block;
            margin: 4px 0 0;
          }

          .history-summary-label {
            font-size: 9px;
          }

          .history-card-actions {
            opacity: 1;
            transform: none;
          }
        }

        @media (max-width: 520px) {
          .watch-history-page {
            padding-top: 60px;
          }

          .watch-history-shell {
            width: calc(100% - 20px);
            padding-bottom: 60px;
          }

          .history-back {
            margin-bottom: 20px;
          }

          .history-header {
            margin-bottom: 18px;
          }

          .history-heading h1 {
            font-size: 26px;
          }

          .history-clear-button {
            padding: 8px 10px;
          }

          .history-clear-button span {
            display: none;
          }

          .history-summary {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .history-summary-item:nth-child(2) {
            border-right: 0;
          }

          .history-summary-item:nth-child(-n + 2) {
            border-bottom: 1px solid var(--history-border);
          }

          .history-card {
            gap: 11px;
            padding: 8px 5px;
          }

          .history-poster {
            width: 52px;
            height: 74px;
            flex-basis: 52px;
          }

          .history-title-wrap h3 {
            font-size: 13px;
          }

          .history-time {
            display: none;
          }

          .history-meta {
            gap: 6px;
            margin-top: 7px;
          }

          .history-card-actions {
            gap: 5px;
          }

          .history-play-button,
          .history-delete-button {
            width: 29px;
            height: 29px;
          }

          .history-day-section {
            margin-bottom: 24px;
          }

          .history-day-count {
            display: none;
          }

          .history-empty {
            margin-top: 35px;
            padding: 38px 20px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .history-card,
          .history-card-actions,
          .history-play-button,
          .history-delete-button,
          .history-search input,
          .history-filter,
          .history-clear-button {
            transition: none !important;
          }
        }
      `}</style>

      <main className="watch-history-shell">
        <div className="history-back">
          <BackButton />
        </div>

        <motion.header
          initial={reducedMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reducedMotion ? REDUCED_TRANSITION : { duration: 0.35, ease: 'easeOut' }}
          className="history-header"
        >
          <div className="history-heading">
            <div className="history-kicker">
              <History size={13} />
              Nhật ký xem
            </div>

            <h1>Lịch sử xem</h1>

            <p>
              {history.length
                ? `${history.length} mục đã được lưu trong tài khoản của bạn.`
                : 'Theo dõi những nội dung bạn đã xem gần đây.'}
            </p>
          </div>

          {history.length > 0 && (
            <button
              type="button"
              className="history-clear-button"
              disabled={busy}
              onClick={() => setShowClearConfirm(true)}
            >
              <RotateCcw size={13} />
              <span>Xóa tất cả</span>
            </button>
          )}
        </motion.header>

        {history.length > 0 && <HistorySummary items={history} />}

        {history.length > 0 && (
          <div className="history-toolbar">
            <div className="history-search">
              <Search size={15} />

              <input
                type="search"
                value={search}
                placeholder="Tìm trong lịch sử..."
                aria-label="Tìm trong lịch sử xem"
                onChange={(event) => setSearch(event.target.value)}
              />

              {search && (
                <button
                  type="button"
                  className="history-search-clear"
                  aria-label="Xóa tìm kiếm"
                  onClick={() => setSearch('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="button"
              className="history-filter-toggle"
              aria-label="Mở bộ lọc"
              aria-expanded={showFilters}
              onClick={() => setShowFilters((value) => !value)}
            >
              <ChevronDown
                size={16}
                style={{
                  transform: showFilters ? 'rotate(180deg)' : 'none',
                  transition: 'transform .18s ease',
                }}
              />
            </button>

            <div className={`history-filter-list ${showFilters ? 'open' : ''}`}>
              {FILTERS.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={`history-filter ${filter === option.value ? 'active' : ''}`}
                  onClick={() => {
                    setFilter(option.value);
                    setShowFilters(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {filteredHistory.length === 0 ? (
          <EmptyState
            hasFilter={hasActiveFilter}
            onBrowse={() => navigate('/browse')}
            onReset={resetFilters}
          />
        ) : (
          <div>
            {groupedHistory.map((group) => (
              <DaySection
                key={group.key}
                label={group.label}
                items={group.items}
                onDelete={deleteItem}
                onOpen={openItem}
                reducedMotion={reducedMotion}
              />
            ))}
          </div>
        )}
      </main>

      <AnimatePresence>
        {showClearConfirm && (
          <ConfirmClearDialog
            count={history.length}
            onCancel={() => setShowClearConfirm(false)}
            onConfirm={clearAll}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
