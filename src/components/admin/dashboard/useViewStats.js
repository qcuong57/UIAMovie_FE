// src/components/admin/dashboard/useViewStats.js
import { useState, useEffect, useCallback } from "react";
import viewStatsService from "../../../services/viewStatsService";

const EMPTY = {
  overview: null, top: [], genres: [], loading: true,
  error: null, topError: null, genresError: null,
};

// reloadKey: cha tăng giá trị này (vd nút "Làm mới" của cả dashboard) để buộc tải lại
export const useViewStats = ({ granularity, contentType, reloadKey = 0 }) => {
  const [state, setState] = useState(EMPTY);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false; // tránh race khi đổi filter liên tục
    setState((s) => ({ ...s, loading: true, error: null }));

    (async () => {
      const [ov, top, gen] = await Promise.allSettled([
        viewStatsService.getOverview({ granularity, contentType }),
        viewStatsService.getTop({ contentType, take: 10 }),
        viewStatsService.getGenres({ contentType }),
      ]);
      if (cancelled) return;
      setState({
        overview: ov.status === "fulfilled" ? ov.value : null,
        top: top.status === "fulfilled" && Array.isArray(top.value) ? top.value : [],
        genres: gen.status === "fulfilled" && Array.isArray(gen.value) ? gen.value : [],
        loading: false,
        error: ov.status === "rejected" ? ov.reason : null,
        topError: top.status === "rejected" ? top.reason : null,
        genresError: gen.status === "rejected" ? gen.reason : null,
      });
    })();

    return () => { cancelled = true; };
  }, [granularity, contentType, tick, reloadKey]);

  return { ...state, reload };
};