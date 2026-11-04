// Trang tĩnh: /gioi-thieu, /gioi-thieu/:slug và trang gốc /:pageSlug (hồ sơ, hướng dẫn...)
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { pageApi } from '../../services/portalService';
import { portalRoutes } from '../../utils/portalRoutes';
import useAsync from '../../hooks/useAsync';
import usePageTitle from '../../hooks/usePageTitle';
import {
  Container, PageHero, Thumb, RichContent, AttachmentList, Skeleton, NotFoundBlock
} from '../../components/portal/PortalUI';

const PLACEHOLDER = '[Nội dung đang được cập nhật]';
const ABOUT_SLUG = 'gioi-thieu';

// Mục cố định của khu Giới thiệu, khớp với menu header
const ABOUT_EXTRA_LINKS = [
  { title: 'Ban Chủ nhiệm các nhiệm kỳ', to: '/gioi-thieu/ban-chu-nhiem' },
  { title: 'Hội đồng khen thưởng, kỷ luật', to: '/gioi-thieu/hoi-dong-khen-thuong-ky-luat' }
];

const isEmptyContent = (html) => {
  const text = (html || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  return !text || text === PLACEHOLDER;
};

const SectionNav = ({ heading, items, activeSlug }) => (
  <nav className="overflow-hidden rounded-xl border border-stone-200 bg-white">
    {heading && (
      <Link
        to={heading.to}
        className="flex items-center gap-2 border-b border-stone-200 bg-navy-950 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white hover:text-gold-hover"
      >
        <span className="h-4 w-1 rounded-full bg-gold" />
        {heading.title}
      </Link>
    )}
    <ul className="divide-y divide-stone-100">
      {items.map((item) => {
        const active = item.slug && item.slug === activeSlug;
        return (
          <li key={item.to}>
            <Link
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center justify-between gap-2 px-4 py-2.5 text-sm transition-colors ${
                active ? 'bg-gold/10 font-semibold text-navy-950' : 'text-slate-600 hover:bg-stone-50 hover:text-navy-950'
              }`}
            >
              <span>{item.title}</span>
              <ChevronRight className={`h-4 w-4 shrink-0 ${active ? 'text-gold-dark' : 'text-slate-300'}`} />
            </Link>
          </li>
        );
      })}
    </ul>
  </nav>
);

const StaticPage = () => {
  const { slug: childSlug, pageSlug } = useParams();
  const slug = childSlug ?? pageSlug ?? ABOUT_SLUG;
  const { data: page, loading, notFound, error } = useAsync(() => pageApi.bySlug(slug), [slug]);

  usePageTitle(page?.title);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (notFound || (error && !loading)) return <NotFoundBlock title="Không tìm thấy trang" />;

  if (loading || !page) {
    return (
      <>
        <div className="h-40 animate-pulse bg-navy-950" />
        <Container className="grid gap-8 py-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          <Skeleton className="h-64" />
          <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-6">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-4" />)}
          </div>
        </Container>
      </>
    );
  }

  const parent = page.parent;
  const sectionSlug = parent?.slug ?? page.slug;
  const isAboutSection = sectionSlug === ABOUT_SLUG;

  // Trang cha: liệt kê trang con; trang con: liệt kê trang cùng cấp
  const navPages = parent ? page.siblings : page.children;
  const navItems = [
    ...navPages.map((p) => ({ title: p.title, slug: p.slug, to: portalRoutes.page(p.slug, sectionSlug) })),
    ...(isAboutSection ? ABOUT_EXTRA_LINKS : [])
  ];
  const heading = parent
    ? { title: parent.title, to: portalRoutes.page(parent.slug) }
    : navItems.length ? { title: page.title, to: portalRoutes.page(page.slug) } : null;

  const showChildCards = !parent && page.children.length > 0 && isEmptyContent(page.content);
  const breadcrumb = parent
    ? [{ label: parent.title, to: portalRoutes.page(parent.slug) }, { label: page.title }]
    : [{ label: page.title }];

  return (
    <>
      <PageHero title={page.title} description={page.summary} breadcrumb={breadcrumb} />

      <Container className={`grid gap-8 py-8 ${navItems.length ? 'lg:grid-cols-[260px_minmax(0,1fr)]' : ''}`}>
        {navItems.length > 0 && (
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionNav heading={heading} items={navItems} activeSlug={page.slug} />
          </div>
        )}

        <div className="min-w-0">
          {showChildCards ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {[...page.children, ...(isAboutSection ? ABOUT_EXTRA_LINKS : [])].map((child) => {
                const to = child.to ?? portalRoutes.page(child.slug, page.slug);
                return (
                  <Link
                    key={to}
                    to={to}
                    className="group overflow-hidden rounded-xl border border-stone-200 bg-white transition-shadow hover:shadow-legal"
                  >
                    <div className="aspect-[16/9] overflow-hidden bg-stone-100">
                      <Thumb src={child.thumbnail} alt={child.title} className="transition-transform duration-500 group-hover:scale-[1.03]" />
                    </div>
                    <div className="p-5">
                      <h2 className="text-lg font-bold leading-snug !text-navy-950 group-hover:!text-gold-dark">{child.title}</h2>
                      {child.summary && <p className="mt-2 line-clamp-3 text-sm text-slate-600">{child.summary}</p>}
                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-gold-dark">
                        Xem chi tiết <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <article className="rounded-xl border border-stone-200 bg-white p-5 sm:p-8">
              {page.thumbnail && (
                <div className="mb-6 overflow-hidden rounded-lg">
                  <Thumb src={page.thumbnail} alt={page.title} />
                </div>
              )}
              {isEmptyContent(page.content) ? (
                <p className="py-8 text-center text-sm text-slate-500">Nội dung đang được cập nhật.</p>
              ) : (
                <RichContent html={page.content} />
              )}
              <AttachmentList files={page.attachments} />
            </article>
          )}
        </div>
      </Container>
    </>
  );
};

export default StaticPage;
