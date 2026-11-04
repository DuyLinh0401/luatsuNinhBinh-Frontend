// Lịch công tác: /lich-cong-tac?view=upcoming|month&month=YYYY-MM&type=
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin, Clock, CalendarX, ExternalLink } from 'lucide-react';
import { eventApi } from '../../services/portalService';
import { portalRoutes } from '../../utils/portalRoutes';
import useAsync from '../../hooks/useAsync';
import usePageTitle from '../../hooks/usePageTitle';
import usePortalMeta from '../../hooks/usePortalMeta';
import { Container, PageHero, DateBadge, EmptyBlock, Skeleton } from '../../components/portal/PortalUI';
import PortalSidebar from '../../components/portal/PortalSidebar';
import { formatDay, formatTime } from '../../components/portal/portalFormat';
import { inputClass } from '../../components/admin/ui/format';

const pad = (n) => `${n}`.padStart(2, '0');
const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

const parseMonth = (value) => {
  const m = /^(\d{4})-(\d{2})$/.exec(value || '');
  return m ? { year: +m[1], month: +m[2] } : parseMonth(currentMonth());
};

const shiftMonth = ({ year, month }, delta) => {
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

const canRegister = (ev) => ev.registrationUrl && (!ev.registrationDeadline || new Date(ev.registrationDeadline) >= new Date());

// Dòng sự kiện dùng chung cho cả 2 chế độ xem
const EventRow = ({ ev, label }) => (
  <li className="flex gap-4 rounded-xl border border-stone-200 bg-white p-4">
    <DateBadge date={ev.startAt} />
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[11px] font-semibold text-gold-dark ring-1 ring-inset ring-gold/30">
          {label('eventType', ev.type)}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
          <Clock className="h-3.5 w-3.5" />
          {formatTime(ev.startAt)}
          {ev.endAt && ` – ${formatTime(ev.endAt)}${formatDay(ev.endAt) !== formatDay(ev.startAt) ? ` ${formatDay(ev.endAt)}` : ''}`}
        </span>
      </div>
      <Link to={portalRoutes.event(ev.slug)} className="mt-1.5 block text-base font-bold leading-snug text-navy-950 hover:text-gold-dark">
        {ev.title}
      </Link>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        {ev.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {ev.location}
          </span>
        )}
        {ev.registrationDeadline && <span>Hạn đăng ký: {formatDay(ev.registrationDeadline)} {formatTime(ev.registrationDeadline)}</span>}
      </div>
      {canRegister(ev) && (
        <a
          href={ev.registrationUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-navy-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-800"
        >
          Đăng ký <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  </li>
);

const EventsPage = () => {
  usePageTitle('Lịch công tác');
  const { label, options } = usePortalMeta();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') === 'month' ? 'month' : 'upcoming';
  const type = searchParams.get('type') || '';
  const monthKey = searchParams.get('month') || currentMonth();
  const { year, month } = parseMonth(monthKey);

  const params =
    view === 'month'
      ? {
          from: new Date(year, month - 1, 1).toISOString(),
          to: new Date(year, month, 0, 23, 59, 59).toISOString(),
          limit: 100,
          ...(type && { type })
        }
      : { upcoming: true, limit: 50, ...(type && { type }) };

  const { data, previous, loading } = useAsync(() => eventApi.list(params), [params]);
  const result = data || previous;

  const update = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setSearchParams(next);
  };

  // Nhóm theo ngày cho chế độ tháng
  const groups = [];
  (result?.items || []).forEach((ev) => {
    const day = new Date(ev.startAt).toDateString();
    const last = groups[groups.length - 1];
    if (last?.day === day) last.items.push(ev);
    else groups.push({ day, date: ev.startAt, items: [ev] });
  });

  const tabClass = (active) =>
    `rounded-md px-3.5 py-2 text-sm font-semibold transition-colors ${active ? 'bg-navy-950 text-white' : 'text-slate-600 hover:bg-stone-100'}`;

  return (
    <>
      <PageHero
        title="Lịch công tác"
        description="Lịch họp, lịch công tác, bồi dưỡng nghiệp vụ và các sự kiện của Đoàn Luật sư."
        breadcrumb={[{ label: 'Lịch công tác' }]}
      />

      <Container className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1">
              <button type="button" className={tabClass(view === 'upcoming')} onClick={() => update({ view: '', month: '' })}>
                Sắp diễn ra
              </button>
              <button type="button" className={tabClass(view === 'month')} onClick={() => update({ view: 'month' })}>
                Theo tháng
              </button>
            </div>
            <select className={`${inputClass} sm:w-56`} value={type} onChange={(e) => update({ type: e.target.value })}>
              <option value="">Tất cả loại sự kiện</option>
              {options('eventType').map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {view === 'month' && (
            <div className="mt-5 flex items-center justify-between rounded-xl bg-navy-950 px-3 py-2.5 text-white">
              <button type="button" onClick={() => update({ month: shiftMonth({ year, month }, -1) })} className="rounded-md p-1.5 hover:bg-white/10" aria-label="Tháng trước">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-lg font-bold">Tháng {month}/{year}</span>
              <button type="button" onClick={() => update({ month: shiftMonth({ year, month }, 1) })} className="rounded-md p-1.5 hover:bg-white/10" aria-label="Tháng sau">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}

          <div className={`mt-5 ${loading && result ? 'opacity-60' : ''}`}>
            {!result ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
            ) : !result.items.length ? (
              <EmptyBlock
                icon={CalendarX}
                title={view === 'month' ? `Không có sự kiện trong tháng ${month}/${year}` : 'Chưa có sự kiện sắp diễn ra'}
                description={view === 'upcoming' ? 'Xem lịch các tháng trước ở chế độ "Theo tháng".' : undefined}
              />
            ) : view === 'month' ? (
              <div className="space-y-6">
                {groups.map((g) => (
                  <section key={g.day}>
                    <h2 className="mb-2.5 text-sm font-bold capitalize !text-navy-950">
                      {new Date(g.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </h2>
                    <ul className="space-y-3">
                      {g.items.map((ev) => <EventRow key={ev.id} ev={ev} label={label} />)}
                    </ul>
                  </section>
                ))}
              </div>
            ) : (
              <ul className="space-y-3">
                {result.items.map((ev) => <EventRow key={ev.id} ev={ev} label={label} />)}
              </ul>
            )}
          </div>
        </div>

        <PortalSidebar />
      </Container>
    </>
  );
};

export default EventsPage;
