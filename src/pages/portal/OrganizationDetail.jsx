// Chi tiết tổ chức hành nghề (/tra-cuu/to-chuc-hanh-nghe/:slug)
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Building2, MapPin, Phone, Mail, Globe, ArrowLeft, Users } from 'lucide-react';
import { organizationApi, assetUrl } from '../../services/portalService';
import { portalRoutes } from '../../utils/portalRoutes';
import useAsync from '../../hooks/useAsync';
import usePageTitle from '../../hooks/usePageTitle';
import usePortalMeta from '../../hooks/usePortalMeta';
import { Container, Breadcrumb, SectionTitle, EmptyBlock, Skeleton, NotFoundBlock } from '../../components/portal/PortalUI';
import { formatDay } from '../../components/portal/portalFormat';

const STATUS_STYLE = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  SUSPENDED: 'bg-amber-50 text-amber-700 ring-amber-200',
  DISSOLVED: 'bg-red-50 text-red-700 ring-red-200'
};

const LAWYER_STATUS_DOT = {
  PRACTICING: 'bg-emerald-500',
  SUSPENDED: 'bg-amber-500',
  TRANSFERRED: 'bg-slate-400',
  REMOVED: 'bg-red-500'
};

const websiteHref = (url) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

const OrganizationDetail = () => {
  const { slug } = useParams();
  const { label } = usePortalMeta();
  const { data: org, loading, error } = useAsync(() => organizationApi.bySlug(slug), [slug]);
  usePageTitle(org?.name || 'Tổ chức hành nghề');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) {
    return (
      <Container className="py-10">
        <Skeleton className="h-4 w-72" />
        <Skeleton className="mt-6 h-56 rounded-xl" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </Container>
    );
  }

  if (error || !org) {
    return <NotFoundBlock title="Không tìm thấy tổ chức hành nghề" />;
  }

  const rows = [
    ['Loại hình', label('organizationType', org.type)],
    ['Số giấy đăng ký hoạt động', org.registrationNumber],
    ['Ngày cấp', formatDay(org.registrationDate)],
    ['Người đại diện', org.representativeName],
    ['Địa chỉ', org.address && <span className="inline-flex items-start gap-1.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />{org.address}</span>],
    ['Điện thoại', org.phone && <a href={`tel:${org.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 hover:text-gold-dark"><Phone className="h-4 w-4 text-gold-dark" />{org.phone}</a>],
    ['Email', org.email && <a href={`mailto:${org.email}`} className="inline-flex items-center gap-1.5 break-all hover:text-gold-dark"><Mail className="h-4 w-4 shrink-0 text-gold-dark" />{org.email}</a>],
    ['Website', org.website && <a href={websiteHref(org.website)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 break-all hover:text-gold-dark"><Globe className="h-4 w-4 shrink-0 text-gold-dark" />{org.website}</a>]
  ].filter(([, value]) => value);

  const lawyers = org.lawyers || [];

  return (
    <div className="bg-stone-parchment pb-16">
      <Container className="pt-6">
        <Breadcrumb
          items={[
            { label: 'Tra cứu luật sư', to: '/tra-cuu/luat-su' },
            { label: 'Tổ chức hành nghề', to: '/tra-cuu/to-chuc-hanh-nghe' },
            { label: org.name }
          ]}
        />

        {/* Thông tin tổ chức */}
        <section className="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white">
          <div className="flex flex-col gap-4 bg-navy-950 px-5 py-6 sm:flex-row sm:items-center sm:px-6">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gold/15 ring-1 ring-gold/40">
              <Building2 className="h-7 w-7 text-gold-hover" />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold !text-white">{org.name}</h1>
              <p className="mt-1 text-sm text-stone-300">{label('organizationType', org.type)}</p>
            </div>
            <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[org.status] || STATUS_STYLE.SUSPENDED}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {label('organizationStatus', org.status)}
            </span>
          </div>
          <dl className="divide-y divide-stone-100 px-5 sm:px-6">
            {rows.map(([term, value]) => (
              <div key={term} className="grid gap-1 py-3 text-sm sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-4">
                <dt className="text-slate-500">{term}</dt>
                <dd className="text-navy-950">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Luật sư thành viên */}
        <section className="mt-10">
          <SectionTitle title={`Luật sư thành viên (${lawyers.length})`} />
          {lawyers.length ? (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {lawyers.map((l) => (
                <li key={l.id}>
                  <Link
                    to={portalRoutes.lawyer(l.slug)}
                    className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3.5 transition-colors hover:border-gold/60"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy-950 font-bold text-gold-hover">
                      {l.avatar ? <img src={assetUrl(l.avatar)} alt="" className="h-full w-full object-cover" /> : l.name.charAt(0)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-navy-950">{l.name}</span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                        <span className={`h-1.5 w-1.5 rounded-full ${LAWYER_STATUS_DOT[l.memberStatus] || 'bg-slate-400'}`} />
                        {l.cardNumber ? `Thẻ số ${l.cardNumber}` : label('lawyerStatus', l.memberStatus)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyBlock icon={Users} title="Chưa có luật sư nào được cập nhật" />
          )}
        </section>

        <Link to="/tra-cuu/to-chuc-hanh-nghe" className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy-950">
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách tổ chức
        </Link>
      </Container>
    </div>
  );
};

export default OrganizationDetail;
