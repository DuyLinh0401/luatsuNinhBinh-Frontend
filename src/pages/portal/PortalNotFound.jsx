// Trang 404 của cổng thông tin: thông báo + ô tìm kiếm + liên kết nhanh
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Home, Users, ScrollText, Phone } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';
import { inputClass } from '../../components/admin/ui/format';
import { NotFoundBlock, Container } from '../../components/portal/PortalUI';

const QUICK_LINKS = [
  { to: '/', label: 'Trang chủ', icon: Home },
  { to: '/tra-cuu/luat-su', label: 'Tra cứu luật sư', icon: Users },
  { to: '/van-ban', label: 'Văn bản', icon: ScrollText },
  { to: '/lien-he', label: 'Liên hệ', icon: Phone }
];

const PortalNotFound = () => {
  usePageTitle('Không tìm thấy trang');
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const search = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/tim-kiem?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div className="pb-16">
      <NotFoundBlock title="Không tìm thấy trang" description="Trang bạn tìm có thể đã được chuyển đi hoặc không còn tồn tại. Hãy thử tìm kiếm hoặc chọn một mục bên dưới." />
      <Container>
        <div className="mx-auto max-w-lg">
          <form onSubmit={search} className="flex gap-2 [&>div]:!mb-0">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm bài viết, văn bản, luật sư..."
                aria-label="Tìm kiếm"
                className={`${inputClass} !pl-9`}
              />
            </div>
            <button type="submit" className="shrink-0 rounded-lg bg-navy-950 px-4 text-sm font-semibold text-white hover:bg-navy-800">
              Tìm
            </button>
          </form>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex flex-col items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-4 text-center text-xs font-semibold text-navy-950 transition-colors hover:border-gold hover:text-gold-dark"
              >
                <Icon className="h-5 w-5 text-gold-dark" strokeWidth={1.7} />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default PortalNotFound;
