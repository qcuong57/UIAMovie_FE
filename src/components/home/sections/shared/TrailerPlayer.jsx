// src/components/home/sections/shared/TrailerPlayer.jsx
// Phát trailer: ưu tiên YouTube (iframe muted autoplay), sau đó video upload. Dùng cho billboard và trailer.
// Cần normalizeHomeCard giữ lại trailerKey và trailerVideoUrl; thiếu thì layout rơi về ảnh tĩnh.
//
// Âm thanh (muted / volume) được điều khiển bằng lệnh, KHÔNG nằm trong src → đổi tiếng không làm tải lại trailer.
//  • YouTube: iframe luôn khởi động mute=1 (để autoplay được), sau đó gửi lệnh mute/unMute/setVolume qua postMessage.
//  • Video upload: đặt thẳng video.muted / video.volume.
import React, { useEffect, useMemo, useRef, useState } from 'react';

const YT_ORIGIN = 'https://www.youtube-nocookie.com';
// YouTube hiện lớp phủ (tiêu đề, nút ⏸ ⏮ ⏭, 'More videos', logo) vài giây đầu → chờ lớp phủ tự tắt rồi mới lộ iframe
const REVEAL_DELAY = 0;

// `persist` (mobile): iframe được GIỮ NGUYÊN giữa các phim và chỉ đổi video bằng lệnh loadVideoById.
// Lý do: iOS Safari chỉ cho autoplay ở lần đầu; iframe mới tạo ra sau đó (không có thao tác chạm) bị chặn → hiện YouTube ở trạng thái pause.
// Dùng lại đúng một phần tử <video> đã được phép phát thì các trailer sau vẫn tự chạy.
function YouTubePlayer({ item, trailerKey: k, active, muted, volume, style, onStall, clean }) {
  const frameRef = useRef(null);
  const audioRef = useRef({ muted, volume });
  audioRef.current = { muted, volume };
  const live = useRef({ k, active });
  live.current = { k, active };
  // Chỉ hiện iframe khi trailer thực sự đang chạy → không lộ nút play / vòng quay tải của YouTube
  const [shown, setShown] = useState(false);
  // iOS Safari/Low Power Mode chặn autoplay: không tự phát được thì cho người xem chạm thẳng vào iframe (nút ▶ của YouTube)
  const [tap, setTap] = useState(false);
  const timers = useRef([]);
  const stallTimer = useRef(null);
  const gotMsg = useRef(false); // player đã phản hồi ít nhất 1 lần (bắt tay thành công)
  const started = useRef(false); // video hiện tại đã phát thật (state 1) → từ đây KHÔNG ẩn iframe nữa
  const lastResume = useRef(0);
  const revealTimer = useRef(null);
  const shownRef = useRef(false); // iframe đã lộ ra chưa (mobile: giữ im lặng cho tới lúc đó)
  const loadedKey = useRef(k); // video đang nằm trong iframe

  // src chỉ dựng từ video ĐẦU TIÊN → không bao giờ đổi (đổi video bằng loadVideoById, đổi âm lượng bằng lệnh)
  const src = useMemo(() => {
    const origin = typeof window !== 'undefined' ? `&origin=${encodeURIComponent(window.location.origin)}` : '';
    const loop = clean ? '' : `&loop=1&playlist=${k}`; // clean (mobile): không dùng playlist → không hiện nút ⏮ ⏭
    return `${YT_ORIGIN}/embed/${k}?autoplay=1&mute=1&controls=0${loop}&modestbranding=1&playsinline=1&rel=0&disablekb=1&fs=0&iv_load_policy=3&enablejsapi=1${origin}`;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const send = (func, args = []) => {
    frameRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), YT_ORIGIN);
  };

  const applyAudio = () => {
    const { muted: mu, volume: v } = audioRef.current;
    const m = mu || (clean && !shownRef.current); // mobile: chưa thấy hình thì chưa cho có tiếng
    send('setVolume', [Math.round(v)]);
    send(m || v === 0 ? 'mute' : 'unMute');
  };

  // Mobile: sau 5s chưa phát được (iOS chặn autoplay) → bật chế độ chạm để người xem tự bấm ▶ của YouTube
  const armStall = () => {
    clearTimeout(stallTimer.current);
    if (!clean) return;
    stallTimer.current = setTimeout(() => {
      if (live.current.active && !started.current) { setTap(true); setShown(true); }
    }, 5000);
  };

  // Chuyển sang video mới / phát lại trong CÙNG iframe
  const start = () => {
    const { k: want } = live.current;
    started.current = false;
    clearTimeout(revealTimer.current); revealTimer.current = null;
    setShown(false); setTap(false);
    if (loadedKey.current !== want) {
      loadedKey.current = want;
      send('loadVideoById', [{ videoId: want, startSeconds: 0 }]);
    } else {
      send('playVideo');
    }
    applyAudio();
    armStall();
  };

  const stop = () => {
    clearTimeout(stallTimer.current);
    clearTimeout(revealTimer.current); revealTimer.current = null;
    started.current = false;
    setShown(false); setTap(false);
    send('pauseVideo');
  };

  // Đổi phim / bật-tắt: đổi video hoặc dừng (chỉ khi player đã bắt tay xong; lần đầu do onLoad/onReady lo)
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    if (!gotMsg.current) return;
    if (active) start(); else stop();
  }, [k, active]); // eslint-disable-line react-hooks/exhaustive-deps

  // Áp lại mỗi khi người dùng đổi tiếng (không đụng tới iframe)
  useEffect(() => { shownRef.current = shown; applyAudio(); }, [muted, volume, shown]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onMessage = (e) => {
      if (e.origin !== YT_ORIGIN || e.source !== frameRef.current?.contentWindow) return;
      let data = e.data;
      if (typeof data === 'string') { try { data = JSON.parse(data); } catch { return; } }
      gotMsg.current = true;
      if (data?.event === 'onReady') {
        applyAudio();
        if (live.current.active) {
          if (loadedKey.current !== live.current.k) start(); else send('playVideo');
        }
      }
      if (!live.current.active) return; // đang tắt: bỏ qua mọi trạng thái (kể cả 'paused' do chính mình ra lệnh)

      // Trạng thái player: 1 đang phát. Khi đã phát thật rồi mà player báo -1/2/5 thì KHÔNG ẩn iframe về ảnh nền
      // mà ra lệnh phát lại.
      const state = data?.event === 'onStateChange' ? data.info : data?.info?.playerState;
      if (typeof state === 'number') {
        if (state === 1) {
          started.current = true;
          clearTimeout(stallTimer.current);
          setTap(false);
          // Lộ iframe sau REVEAL_DELAY (mặc định 0); trong lúc chờ vẫn thấy ảnh nền
          if (!revealTimer.current) revealTimer.current = setTimeout(() => setShown(true), clean ? REVEAL_DELAY : 0);
        } else if (state === 0 && clean) {
          // Hết video: tự phát lại từ đầu (không dùng loop/playlist) và giấu màn hình 'More videos'
          clearTimeout(revealTimer.current); revealTimer.current = null;
          setShown(false); send('seekTo', [0, true]); send('playVideo');
        } else if (started.current && (state === -1 || state === 2 || state === 5)) {
          const now = Date.now();
          if (now - lastResume.current > 800) { lastResume.current = now; send('playVideo'); }
        }
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Iframe tải xong → đăng ký nhận sự kiện của player. Lặp lại tới khi player phản hồi, vì nếu 'listening'
  // tới trước khi player sẵn sàng thì sẽ không nhận được onStateChange.
  const onLoad = () => {
    gotMsg.current = false;
    const listen = () =>
      frameRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), YT_ORIGIN);
    listen();
    applyAudio();
    let tries = 0;
    const id = setInterval(() => {
      if (gotMsg.current || ++tries > 12) { clearInterval(id); return; }
      listen(); applyAudio(); if (live.current.active) send('playVideo');
    }, 350);
    timers.current.push(id);
    if (clean) {
      armStall();
    } else {
      // Phòng hờ: 4s vẫn không có tín hiệu nào thì cứ hiện iframe (autoplay muted hầu như luôn chạy)
      timers.current.push(setTimeout(() => { if (!gotMsg.current) setShown(true); }, 4000));
      // Player có phản hồi nhưng 7s vẫn chưa phát được → tải lại iframe (tối đa 2 lần, do wrapper giới hạn)
      timers.current.push(setTimeout(() => { if (gotMsg.current && !started.current) onStall?.(); }, 7000));
    }
  };

  useEffect(() => () => {
    timers.current.forEach((t) => { clearInterval(t); clearTimeout(t); });
    clearTimeout(revealTimer.current); clearTimeout(stallTimer.current);
  }, []);

  return (
    <iframe
      ref={frameRef} title={`Trailer ${item.title}`} src={src} onLoad={onLoad}
      allow="autoplay; encrypted-media" tabIndex={tap ? 0 : -1}
      // opacity 0.01 thay vì 0: WebKit coi phần tử opacity 0 là "không nhìn thấy" và có thể không cho video autoplay
      style={{ position: 'absolute', border: 0, pointerEvents: tap ? 'auto' : 'none', opacity: shown ? 1 : 0.01, transition: 'opacity .5s ease', ...style }}
    />
  );
}

