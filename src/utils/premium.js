// src/utils/premium.js
// Một nơi duy nhất quyết định "user có Premium hay không".
// Trước đây lặp ở MovieDetailPage, TvShowDetailPage, MovieInfoPage, MovieCard, RecommendSection.

export function userHasPremium(user) {
  if (!user) return false;
  return (
    user.isPremium === true ||
    user.plan === "premium" ||
    user.subscription?.active === true
  );
}