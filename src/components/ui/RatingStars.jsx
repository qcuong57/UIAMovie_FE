// src/components/ui/RatingStars.jsx

import React, { useState } from 'react';
import { Star } from 'lucide-react';

/**
 * RatingStars — hiển thị hoặc cho phép chọn rating
 *
 * @prop {number} rating       — giá trị rating hiện tại (0–maxRating)
 * @prop {number} maxRating    — số sao tối đa (default: 10)
 * @prop {'sm'|'md'|'lg'} size
 * @prop {boolean} interactive — cho phép click để chọn rating
 * @prop {function} onChange   — callback(newRating) khi chọn
 * @prop {boolean} showValue   — hiện số rating bên cạnh
 * @prop {string} className
 *
 * @example
 * // Chỉ hiển thị
 * <RatingStars rating={7.5} showValue />
 *
 * // Cho phép chọn (dùng trên trang review)
 * <RatingStars rating={userRating} interactive onChange={setUserRating} maxRating={5} />
 */

const sizeMap = {
  sm: 14,
  md: 18,
  lg: 24,
};

const textSizeMap = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

const RatingStars = ({
  rating = 0,
  maxRating = 10,
  size = 'md',
  interactive = false,
  onChange,
  showValue = false,
  className = '',
}) => {
  const [hovered, setHovered] = useState(null);

  // Normalize về thang 5 sao để hiển thị
  const displayStars = 5;
  const normalizedRating = (rating / maxRating) * displayStars;
  const activeRating = hovered !== null ? hovered : normalizedRating;

  const iconSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: displayStars }).map((_, i) => {
          const filled = i < Math.floor(activeRating);
          const partial = !filled && i < activeRating;

          return (
            <span
              key={i}
              className={interactive ? 'cursor-pointer' : ''}
              onMouseEnter={() => interactive && setHovered(i + 1)}
              onMouseLeave={() => interactive && setHovered(null)}
              onClick={() => interactive && onChange?.((i + 1) / displayStars * maxRating)}
            >
              <Star
                size={iconSize}
                className={
                  filled
                    ? 'fill-yellow-400 text-yellow-400'
                    : partial
                    ? 'fill-yellow-400/50 text-yellow-400'
                    : 'fill-transparent text-gray-600'
                }
              />
            </span>
          );
        })}
      </div>

      {showValue && (
        <span className={`font-bold text-yellow-400 ${textSizeMap[size]}`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default RatingStars;