// Nút "Lên đầu trang": hiện khi đã cuộn xuống quá 1 màn hình (hữu ích nhất trên điện thoại, trang dài)
import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

const BackToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Lên đầu trang"
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-[5.5rem] right-[22px] z-40 flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-navy-950/25 ring-1 ring-white/20 transition-all duration-300 hover:bg-brand-dark sm:bottom-[6rem] sm:right-[30px] ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
};

export default BackToTop;
