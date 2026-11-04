// Chi tiết sự kiện / lịch công tác: /lich-cong-tac/:slug
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarPlus, ExternalLink, FileText, Clock, MapPin, Tag, Hourglass } from 'lucide-react';
import { eventApi } from '../../services/portalService';
import { portalRoutes } from '../../utils/portalRoutes';
import useAsync from '../../hooks/useAsync';
import usePageTitle from '../../hooks/usePageTitle';
import usePortalMeta from '../../hooks/usePortalMeta';
import { Container, Breadcrumb, DateBadge, ShareButtons, Skeleton, NotFoundBlock } from '../../components/portal/PortalUI';
import PortalSidebar from '../../components/portal/PortalSidebar';
import { formatDateTime } from '../../components/portal/portalFormat';

// ---------- Tệp lịch .ics ----------

const icsDate = (value) => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsText = (value = '') => `${value}`.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

const downloadIcs = (ev) => {
  const start = new Date(ev.startAt);
  const end = ev.endAt ? new Date(ev.endAt) : new Date(start.getTime() + 60 * 60 * 1000);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Doan Luat su tinh Ninh Binh//Lich cong tac//VI',
    'BEGIN:VEVENT',
    `UID:event-${ev.id}@lawnb`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(ev.title)}`,
    ev.location && `LOCATION:${icsText(ev.location)}`,
    ev.description && `DESCRIPTION:${icsText(ev.description)}`,
    `URL:${window.location.href}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean);
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${ev.slug}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const InfoRow = ({ icon: Icon, label, children }) => (
  <div className="flex gap-3 py-3 first:pt-0 last:pb-0">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
    <div className="min-w-0">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-navy-950">{children}</p>
    </div>
  </div>
);

const EventDetail = () => {
  const { slug } = useParams();
  const { label } = usePortalMeta();
  const { data: ev, loading, notFound, error } = useAsync(() => eventApi.bySlug(slug), [slug]);
  usePageTitle(ev?.title);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (notFound || (error && !loading)) return <NotFoundBlock title="Không tìm thấy sự kiện" />;

  if (loading || !ev) {
    return (
      <Container className="py-10">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="mt-5 h-9 w-2/3" />
        <Skeleton className="mt-6 h-48" />
      </Container>
    );
  }

  const deadlinePassed = ev.registrationDeadline && new Date(ev.registrationDeadline) < new Date();
  const canRegister = ev.registrationUrl && !deadlinePassed;

  return (
    <Container className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <article className="min-w-0">
        <Breadcrumb items={[{ label: 'Lịch công tác', to: '/lich-cong-tac' }, { label: ev.title }]} />

        <div className="mt-5 flex items-start gap-4">
          <DateBadge date={ev.startAt} className="h-16 w-16" />
          <div className="min-w-0">
            <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[11px] font-semibold text-gold-dark ring-1 ring-inset ring-gold/30">
              {label('eventType', ev.type)}
            </span>
            <h1 className="mt-2 text-2xl font-bold leading-snug !text-navy-950 sm:text-3xl">{ev.title}</h1>
          </div>
        </div>

        <div className="mt-6 divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white p-5">
          <InfoRow icon={Clock} label="Thời gian">
            {formatDateTime(ev.startAt)}
            {ev.endAt && ` – ${formatDateTime(ev.endAt)}`}
          </InfoRow>
          {ev.location && <InfoRow icon={MapPin} label="Địa điểm">{ev.location}</InfoRow>}
          <InfoRow icon={Tag} label="Loại sự kiện">{label('eventType', ev.type)}</InfoRow>
          {ev.registrationDeadline && (
            <InfoRow icon={Hourglass} label="Hạn đăng ký">
              {formatDateTime(ev.registrationDeadline)}
              {deadlinePassed && <span className="ml-2 text-xs font-semibold text-red-600">(đã hết hạn)</span>}
            </InfoRow>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {canRegister && (
            <a
              href={ev.registrationUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-hover"
            >
              Đăng ký tham dự <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <button
            type="button"
            onClick={() => downloadIcs(ev)}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-navy-950 hover:border-navy-950"
          >
            <CalendarPlus className="h-4 w-4" /> Thêm vào lịch
          </button>
        </div>

        {ev.description && (
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide !text-navy-950">Nội dung</h2>
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-700">{ev.description}</p>
          </div>
        )}

        {ev.post && (
          <Link
            to={portalRoutes.post(ev.post.slug)}
            className="mt-8 flex items-center gap-3 rounded-xl border border-gold/40 bg-gold/5 p-4 hover:bg-gold/10"
          >
            <FileText className="h-5 w-5 shrink-0 text-gold-dark" />
            <span className="min-w-0">
              <span className="block text-xs text-slate-500">Thông báo liên quan</span>
              <span className="block font-semibold text-navy-950">{ev.post.title}</span>
            </span>
          </Link>
        )}

        <div className="mt-8 border-t border-stone-200 pt-5">
          <ShareButtons title={ev.title} />
        </div>
      </article>

      <PortalSidebar />
    </Container>
  );
};

export default EventDetail;
