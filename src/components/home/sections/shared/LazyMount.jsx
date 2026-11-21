// src/components/home/sections/shared/LazyMount.jsx
// Chỉ dựng children khi khối sắp lọt vào màn hình (cách mép dưới `rootMargin`), dựng rồi thì giữ nguyên.
// Trang chủ có nhiều khối nặng (ảnh, framer-motion, iframe): không dựng hết một lượt lúc vào trang.
import React, { useEffect, useRef, useState } from 'react';

export default function LazyMount({ children, rootMargin = '600px 0px', minHeight = 360 }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const el = ref.current;
    if (ready || !el) return undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setReady(true);
    }, { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ready, rootMargin]);

  return ready ? children : <div ref={ref} aria-hidden style={{ minHeight }} />;
}