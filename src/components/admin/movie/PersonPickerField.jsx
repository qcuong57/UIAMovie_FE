// src/components/admin/movie/PersonPickerField.jsx
// Ô chọn diễn viên/đạo diễn dùng chung cho MovieAddModal & MovieEditModal.
// Hỗ trợ:
//   1) Autocomplete tìm Person có sẵn trong DB (movieService.searchPersons) → chọn = gắn PersonId
//   2) Nhập tay tên mới chưa có trong DB → tạo entry với PersonId=null, TmdbPersonId=null
//      (backend sẽ match theo Name hoặc tạo Person mới khi lưu — xem UpsertPersonAsync)
//
// Dùng chung 1 "person" shape nội bộ:
//   { personId, tmdbPersonId, name, character, order, profileUrl }
// character chỉ áp dụng cho cast, bỏ qua với director.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Plus, User, GripVertical } from 'lucide-react';
import movieService from '../../../services/movieService';
import { T, FONT_BODY as FONT } from '../../../context/adminTokens';

let uidSeq = 0;
const nextUid = () => `p_${Date.now()}_${uidSeq++}`;

/** Hook debounce đơn giản cho search input */
function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/**
 * Ô search + dropdown gợi ý Person. Khi chọn 1 kết quả hoặc nhấn "Thêm mới",
 * gọi onPick(personLike) rồi tự xoá input.
 *   personLike (từ DB)   → { id, name, profileUrl, tmdbPersonId }
 *   personLike (nhập tay) → { id: null, name, profileUrl: null, tmdbPersonId: null }
 */
