// src/components/home/sections/shared/TrailerPlayer.jsx
// Phát trailer: ưu tiên YouTube (iframe muted autoplay), sau đó video upload. Dùng cho billboard và trailer.
// Cần normalizeHomeCard giữ lại trailerKey và trailerVideoUrl; thiếu thì layout rơi về ảnh tĩnh.
//
// Âm thanh (muted / volume) được điều khiển bằng lệnh, KHÔNG nằm trong src → đổi tiếng không làm tải lại trailer.
//  • YouTube: iframe luôn khởi động mute=1 (để autoplay được), sau đó gửi lệnh mute/unMute/setVolume qua postMessage.
//  • Video upload: đặt thẳng video.muted / video.volume.
import React, { useEffect, useMemo, useRef, useState } from 'react';

const YT_ORIGIN = 'https://www.youtube-nocookie.com';

function YouTubePlayer({ item, trailerKey: k, muted, volume, style }) {
  const frameRef = useRef(null);
  const audioRef = useRef({ muted, volume });
  audioRef.current = { muted, volume };
  // Chỉ hiện iframe khi trailer thực sự đang chạy → không lộ nút play / vòng quay tải của YouTube
  const [shown, setShown] = useState(false);

  // src chỉ phụ thuộc vào trailerKey → không bao giờ đổi khi bấm âm lượng
  const src = useMemo(() => {
    const origin = typeof window !== 'undefined' ? `&origin=${encodeURIComponent(window.location.origin)}` : '';
    return `${YT_ORIGIN}/embed/${k}?autoplay=1&mute=1&controls=0&loop=1&playlist=${k}&modestbranding=1&playsinline=1&rel=0&disablekb=1&fs=0&iv_load_policy=3&enablejsapi=1${origin}`;
  }, [k]);

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
      if (data?.event === 'onReady') applyAudio();

      // Trạng thái player: 1 đang phát, 3 đệm, 0 hết (loop sẽ phát lại ngay); còn lại (-1, 2, 5) là chưa phát/tạm dừng
      const state = data?.event === 'onStateChange' ? data.info : data?.info?.playerState;
      if (typeof state === 'number') setShown(state === 1 || state === 3 || state === 0);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [k]); // eslint-disable-line react-hooks/exhaustive-deps

  // Iframe tải xong → đăng ký nhận sự kiện của player, rồi áp âm thanh (kèm vài lần thử lại phòng player chưa kịp sẵn sàng)
  const onLoad = () => {
    frameRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), YT_ORIGIN);
    applyAudio();
    [400, 1200].forEach((ms) => setTimeout(applyAudio, ms));
  };

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
export default function TrailerPlayer({ item, muted = true, volume = 60, style }) {
  if (item.trailerKey) {
    return <YouTubePlayer key={item.trailerKey} item={item} trailerKey={item.trailerKey} muted={muted} volume={volume} style={style} />;
  }
  if (item.trailerVideoUrl) {
    return <UploadedVideo key={item.trailerVideoUrl} item={item} muted={muted} volume={volume} style={style} />;
  }
  return null;
}

export const hasTrailer = (i) => Boolean(i.trailerKey || i.trailerVideoUrl);

// Phóng to khung trailer để lấp đầy tỉ lệ 16:9 → 21:9, tránh viền đen
export const TRAILER_FILL = { top: '50%', left: '50%', width: '100%', height: '170%', transform: 'translate(-50%,-50%)' };