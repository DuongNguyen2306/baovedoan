import { BRAND } from '@/lib/brand'

const FOOTER_LINKS = [
  {
    title: 'Dịch vụ công',
    links: [
      { label: 'Tra cứu hồ sơ', route: 'tra-cuu' as const },
      { label: 'Tìm nhà ở', route: 'tim-nha' as const },
      { label: 'Danh mục dự án', route: 'projects' as const },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: [
      { label: 'Hướng dẫn sử dụng', route: 'landing' as const },
      { label: 'Câu hỏi thường gặp', route: 'landing' as const },
      { label: 'Chính sách bảo mật', route: 'landing' as const },
      { label: 'Điều khoản sử dụng', route: 'landing' as const },
    ],
  },
]

const LANDING_LINKS = [
  {
    title: 'Về cổng thông tin',
    links: [
      { label: 'Giới thiệu', route: 'landing' as const },
      { label: 'Cơ quan vận hành', route: 'landing' as const },
      { label: 'Chính sách bảo mật', route: 'landing' as const },
      { label: 'Điều khoản sử dụng', route: 'landing' as const },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: [
      { label: 'Hướng dẫn đăng ký', route: 'register' as const },
      { label: 'Đăng nhập', route: 'login' as const },
      { label: 'Câu hỏi thường gặp', route: 'landing' as const },
      { label: 'Liên hệ', route: 'landing' as const },
    ],
  },
]

export function GovFooter() {
  return null
}
