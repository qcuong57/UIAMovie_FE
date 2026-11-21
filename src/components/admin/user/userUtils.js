// Helper dùng chung cho nhóm component quản lý người dùng
export const errMsg = (e, fallback) =>
  e?.response?.data?.message ?? e?.message ?? fallback;