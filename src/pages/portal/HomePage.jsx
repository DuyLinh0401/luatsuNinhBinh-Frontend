// Trang chủ cổng thông tin: tin nổi bật, liên kết nhanh, các khối chuyên mục, lịch công tác, văn bản mới
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ChevronLeft, ChevronRight, GraduationCap, FileBadge, UserPlus, FileText, Scale, BookOpen,
  CalendarDays, Users, Building2, Landmark, ClipboardList, Link2, MapPin, ScrollText, Megaphone
} from 'lucide-react';
import { portalApi, postApi, assetUrl } from '../../services/portalService';
import { portalRoutes } from '../../utils/portalRoutes';
import { useSite } from '../../contexts/siteContext';
import useAsync from '../../hooks/useAsync';
import usePageTitle from '../../hooks/usePageTitle';
import usePortalMeta from '../../hooks/usePortalMeta';
import NewsTicker from '../../components/portal/NewsTicker';
import {
  Container, SectionTitle, PostCard, DateBadge, SmartLink, Skeleton, EmptyBlock
} from '../../components/portal/PortalUI';
import { formatDay, formatTime } from '../../components/portal/portalFormat';

// Tên icon lucide lưu trong banner QUICK_LINK
const QUICK_ICONS = { GraduationCap, FileBadge, UserPlus, Search, FileText, Scale, BookOpen, CalendarDays, Users, Building2, Landmark, ClipboardList };

// ---------- Hero ----------

const HeroSearch = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim().length >= 2) navigate(`/tim-kiem?q=${encodeURIComponent(q.trim())}`);
      }}
      className="mt-6 flex max-w-xl overflow-hidden rounded-xl bg-white p-1.5 shadow-2xl shadow-black/30 [&>div]:!mb-0"
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Tìm văn bản, thông báo, luật sư..."
        aria-label="Tìm kiếm"
        className="min-w-0 flex-1 border-0 bg-transparent !px-3 !py-2.5 text-[15px] text-navy-950 placeholder:text-slate-400 focus:outline-none focus:ring-0"
      />
      <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-dark">
        <Search className="h-4 w-4" /> <span className="hidden sm:inline">Tìm kiếm</span>
      </button>
    </form>
  );
};

