// src/components/admin/dashboard/GenreDonutCard.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ACCENT, ACCENT4 } from '../../../context/adminTokens';
import { GenreDonut } from './ChartComponents';
import { Spin, Empty } from './DashboardPrimitives';
import { Card } from './Card';

// ── Genre + Free/Premium Donut Card ───────────────────────────────────────────
export const GenreDonutCard = ({
  donutSlices,
  movies, tvShows,
  moviePremiumCount, showPremiumCount,
  donutTab, setDonutTab,
  loading,
}) => (
  <Card
    title="Thể loại & Free/Premium"
    noPad
    tabs={[
      { key: 'genres',  label: 'Thể loại',   count: donutSlices.length },
      { key: 'premium', label: 'Free/Premium', count: 2 },
    ]}
    activeTab={donutTab}
    onTabChange={setDonutTab}
  >
    <div style={{ padding: '4px 20px 12px' }}>
      {loading ? (
        <Spin />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={donutTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {donutTab === 'genres' ? (
              donutSlices.length > 0 ? (
                <GenreDonut slices={donutSlices} />
              ) : (
                <Empty />
              )
            ) : (
              <GenreDonut
                slices={[
                  { label: `Movie Free (${movies.length - moviePremiumCount})`,   value: movies.length - moviePremiumCount,   color: ACCENT      },
                  { label: `Movie Premium (${moviePremiumCount})`,                value: moviePremiumCount,                   color: '#a7f3d0'   },
                  { label: `Show Free (${tvShows.length - showPremiumCount})`,    value: tvShows.length - showPremiumCount,   color: ACCENT4     },
                  { label: `Show Premium (${showPremiumCount})`,                  value: showPremiumCount,                   color: '#FDE68A'   },
                ].filter((s) => s.value > 0)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  </Card>
);