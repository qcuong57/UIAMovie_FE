// src/components/admin/AdminTmdbSearch.jsx
// Panel slide-in dùng chung cho AdminMovies & AdminTvShows
// 2 tab: 🎬 Phim | 📺 TV Show — mỗi tab có search theo tên + nhập ID riêng.
//
// Panel CHỈ xếp việc import vào hàng đợi nền (tmdbImportStore). Tiến trình hiển thị trên thẻ
// và trong <TmdbImportTray /> (gắn ở layout admin) nên đóng panel không làm mất tiến trình.

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, Film, Tv, X, Hash, Clock } from 'lucide-react';
import { useTmdbDiscover, useTmdbExisting } from '../../hooks/useTmdbDiscover';
import { useImportJobs, useOnImportsSettled, batchStats } from '../../hooks/useTmdbImports';
import { enqueueImports, jobKey, isActive, isSuccess } from '../../../stores/tmdbImportStore';
import TmdbFilterBar, { EMPTY_FILTERS, hasActiveFilters, filtersKey } from './tmdb/TmdbFilterBar';
import TmdbResultCard from './tmdb/TmdbResultCard';
import { Spin, ProgressBar, JobProgress, Notice, ResultBadges, TONE, toImportItem } from './tmdb/TmdbImportUi';
import { T, FONT_BODY as FONT } from '../../context/adminTokens';

const useDebounced = (value, ms = 350) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
};

const ghostBtn = {
  padding: '5px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.surfaceAlt ?? T.bg,
  fontFamily: FONT, fontSize: 11, color: T.textSub, cursor: 'pointer',
};

const pagerBtn = (disabled) => ({
  padding: '7px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface,
  cursor: disabled ? 'default' : 'pointer', fontFamily: FONT, fontSize: 12.5, color: T.textSub,
  opacity: disabled ? 0.5 : 1,
});

// ── Thanh chọn nhiều + import hàng loạt ───────────────────────────────────────
function BulkBar({ selectableCount, selectedCount, stats, onSelectAll, onClear, onImport }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '8px 10px', margin: '4px 0 10px',
      borderRadius: 8, background: T.surface, border: `1px solid ${T.border}`,
    }}>
      <button type="button" onClick={onSelectAll} disabled={selectableCount === 0} style={ghostBtn}>
        Chọn tất cả ({selectableCount})
      </button>
      {selectedCount > 0 && <button type="button" onClick={onClear} style={ghostBtn}>Bỏ chọn</button>}
      <button
        type="button" onClick={onImport} disabled={selectedCount === 0}
        style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 6,
          border: `1px solid ${T.accent}`, background: T.accent, fontFamily: FONT, fontSize: 11.5, fontWeight: 600,
          color: '#fff', cursor: selectedCount === 0 ? 'default' : 'pointer', opacity: selectedCount === 0 ? 0.5 : 1,
        }}
      >
        <Download size={11} /> Import {selectedCount > 0 ? selectedCount : ''} đã chọn
      </button>

      {stats && (
        <div style={{ flexBasis: '100%' }}>
          <ProgressBar value={stats.percent} tone={stats.failed ? 'warn' : 'accent'} height={6} />
          <p style={{ margin: '4px 0 0', fontFamily: FONT, fontSize: 10.5, color: T.textMuted }}>
            Đang import {stats.finished}/{stats.total} ({stats.percent}%){stats.failed ? ` · ${stats.failed} lỗi` : ''}
            {' '}— chạy nền, đóng panel vẫn tiếp tục
          </p>
        </div>
      )}
    </div>
  );
}

