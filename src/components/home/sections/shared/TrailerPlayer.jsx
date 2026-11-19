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
const REVEAL_DELAY = 3000;

function YouTubePlayer({ item, trailerKey: k, muted, volume, style, onStall, clean }) {
  const frameRef = useRef(null);
  const audioRef = useRef({ muted, volume });
  audioRef.current = { muted, volume };
  // Chỉ hiện iframe khi trailer thực sự đang chạy → không lộ nút play / vòng quay tải của YouTube
  const [shown, setShown] = useState(false);
  const timers = useRef([]);
  const gotMsg = useRef(false); // player đã phản hồi ít nhất 1 lần (bắt tay thành công)
  const started = useRef(false); // đã từng phát thật (state 1) → từ đây KHÔNG ẩn iframe nữa
  const lastResume = useRef(0);
  const revealTimer = useRef(null);

  // src chỉ phụ thuộc vào trailerKey → không bao giờ đổi khi bấm âm lượng
  const src = useMemo(() => {
    const origin = typeof window !== 'undefined' ? `&origin=${encodeURIComponent(window.location.origin)}` : '';
    const loop = clean ? '' : `&loop=1&playlist=${k}`; // clean (mobile): không dùng playlist → không hiện nút ⏮ ⏭
    return `${YT_ORIGIN}/embed/${k}?autoplay=1&mute=1&controls=0${loop}&modestbranding=1&playsinline=1&rel=0&disablekb=1&fs=0&iv_load_policy=3&enablejsapi=1${origin}`;
  }, [k, clean]);

  const send = (func, args = []) => {
    frameRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), YT_ORIGIN);
  };

  const applyAudio = () => {
    const { muted: m, volume: v } = audioRef.current;
    send('setVolume', [Math.round(v)]);
    send(m || v === 0 ? 'mute' : 'unMute');
  };

  // Áp lại mỗi khi người dùng đổi tiếng (không đụng tới iframe)
  useEffect(() => { applyAudio(); }, [muted, volume]); // eslint-disable-line react-hooks/exhaustive-deps

  // Khi player báo sẵn sàng thì áp trạng thái âm thanh hiện tại
  useEffect(() => {
    const onMessage = (e) => {
      if (e.origin !== YT_ORIGIN || e.source !== frameRef.current?.contentWindow) return;
      let data = e.data;
      if (typeof data === 'string') { try { data = JSON.parse(data); } catch { return; } }
      gotMsg.current = true;
      if (data?.event === 'onReady') { applyAudio(); send('playVideo'); }

      // Trạng thái player: 1 đang phát. Khi đã phát thật rồi mà player báo -1/2/5 (hay gặp ở iframe thứ 2 trở đi,
      // hoặc khi tab bị ẩn) thì KHÔNG ẩn iframe về ảnh nền nữa mà ra lệnh phát lại.
      const state = data?.event === 'onStateChange' ? data.info : data?.info?.playerState;
      if (typeof state === 'number') {
        if (state === 1) {
          started.current = true;
          // Lộ iframe sau REVEAL_DELAY (lớp phủ của YouTube đã tự ẩn); trong lúc chờ vẫn thấy ảnh nền
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
  }, [k]); // eslint-disable-line react-hooks/exhaustive-deps

  // Iframe tải xong → đăng ký nhận sự kiện của player. Lặp lại tới khi player phản hồi, vì nếu 'listening'
  // tới trước khi player sẵn sàng (hay gặp ở iframe thứ 2 trở đi) thì sẽ không nhận được onStateChange
  // → iframe giữ opacity 0 dù trailer vẫn đang phát (có tiếng nhưng không có hình).
  const onLoad = () => {
    gotMsg.current = false;
    const listen = () =>
      frameRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), YT_ORIGIN);
    listen();
    applyAudio();
    let tries = 0;
    const id = setInterval(() => {
      if (gotMsg.current || ++tries > 12) { clearInterval(id); return; }
      listen(); applyAudio(); send('playVideo');
    }, 350);
    timers.current.push(id);
    // Phòng hờ: 4s vẫn không có tín hiệu nào thì cứ hiện iframe (autoplay muted hầu như luôn chạy)
    timers.current.push(setTimeout(() => { if (!gotMsg.current) setShown(true); }, 4000));
    // Player có phản hồi nhưng 7s vẫn chưa phát được → tải lại iframe (tối đa 2 lần, do wrapper giới hạn)
    timers.current.push(setTimeout(() => { if (gotMsg.current && !started.current) onStall?.(); }, 7000));
  };

  useEffect(() => () => { timers.current.forEach((t) => { clearInterval(t); clearTimeout(t); }); clearTimeout(revealTimer.current); }, []);

  return (
    <iframe
      ref={frameRef} title={`Trailer ${item.title}`} src={src} onLoad={onLoad}
      allow="autoplay; encrypted-media" tabIndex={-1}
      style={{ position: 'absolute', border: 0, pointerEvents: 'none', opacity: shown ? 1 : 0, transition: 'opacity .5s ease', ...style }}
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

  // `muted` luôn có ở lần render đầu để autoplay được; sau đó effect ở trên quản lý
  return <video ref={ref} src={item.trailerVideoUrl} autoPlay muted loop playsInline style={{ position: 'absolute', objectFit: 'cover', pointerEvents: 'none', ...style }} />;
}

// Ưu tiên YouTube (iframe muted autoplay), sau đó video upload. Không có thì trả null.
export default function TrailerPlayer({ item, muted = true, volume = 60, style, clean = false }) {
  const [retry, setRetry] = useState({ id: '', n: 0 });
  const tries = retry.id === item.trailerKey ? retry.n : 0;
  if (item.trailerKey) {
    return (
      <YouTubePlayer
        key={`${item.trailerKey}-${tries}`} item={item} trailerKey={item.trailerKey} muted={muted} volume={volume} style={style} clean={clean}
        onStall={() => { if (tries < 2) setRetry({ id: item.trailerKey, n: tries + 1 }); }}
      />
    );
  }
  if (item.trailerVideoUrl) {
    return <UploadedVideo key={item.trailerVideoUrl} item={item} muted={muted} volume={volume} style={style} />;
  }
  return null;
}

export const hasTrailer = (i) => Boolean(i.trailerKey || i.trailerVideoUrl);

// Phóng to khung trailer để lấp đầy tỉ lệ 16:9 → 21:9, tránh viền đen
export const TRAILER_FILL = { top: '50%', left: '50%', width: '100%', height: '170%', transform: 'translate(-50%,-50%)' };

// Khung đã đúng tỉ lệ 16:9 (kiểu TrailerSection / Billboard mới) → iframe phủ vừa khít, thấy trọn trailer, không cắt
export const TRAILER_FIT = { top: 0, left: 0, width: '100%', height: '100%' };