function UploadedVideo({ item, muted, volume, style }) {
  const ref = useRef(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.volume = Math.min(1, Math.max(0, volume / 100));
    v.muted = muted || volume === 0;
  }, [muted, volume]);

  // iOS Safari đôi khi bỏ qua thuộc tính autoPlay → chủ động gọi play() khi đủ dữ liệu (video đang muted nên được phép)
  const tryPlay = () => { const v = ref.current; if (v && v.paused) v.play?.().catch(() => {}); };
  useEffect(() => { tryPlay(); }, []);

  // `muted` luôn có ở lần render đầu để autoplay được; sau đó effect ở trên quản lý
  return (
    <video
      ref={ref} src={item.trailerVideoUrl} autoPlay muted loop playsInline preload="auto" disablePictureInPicture
      onCanPlay={tryPlay}
      style={{ position: 'absolute', objectFit: 'cover', pointerEvents: 'none', ...style }}
    />
  );
}

// Ưu tiên YouTube (iframe muted autoplay), sau đó video upload. Không có thì trả null.
// persist (mobile): giữ một iframe duy nhất qua các phim; `active` = có đang tới lượt phát không.
export default function TrailerPlayer({ item, muted = true, volume = 60, style, clean = false, persist = false, active = true }) {
  const [retry, setRetry] = useState({ id: '', n: 0 });
  const tries = retry.id === item.trailerKey ? retry.n : 0;
  if (item.trailerKey) {
    return (
      <YouTubePlayer
        key={persist ? 'yt' : `${item.trailerKey}-${tries}`} item={item} trailerKey={item.trailerKey} active={active}
        muted={muted} volume={volume} style={style} clean={clean}
        onStall={() => { if (!persist && tries < 2) setRetry({ id: item.trailerKey, n: tries + 1 }); }}
      />
    );
  }
  if (item.trailerVideoUrl) {
    if (!active) return null;
    return <UploadedVideo key={item.trailerVideoUrl} item={item} muted={muted} volume={volume} style={style} />;
  }
  return null;
}

export const hasTrailer = (i) => Boolean(i.trailerKey || i.trailerVideoUrl);

// Phóng to khung trailer để lấp đầy tỉ lệ 16:9 → 21:9, tránh viền đen
export const TRAILER_FILL = { top: '50%', left: '50%', width: '100%', height: '170%', transform: 'translate(-50%,-50%)' };

// Khung đã đúng tỉ lệ 16:9 (kiểu TrailerSection / Billboard mới) → iframe phủ vừa khít, thấy trọn trailer, không cắt
export const TRAILER_FIT = { top: 0, left: 0, width: '100%', height: '100%' };