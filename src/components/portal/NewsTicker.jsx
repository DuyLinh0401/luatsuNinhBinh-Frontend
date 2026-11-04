// Dải "Tin mới" chạy ngang + ngày giờ hiện tại (đầu trang chủ)
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock, Megaphone } from 'lucide-react';
import { postApi } from '../../services/portalService';
import { portalRoutes } from '../../utils/portalRoutes';
import useAsync from '../../hooks/useAsync';
import { Container } from './PortalUI';

const TICKER_LIMIT = 10;
const SECONDS_PER_ITEM = 9; // tốc độ chạy: càng nhiều tin, vòng chạy càng dài
const NEW_WITHIN_MS = 24 * 60 * 60 * 1000;

const formatToday = (d) =>
  d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
const formatClock = (d) => d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const pad = (n) => String(n).padStart(2, '0');
const formatShortDay = (value) => {
  const d = new Date(value);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
};

// Ngày + đồng hồ tự cập nhật mỗi giây (tách riêng để chỉ phần này render lại)
const LiveDate = ({ className }) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className={className}>
      <span className="flex items-center gap-1.5 whitespace-nowrap">
        <CalendarDays className="h-3.5 w-3.5 text-brand" />
        <span className="first-letter:uppercase">{formatToday(now)}</span>
      </span>
      <span className="flex items-center gap-1.5 whitespace-nowrap tabular-nums text-navy-950">
        <Clock className="h-3.5 w-3.5 text-brand" />
        <time dateTime={now.toISOString()}>{formatClock(now)}</time>
      </span>
    </div>
  );
};

const TickerItems = ({ posts, hidden, now }) => (
  <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
    {posts.map((post) => {
      const isNew = post.publishedAt && now - new Date(post.publishedAt).getTime() < NEW_WITHIN_MS;
      return (
        <li key={post.id} className="flex items-center">
          <span className="mx-5 h-1.5 w-1.5 shrink-0 rotate-45 bg-gold" />
          <Link
            to={portalRoutes.post(post.slug)}
            tabIndex={hidden ? -1 : undefined}
            className="flex h-11 items-center gap-2 whitespace-nowrap text-[13.5px] font-medium text-navy-950 transition-colors hover:text-brand"
          >
            {isNew && <span className="rounded bg-red-600 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-white">Mới</span>}
            {post.title}
            {post.publishedAt && <span className="text-xs font-normal text-slate-400">({formatShortDay(post.publishedAt)})</span>}
          </Link>
        </li>
      );
    })}
  </ul>
);

const NewsTicker = () => {
  const { data } = useAsync(() => postApi.list({ limit: TICKER_LIMIT, sort: 'newest' }), []);
  const posts = data?.items || [];
  // Mốc thời gian lúc mở trang, dùng để gắn nhãn "Mới" cho tin đăng trong 24 giờ
  const [openedAt] = useState(() => Date.now());

  return (
    <div className="border-b border-stone-200 bg-white">
      {/* Điện thoại: ngày giờ thành một dòng riêng phía trên */}
      <LiveDate className="flex items-center justify-between gap-3 border-b border-stone-100 bg-stone-warm px-4 py-1.5 text-xs text-slate-600 md:hidden" />

      <Container className="flex h-11 items-center gap-4">
        <div className="flex shrink-0 items-center gap-2 rounded-md bg-brand px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-hover opacity-75 motion-reduce:hidden" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-hover" />
          </span>
          <Megaphone className="h-3.5 w-3.5 sm:hidden" aria-label="Tin mới" />
          <span className="hidden sm:inline">Tin mới</span>
        </div>

        {/* Dòng tin: lặp nội dung 2 lần để chạy liền mạch; rê chuột / focus thì dừng */}
        <div
          className="group relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_24px,black_calc(100%-24px),transparent)] motion-reduce:overflow-x-auto"
          aria-label="Tin mới đăng"
        >
          {posts.length > 0 ? (
            <div
              className="flex w-max animate-marquee group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:animate-none"
              style={{ '--marquee-duration': `${Math.max(posts.length, 3) * SECONDS_PER_ITEM}s` }}
            >
              <TickerItems posts={posts} now={openedAt} />
              <TickerItems posts={posts} now={openedAt} hidden />
            </div>
          ) : (
            <p className="truncate text-[13.5px] text-slate-400">{data ? 'Chưa có tin mới.' : 'Đang tải tin mới...'}</p>
          )}
        </div>

        <LiveDate className="hidden shrink-0 items-center gap-4 border-l border-stone-200 pl-4 text-xs text-slate-600 md:flex" />
      </Container>
    </div>
  );
};

export default NewsTicker;
