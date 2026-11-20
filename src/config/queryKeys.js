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
  // `picker`: danh sách thể loại cho ô chọn thể loại trong form admin (mảng đã chuẩn hoá); cùng gốc "genres" nên đổi thể loại là làm mới luôn.
  genres: { all: ["genres"], admin: ["genres", "admin"], picker: ["genres", "picker"] },
  home: {
    all: ["home"],
    trendingMovies: ["home", "trending-movies"],
    topTvShows: ["home", "top-tvshows"],
    latestMovies: ["home", "latest-movies"],
    latestTvShows: ["home", "latest-tvshows"],
    country: (code) => ["home", "country", code],
    // Các khối trang chủ do admin cấu hình (GET /api/home-sections). Dưới gốc "home" nên tự làm mới khi admin sửa phim.
    sections: ["home", "sections"],
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
  // Navbar search (dropdown/overlay): chung gốc "search" → thuộc PUBLIC_QUERY_ROOTS, không bị reset khi đổi tài khoản.
  search: {
    all: ["search"],
    list: (filter) => ["search", "list", filter],
    navMovies: (q) => ["search", "nav", "movies", q],
    navTv: (q) => ["search", "nav", "tv", q],
    navActors: (q) => ["search", "nav", "actors", q],
  },
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
  // ── ADMIN ── gốc "admin" KHÔNG nằm trong PUBLIC_QUERY_ROOTS → tự reset khi đổi tài khoản.
  admin: {
    all: ["admin"],
    movies: {
      all: ["admin", "movies"],
      list: () => ["admin", "movies", "list"],
      detail: (id) => ["admin", "movies", "detail", String(id)],
      subtitles: (id) => ["admin", "movies", "subtitles", String(id)],
    },
    // TV show: filter là MỘT object (gồm page) → key ổn định, prefetch trang kế dùng đúng key này.
    // seasons(showId) là TIỀN TỐ của season(showId, n) → vá/invalidate/xoá cả nhóm season của một show.
    tvShows: {
      all: ["admin", "tvShows"],
      lists: () => ["admin", "tvShows", "list"],
      list: (filter) => ["admin", "tvShows", "list", filter],
      detail: (id) => ["admin", "tvShows", "detail", String(id)],
      seasons: (showId) => ["admin", "tvShows", "seasons", String(showId)],
      season: (showId, seasonNumber) => ["admin", "tvShows", "seasons", String(showId), String(seasonNumber)],
      subtitles: (episodeId) => ["admin", "tvShows", "subtitles", String(episodeId)],
    },
    // Person: filter là MỘT object (gồm page). `search` (ô gợi ý PersonPickerField) tách riêng khỏi `list`.
    // Doanh thu & đơn hàng. Tham số là object nên key ổn định theo từng bộ lọc / kỳ.
    // Nội dung file phụ đề đang chỉnh (phim hoặc tập: mediaId khác nhau nên không đụng nhau).
    subtitleContent: (mediaId, subtitleId) => ["admin", "subtitle-content", String(mediaId), String(subtitleId)],
    // Thông báo / bản tin do admin phát. Cùng nguồn dữ liệu với trang Tin tức công khai (`announcements.*`).
    announcements: { all: ["admin", "announcements"], list: ["admin", "announcements", "list"] },
    // Quản lý trang chủ: list gồm cả khối đã tắt / hết hạn; search = ô tìm phim để thêm vào khối.
    homeSections: {
      all: ["admin", "homeSections"],
      list: ["admin", "homeSections", "list"],
      meta: ["admin", "homeSections", "meta"],
      search: (kind, q) => ["admin", "homeSections", "search", kind, q],
    },
    // Gói Premium (admin): TẤT CẢ gói kể cả đã tắt bán. Bộ lọc gói của trang Doanh thu dùng chung key này.
    plans: { all: ["admin", "plans"], list: ["admin", "plans", "list"] },
    revenue: {
      all: ["admin", "revenue"],
      summary: ["admin", "revenue", "summary"],
      chart: (params) => ["admin", "revenue", "chart", params],
      orders: (filter) => ["admin", "revenue", "orders", filter],
      // Gói cho bộ lọc trang Doanh thu (đã qua select → {value,label}); tách riêng để không lẫn dữ liệu với `admin.plans`.
      planOptions: ["admin", "revenue", "plan-options"],
    },
    // Quảng cáo: filter là MỘT object (page, pageSize, search, isActive) → key ổn định.
    // detail(id) nằm dưới `all` → invalidate ["admin","ads"] làm mới cả danh sách lẫn panel chi tiết.
    ads: {
      all: ["admin", "ads"],
      lists: () => ["admin", "ads", "list"],
      list: (filter) => ["admin", "ads", "list", filter],
      detail: (id) => ["admin", "ads", "detail", String(id)],
    },
    // Cấu hình lịch phát (Cố định | Ngẫu nhiên): tách khỏi `ads` để sửa 1 quảng cáo không tải lại cấu hình.
    adScheduleSettings: ["admin", "ad-schedule-settings"],
    // Đánh giá: danh sách theo đối tượng (phim / show / tập), tách khỏi reply để xoá reply chỉ làm mới đúng phần cần.
    reviews: {
      all: ["admin", "reviews"],
      catalog: (kind) => ["admin", "reviews", "catalog", kind],
      episodes: (showId) => ["admin", "reviews", "episodes", String(showId)],
      lists: () => ["admin", "reviews", "list"],
      list: (target) => ["admin", "reviews", "list", target],
      repliesOf: (reviewId) => ["admin", "reviews", "replies", String(reviewId)],
      replies: (reviewId, page) => ["admin", "reviews", "replies", String(reviewId), page],
    },
    // Dashboard tổng quan: mỗi nguồn dữ liệu một query riêng → section nào xong trước hiện trước,
    // lỗi một nguồn không làm trắng cả trang. Nút "Làm mới" chỉ cần invalidate `dashboard.all`.
    dashboard: {
      all: ["admin", "dashboard"],
      movies: ["admin", "dashboard", "movies"],
      tvShows: ["admin", "dashboard", "tvShows"],
      movieTotal: ["admin", "dashboard", "movie-total"],
      tvShowTotal: ["admin", "dashboard", "tvshow-total"],
      trendingMovies: ["admin", "dashboard", "trending-movies"],
      trendingShows: ["admin", "dashboard", "trending-shows"],
      genres: ["admin", "dashboard", "genres"],
      users: ["admin", "dashboard", "users"],
      reviews: ["admin", "dashboard", "reviews"],
      // Thống kê lượt xem: tham số là object nên key ổn định theo từng bộ lọc.
      viewStats: {
        all: ["admin", "dashboard", "view-stats"],
        overview: (params) => ["admin", "dashboard", "view-stats", "overview", params],
        top: (params) => ["admin", "dashboard", "view-stats", "top", params],
        genres: (params) => ["admin", "dashboard", "view-stats", "genres", params],
      },
    },
    // Import TMDB: tìm/lọc, thể loại và preview chỉ đọc; `existing` đánh dấu phim đã có trong DB.
    tmdb: {
      all: ["admin", "tmdb"],
      preview: (kind, tmdbId) => ["admin", "tmdb", "preview", kind, String(tmdbId)],
      // Sắp xếp thể loại để chọn [1,2] và [2,1] dùng chung một cache entry
      discover: (kind, query, filters, page) => [
        "admin", "tmdb", "discover", kind, query,
        { ...filters, genres: [...(filters?.genres ?? [])].sort((a, b) => a - b) },
        page,
      ],
      genres: (kind) => ["admin", "tmdb", "genres", kind],
      existing: (kind, ids) => ["admin", "tmdb", "exists", kind, ids.join(",")],
      existingAll: () => ["admin", "tmdb", "exists"], // tiền tố — dùng để invalidate
    },
    persons: {
      all: ["admin", "persons"],
      lists: () => ["admin", "persons", "list"],
      list: (filter) => ["admin", "persons", "list", filter],
      detail: (id) => ["admin", "persons", "detail", String(id)],
      searches: () => ["admin", "persons", "search"],
      search: (q) => ["admin", "persons", "search", q],
    },
    // Người dùng: filter là MỘT object (gồm page) → key ổn định, prefetch trang kế dùng đúng key này.
    users: {
      all: ["admin", "users"],
      lists: () => ["admin", "users", "list"],
      list: (filter) => ["admin", "users", "list", filter],
      detail: (id) => ["admin", "users", "detail", String(id)],
    },
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

// Cache phía người dùng bị ảnh hưởng khi admin thêm / sửa / xoá phim → invalidate cùng lúc.
export const CATALOG_ROOTS = new Set([
  "movies",
  "tvshows",
  "home",
  "browse",
  "search",
  "coming-soon",
]);

// Mức làm mới theo độ biến động của dữ liệu (dùng cho staleTime từng query)
export const STALE = {
  static: 60 * 60_000, // genres, quốc gia: ít đổi
  medium: 5 * 60_000, // hàng theo quốc gia, review trang chủ
  list: 2 * 60_000, // danh sách phim trang chủ
  user: 60_000, // dữ liệu cá nhân (favorites, lịch sử xem)
  admin: 30_000, // bảng / chi tiết admin: cần tươi hơn catalogue công khai
};