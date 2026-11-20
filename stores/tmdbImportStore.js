// src/stores/tmdbImportStore.js
// Trình quản lý import TMDB chạy NỀN, nằm ngoài React:
//  • đóng panel / chuyển trang vẫn tiếp tục theo dõi tiến trình;
//  • mỗi job được lưu vào localStorage (kèm jobId của server) → reload trang vẫn tiếp tục poll;
//  • hàng đợi có giới hạn song song theo loại (phim nhẹ hơn TV show);
//  • lịch sử các lần import gần đây được giữ lại để biết phim nào đã import.
//
// Server: POST {base}/{tmdbId}/import → { jobId } (202), GET /admin/tmdb/import-jobs/{jobId}
//   → { status: 'running' | 'done' | 'failed', step?, progress? (0–100), result?, error?, errorStatus? }
// `progress` là tuỳ chọn: chưa có thì UI hiện thanh không xác định (không giả số %).

import axiosInstance from '../src/config/axios';
import tmdbService from '../src/services/tmdbService';
import { queryKeys, CATALOG_ROOTS } from '../src/config/queryKeys';

const STORAGE_KEY = 'admin.tmdbImports.v1';
const CONCURRENCY = { movie: 3, tv: 2 };
const POLL_MS = 1500;
const POLL_HIDDEN_MS = 5000;       // tab bị ẩn thì poll thưa hơn
const MAX_WAIT_MS = 30 * 60 * 1000;
const MAX_POLL_ERRORS = 5;          // số lần poll lỗi mạng liên tiếp trước khi bỏ cuộc
const SETTLE_DEBOUNCE_MS = 800;     // gom nhiều job xong liên tiếp thành 1 lần làm mới cache
const KEEP_FINISHED_MS = 24 * 60 * 60 * 1000;
const MAX_JOBS = 50;

// ── Helpers ───────────────────────────────────────────────────────────────────
const base = (kind) => (kind === 'movie' ? '/movies/tmdb' : '/tvshows/tmdb');
const unwrap = (res) => {
  const envelope = res?.data ?? res;
  return envelope?.data ?? envelope;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const toPercent = (v) => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Math.min(100, Math.max(0, Number(v))) : null);
const isTransient = (status) => !status || status >= 500;

export const jobKey = (kind, tmdbId) => `${kind}:${tmdbId}`;
export const isActive  = (job) => job?.status === 'queued' || job?.status === 'running';
export const isSuccess = (job) => job?.status === 'done' || job?.status === 'exists';

// ── State (immutable, đọc qua useSyncExternalStore) ──────────────────────────
function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    const cutoff = Date.now() - KEEP_FINISHED_MS;
    return Object.fromEntries(
      Object.entries(raw).filter(([, j]) => isActive(j) || (j.finishedAt ?? 0) > cutoff),
    );
  } catch {
    return {};
  }
}

function save(state) {
  try {
    // Job đang chạy/chờ luôn được giữ; chỉ cắt bớt job đã xong (cũ nhất trước)
    const all = Object.values(state);
    const live = all.filter(isActive);
    const finished = all
      .filter((j) => !isActive(j))
      .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))
      .slice(0, Math.max(0, MAX_JOBS - live.length));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries([...live, ...finished].map((j) => [j.key, j]))));
  } catch { /* hết dung lượng / private mode: bỏ qua, store vẫn chạy trong bộ nhớ */ }
}

let jobs = load();
let queryClient = null;
let started = false;

const listeners = new Set();
const settledListeners = new Set();
const running = new Set();      // key các job đang được tab này theo dõi
const dirtyKinds = new Set();   // loại vừa có job xong → cần làm mới danh sách tương ứng
let settleTimer = null;

export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const getJobs = () => jobs;
/** Gọi (đã debounce) sau khi một nhóm job vừa xong — dùng để panel/trang làm mới dữ liệu cục bộ. */
export const subscribeSettled = (fn) => { settledListeners.add(fn); return () => settledListeners.delete(fn); };

function commit(next) {
  jobs = next;
  save(jobs);
  listeners.forEach((l) => l());
}

function patch(key, changes) {
  if (jobs[key]) commit({ ...jobs, [key]: { ...jobs[key], ...changes } });
}

// ── Làm mới cache sau khi import xong ────────────────────────────────────────
function invalidateCaches() {
  if (!queryClient) return;
  for (const kind of dirtyKinds) {
    queryClient.invalidateQueries({
      queryKey: kind === 'movie' ? queryKeys.admin.movies.all : queryKeys.admin.tvShows.lists(),
    });
  }
  dirtyKinds.clear();
  queryClient.invalidateQueries({ queryKey: queryKeys.admin.persons.lists() }); // cast / đạo diễn mới
  queryClient.invalidateQueries({ queryKey: queryKeys.genres.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.admin.tmdb.existingAll() });          // nhãn "Đã có"
  queryClient.invalidateQueries({ predicate: (q) => CATALOG_ROOTS.has(q.queryKey[0]) });
}

function scheduleSettle(kind) {
  dirtyKinds.add(kind);
  clearTimeout(settleTimer);
  settleTimer = setTimeout(() => {
    invalidateCaches();
    settledListeners.forEach((fn) => fn());
  }, SETTLE_DEBOUNCE_MS);
}

// ── Chạy một job ─────────────────────────────────────────────────────────────
async function startRemote(kind, tmdbId) {
  for (let attempt = 0; ; attempt++) {
    try {
      return unwrap(await axiosInstance.post(`${base(kind)}/${tmdbId}/import`)).jobId;
    } catch (err) {
      // Lỗi mạng / 5xx: thử lại 1 lần. Nếu lần 1 thực ra đã tạo job thì server trả 409 → coi như "đã có".
      if (attempt < 1 && isTransient(err?.response?.status)) { await sleep(1000); continue; }
      throw err;
    }
  }
}

