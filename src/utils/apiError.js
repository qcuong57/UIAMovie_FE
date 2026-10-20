// src/utils/apiError.js
// Lấy thông báo lỗi người dùng đọc được từ một lỗi axios.
//
// axiosInstance giữ nguyên error.response, và BE luôn trả { message } (camelCase).
// KHÔNG dùng error.message cho lỗi HTTP: axios đặt nó thành
// "Request failed with status code 400", không phải thông báo của BE.

export const getApiErrorMessage = (error, fallback = 'Đã có lỗi xảy ra') => {
  const status = error?.response?.status;

  if (status === 429) {
    return 'Bạn thao tác quá nhanh. Vui lòng đợi một lát rồi thử lại.';
  }

  const serverMessage =
    error?.response?.data?.message || error?.response?.data?.data?.message;
  if (serverMessage) return serverMessage;

  // Không có response = lỗi mạng / timeout.
  if (error && !error.response && error.request) {
    return 'Không kết nối được tới máy chủ. Vui lòng kiểm tra mạng và thử lại.';
  }

  // Lỗi do FE tự ném (new Error('...')) thì message đã là tiếng Việt của mình.
  if (error?.message && !/status code|Network Error|timeout/i.test(error.message)) {
    return error.message;
  }

  return fallback;
};