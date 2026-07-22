/**
 * Trình soạn mô tả dự án.
 * Dùng textarea ổn định — CKEditor build-classic (v41) không tương thích
 * @ckeditor/ckeditor5-react v11 (peer ckeditor5 >= 46) và từng làm trắng trang chi tiết.
 */
export function RichEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (html: string) => void
}) {
  return (
    <textarea
      className="input min-h-[160px] w-full resize-y"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Nhập mô tả dự án..."
      rows={8}
    />
  )
}