const httpError = (message, status) => Object.assign(new Error(message), { response: { status, data: { message } } });

/** Server không còn job (restart / hết hạn lưu): nếu phim đã vào DB thì coi như xong thay vì báo lỗi. */
async function explainMissingJob(key) {
  const { kind, tmdbId } = jobs[key] ?? {};
  try {
    const existing = kind ? await tmdbService.getExisting(kind, [tmdbId]) : [];
    if (existing.includes(tmdbId)) return httpError('Đã có trong thư viện', 409);
  } catch { /* bỏ qua, báo lỗi 404 bên dưới */ }
  return httpError('Server không còn lưu tiến trình này (có thể vừa khởi động lại). Hãy kiểm tra lại danh sách.', 404);
}

async function waitForJob(key, jobId) {
  const deadline = Date.now() + MAX_WAIT_MS;
  let errors = 0;

  while (Date.now() < deadline) {
    await sleep(typeof document !== 'undefined' && document.hidden ? POLL_HIDDEN_MS : POLL_MS);

    let remote;
    try {
      remote = unwrap(await axiosInstance.get(`/admin/tmdb/import-jobs/${jobId}`));
      errors = 0;
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) throw await explainMissingJob(key);
      if (++errors >= MAX_POLL_ERRORS) throw err;
      continue; // mất mạng thoáng qua: poll tiếp
    }

    const step = remote.step ?? null;
    const progress = toPercent(remote.progress);
    const current = jobs[key];
    if (current && (current.step !== step || current.progress !== progress)) patch(key, { step, progress });

    if (remote.status === 'done') return remote.result ?? null;
    if (remote.status === 'failed') throw httpError(remote.error || 'Import thất bại', remote.errorStatus);
  }
  throw httpError('Import quá lâu, hãy kiểm tra lại danh sách sau ít phút.');
}

async function run(key) {
  running.add(key);
  try {
    const { kind, tmdbId, jobId: existingJobId, startedAt } = jobs[key];
    let jobId = existingJobId;

    patch(key, { status: 'running', startedAt: startedAt ?? Date.now() });
    if (!jobId) {
      jobId = await startRemote(kind, tmdbId);
      patch(key, { jobId });
    }

    const result = await waitForJob(key, jobId);
    patch(key, {
      status: 'done', result, progress: 100, error: null, finishedAt: Date.now(),
      // Import theo ID chưa biết tên/poster → lấy từ kết quả nếu server có trả
      title: result?.title ?? result?.name ?? jobs[key]?.title,
      posterUrl: result?.posterUrl ?? jobs[key]?.posterUrl,
    });
    scheduleSettle(kind);
  } catch (err) {
    const status = err?.response?.status;
    const kind = jobs[key]?.kind;
    if (status === 409) {
      patch(key, { status: 'exists', finishedAt: Date.now() }); // đã có trong DB — coi như xong
      if (kind) scheduleSettle(kind);
    } else {
      patch(key, {
        status: 'failed', finishedAt: Date.now(), errorStatus: status,
        error: err?.response?.data?.message ?? err?.message ?? 'Import thất bại',
      });
    }
  } finally {
    running.delete(key);
    pump();
  }
}

/** Đưa job từ hàng đợi vào chạy cho tới khi đủ số luồng song song của từng loại. */
function pump() {
  for (const [kind, limit] of Object.entries(CONCURRENCY)) {
    let free = limit - [...running].filter((k) => jobs[k]?.kind === kind).length;
    const waiting = Object.values(jobs)
      .filter((j) => j.kind === kind && j.status === 'queued' && !running.has(j.key))
      .sort((a, b) => a.createdAt - b.createdAt);
    for (const job of waiting) {
      if (free-- <= 0) break;
      run(job.key);
    }
  }
}

// ── API công khai ────────────────────────────────────────────────────────────
/** Gắn queryClient và tiếp tục các job dang dở từ phiên trước. Gọi 1 lần (idempotent). */
export function initTmdbImports(qc) {
  queryClient = qc;
  if (started) return;
  started = true;

  for (const job of Object.values(jobs)) {
    if (job.status !== 'running') continue;
    if (job.jobId) run(job.key);                       // server vẫn đang chạy → poll tiếp
    else patch(job.key, { status: 'queued' });         // chưa kịp tạo job trên server → xếp lại hàng
  }
  pump();
}

/** items: [{ kind, tmdbId, title, posterUrl }]. Job đang chạy/chờ thì bỏ qua; job cũ (xong/lỗi) được làm lại. */
export function enqueueImports(items) {
  const next = { ...jobs };
  const now = Date.now();
  let changed = false;
  items.forEach(({ kind, tmdbId, title, posterUrl }, i) => {
    const key = jobKey(kind, tmdbId);
    if (isActive(next[key])) return;
    next[key] = {
      key, kind, tmdbId, title: title ?? `TMDB #${tmdbId}`, posterUrl: posterUrl ?? null,
      status: 'queued', jobId: null, step: null, progress: null,
      result: null, error: null, errorStatus: null,
      createdAt: now + i, startedAt: null, finishedAt: null, // +i giữ đúng thứ tự khi thêm hàng loạt
    };
    changed = true;
  });
  if (!changed) return;
  commit(next);
  pump();
}

/** Xoá khỏi danh sách (job đang chạy trên server thì không huỷ được → bỏ qua). */
export function dismissImport(key) {
  if (!jobs[key] || running.has(key)) return;
  const { [key]: _removed, ...rest } = jobs;
  commit(rest);
}

export function clearFinishedImports() {
  commit(Object.fromEntries(Object.entries(jobs).filter(([key, j]) => isActive(j) || running.has(key))));
}