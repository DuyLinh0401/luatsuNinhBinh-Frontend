// Bảng điều khiển dùng chung: admin thấy toàn hệ thống, nhân viên thấy bài viết của mình
import { Link } from 'react-router-dom';
import {
  FileText, Clock, Eye, ScrollText, Users, Building2, Inbox, CalendarDays, MapPin, ArrowRight, PenSquare, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { portalApi } from '../../services/portalService';
import usePortalMeta from '../../hooks/usePortalMeta';
import useAsync from '../../hooks/useAsync';
import { PageHeader, Card, Button, Badge, EmptyState, Spinner } from '../../components/admin/ui/AdminUI';
import { formatDate } from '../../components/admin/ui/format';
import { portalRoutes } from '../../utils/portalRoutes';

const STATUS_TONE = { DRAFT: 'gray', PENDING: 'amber', PUBLISHED: 'green', ARCHIVED: 'blue' };

const StatCard = ({ icon: Icon, label, value, hint, to, tone = 'navy' }) => {
  const tones = {
    navy: 'bg-navy-950 text-gold-hover',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-emerald-50 text-emerald-600',
    gold: 'bg-gold/10 text-gold-dark'
  };
  const body = (
    <div className="flex items-start gap-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}>
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-navy-950">{value ?? '—'}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
      </div>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
};

const PortalDashboard = () => {
  const { user, isAdmin } = useAuth();
  const { label } = usePortalMeta();
  const { data, loading, error } = useAsync(() => portalApi.dashboard(), []);
  const base = isAdmin ? '/admin' : '/staff';

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }
  if (error || !data) return <EmptyState title="Không tải được số liệu" description="Vui lòng tải lại trang." />;

  const byStatus = data.posts.byStatus || {};
  const lawyers = data.lawyers || {};
  const totalLawyers = Object.values(lawyers).reduce((a, b) => a + b, 0);
  const greeting = new Date().getHours() < 12 ? 'Chào buổi sáng' : new Date().getHours() < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${user?.fullName || user?.username || ''}`}
        description={isAdmin ? 'Tổng quan hoạt động của cổng thông tin.' : 'Tổng quan bài viết của bạn và lịch công tác sắp tới.'}
        actions={<Link to={`${base}/posts`}><Button variant="gold" icon={PenSquare}>Viết bài mới</Button></Link>}
      />

      {/* Chỉ số */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Clock} tone="amber" label="Chờ duyệt" value={byStatus.PENDING || 0} hint={isAdmin ? 'Bài nhân viên gửi lên' : 'Bài bạn đã gửi duyệt'} to={`${base}/posts`} />
        <StatCard icon={FileText} tone="green" label="Đã xuất bản" value={byStatus.PUBLISHED || 0} hint={`${data.posts.publishedLast30Days} bài trong 30 ngày qua`} to={`${base}/posts`} />
        <StatCard icon={Eye} tone="gold" label="Tổng lượt xem" value={data.posts.totalViews.toLocaleString('vi-VN')} hint={isAdmin ? 'Của toàn bộ bài viết' : 'Của bài bạn viết'} />
        {isAdmin ? (
          <StatCard icon={Inbox} label="Liên hệ chưa xử lý" value={data.pendingContacts} to="/admin/contacts" />
        ) : (
          <StatCard icon={PenSquare} label="Bản nháp" value={byStatus.DRAFT || 0} to="/staff/posts" />
        )}
      </div>

      {isAdmin && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={ScrollText} tone="gold" label="Văn bản công khai" value={data.documents} to="/admin/documents" />
          <StatCard
            icon={Users}
            tone="gold"
            label="Luật sư thành viên"
            value={totalLawyers}
            hint={`${lawyers.PRACTICING || 0} đang hành nghề`}
            to="/admin/lawyers"
          />
          <StatCard icon={Building2} tone="gold" label="Tổ chức hành nghề" value={data.organizations} hint="Đang hoạt động" to="/admin/organizations" />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          {(isAdmin || data.pendingPosts.length > 0) && (
            <Card
              title={isAdmin ? 'Bài chờ duyệt' : 'Bài đang chờ duyệt'}
              padded={false}
              actions={<Link to={`${base}/posts`} className="text-xs font-semibold text-gold-dark hover:text-navy-950">Xem tất cả</Link>}
            >
              {data.pendingPosts.length ? (
                <ul className="divide-y divide-stone-100">
                  {data.pendingPosts.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                      <Clock className="h-4 w-4 shrink-0 text-amber-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-navy-950">{p.title}</p>
                        <p className="text-xs text-slate-400">{p.author?.fullName} · gửi {formatDate(p.updatedAt, true)}</p>
                      </div>
                      <Link to={`${base}/posts`} className="shrink-0 text-xs font-semibold text-gold-dark hover:text-navy-950">Xem</Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon={Clock} title="Không có bài chờ duyệt" />
              )}
            </Card>
          )}

          <Card title={isAdmin ? 'Cập nhật gần đây' : 'Bài viết gần đây của bạn'} padded={false}>
            {data.recentPosts.length ? (
              <ul className="divide-y divide-stone-100">
                {data.recentPosts.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-navy-950">{p.title}</p>
                      <p className="text-xs text-slate-400">Cập nhật {formatDate(p.updatedAt, true)} · {p.views} lượt xem</p>
                    </div>
                    <Badge tone={STATUS_TONE[p.status]} dot>{label('postStatus', p.status)}</Badge>
                    {p.status === 'PUBLISHED' && (
                      <a href={portalRoutes.post(p.slug)} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-navy-950" aria-label="Xem trên trang">
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={FileText} title="Chưa có bài viết" action={<Link to={`${base}/posts`}><Button size="sm">Viết bài đầu tiên</Button></Link>} />
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Lịch công tác sắp tới" padded={false} actions={<Link to={`${base}/events`} className="text-xs font-semibold text-gold-dark hover:text-navy-950">Quản lý</Link>}>
            {data.upcomingEvents.length ? (
              <ul className="divide-y divide-stone-100">
                {data.upcomingEvents.map((ev) => (
                  <li key={ev.id} className="flex gap-3 px-5 py-3">
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-gold/40 text-center">
                      <span className="text-base font-bold leading-none text-navy-950">{new Date(ev.startAt).getDate()}</span>
                      <span className="text-[10px] font-semibold text-gold-dark">Th{new Date(ev.startAt).getMonth() + 1}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-medium text-navy-950">{ev.title}</p>
                      <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />{formatDate(ev.startAt, true)}</span>
                        {ev.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.location}</span>}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={CalendarDays} title="Chưa có lịch sắp tới" />
            )}
          </Card>

          {isAdmin && data.popularPosts?.length > 0 && (
            <Card title="Bài xem nhiều nhất" padded={false}>
              <ol className="divide-y divide-stone-100">
                {data.popularPosts.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="w-5 text-lg font-bold text-gold">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-navy-950">{p.title}</span>
                    <span className="inline-flex items-center gap-1 text-xs tabular-nums text-slate-400">
                      <TrendingUp className="h-3 w-3" />{p.views}
                    </span>
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortalDashboard;
