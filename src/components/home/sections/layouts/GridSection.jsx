// src/components/home/sections/layouts/GridSection.jsx
// grid: lưới chia trang giống CountryMovieRows (cột × hàng cấu hình được).
import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import MovieCard from '../../../movie/MovieCard';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';
import SectionHeading from '../shared/SectionHeading';
import PagerButtons from '../shared/PagerButtons';
import { HOME_EASE } from '../shared/motionPresets';
import { accentOf, keyOf, clamp } from '../shared/layoutUtils';

const pageV = {
  enter: (d) => ({ opacity: 0, x: d * 24 }),
  center: { opacity: 1, x: 0 },
  exit: (d) => ({ opacity: 0, x: d * -24 }),
};

export function GridSection({ section }) {
  const isMobile = useIsMobile();
  const reduce = useReducedMotion();
  const accent = accentOf(section);
  const COLS = clamp(Number(section.config?.columns) || 5, 3, 6);
  const ROWS = clamp(Number(section.config?.rows) || 2, 1, 3);
  const perPage = COLS * ROWS;
  const items = section.items;

  const [rawPage, setPage] = useState(0);
  const [dir, setDir] = useState(1);
  const maxPage = Math.max(0, Math.ceil(items.length / perPage) - 1);
  const page = Math.min(rawPage, maxPage); // số trang đổi (đổi cột/hàng, đổi dữ liệu) thì kẹp lại ngay, không cần effect
  const goPage = (p) => { setDir(p > page ? 1 : -1); setPage(p); };

  const visible = items.slice(page * perPage, page * perPage + perPage);
  const paged = !isMobile && maxPage > 0;

  return (
    <section style={{ marginBottom: isMobile ? 32 : 44 }}>
      <SectionHeading
        title={section.title} subtitle={section.subtitle} accent={accent} isMobile={isMobile}
        right={paged && <PagerButtons canPrev={page > 0} canNext={page < maxPage} onPrev={() => goPage(page - 1)} onNext={() => goPage(page + 1)} />}
      />

      <div style={{ position: 'relative', overflow: isMobile ? 'hidden' : 'visible' }}>
        {isMobile ? (
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>
            {items.map((item) => (
              <div key={keyOf(item)} style={{ flexShrink: 0 }}>
                <MovieCard movie={item} cardWidth={160} />
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div
              key={page}
              custom={dir} variants={pageV} initial="enter" animate="center" exit="exit"
              transition={{ duration: reduce ? 0 : 0.28, ease: HOME_EASE }}
              style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: ROWS > 1 ? '20px 4px' : 4 }}
            >
              {visible.map((item, i) => (
                <motion.div
                  key={keyOf(item)}
                  initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: HOME_EASE, delay: reduce ? 0 : 0.08 + Math.min(i, 10) * 0.035 }}
                >
                  <MovieCard movie={item} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {paged && (
          <div style={{ display: 'flex', gap: 6, marginTop: 16, paddingLeft: 2 }}>
            {Array.from({ length: maxPage + 1 }).map((_, i) => (
              <button
                key={i} type="button" aria-label={`Trang ${i + 1}`} onClick={() => goPage(i)}
                style={{ height: 3, width: i === page ? 24 : 6, opacity: i === page ? 1 : 0.3, background: i === page ? accent : 'rgba(255,255,255,0.5)', borderRadius: 2, border: 'none', cursor: 'pointer', padding: 0, transition: 'all .25s' }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}