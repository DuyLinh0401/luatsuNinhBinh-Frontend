// Hồ sơ luật sư thành viên (/tra-cuu/luat-su/:slug)
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Mail, Phone, Building2, MapPin, ArrowLeft, Languages } from 'lucide-react';
import { lawyerApi, assetUrl } from '../../services/portalService';
import { portalRoutes } from '../../utils/portalRoutes';
import useAsync from '../../hooks/useAsync';
import usePageTitle from '../../hooks/usePageTitle';
import usePortalMeta from '../../hooks/usePortalMeta';
import { Container, Breadcrumb, RichContent, Skeleton, NotFoundBlock } from '../../components/portal/PortalUI';
import { formatDay } from '../../components/portal/portalFormat';

const STATUS_STYLE = {
  PRACTICING: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  SUSPENDED: 'bg-amber-50 text-amber-700 ring-amber-200',
  TRANSFERRED: 'bg-slate-100 text-slate-600 ring-slate-200',
  REMOVED: 'bg-red-50 text-red-700 ring-red-200'
};

const Section = ({ title, children }) => (
  <section className="rounded-xl border border-stone-200 bg-white p-5 sm:p-6">
    <h2 className="mb-4 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide !text-navy-950">
      <span className="h-4 w-1 rounded-full bg-gold" />
      {title}
    </h2>
    {children}
  </section>
);

