// Tra cứu luật sư thành viên (/tra-cuu/luat-su)
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Users, Building2, Phone, RotateCcw } from 'lucide-react';
import { lawyerApi, organizationApi, practiceAreaApi, assetUrl } from '../../services/portalService';
import { portalRoutes } from '../../utils/portalRoutes';
import { useSite } from '../../contexts/siteContext';
import useAsync from '../../hooks/useAsync';
import usePageTitle from '../../hooks/usePageTitle';
import usePortalMeta from '../../hooks/usePortalMeta';
import { inputClass } from '../../components/admin/ui/format';
import { Container, PageHero, PublicPagination, EmptyBlock, Skeleton, FilterToggle } from '../../components/portal/PortalUI';

const STATUS_STYLE = {
  PRACTICING: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  SUSPENDED: 'bg-amber-50 text-amber-700 ring-amber-200',
  TRANSFERRED: 'bg-slate-100 text-slate-600 ring-slate-200',
  REMOVED: 'bg-red-50 text-red-700 ring-red-200'
};

const FILTER_KEYS = ['q', 'organization', 'practiceArea', 'memberStatus'];

const LookupTabs = ({ active }) => (
  <div className="mt-5 inline-flex rounded-full bg-white/10 p-1 ring-1 ring-white/15">
    {[
      { key: 'lawyers', to: '/tra-cuu/luat-su', label: 'Luật sư thành viên', icon: Users },
      { key: 'orgs', to: '/tra-cuu/to-chuc-hanh-nghe', label: 'Tổ chức hành nghề', icon: Building2 }
    ].map(({ key, to, label, icon: Icon }) => (
      <Link
        key={key}
        to={to}
        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
          active === key ? 'bg-gold text-navy-950' : 'text-stone-200 hover:text-white'
        }`}
      >
        <Icon className="h-4 w-4" /> {label}
      </Link>
    ))}
  </div>
);

const StatusBadge = ({ status, label }) => (
  <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[status] || STATUS_STYLE.TRANSFERRED}`}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {label}
  </span>
);

const Avatar = ({ lawyer, size = 'h-10 w-10' }) => (
  <div className={`flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy-950 text-sm font-bold text-gold-hover`}>
    {lawyer.avatar ? <img src={assetUrl(lawyer.avatar)} alt="" className="h-full w-full object-cover" /> : lawyer.name.charAt(0)}
  </div>
);

const LawyerDirectory = () => {
  usePageTitle('Tra cứu luật sư thành viên');
  const { settings } = useSite();
  const { label, options } = usePortalMeta();
  const [params, setParams] = useSearchParams();
  const filters = Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || '']));
  const page = Math.max(parseInt(params.get('page')) || 1, 1);
  const [draft, setDraft] = useState(filters.q);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: orgData } = useAsync(() => organizationApi.list({ limit: 100 }), ['orgs']);
  const { data: areas } = useAsync(() => practiceAreaApi.list(), ['areas']);

  const query = Object.fromEntries(Object.entries({ ...filters, page, limit: 20 }).filter(([, v]) => v !== ''));
  const { data, previous, loading } = useAsync(() => lawyerApi.directory(query), [query]);
  const result = data || previous;
  const items = result?.items || [];
  const pagination = result?.pagination || {};

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  const submit = (e) => {
    e.preventDefault();
    update({ q: draft.trim() });
  };

  const reset = () => {
    setDraft('');
    setParams(new URLSearchParams());
  };

  const changePage = (p) => {
    update({ page: p > 1 ? `${p}` : '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasFilter = FILTER_KEYS.some((k) => filters[k]);
  const activeFilterCount = FILTER_KEYS.filter((k) => k !== 'q' && filters[k]).length;
  const phone = settings.contact?.hotline || settings.contact?.phones?.[0];

  return (
    <div className="bg-stone-parchment pb-16">
      <PageHero
        title="Tra cứu luật sư thành viên"
        description="Cơ sở dữ liệu luật sư thành viên Đoàn Luật sư tỉnh Ninh Bình: số thẻ, chứng chỉ hành nghề, tổ chức hành nghề và tình trạng hành nghề."
        breadcrumb={[{ label: 'Tra cứu luật sư' }]}
      >
        <LookupTabs active="lawyers" />
        <div className="h-10" />
      </PageHero>

      <Container className="-mt-10 relative">
        {/* Bảng tìm kiếm */}
        <form onSubmit={submit} className="rounded-xl border border-stone-200 bg-white p-4 shadow-lg shadow-navy-950/5 sm:p-5 [&>div]:!mb-0">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))_auto]">
            <div className="relative md:col-span-2 lg:col-span-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Họ tên, số thẻ hoặc số chứng chỉ hành nghề"
                className={`${inputClass} !pl-9`}
                aria-label="Từ khoá tra cứu"
              />
            </div>
            {/* Điện thoại: các ô lọc ẩn sau nút "Bộ lọc"; từ máy tính bảng trở lên hiện thẳng trong lưới */}
            <div className={`${filtersOpen ? 'grid' : 'hidden'} gap-3 md:contents`}>
              <select value={filters.organization} onChange={(e) => update({ organization: e.target.value })} className={`${inputClass} !pr-8`} aria-label="Tổ chức hành nghề">
                <option value="">Mọi tổ chức hành nghề</option>
                {(orgData?.items || []).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              <select value={filters.practiceArea} onChange={(e) => update({ practiceArea: e.target.value })} className={`${inputClass} !pr-8`} aria-label="Lĩnh vực">
                <option value="">Mọi lĩnh vực</option>
                {(areas || []).map((a) => <option key={a.id} value={a.slug}>{a.name}</option>)}
              </select>
              <select value={filters.memberStatus} onChange={(e) => update({ memberStatus: e.target.value })} className={`${inputClass} !pr-8`} aria-label="Tình trạng hành nghề">
                <option value="">Mọi tình trạng</option>
                {options('lawyerStatus').map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex gap-2 md:col-span-2 lg:col-span-1">
              <button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-navy-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
                <Search className="h-4 w-4" /> Tra cứu
              </button>
              <FilterToggle open={filtersOpen} count={activeFilterCount} onClick={() => setFiltersOpen((v) => !v)} />
              {hasFilter && (
                <button type="button" onClick={reset} className="inline-flex items-center justify-center rounded-lg border border-stone-300 px-3 text-slate-500 hover:text-navy-950" aria-label="Xoá bộ lọc" title="Xoá bộ lọc">
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Kết quả */}
        <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
          {result ? (
            <p>
              Tìm thấy <span className="font-semibold text-navy-950">{pagination.total || 0}</span> luật sư
            </p>
          ) : (
            <Skeleton className="h-4 w-40" />
          )}
        </div>

        <div className={`mt-3 transition-opacity ${loading && result ? 'opacity-60' : ''}`}>
          {!result ? (
            <div className="space-y-2 rounded-xl border border-stone-200 bg-white p-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : items.length === 0 ? (
            <EmptyBlock icon={Users} title="Không tìm thấy luật sư phù hợp" description="Thử bỏ bớt bộ lọc hoặc kiểm tra lại họ tên, số thẻ." />
          ) : (
            <>
              {/* Bảng (desktop) */}
              <div className="hidden overflow-hidden rounded-xl border border-stone-200 bg-white md:block">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3">Luật sư</th>
                      <th className="px-4 py-3">Số thẻ</th>
                      <th className="px-4 py-3">Số CCHN</th>
                      <th className="px-4 py-3">Tổ chức hành nghề</th>
                      <th className="px-4 py-3">Tình trạng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {items.map((l) => (
                      <tr key={l.id} className="hover:bg-stone-50/70">
                        <td className="px-4 py-3">
                          <Link to={portalRoutes.lawyer(l.slug)} className="flex items-center gap-3">
                            <Avatar lawyer={l} />
                            <span className="min-w-0">
                              <span className="block font-semibold text-navy-950 hover:text-gold-dark">{l.name}</span>
                              {l.birthYear && <span className="block text-xs text-slate-400">Sinh năm {l.birthYear}</span>}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 tabular-nums text-[13px] text-slate-700">{l.cardNumber || '—'}</td>
                        <td className="px-4 py-3 tabular-nums text-[13px] text-slate-700">{l.certificateNumber || '—'}</td>
                        <td className="px-4 py-3">
                          {l.organization ? (
                            <Link to={portalRoutes.organization(l.organization.slug)} className="text-slate-700 hover:text-gold-dark">{l.organization.name}</Link>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={l.memberStatus} label={label('lawyerStatus', l.memberStatus)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Thẻ (mobile) */}
              <ul className="space-y-3 md:hidden">
                {items.map((l) => (
                  <li key={l.id} className="rounded-xl border border-stone-200 bg-white p-4">
                    <Link to={portalRoutes.lawyer(l.slug)} className="flex items-center gap-3">
                      <Avatar lawyer={l} size="h-12 w-12" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-navy-950">{l.name}</span>
                        <span className="mt-1 block"><StatusBadge status={l.memberStatus} label={label('lawyerStatus', l.memberStatus)} /></span>
                      </span>
                    </Link>
                    <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-stone-100 pt-3 text-xs">
                      <div><dt className="text-slate-400">Số thẻ</dt><dd className="tabular-nums text-navy-950">{l.cardNumber || '—'}</dd></div>
                      <div><dt className="text-slate-400">Số CCHN</dt><dd className="tabular-nums text-navy-950">{l.certificateNumber || '—'}</dd></div>
                      <div className="col-span-2">
                        <dt className="text-slate-400">Tổ chức hành nghề</dt>
                        <dd className="text-navy-950">
                          {l.organization ? <Link to={portalRoutes.organization(l.organization.slug)} className="hover:text-gold-dark">{l.organization.name}</Link> : '—'}
                        </dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <PublicPagination page={page} totalPages={pagination.totalPages} onChange={changePage} />

        <p className="mt-8 flex items-start gap-2 rounded-lg border border-gold/30 bg-gold/5 px-4 py-3 text-xs leading-relaxed text-slate-600">
          <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-dark" />
          <span>
            Thông tin tra cứu mang tính tham khảo; vui lòng liên hệ Văn phòng Đoàn để xác minh
            {phone && (
              <>
                {' '}qua số <a href={`tel:${phone.replace(/\s/g, '')}`} className="font-semibold text-navy-950 hover:text-gold-dark">{phone}</a>
              </>
            )}
            .
          </span>
        </p>
      </Container>
    </div>
  );
};

export default LawyerDirectory;
