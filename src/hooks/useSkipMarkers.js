// src/components/hooks/useSkipMarkers.js
import { useCallback, useEffect, useState } from "react";

const inRange = (t, start, end) => start != null && end != null && t >= start && t < end;

/**
 * Hiện nút "Bỏ qua intro / recap" theo mốc thời gian (giây).
 * @param {{ videoRef, hasVideo: boolean, markers?: { introStart, introEnd, recapStart, recapEnd } }} p
 */
export default function useSkipMarkers({ videoRef, hasVideo, markers }) {
  const { introStart, introEnd, recapStart, recapEnd } = markers ?? {};
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [showSkipRecap, setShowSkipRecap] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      const t = v.currentTime;
      setShowSkipIntro(inRange(t, introStart, introEnd));
      setShowSkipRecap(inRange(t, recapStart, recapEnd));
    };
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [videoRef, hasVideo, introStart, introEnd, recapStart, recapEnd]);

  const skipIntro = useCallback(() => {
    const v = videoRef.current;
    if (!v || introEnd == null) return;
    v.currentTime = introEnd;
    setShowSkipIntro(false);
  }, [videoRef, introEnd]);

  const skipRecap = useCallback(() => {
    const v = videoRef.current;
    if (!v || recapEnd == null) return;
    v.currentTime = recapEnd;
    setShowSkipRecap(false);
  }, [videoRef, recapEnd]);

  return { showSkipIntro, showSkipRecap, skipIntro, skipRecap };
}