const LawyerProfile = () => {
  const { slug } = useParams();
  const { label } = usePortalMeta();
  const { data: lawyer, loading, error } = useAsync(() => lawyerApi.bySlug(slug), [slug]);
  usePageTitle(lawyer?.name || 'Hồ sơ luật sư');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) {
    return (
      <Container className="py-10">
        <Skeleton className="h-4 w-64" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </Container>
    );
  }

  // API trả về cả luật sư đã ẩn khi biết slug: coi như không tồn tại trên trang công khai
  if (error || !lawyer || lawyer.isActive === false) {
    return <NotFoundBlock title="Không tìm thấy luật sư" description="Hồ sơ không tồn tại hoặc không còn được công khai." />;
  }

  const practiceRows = [
    ['Số thẻ luật sư', lawyer.cardNumber],
    ['Ngày cấp thẻ', formatDay(lawyer.cardIssuedDate)],
    ['Số chứng chỉ hành nghề', lawyer.certificateNumber],
    ['Ngày cấp CCHN', formatDay(lawyer.certificateDate)],
    ['Ngày gia nhập Đoàn', formatDay(lawyer.joinedDate)],
    [
      'Tổ chức hành nghề',
      lawyer.organization && (
        <Link to={portalRoutes.organization(lawyer.organization.slug)} className="font-medium text-navy-950 hover:text-gold-dark">
          {lawyer.organization.name}
        </Link>
      )
    ],
    [
      'Lĩnh vực hành nghề',
      lawyer.practiceAreas?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {lawyer.practiceAreas.map((a) => (
            <Link
              key={a.id}
              to={`/tra-cuu/luat-su?practiceArea=${a.slug}`}
              className="rounded-full bg-gold/10 px-2.5 py-0.5 text-xs font-medium text-gold-dark ring-1 ring-inset ring-gold/30 hover:bg-gold/20"
            >
              {a.name}
            </Link>
          ))}
        </div>
      )
    ],
    ['Kinh nghiệm', lawyer.experience ? `${lawyer.experience} năm` : null],
    ['Năm sinh', lawyer.birthYear],
    ['Giới tính', lawyer.gender && label('gender', lawyer.gender)]
  ].filter(([, value]) => value);

  const hasContact = lawyer.email || lawyer.phone;

  return (
    <div className="bg-stone-parchment pb-16">
      <Container className="pt-6">
        <Breadcrumb items={[{ label: 'Tra cứu luật sư', to: '/tra-cuu/luat-su' }, { label: lawyer.name }]} />

        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* Thẻ hồ sơ */}
          <aside className="space-y-6">
            <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
              <div className="h-20 bg-gradient-to-r from-navy-950 to-navy-800" />
              <div className="-mt-12 px-6 pb-6 text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-navy-950 text-3xl font-bold text-gold-hover ring-4 ring-white">
                  {lawyer.avatar ? <img src={assetUrl(lawyer.avatar)} alt={lawyer.name} className="h-full w-full object-cover" /> : lawyer.name.charAt(0)}
                </div>
                <h1 className="mt-4 text-2xl font-bold !text-navy-950">{lawyer.name}</h1>
                {lawyer.position && <p className="mt-1 text-sm text-slate-500">{lawyer.position}</p>}
                <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[lawyer.memberStatus] || STATUS_STYLE.TRANSFERRED}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {label('lawyerStatus', lawyer.memberStatus)}
                </span>
              </div>
              {hasContact && (
                <div className="space-y-2 border-t border-stone-100 px-6 py-4 text-sm">
                  {lawyer.phone && (
                    <a href={`tel:${lawyer.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-slate-600 hover:text-navy-950">
                      <Phone className="h-4 w-4 text-gold-dark" /> {lawyer.phone}
                    </a>
                  )}
                  {lawyer.email && (
                    <a href={`mailto:${lawyer.email}`} className="flex items-center gap-2 break-all text-slate-600 hover:text-navy-950">
                      <Mail className="h-4 w-4 shrink-0 text-gold-dark" /> {lawyer.email}
                    </a>
                  )}
                </div>
              )}
            </div>

            {lawyer.organization && (
              <div className="rounded-xl border border-stone-200 bg-white p-5 text-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Tổ chức hành nghề</p>
                <Link to={portalRoutes.organization(lawyer.organization.slug)} className="mt-2 flex items-start gap-2 font-semibold text-navy-950 hover:text-gold-dark">
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
                  {lawyer.organization.name}
                </Link>
                {lawyer.organization.address && (
                  <p className="mt-2 flex items-start gap-2 text-slate-500"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{lawyer.organization.address}</p>
                )}
                {lawyer.organization.phone && (
                  <a href={`tel:${lawyer.organization.phone.replace(/\s/g, '')}`} className="mt-2 flex items-center gap-2 text-slate-500 hover:text-navy-950">
                    <Phone className="h-4 w-4" />{lawyer.organization.phone}
                  </a>
                )}
              </div>
            )}

            <Link to="/tra-cuu/luat-su" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy-950">
              <ArrowLeft className="h-4 w-4" /> Quay lại tra cứu
            </Link>
          </aside>

          {/* Thông tin chi tiết */}
          <div className="min-w-0 space-y-6">
            <Section title="Thông tin hành nghề">
              {practiceRows.length ? (
                <dl className="divide-y divide-stone-100">
                  {practiceRows.map(([term, value]) => (
                    <div key={term} className="grid gap-1 py-2.5 text-sm sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-4">
                      <dt className="text-slate-500">{term}</dt>
                      <dd className="text-navy-950">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-slate-500">Chưa cập nhật thông tin hành nghề.</p>
              )}
            </Section>

            {lawyer.biography && (
              <Section title="Giới thiệu">
                <RichContent html={lawyer.biography} />
              </Section>
            )}

            {(lawyer.education || lawyer.awards) && (
              <div className="grid gap-6 md:grid-cols-2">
                {lawyer.education && (
                  <Section title="Học vấn">
                    <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{lawyer.education}</p>
                  </Section>
                )}
                {lawyer.awards && (
                  <Section title="Thành tích">
                    <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{lawyer.awards}</p>
                  </Section>
                )}
              </div>
            )}

            {lawyer.languages?.length > 0 && (
              <Section title="Ngôn ngữ">
                <div className="flex flex-wrap items-center gap-2">
                  <Languages className="h-4 w-4 text-gold-dark" />
                  {lawyer.languages.map((lang) => (
                    <span key={lang} className="rounded-md bg-stone-100 px-2.5 py-1 text-xs font-medium text-slate-700">{lang}</span>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default LawyerProfile;
