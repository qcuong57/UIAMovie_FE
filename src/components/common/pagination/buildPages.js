// src/components/common/pagination/buildPages.js
// Hàm thuần (dễ test): trả về dãy ô trang gồm số và 'DOTS_LEFT' / 'DOTS_RIGHT'.
// LUÔN cùng số ô (sibling*2 + 5) khi nhiều trang → thanh phân trang không giật khi đổi trang:
//   1 2 3 4 5 … 12  →  1 … 4 5 6 … 12  →  1 … 8 9 10 11 12

const range = (a, b) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);

export const buildPages = (page, total, sibling = 1) => {
  if (!total || total < 1) return [];
  const slots = sibling * 2 + 5;
  if (total <= slots) return range(1, total);

  const current = Math.min(Math.max(page, 1), total);
  const left = Math.max(current - sibling, 1);
  const right = Math.min(current + sibling, total);
  const dotsLeft = left > 2;
  const dotsRight = right < total - 1;
  const edgeCount = 3 + 2 * sibling;

  if (!dotsLeft && dotsRight) return [...range(1, edgeCount), 'DOTS_RIGHT', total];
  if (dotsLeft && !dotsRight) return [1, 'DOTS_LEFT', ...range(total - edgeCount + 1, total)];
  return [1, 'DOTS_LEFT', ...range(left, right), 'DOTS_RIGHT', total];
};