// Slider ảnh từ banner HOME_SLIDER; không có banner thì dùng hero mặc định
const Hero = ({ slides, siteName }) => {
  const [index, setIndex] = useState(0);
  const count = slides.length;

  useEffect(() => {
    if (count < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    return () => clearInterval(id);
  }, [count]);

  if (!count) {
    return (
      <section className="relative overflow-hidden bg-navy-950">
        <img src="/images/trangan-hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950/90 via-navy-900/65 to-brand/10" />
        <Container className="relative py-14 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-hover">Cổng thông tin điện tử</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight !text-white sm:text-5xl">{siteName}</h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone-300 sm:text-base">
            Thông tin hoạt động, văn bản, lịch công tác và cơ sở dữ liệu luật sư thành viên.
          </p>
          <HeroSearch />
        </Container>
      </section>
    );
  }

  const current = slides[index % count];
  return (
    <section className="relative overflow-hidden bg-navy-950">
      <div className="relative aspect-[16/7] max-h-[560px] w-full sm:aspect-[16/6]">
        {slides.map((s, i) => (
          <img
            key={s.id}
            src={assetUrl(s.imageUrl)}
            alt={s.title}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${i === index % count ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-950/15 to-transparent" />
        <Container className="absolute inset-x-0 bottom-0 pb-6 sm:pb-10">
          {current.title && (
            <SmartLink to={current.linkUrl} newTab={current.openInNewTab} className="block max-w-3xl">
              <h2 className="text-xl font-bold !text-white drop-shadow sm:text-3xl">{current.title}</h2>
              {current.description && <p className="mt-2 line-clamp-2 text-sm text-stone-200">{current.description}</p>}
            </SmartLink>
          )}
        </Container>
        {count > 1 && (
          <>
            <button type="button" aria-label="Ảnh trước" onClick={() => setIndex((i) => (i - 1 + count) % count)} className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur hover:bg-black/50 sm:flex">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" aria-label="Ảnh sau" onClick={() => setIndex((i) => (i + 1) % count)} className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur hover:bg-black/50 sm:flex">
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 right-4 flex gap-1.5">
              {slides.map((s, i) => (
                <button key={s.id} type="button" aria-label={`Ảnh ${i + 1}`} onClick={() => setIndex(i)} className={`h-1.5 rounded-full transition-all ${i === index % count ? 'w-6 bg-gold' : 'w-1.5 bg-white/60'}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

// ---------- Các khối ----------

const QuickLinks = ({ links }) => {
  if (!links?.length) return null;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {links.map((l) => {
        const Icon = QUICK_ICONS[l.icon] || Link2;
        return (
          <SmartLink
            key={l.id}
            to={l.linkUrl}
            newTab={l.openInNewTab}
            className="group flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-navy-950 text-gold-hover transition-colors group-hover:bg-gold group-hover:text-navy-950">
              {l.imageUrl ? <img src={assetUrl(l.imageUrl)} alt="" className="h-6 w-6 object-contain" /> : <Icon className="h-5 w-5" />}
            </span>
            <span className="text-[13px] font-semibold leading-snug text-navy-950">{l.title}</span>
          </SmartLink>
        );
      })}
    </div>
  );
};

// Khối chuyên mục: tab theo chuyên mục con, bài đầu lớn + danh sách bên cạnh
const CategorySection = ({ section }) => {
  const { categoryHref } = useSite();
  const [tab, setTab] = useState(null);
  const tabData = useAsync(
    () => (tab ? postApi.list({ category: tab.slug, limit: 5 }).then((d) => d.items) : Promise.resolve(null)),
    [tab?.slug]
  );
  const posts = tab ? tabData.data || tabData.previous || [] : section.posts;
  const isGallery = section.category.slug === 'hinh-anh-video';
  const [lead, ...rest] = posts;

  return (
    <section>
      <SectionTitle title={section.category.name} to={categoryHref(tab || section.category)}>
        {section.children.length > 0 && !isGallery && (
          <div className="hidden items-center gap-1 lg:flex">
            {[null, ...section.children.slice(0, 4)].map((c) => (
              <button
                key={c?.id ?? 'all'}
                type="button"
                onClick={() => setTab(c)}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  (tab?.id ?? null) === (c?.id ?? null) ? 'bg-navy-950 text-white' : 'text-slate-500 hover:bg-stone-200/60 hover:text-navy-950'
                }`}
              >
                {c ? c.name : 'Tất cả'}
              </button>
            ))}
          </div>
        )}
      </SectionTitle>

      {tab && tabData.loading && !tabData.previous ? (
        <Skeleton className="h-64" />
      ) : !posts.length ? (
        <EmptyBlock title="Chưa có bài viết trong mục này" />
      ) : isGallery ? (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
          {posts.slice(0, 6).map((p) => <PostCard key={p.id} post={p} variant="grid" />)}
        </div>
      ) : (
        <div className={`grid gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] ${tab && tabData.loading ? 'opacity-60' : ''}`}>
          <PostCard post={lead} variant="lead" showCategory={false} />
          <div className="space-y-4 divide-y divide-stone-200 [&>*+*]:pt-4">
            {rest.slice(0, 4).map((p) => <PostCard key={p.id} post={p} variant="compact" />)}
          </div>
        </div>
      )}
    </section>
  );
};

const InlineBanner = ({ banner }) => (
  <SmartLink to={banner.linkUrl} newTab={banner.openInNewTab} className="block overflow-hidden rounded-xl border border-stone-200 shadow-sm">
    {banner.imageUrl ? (
      <img src={assetUrl(banner.imageUrl)} alt={banner.title} className="w-full" loading="lazy" />
    ) : (
      <span className="block bg-navy-950 p-5 text-lg font-bold text-white">{banner.title}</span>
    )}
  </SmartLink>
);

const EventsBox = ({ events }) => (
  <section className="rounded-xl border border-stone-200 bg-white p-5">
    <SectionTitle title="Lịch công tác" to="/lich-cong-tac" action="Xem lịch" className="!mb-4" />
    {events.length ? (
      <ul className="space-y-4">
        {events.map((ev) => (
          <li key={ev.id} className="flex gap-3">
            <DateBadge date={ev.startAt} />
            <div className="min-w-0">
              <Link to={portalRoutes.event(ev.slug)} className="line-clamp-2 text-sm font-semibold leading-snug text-navy-950 hover:text-gold-dark">
                {ev.title}
              </Link>
              <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />{formatTime(ev.startAt)}</span>
                {ev.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.location}</span>}
              </p>
            </div>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-slate-500">Chưa có lịch công tác sắp tới.</p>
    )}
  </section>
);

const DocumentsBox = ({ documents }) => {
  const { label } = usePortalMeta();
  return (
    <section className="rounded-xl border border-stone-200 bg-white p-5">
      <SectionTitle title="Văn bản mới" to="/van-ban" className="!mb-4" />
      {documents.length ? (
        <ul className="divide-y divide-stone-100">
          {documents.map((d) => (
            <li key={d.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <ScrollText className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" strokeWidth={1.6} />
              <div className="min-w-0">
                <Link to={portalRoutes.document(d.slug)} className="line-clamp-2 text-sm font-medium leading-snug text-navy-950 hover:text-gold-dark">
                  {d.title}
                </Link>
                <p className="mt-0.5 text-xs text-slate-500">
                  {[d.documentNumber, label('documentType', d.documentType), formatDay(d.issuedDate)].filter(Boolean).join(' · ')}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">Chưa có văn bản.</p>
      )}
    </section>
  );
};

const LookupBox = () => (
  <section className="relative overflow-hidden rounded-xl bg-navy-950 p-6 text-white">
    <Scale className="absolute -right-6 -top-6 h-32 w-32 text-white/[0.04]" />
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-hover">Cơ sở dữ liệu</p>
    <h2 className="mt-1 text-xl font-bold !text-white">Tra cứu luật sư</h2>
    <p className="mt-2 text-[13px] text-stone-300">Kiểm tra thông tin luật sư thành viên và tổ chức hành nghề luật sư.</p>
    <div className="mt-4 grid gap-2">
      <Link to="/tra-cuu/luat-su" className="flex items-center justify-between rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-hover">
        Luật sư thành viên <ChevronRight className="h-4 w-4" />
      </Link>
      <Link to="/tra-cuu/to-chuc-hanh-nghe" className="flex items-center justify-between rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/5">
        Tổ chức hành nghề <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  </section>
);

const Partners = ({ partners }) => {
  if (!partners?.length) return null;
  return (
    <section className="border-t border-stone-200 bg-white py-8">
      <Container>
        <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Đơn vị liên kết</p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {partners.map((p) => (
            <SmartLink key={p.id} to={p.linkUrl} newTab={p.openInNewTab ?? true} title={p.title} className="opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0">
              {p.imageUrl ? <img src={assetUrl(p.imageUrl)} alt={p.title} className="h-14 w-auto object-contain" loading="lazy" /> : <span className="text-sm font-semibold text-navy-950">{p.title}</span>}
            </SmartLink>
          ))}
        </div>
      </Container>
    </section>
  );
};

// ---------- Trang ----------

const HomeSkeleton = () => (
  <Container className="space-y-8 py-8">
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <Skeleton className="aspect-[16/9]" />
      <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
    </div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
  </Container>
);

const HomePage = () => {
  const { settings } = useSite();
  const siteName = settings.general?.siteName || 'Đoàn Luật sư tỉnh Ninh Bình';
  usePageTitle(null);
  const { data, loading, error } = useAsync(() => portalApi.home(), []);

  const banners = data?.banners || {};
  const featured = data?.featured || [];
  const sections = (data?.sections || []).filter((s) => s.posts.length > 0);
  const notice = banners.HOME_FEATURED?.[0];
  const inline = banners.HOME_INLINE || [];
  const [lead, ...others] = featured;

  return (
    <div className="bg-stone-parchment">
      <NewsTicker />
      <Hero slides={(banners.HOME_SLIDER || []).filter((b) => b.imageUrl)} siteName={siteName} />

      {loading ? (
        <HomeSkeleton />
      ) : error ? (
        <Container className="py-16">
          <EmptyBlock title="Không tải được dữ liệu trang chủ" description="Vui lòng thử tải lại trang sau ít phút." />
        </Container>
      ) : (
        <>
          <Container className="space-y-10 py-8 sm:py-10">
            {notice && (
              <SmartLink to={notice.linkUrl} newTab={notice.openInNewTab} className="flex items-center gap-3 rounded-xl border border-gold/40 bg-gold/10 px-5 py-3.5 hover:bg-gold/15">
                <Megaphone className="h-5 w-5 shrink-0 text-gold-dark" />
                <span className="text-sm font-semibold text-navy-950">{notice.title}</span>
                <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-gold-dark" />
              </SmartLink>
            )}

            {/* Tin nổi bật */}
            {lead && (
              <section>
                <SectionTitle title="Tin nổi bật" />
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                  <PostCard post={lead} variant="lead" />
                  <div className="space-y-4 divide-y divide-stone-200 [&>*+*]:pt-4">
                    {others.slice(0, 5).map((p) => <PostCard key={p.id} post={p} variant="compact" />)}
                  </div>
                </div>
              </section>
            )}

            <QuickLinks links={banners.QUICK_LINK} />

            {/* Khối chuyên mục + cột phải */}
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="space-y-10">
                {sections.map((section, i) => (
                  <div key={section.category.id} className="space-y-10">
                    <CategorySection section={section} />
                    {/* Banner ngang chèn sau khối thứ 2, 4, ... */}
                    {i % 2 === 1 && inline[(i - 1) / 2] && <InlineBanner banner={inline[(i - 1) / 2]} />}
                  </div>
                ))}
                {!sections.length && <EmptyBlock title="Chưa có bài viết" description="Nội dung sẽ được cập nhật sớm." />}
              </div>

              <div className="space-y-6 lg:sticky lg:top-16 lg:self-start">
                <LookupBox />
                <EventsBox events={data.upcomingEvents || []} />
                <DocumentsBox documents={data.latestDocuments || []} />
              </div>
            </div>
          </Container>

          <Partners partners={banners.PARTNER} />
        </>
      )}
    </div>
  );
};

export default HomePage;
