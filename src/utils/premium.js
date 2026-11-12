// src/utils/premium.js
// Nguồn duy nhất cho logic "user có Premium không" (dùng ở MovieCard, MovieDetailPage, TvShowDetailPage).
export function userHasPremium(user) {
  if (!user) return false;
  return (
    user.isPremium === true ||
    user.plan === "premium" ||
    user.subscription?.active === true
  );
}