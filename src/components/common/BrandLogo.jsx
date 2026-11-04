// Logo Đoàn Luật sư tỉnh Ninh Bình (PNG nền trong suốt, đặt được trên nền sáng lẫn nền tối).
// Ảnh gốc 512px ở /brand/logo.png; hiển thị nhỏ dùng bản 192px cho nhẹ.
const BrandLogo = ({ className = 'h-12 w-12', large = false }) => (
  <img
    src={large ? '/brand/logo.png' : '/brand/logo-192.png'}
    alt="Logo Đoàn Luật sư tỉnh Ninh Bình"
    width={large ? 512 : 192}
    height={large ? 512 : 192}
    className={`shrink-0 select-none object-contain ${className}`}
    draggable={false}
  />
);

export default BrandLogo;
