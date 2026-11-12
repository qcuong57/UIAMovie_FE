// src/config/queryKeys.js
// Nơi DUY NHẤT định nghĩa queryKey → invalidate theo nhóm không bị lệch key.
// Quy ước: [tài nguyên, loại, tham số]. Ví dụ invalidate mọi danh sách phim: { queryKey: queryKeys.movies.lists() }.

export const queryKeys = {
  movies: {
    all: ["movies"],
    lists: () => ["movies", "list"],
    list: (filter) => ["movies", "list", filter],
    detail: (id) => ["movies", "detail", String(id)],
  },
  tvShows: {
    all: ["tvshows"],
    lists: () => ["tvshows", "list"],
    list: (filter) => ["tvshows", "list", filter],
    detail: (id) => ["tvshows", "detail", String(id)],
  },
  genres: { all: ["genres"] },
  home: {
    all: ["home"],
    trendingMovies: ["home", "trending-movies"],
    topTvShows: ["home", "top-tvshows"],
    latestMovies: ["home", "latest-movies"],
    latestTvShows: ["home", "latest-tvshows"],
    country: (code) => ["home", "country", code],
  },
  reviews: { home: ["reviews", "home"] },
  // Trang Sắp chiếu & Tin tức: dữ liệu công khai
  comingSoon: { all: ["coming-soon"] },
  announcements: {
    all: ["announcements"],
    list: (type) => ["announcements", "list", type],
  },
  // Trang Duyệt / Tìm kiếm: filter là MỘT object (gồm cả page) → key ổn định, prefetch dùng đúng key này.
  browse: { all: ["browse"], list: (filter) => ["browse", "list", filter] },
  search: { all: ["search"], list: (filter) => ["search", "list", filter] },
  recommendations: {
    all: ["recommendations"],
    personalized: (userId, daySeed) => [
      "recommendations",
      "personalized",
      userId ?? "guest",
      daySeed,
    ],
  },
  me: {
    all: ["me"],
    // favoriteIds NẰM DƯỚI favorites → invalidate ["me","favorites"] làm mới cả danh sách lẫn tập id.
    favorites: ["me", "favorites"],
    favoriteIds: ["me", "favorites", "ids"],
    // Danh sách bản ghi yêu thích (cho trang Yêu thích). Cũng nằm dưới favorites → cùng bị invalidate.
    favoriteList: ["me", "favorites", "list"],
    watchHistory: ["me", "watch-history"],
  },
  premium: { plans: ["premium", "plans"] },
};

// Nhóm cache CÔNG KHAI (không phụ thuộc người dùng) → giữ lại khi đăng nhập/đăng xuất,
// để trang chủ không bị "nháy" màn hình loading. Mọi nhóm khác bị reset khi đổi tài khoản.
export const PUBLIC_QUERY_ROOTS = new Set([
  "home",
  "genres",
  "browse",
  "search",
  "coming-soon",
  "announcements",
]);

// Mức làm mới theo độ biến động của dữ liệu (dùng cho staleTime từng query)
export const STALE = {
  static: 60 * 60_000, // genres, quốc gia: ít đổi
  medium: 5 * 60_000, // hàng theo quốc gia, review trang chủ
  list: 2 * 60_000, // danh sách phim trang chủ
  user: 60_000, // dữ liệu cá nhân (favorites, lịch sử xem)
};
