/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Một font duy nhất: Be Vietnam Pro (thiết kế riêng cho tiếng Việt, dấu thanh chuẩn).
      // serif/display trỏ cùng font để mã cũ hoặc nội dung lỡ dùng các lớp này vẫn đồng nhất
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'Arial', 'sans-serif'],
        serif: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        display: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#FBF8F1',
          100: '#F4ECE0',
          200: '#E8D6BF',
          300: '#D7BC97',
          400: '#C59B27',
          500: '#B38918',
          600: '#8E6B0E',
          700: '#694E09',
          800: '#473506',
          900: '#261C02',
        },
        // Bảng màu "xanh pháp lý + vàng đồng": navy là xanh dương đậm (chữ tiêu đề, nền tối),
        // brand là xanh tươi hơn cho các mảng nhận diện lớn (thanh menu, nút chính)
        navy: {
          950: '#0B2545',
          900: '#123462',
          800: '#1B4A85',
          700: '#2A5FA0',
          600: '#4778B8',
        },
        brand: {
          light: '#E8F0FA',
          DEFAULT: '#0F5AA6',
          dark: '#0B4886',
        },
        gold: {
          light: '#F6E7C1',
          DEFAULT: '#C8992B',
          hover: '#E2B649',
          dark: '#9A7413',
          deep: '#6F530C',
        },
        // Xám ngả xanh (thay tông xám ấm mặc định của "stone") cho nền và viền sáng, sạch hơn
        stone: {
          50: '#F7F9FC',
          100: '#EEF2F7',
          200: '#E1E7EF',
          300: '#CBD4E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          parchment: '#F5F8FC',
          warm: '#EEF3F9',
          border: '#DCE4EE',
        },
        emerald: {
          deep: '#0B2B26',
          trangan: '#134E4A',
          jade: '#1D6355',
        },
        vermilion: {
          seal: '#991B1B',
        }
      },
      boxShadow: {
        'legal': '0 10px 30px -5px rgba(11, 37, 69, 0.08), 0 4px 6px -2px rgba(11, 37, 69, 0.04)',
        'legal-hover': '0 20px 40px -10px rgba(11, 37, 69, 0.16), 0 8px 12px -3px rgba(11, 37, 69, 0.08)',
        'gold-glow': '0 0 25px rgba(200, 153, 43, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-subtle': 'pulseSubtle 3s infinite',
        // Dòng tin chạy: thời lượng đặt qua biến --marquee-duration theo số tin
        'marquee': 'marquee var(--marquee-duration, 60s) linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        // Nội dung được lặp 2 lần => dịch -50% là quay về đúng vị trí đầu, chạy liền mạch
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}