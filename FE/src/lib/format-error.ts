import { ApiError } from '@/api/http'

export function formatError(err: unknown): string {
  if (err instanceof ApiError) {
    const b = err.body
    if (b && typeof b === 'object') {
      const pd = b as { title?: string; errors?: Record<string, string[]>; detail?: string; Detail?: string; message?: string; Message?: string }
      if (pd.errors) {
        return Object.entries(pd.errors)
          .flatMap(([k, msgs]) => msgs.map((m) => `${k}: ${m}`))
          .join(' · ')
      }

      // BE có thể trả `message` (raw object) thay vì ProblemDetails `title`/`detail`.
      // Ưu tiên `message` cho status 4xx/5xx vì title thường là chuỗi generic do .NET sinh ra.
      const msg =
        (typeof pd.message === 'string' && pd.message) ||
        (typeof pd.Message === 'string' && pd.Message) ||
        null

      if (pd.title && pd.title !== 'Unauthorized' && pd.title !== 'One or more validation errors occurred.' && (!msg || msg.startsWith('Đã xảy ra lỗi'))) {
        return pd.title
      }
      if (pd.title === 'Unauthorized') return 'Bạn chưa đăng nhập hoặc phiên đã hết hạn.'

      const detail = pd.detail ?? pd.Detail
      if (typeof detail === 'string' && detail) {
        if (detail.includes('429') || detail.toLowerCase().includes('rate limit')) {
          return 'Dịch vụ FPT AI tạm giới hạn số lần gọi. Vui lòng đợi khoảng 30 phút rồi thử lại.'
        }
        return detail
      }

      if (msg) return msg

      // Trường hợp BE trả raw object không có title/message
      if (err.status === 422) {
        return 'Hồ sơ chưa đủ điều kiện nộp. Vui lòng kiểm tra: đã upload đủ tài liệu, dự án còn nhận hồ sơ, và thông tin hợp lệ.'
      }
      if (err.status === 409) {
        return 'Hồ sơ đang ở trạng thái không thể thực hiện thao tác này.'
      }
    }
    return err.message
  }
  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend đang chạy và không bị chặn CORS.'
  }
  if (err instanceof Error) return err.message
  return 'Đã xảy ra lỗi. Vui lòng thử lại.'
}

export function formatSuccess(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Thành công.'
  const o = data as Record<string, unknown>
  const msg = o.message ?? o.Message
  if (typeof msg === 'string' && msg) return msg
  return 'Thành công.'
}
