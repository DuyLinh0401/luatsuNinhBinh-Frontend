// Tra cứu tổ chức hành nghề luật sư (/tra-cuu/to-chuc-hanh-nghe)
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Users, Building2, MapPin, RotateCcw } from 'lucide-react';
import { organizationApi } from '../../services/portalService';
import { portalRoutes } from '../../utils/portalRoutes';
import useAsync from '../../hooks/useAsync';
import usePageTitle from '../../hooks/usePageTitle';
import usePortalMeta from '../../hooks/usePortalMeta';
import { inputClass } from '../../components/admin/ui/format';
import { Container, PageHero, PublicPagination, EmptyBlock, Skeleton, FilterToggle } from '../../components/portal/PortalUI';

const STATUS_STYLE = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  SUSPENDED: 'bg-amber-50 text-amber-700 ring-amber-200',
  DISSOLVED: 'bg-red-50 text-red-700 ring-red-200'
};

const FILTER_KEYS = ['q', 'type', 'status'];

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
  <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[status] || STATUS_STYLE.SUSPENDED}`}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {label}
  </span>
);

const OrganizationsPage = () => {
  usePageTitle('Tra cứu tổ chức hành nghề luật sư');
  const { label, options } = usePortalMeta();
  const [params, setParams] = useSearchParams();
  const filters = Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || '']));
  const page = Math.max(parseInt(params.get('page')) || 1, 1);
  const [draft, setDraft] = useState(filters.q);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const query = Object.fromEntries(Object.entries({ ...filters, page, limit: 20 }).filter(([, v]) => v !== ''));
  const { data, previous, loading } = useAsync(() => organizationApi.list(query), [query]);
  const result = data || previous;
  const items = result?.items || [];
  const pagination = result?.pagination || {};

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in changes)) next.delete('page');
    setParams(next);
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

  return (
    <div className="bg-stone-parchment pb-16">
      <PageHero
        title="Tra cứu tổ chức hành nghề"
        description="Văn phòng luật sư và công ty luật là thành viên Đoàn Luật sư tỉnh Ninh Bình."
        breadcrumb={[{ label: 'Tra cứu luật sư', to: '/tra-cuu/luat-su' }, { label: 'Tổ chức hành nghề' }]}
      >
        <LookupTabs active="orgs" />
        <div className="h-10" />
      </PageHero>

      <Container className="relative -mt-10">
        <form
          onSubmit={(e) => { e.preventDefault(); update({ q: draft.trim() }); }}
          className="rounded-xl border border-stone-200 bg-white p-4 shadow-lg shadow-navy-950/5 sm:p-5 [&>div]:!mb-0"
        >
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))_auto]">
            <div className="relative md:col-span-2 lg:col-span-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Tên tổ chức, số đăng ký, người đại diện, địa chỉ"
                className={`${inputClass} !pl-9`}
                aria-label="Từ khoá tra cứu"
              />
            </div>
            {/* Điện thoại: các ô lọc ẩn sau nút "Bộ lọc" */}
            <div className={`${filtersOpen ? 'grid' : 'hidden'} gap-3 md:contents`}>
              <select value={filters.type} onChange={(e) => update({ type: e.target.value })} className={`${inputClass} !pr-8`} aria-label="Loại hình">
                <option value="">Mọi loại hình</option>
                {options('organizationType').map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select value={filters.status} onChange={(e) => update({ status: e.target.value })} className={`${inputClass} !pr-8`} aria-label="Trạng thái">
                <option value="">Mọi trạng thái</option>
                {options('organizationStatus').map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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

        <div className="mt-6 text-sm text-slate-600">
          {result ? (
            <p>Tìm thấy <span className="font-semibold text-navy-950">{pagination.total || 0}</span> tổ chức hành nghề</p>
          ) : (
            <Skeleton className="h-4 w-48" />
          )}
        </div>

        <div className={`mt-3 transition-opacity ${loading && result ? 'opacity-60' : ''}`}>
          {!result ? (
            <div className="space-y-2 rounded-xl border border-stone-200 bg-white p-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : items.length === 0 ? (
            <EmptyBlock icon={Building2} title="Không tìm thấy tổ chức phù hợp" description="Thử bỏ bớt bộ lọc hoặc đổi từ khoá." />
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-xl border border-stone-200 bg-white lg:block">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3">Tổ chức hành nghề</th>
                      <th className="px-4 py-3">Số ĐKHĐ</th>
                      <th className="px-4 py-3">Người đại diện</th>
                      <th className="px-4 py-3">Địa chỉ</th>
                      <th className="px-4 py-3 text-center">Luật sư</th>
                      <th className="px-4 py-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {items.map((o) => (
                      <tr key={o.id} className="align-top hover:bg-stone-50/70">
                        <td className="max-w-xs px-4 py-3">
                          <Link to={portalRoutes.organization(o.slug)} className="font-semibold text-navy-950 hover:text-gold-dark">{o.name}</Link>
                          <span className="mt-0.5 block text-xs text-slate-400">{label('organizationType', o.type)}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-[13px] text-slate-700">{o.registrationNumber || '—'}</td>
                        <td className="px-4 py-3 text-slate-700">{o.representativeName || '—'}</td>
                        <td className="max-w-xs px-4 py-3 text-slate-600">{o.address || '—'}</td>
                        <td className="px-4 py-3 text-center font-semibold text-navy-950">{o._count?.lawyers ?? 0}</td>
                        <td className="px-4 py-3"><StatusBadge status={o.status} label={label('organizationStatus', o.status)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="space-y-3 lg:hidden">
                {items.map((o) => (
                  <li key={o.id} className="rounded-xl border border-stone-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link to={portalRoutes.organization(o.slug)} className="font-semibold text-navy-950 hover:text-gold-dark">{o.name}</Link>
                        <p className="mt-0.5 text-xs text-slate-400">{label('organizationType', o.type)}</p>
                      </div>
                      <StatusBadge status={o.status} label={label('organizationStatus', o.status)} />
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-stone-100 pt-3 text-xs">
                      <div><dt className="text-slate-400">Số ĐKHĐ</dt><dd className="tabular-nums text-navy-950">{o.registrationNumber || '—'}</dd></div>
                      <div><dt className="text-slate-400">Số luật sư</dt><dd className="font-semibold text-navy-950">{o._count?.lawyers ?? 0}</dd></div>
                      <div className="col-span-2"><dt className="text-slate-400">Người đại diện</dt><dd className="text-navy-950">{o.representativeName || '—'}</dd></div>
                      {o.address && (
                        <div className="col-span-2 flex gap-1.5 text-slate-600"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{o.address}</div>
                      )}
                    </dl>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <PublicPagination page={page} totalPages={pagination.totalPages} onChange={changePage} />
      </Container>
    </div>
  );
};

export default OrganizationsPage;