// ── Tab tìm theo tên + bộ lọc ─────────────────────────────────────────────────
function SearchTab({ kind }) {
  const isMovie = kind === 'movie';
  const noun = isMovie ? 'phim' : 'TV show';

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [paging, setPaging] = useState({ scope: '', stack: [1] });
  const [selected, setSelected] = useState(() => new Set());

  const trimmed = query.trim();
  const debouncedQuery = useDebounced(trimmed);
  const debouncedFilters = useDebounced(filters);

  // Con trỏ phân trang (mỗi phần tử là trang TMDB bắt đầu quét; trang sau = nextPage server trả về)
  // gắn với từ khoá + bộ lọc đã debounce: đổi tìm kiếm là tự về trang 1, không bắn request thừa cho trang cũ.
  const scope = `${debouncedQuery}|${filtersKey(debouncedFilters)}`;
  const pageStack = paging.scope === scope ? paging.stack : [1];

  const active = !!debouncedQuery || hasActiveFilters(debouncedFilters);
  const hasInput = !!trimmed || hasActiveFilters(filters);
  const pendingInput = trimmed !== debouncedQuery || filtersKey(filters) !== filtersKey(debouncedFilters);

  const discoverQ = useTmdbDiscover(kind, debouncedQuery, debouncedFilters, pageStack[pageStack.length - 1], active);
  const results = active ? (discoverQ.data?.results ?? []) : [];
  const nextPage = active ? (discoverQ.data?.nextPage ?? null) : null;
  const notes = active ? (discoverQ.data?.notes ?? []) : [];
  const searching = hasInput && (discoverQ.isFetching || pendingInput);

  // Phim/show đã có trong DB (server) hoặc đã import xong trong phiên này (store)
  const jobs = useImportJobs();
  const jobOf = (id) => jobs[jobKey(kind, id)];
  const existingQ = useTmdbExisting(kind, results.map((r) => r.id));
  const existingSet = useMemo(() => new Set(existingQ.data ?? []), [existingQ.data]);
  const isDone = (id) => existingSet.has(id) || isSuccess(jobOf(id));

  const stats = batchStats(Object.values(jobs).filter((j) => j.kind === kind));
  const selectableIds = results.filter((r) => !isDone(r.id) && !isActive(jobOf(r.id))).map((r) => r.id);

  const goToPage = (updater) => {
    setPaging({ scope, stack: typeof updater === 'function' ? updater(pageStack) : updater });
    setSelected(new Set());
  };
  const changeQuery = (q) => { setQuery(q); setSelected(new Set()); };
  const changeFilters = (f) => { setFilters(f); setSelected(new Set()); };

  const toggleSelect = (id) => setSelected((prev) => {
    const next = new Set(prev);
    if (!next.delete(id)) next.add(id);
    return next;
  });

  const importOne = (item) => enqueueImports([toImportItem(item, isMovie)]);

  const importSelected = () => {
    const items = results.filter((r) => selected.has(r.id) && selectableIds.includes(r.id));
    if (items.length === 0) return;
    const confirmed = window.confirm(
      `Import ${items.length} ${noun} từ TMDB?\n\nMỗi ${noun} import xong sẽ gửi 1 thông báo “mới ra mắt” tới người dùng.`,
    );
    if (!confirmed) return;
    enqueueImports(items.map((r) => toImportItem(r, isMovie)));
    setSelected(new Set());
  };

  return (
    <>
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <Search size={15} color={T.textMuted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input
          placeholder={isMovie ? 'Tên phim... (VD: Parasite)' : 'Tên TV show... (VD: Squid Game)'}
          value={query} onChange={(e) => changeQuery(e.target.value)}
          style={{
            width: '100%', height: 40, padding: '0 36px 0 38px', borderRadius: 10, background: T.surface,
            border: `1px solid ${T.border}`, fontFamily: FONT, fontSize: 13.5, color: T.text, outline: 'none', boxSizing: 'border-box',
          }}
        />
        {query && (
          <button
            type="button" onClick={() => changeQuery('')} aria-label="Xoá từ khoá"
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex', padding: 0 }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <TmdbFilterBar kind={kind} filters={filters} onChange={changeFilters} hasQuery={!!trimmed} />

      {searching && <div style={{ padding: '32px 0', display: 'flex', justifyContent: 'center' }}><Spin /></div>}

      {!searching && discoverQ.isError && (
        <Notice tone="error" style={{ borderRadius: 8, marginBottom: 10 }}>
          ❌ {discoverQ.error?.response?.data?.message ?? 'Không tải được danh sách từ TMDB'}
        </Notice>
      )}

      {!searching && results.length > 0 && (
        <>
          <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, margin: '0 0 8px' }}>
            {discoverQ.data?.isFiltered
              ? `${results.length} ${noun} phù hợp ở trang này`
              : `${(discoverQ.data?.totalResults ?? 0).toLocaleString()} kết quả`} — trang {pageStack.length}
          </p>
          {notes.map((n) => (
            <p key={n} style={{ fontFamily: FONT, fontSize: 10.5, color: TONE.warn, margin: '0 0 6px', lineHeight: 1.5 }}>⚠️ {n}</p>
          ))}

          <BulkBar
            selectableCount={selectableIds.length} selectedCount={selected.size} stats={stats}
            onSelectAll={() => setSelected(new Set(selectableIds))}
            onClear={() => setSelected(new Set())}
            onImport={importSelected}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {results.map((item) => (
              <TmdbResultCard
                key={item.id} item={item} isMovie={isMovie}
                job={jobOf(item.id)} imported={isDone(item.id)}
                selected={selected.has(item.id)} onToggle={toggleSelect} onImport={() => importOne(item)}
              />
            ))}
          </div>

          {(pageStack.length > 1 || nextPage) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, gap: 8 }}>
              <button type="button" disabled={pageStack.length <= 1} style={pagerBtn(pageStack.length <= 1)} onClick={() => goToPage((s) => s.slice(0, -1))}>
                ← Trước
              </button>
              <span style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted }}>Trang {pageStack.length}</span>
              <button type="button" disabled={!nextPage} style={pagerBtn(!nextPage)} onClick={() => goToPage((s) => [...s, nextPage])}>
                Sau →
              </button>
            </div>
          )}
        </>
      )}

      {!searching && !hasInput && (
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: T.accentLight, border: `1px solid ${T.accent}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
          }}>
            {isMovie ? <Film size={22} color={T.accent} strokeWidth={1.5} /> : <Tv size={22} color={T.accent} strokeWidth={1.5} />}
          </div>
          <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted, margin: 0 }}>
            Nhập tên {noun} hoặc chọn bộ lọc để duyệt TMDB
          </p>
        </div>
      )}

      {!searching && hasInput && !discoverQ.isError && results.length === 0 && (
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.textMuted, margin: '0 0 4px' }}>Không tìm thấy kết quả</p>
          <p style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, margin: 0 }}>Thử từ khóa khác, tên tiếng Anh hoặc nới lỏng bộ lọc</p>
        </div>
      )}
    </>
  );
}

// ── Tab nhập ID ───────────────────────────────────────────────────────────────
function IdTab({ kind }) {
  const isMovie = kind === 'movie';
  const [rawId, setRawId] = useState('');
  const [lastKey, setLastKey] = useState(null);

  const jobs = useImportJobs();
  const job = lastKey ? jobs[lastKey] : null;
  const busy = isActive(job);
  const trimmed = rawId.trim();
  const tmdbId = /^\d+$/.test(trimmed) ? Number(trimmed) : null;

  const submit = () => {
    if (!tmdbId || busy) return;
    enqueueImports([{ kind, tmdbId, title: `TMDB #${tmdbId}` }]);
    setLastKey(jobKey(kind, tmdbId));
    setRawId('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ padding: 14, borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <Hash size={13} color={T.textMuted} style={{ marginTop: 2, flexShrink: 0 }} />
        <p style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, lineHeight: 1.65, margin: 0 }}>
          Tìm ID tại <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" style={{ color: T.accentText }}>themoviedb.org</a>
          {' '}— URL dạng{' '}
          <code style={{ color: T.textSub, fontSize: 11, background: T.bg, padding: '1px 5px', borderRadius: 4 }}>
            {isMovie ? '/movie/496243' : '/tv/1396'}
          </code>
        </p>
      </div>

      {!isMovie && (
        <div style={{ padding: '10px 12px', borderRadius: 8, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <Clock size={13} color="#3B82F6" style={{ marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontFamily: FONT, fontSize: 11.5, color: '#1D4ED8', lineHeight: 1.6, margin: 0 }}>
            TV show import lâu hơn phim vì backend fetch từng season và tập từ TMDB. Show nhiều season (One Piece, Naruto…)
            có thể mất <strong>30–60 giây</strong>. Import chạy nền — bạn có thể đóng panel.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          TMDB {isMovie ? 'Movie' : 'TV Show'} ID
        </label>
        <input
          inputMode="numeric" placeholder={isMovie ? 'VD: 496243' : 'VD: 1396'}
          value={rawId} onChange={(e) => setRawId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()}
          style={{ height: 42, padding: '0 14px', borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, fontFamily: FONT, fontSize: 13.5, color: T.text, outline: 'none' }}
        />
      </div>

      <button
        type="button" onClick={submit} disabled={busy || !tmdbId}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px 0', borderRadius: 10,
          border: 'none', background: T.accent, fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: '#fff',
          cursor: !tmdbId || busy ? 'default' : 'pointer', opacity: !tmdbId || busy ? 0.5 : 1, transition: 'all 0.15s',
        }}
      >
        {busy
          ? <><Spin color="#fff" /> {isMovie ? 'Đang import…' : 'Đang fetch seasons & cast…'}</>
          : <><Download size={15} /> Import {isMovie ? 'phim' : 'TV show'} này</>}
      </button>

      {busy && <JobProgress job={job} />}

      {job?.status === 'done' && job.result && (
        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #86EFAC' }}>
          <ResultBadges result={job.result} kind={kind} />
        </div>
      )}
      {job?.status === 'exists' && (
        <Notice tone="warn" style={{ borderRadius: 10 }}>{isMovie ? 'Phim' : 'TV show'} đã được import trước đó</Notice>
      )}
      {job?.status === 'failed' && <Notice tone="error" style={{ borderRadius: 10 }}>{job.error ?? 'Import thất bại'}</Notice>}
    </div>
  );
}

// ── Nội dung 1 tab chính (Phim / TV Show) ─────────────────────────────────────
const SUB_TABS = [
  { key: 'search', label: '🔍 Tìm theo tên' },
  { key: 'id', label: '# Nhập ID' },
];

function TabContent({ kind }) {
  const [subTab, setSubTab] = useState('search');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, flexShrink: 0, paddingLeft: 20 }}>
        {SUB_TABS.map(({ key, label }) => (
          <button
            key={key} type="button" onClick={() => setSubTab(key)}
            style={{
              padding: '10px 16px', background: 'none', border: 'none', marginBottom: -1, cursor: 'pointer',
              borderBottom: `2px solid ${subTab === key ? T.accent : 'transparent'}`,
              fontFamily: FONT, fontSize: 12.5, fontWeight: subTab === key ? 700 : 400,
              color: subTab === key ? T.accentText : T.textMuted, transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Cả hai tab luôn mounted (chỉ ẩn) để giữ từ khoá / bộ lọc khi chuyển qua lại */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: T.bg }}>
        <div style={{ display: subTab === 'search' ? 'block' : 'none' }}><SearchTab kind={kind} /></div>
        <div style={{ display: subTab === 'id' ? 'block' : 'none' }}><IdTab kind={kind} /></div>
      </div>
    </div>
  );
}

// ── Panel (export) ────────────────────────────────────────────────────────────
const MAIN_TABS = [
  { key: 'movie', label: '🎬 Phim' },
  { key: 'tv', label: '📺 TV Show' },
];

export default function AdminTmdbSearch({ onClose, onImported, defaultTab = 'movie', singleTab = false }) {
  const [mainTab, setMainTab] = useState(defaultTab);
  const kind = singleTab ? defaultTab : mainTab;

  // Làm mới dữ liệu cục bộ của trang cha khi có phim import xong (đã debounce, kể cả import chạy nền)
  useOnImportsSettled(onImported);

  const headerTitle = singleTab ? (kind === 'movie' ? 'Import Phim' : 'Import TV Show') : 'Import Nội Dung';

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, zIndex: 200, background: T.surface,
        borderLeft: `1px solid ${T.borderMed ?? T.border}`, display: 'flex', flexDirection: 'column',
        boxShadow: T.shadowLg ?? '0 20px 60px rgba(0,0,0,0.15)', fontFamily: FONT,
      }}
    >
      <div style={{ padding: '20px 20px 0', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <p style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px', fontWeight: 600 }}>TMDB</p>
            <h2 style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.01em' }}>{headerTitle}</h2>
          </div>
          {onClose && (
            <button
              type="button" onClick={onClose} aria-label="Đóng"
              style={{ width: 32, height: 32, borderRadius: '50%', background: T.bg, border: `1px solid ${T.border}`, cursor: 'pointer', color: T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {singleTab ? (
          <div style={{ marginBottom: 12 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: T.accent,
              fontFamily: FONT, fontSize: 11.5, fontWeight: 700, color: '#fff', boxShadow: `0 2px 8px ${T.accent}50`,
            }}>
              {kind === 'movie' ? <Film size={12} /> : <Tv size={12} />}
              {kind === 'movie' ? 'Chỉ import phim' : 'Chỉ import TV show'}
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', marginBottom: -1 }}>
            {MAIN_TABS.map(({ key, label }) => (
              <button
                key={key} type="button" onClick={() => setMainTab(key)}
                style={{
                  padding: '9px 18px', background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: `2px solid ${mainTab === key ? T.accent : 'transparent'}`,
                  fontFamily: FONT, fontSize: 13, fontWeight: mainTab === key ? 700 : 500,
                  color: mainTab === key ? T.accentText : T.textMuted, transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={kind}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            <TabContent kind={kind} />
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}