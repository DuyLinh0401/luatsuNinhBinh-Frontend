import { Link } from 'react-router-dom';
import { Search, CalendarDays, MapPin } from 'lucide-react';
import { portalApi, assetUrl } from '../../services/portalService';
import { portalRoutes } from '../../utils/portalRoutes';
import useAsync from '../../hooks/useAsync';
import { Thumb, DateBadge, Skeleton, SmartLink } from './PortalUI';
import { formatDay, formatTime } from './portalFormat';

// Dữ liệu sidebar ít thay đổi: dùng chung trong 5 phút cho mọi trang
let cached = null;
const loadSidebar = () => {
  if (cached && Date.now() - cached.at < 5 * 60 * 1000) return cached.promise;
  const promise = portalApi.sidebar().catch((e) => {
    cached = null;
    throw e;
  });
  cached = { at: Date.now(), promise };
  return promise;
};

const Box = ({ title, children, className = '' }) => (
  <section className={`rounded-xl border border-stone-200 bg-white p-5 ${className}`}>
    <h2 className="mb-4 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide !text-navy-950">
      <span className="h-4 w-1 rounded-full bg-gold" />
      {title}
    </h2>
    {children}
  </section>
);

const PortalSidebar = ({ hideLookup = false }) => {
  const { data, loading } = useAsync(loadSidebar, []);

  return (
    // Điện thoại: một cột gọn; máy tính bảng: 2 cột; máy tính: cột phụ bên phải
    <aside className="grid gap-5 md:grid-cols-2 md:items-start lg:block lg:space-y-6">
      {!hideLookup && (
        <Link
          to="/tra-cuu/luat-su"
          className="group flex items-center gap-4 overflow-hidden rounded-xl bg-navy-950 p-5 text-white transition-colors hover:bg-navy-900 md:col-span-2 lg:col-span-1"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gold/15 ring-1 ring-gold/40">
            <Search className="h-5 w-5 text-gold-hover" />
          </span>
          <span>
            <span className="block text-base font-bold">Tra cứu luật sư</span>
            <span className="block text-xs text-stone-300">Luật sư thành viên & tổ chức hành nghề</span>
          </span>
        </Link>
      )}

      <Box title="Xem nhiều nhất">
        {loading ? (
          <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : (
          <ol className="space-y-4">
            {(data?.popular || []).map((post, i) => (
              <li key={post.id} className={`gap-3 ${i >= 3 ? 'hidden lg:flex' : 'flex'}`}>
                <span className="w-5 shrink-0 text-xl font-bold leading-none text-gold">{i + 1}</span>
                <Link to={portalRoutes.post(post.slug)} className="h-12 w-16 shrink-0 overflow-hidden rounded bg-stone-100">
                  <Thumb src={post.thumbnail} />
                </Link>
                <Link to={portalRoutes.post(post.slug)} className="line-clamp-3 text-[13px] font-medium leading-snug text-navy-950 hover:text-gold-dark">
                  {post.title}
                </Link>
              </li>
            ))}
          </ol>
        )}
      </Box>

      {data?.upcomingEvents?.length > 0 && (
        <Box title="Lịch công tác sắp tới">
          <ul className="space-y-4">
            {data.upcomingEvents.map((ev) => (
              <li key={ev.id} className="flex gap-3">
                <DateBadge date={ev.startAt} className="h-12 w-12" />
                <div className="min-w-0">
                  <Link to={portalRoutes.event(ev.slug)} className="line-clamp-2 text-[13px] font-semibold leading-snug text-navy-950 hover:text-gold-dark">
                    {ev.title}
                  </Link>
                  <p className="mt-1 flex flex-wrap gap-x-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />{formatTime(ev.startAt)}</span>
                    {ev.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.location}</span>}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <Link to="/lich-cong-tac" className="mt-2 block py-2 text-xs font-semibold text-gold-dark hover:text-navy-950">Xem toàn bộ lịch →</Link>
        </Box>
      )}

      <Box title="Bài viết mới" className="hidden lg:block">
        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {(data?.latest || []).map((post) => (
              <li key={post.id} className="py-2.5 first:pt-0 last:pb-0">
                <Link to={portalRoutes.post(post.slug)} className="line-clamp-2 text-[13px] leading-snug text-navy-950 hover:text-gold-dark">
                  {post.title}
                </Link>
                <span className="text-xs text-slate-500">{formatDay(post.publishedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Box>

      {(data?.banners || []).map((b) => (
        <SmartLink key={b.id} to={b.linkUrl} newTab={b.openInNewTab} className="block overflow-hidden rounded-xl border border-stone-200">
          {b.imageUrl ? <img src={assetUrl(b.imageUrl)} alt={b.title} className="w-full" /> : <span className="block p-4 text-sm font-semibold">{b.title}</span>}
        </SmartLink>
      ))}
    </aside>
  );
};

export default PortalSidebar;