function PersonSearchInput({ placeholder, onPick, excludeIds = [] }) {
  const [query, setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]     = useState(false);
  const debouncedQuery = useDebounced(query, 300);
  const boxRef = useRef(null);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (q.length < 2) { setResults([]); return; }
    let cancelled = false;
    setLoading(true);
    movieService.searchPersons(q)
      .then(res => {
        if (cancelled) return;
        const list = res?.data ?? res ?? [];
        setResults(Array.isArray(list) ? list : []);
      })
      .catch(() => { if (!cancelled) setResults([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const filteredResults = results.filter(r => !excludeIds.includes(r.id));
  const trimmed = query.trim();
  const exactMatch = filteredResults.some(r => r.name.toLowerCase() === trimmed.toLowerCase());

  const pick = (person) => {
    onPick(person);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const addManual = () => {
    if (!trimmed) return;
    pick({ id: null, name: trimmed, profileUrl: null, tmdbPersonId: null });
  };

  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Search size={14} color={T.textMuted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => { if (e.key === 'Enter' && trimmed && !exactMatch) { e.preventDefault(); addManual(); } }}
          placeholder={placeholder}
          style={{
            width: '100%', height: 40, padding: '0 14px 0 34px',
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 10, color: T.text, outline: 'none',
            fontFamily: FONT, fontSize: 13, boxSizing: 'border-box',
          }}
        />
      </div>

      {open && trimmed.length >= 1 && (
        <div style={{
          position: 'absolute', top: 44, left: 0, right: 0, zIndex: 20,
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
          boxShadow: T.shadowLg, maxHeight: 240, overflowY: 'auto',
        }}>
          {trimmed.length < 2 && (
            <p style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, padding: '10px 12px', margin: 0 }}>
              Gõ thêm để tìm kiếm...
            </p>
          )}

          {trimmed.length >= 2 && loading && (
            <p style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, padding: '10px 12px', margin: 0 }}>
              Đang tìm...
            </p>
          )}

          {trimmed.length >= 2 && !loading && filteredResults.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => pick(p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '8px 12px', background: 'transparent', border: 'none',
                cursor: 'pointer', textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {p.profileUrl
                ? <img src={p.profileUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: 28, height: 28, borderRadius: '50%', background: T.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><User size={13} color={T.textMuted} /></div>
              }
              <span style={{ fontFamily: FONT, fontSize: 13, color: T.text, flex: 1 }}>{p.name}</span>
              {p.tmdbPersonId && <span style={{ fontFamily: FONT, fontSize: 10, color: T.textMuted }}>TMDB</span>}
            </button>
          ))}

          {trimmed.length >= 2 && !loading && filteredResults.length === 0 && (
            <p style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, padding: '10px 12px', margin: 0 }}>
              Không tìm thấy trong hệ thống
            </p>
          )}

          {trimmed.length >= 1 && !exactMatch && (
            <button
              type="button"
              onClick={addManual}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '10px 12px', background: 'transparent',
                border: 'none', borderTop: filteredResults.length ? `1px solid ${T.border}` : 'none',
                cursor: 'pointer', textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.background = T.accentLight}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Plus size={14} color={T.accentText} />
              <span style={{ fontFamily: FONT, fontSize: 13, color: T.accentText, fontWeight: 600 }}>
                Thêm mới “{trimmed}” (chưa có trong hệ thống)
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Cast (nhiều diễn viên, có vai diễn + thứ tự) ───────────────────────────────
/**
 * Props:
 *   value    – Array<{ uid, personId, tmdbPersonId, name, character, order, profileUrl }>
 *   onChange – (nextArray) => void
 */
export function CastPickerField({ value = [], onChange }) {
  const handlePick = useCallback((person) => {
    const entry = {
      uid: nextUid(),
      personId: person.id ?? null,
      tmdbPersonId: person.tmdbPersonId ?? null,
      name: person.name,
      character: '',
      order: value.length,
      profileUrl: person.profileUrl ?? null,
    };
    onChange([...value, entry]);
  }, [value, onChange]);

  const updateCharacter = (uid, character) => {
    onChange(value.map(c => c.uid === uid ? { ...c, character } : c));
  };

  const remove = (uid) => {
    onChange(value.filter(c => c.uid !== uid).map((c, i) => ({ ...c, order: i })));
  };

  const move = (from, to) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next.map((c, i) => ({ ...c, order: i })));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        Diễn viên
      </label>

      <PersonSearchInput
        placeholder="Tìm hoặc thêm diễn viên..."
        onPick={handlePick}
        excludeIds={value.map(c => c.personId).filter(Boolean)}
      />

      {value.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 }}>
          {value.map((c, i) => (
            <div key={c.uid} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 10px', borderRadius: 9,
              background: T.surfaceAlt, border: `1px solid ${T.border}`,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0}
                  style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', color: i === 0 ? T.border : T.textMuted, padding: 0, lineHeight: 0 }}
                  title="Lên">▲</button>
                <button type="button" onClick={() => move(i, i + 1)} disabled={i === value.length - 1}
                  style={{ background: 'none', border: 'none', cursor: i === value.length - 1 ? 'default' : 'pointer', color: i === value.length - 1 ? T.border : T.textMuted, padding: 0, lineHeight: 0 }}
                  title="Xuống">▼</button>
              </div>

              {c.profileUrl
                ? <img src={c.profileUrl} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: 30, height: 30, borderRadius: '50%', background: T.surface, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><User size={13} color={T.textMuted} /></div>
              }

              <div style={{ flex: '0 0 34%', minWidth: 0 }}>
                <p style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: T.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.name}
                </p>
                {!c.personId && !c.tmdbPersonId && (
                  <p style={{ fontFamily: FONT, fontSize: 10, color: T.accentText, margin: 0 }}>Mới (nhập tay)</p>
                )}
              </div>

              <input
                value={c.character}
                onChange={e => updateCharacter(c.uid, e.target.value)}
                placeholder="Vai diễn..."
                style={{
                  flex: 1, height: 32, padding: '0 10px',
                  background: T.surface, border: `1px solid ${T.border}`,
                  borderRadius: 7, color: T.text, outline: 'none',
                  fontFamily: FONT, fontSize: 12.5, boxSizing: 'border-box', minWidth: 0,
                }}
              />

              <button
                type="button"
                onClick={() => remove(c.uid)}
                style={{ width: 26, height: 26, borderRadius: '50%', background: T.surface, border: `1px solid ${T.border}`, cursor: 'pointer', color: T.red, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Director (1 người duy nhất) ─────────────────────────────────────────────────
/**
 * Props:
 *   value    – { personId, tmdbPersonId, name, profileUrl } | null
 *   onChange – (nextValueOrNull) => void
 */
export function DirectorPickerField({ value, onChange }) {
  const handlePick = (person) => {
    onChange({
      personId: person.id ?? null,
      tmdbPersonId: person.tmdbPersonId ?? null,
      name: person.name,
      profileUrl: person.profileUrl ?? null,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        Đạo diễn
      </label>

      {value?.name ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', borderRadius: 9,
          background: T.surfaceAlt, border: `1px solid ${T.border}`,
        }}>
          {value.profileUrl
            ? <img src={value.profileUrl} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: 30, height: 30, borderRadius: '50%', background: T.surface, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><User size={13} color={T.textMuted} /></div>
          }
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {value.name}
            </p>
            {!value.personId && !value.tmdbPersonId && (
              <p style={{ fontFamily: FONT, fontSize: 10, color: T.accentText, margin: 0 }}>Mới (nhập tay)</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            style={{ width: 26, height: 26, borderRadius: '50%', background: T.surface, border: `1px solid ${T.border}`, cursor: 'pointer', color: T.red, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <PersonSearchInput placeholder="Tìm hoặc thêm đạo diễn..." onPick={handlePick} />
      )}
    </div>
  );
}

// ── Helpers chuyển đổi sang shape DTO backend (ImportCastDTO / ImportDirectorDTO) ──
export function castStateToDto(castState) {
  return castState.map(c => ({
    personId: c.personId ?? null,
    tmdbPersonId: c.tmdbPersonId ?? null,
    name: c.name,
    character: c.character || '',
    order: c.order,
    profileUrl: c.profileUrl ?? null,
  }));
}

export function directorStateToDto(directorState) {
  if (!directorState || !directorState.name) return { name: '' }; // gửi rỗng = xoá đạo diễn
  return {
    personId: directorState.personId ?? null,
    tmdbPersonId: directorState.tmdbPersonId ?? null,
    name: directorState.name,
    profileUrl: directorState.profileUrl ?? null,
  };
}