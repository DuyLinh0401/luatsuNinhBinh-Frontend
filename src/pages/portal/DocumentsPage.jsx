// Danh sách văn bản: /van-ban và /van-ban/:category, bộ lọc nằm trên URL để chia sẻ được
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Search, FileDown, X, ScrollText } from 'lucide-react';
import { documentApi, categoryApi, assetUrl } from '../../services/portalService';
import { portalRoutes } from '../../utils/portalRoutes';
import useAsync from '../../hooks/useAsync';
import usePageTitle from '../../hooks/usePageTitle';
import usePortalMeta from '../../hooks/usePortalMeta';
import { Container, PageHero, PublicPagination, EmptyBlock, Skeleton, FilterToggle } from '../../components/portal/PortalUI';
import { formatDay } from '../../components/portal/portalFormat';
import { inputClass } from '../../components/admin/ui/format';

const FILTER_KEYS = ['q', 'documentType', 'issuingBody', 'year', 'effectStatus'];

const EFFECT_TONE = {
  IN_EFFECT: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  PARTIALLY_EXPIRED: 'bg-amber-50 text-amber-700 ring-amber-200',
  EXPIRED: 'bg-red-50 text-red-700 ring-red-200',
  NOT_YET_EFFECTIVE: 'bg-sky-50 text-sky-700 ring-sky-200'
};

export const EffectBadge = ({ status, children }) => (
  <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${EFFECT_TONE[status] || 'bg-stone-100 text-slate-600 ring-stone-200'}`}>
    {children}
  </span>
);

const flatten = (nodes, parent = null) =>
  nodes.flatMap((n) => [{ ...n, parent }, ...flatten(n.children || [], n)]);

const DocumentsPage = () => {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { label } = usePortalMeta();

  const filters = Object.fromEntries(FILTER_KEYS.map((k) => [k, searchParams.get(k) || '']));
  const page = Math.max(parseInt(searchParams.get('page')) || 1, 1);

  const { data: tree } = useAsync(() => categoryApi.tree({ type: 'DOCUMENT' }), []);
  const { data: options } = useAsync(() => documentApi.filters(), []);

  const params = { category: category || undefined, page, limit: 15 };
  FILTER_KEYS.forEach((k) => {
    if (filters[k]) params[k] = filters[k];
  });
  const list = useAsync(() => documentApi.list(params), [params]);
  const result = list.data || list.previous;

  const categories = useMemo(() => flatten(tree || []), [tree]);
  const current = categories.find((c) => c.slug === category);
  const root = (tree || [])[0];
  const title = current?.name || 'Văn bản';
  usePageTitle(title);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [category]);

  const update = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in changes)) next.delete('page');
    setSearchParams(next);
  };

  const hasFilters = FILTER_KEYS.some((k) => filters[k]);
  const activeFilterCount = FILTER_KEYS.filter((k) => k !== 'q' && filters[k]).length;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const navItems = root ? [{ ...root, isRoot: true }, ...(root.children || [])] : [];

  return (
    <>
      <PageHero
        title={title}
        description="Văn bản của Đoàn Luật sư, Liên đoàn Luật sư Việt Nam và văn bản quy phạm pháp luật liên quan đến hoạt động luật sư."
        breadcrumb={current ? [{ label: 'Văn bản', to: portalRoutes.documents() }, { label: current.name }] : [{ label: 'Văn bản' }]}
      />

      <Container className="grid gap-8 py-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Chuyên mục văn bản: điện thoại/máy tính bảng là dải nút vuốt ngang, máy tính là cột bên trái */}
        <aside className="min-w-0">
          {tree && (
            <nav aria-label="Chuyên mục văn bản" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:hidden [&::-webkit-scrollbar]:hidden">
              {navItems.map((c) => {
                const active = c.isRoot ? !category || category === c.slug : category === c.slug;
                return (
                  <Link
                    key={c.id}
                    to={portalRoutes.documents(c.isRoot ? undefined : c.slug)}
                    className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      active ? 'border-navy-950 bg-navy-950 text-white' : 'border-stone-300 bg-white text-slate-600 hover:border-gold'
                    }`}
                  >
                    {c.isRoot ? 'Tất cả' : c.name}
                  </Link>
                );
              })}
            </nav>
          )}
          <nav className="hidden overflow-hidden rounded-xl border border-stone-200 bg-white lg:block">
            <p className="border-b border-stone-200 px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-navy-950">Chuyên mục</p>
            {!tree ? (
              <div className="space-y-2 p-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-5" />)}</div>
            ) : (
              <ul className="py-1.5">
                {navItems.map((c) => {
                  const active = c.isRoot ? !category || category === c.slug : category === c.slug;
                  return (
                    <li key={c.id}>
                      <Link
                        to={portalRoutes.documents(c.isRoot ? undefined : c.slug)}
                        className={`flex items-center gap-2 border-l-[3px] px-4 py-2.5 text-sm transition-colors ${
                          active ? 'border-gold bg-gold/5 font-semibold text-navy-950' : 'border-transparent text-slate-600 hover:bg-stone-50 hover:text-navy-950'
                        }`}
                      >
                        {c.isRoot ? 'Tất cả văn bản' : c.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </nav>
        </aside>

        <div className="min-w-0">
          {/* Bộ lọc */}
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  defaultValue={filters.q}
                  key={filters.q}
                  placeholder="Tìm theo số hiệu, trích yếu..."
                  aria-label="Tìm văn bản"
                  className={`${inputClass} !pl-9`}
                  onKeyDown={(e) => e.key === 'Enter' && update({ q: e.currentTarget.value.trim() })}
                  onBlur={(e) => e.currentTarget.value.trim() !== filters.q && update({ q: e.currentTarget.value.trim() })}
                />
              </div>
              {/* Điện thoại: các ô lọc gom vào nút "Bộ lọc" */}
              <FilterToggle open={filtersOpen} count={activeFilterCount} onClick={() => setFiltersOpen((v) => !v)} className="sm:hidden" />
            </div>
            <div className={`mt-3 gap-3 sm:grid sm:grid-cols-2 xl:grid-cols-4 ${filtersOpen ? 'grid' : 'hidden'}`}>
              <select className={inputClass} value={filters.documentType} onChange={(e) => update({ documentType: e.target.value })}>
                <option value="">Loại văn bản</option>
                {Object.entries(options?.documentTypes || {}).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
              </select>
              <select className={inputClass} value={filters.issuingBody} onChange={(e) => update({ issuingBody: e.target.value })}>
                <option value="">Cơ quan ban hành</option>
                {(options?.issuingBodies || []).map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <select className={inputClass} value={filters.year} onChange={(e) => update({ year: e.target.value })}>
                <option value="">Năm ban hành</option>
                {(options?.years || []).map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <select className={inputClass} value={filters.effectStatus} onChange={(e) => update({ effectStatus: e.target.value })}>
                <option value="">Tình trạng hiệu lực</option>
                {Object.entries(options?.effectStatuses || {}).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
              </select>
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={() => update(Object.fromEntries(FILTER_KEYS.map((k) => [k, ''])))}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600"
              >
                <X className="h-3.5 w-3.5" /> Xoá lọc
              </button>
            )}
          </div>

          <p className="mb-3 mt-5 text-sm text-slate-500">
            {result ? <>Tìm thấy <b className="text-navy-950">{result.pagination.total}</b> văn bản</> : 'Đang tải...'}
          </p>

          {!result ? (
            <div className="space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : result.items.length === 0 ? (
            <EmptyBlock icon={ScrollText} title="Không có văn bản phù hợp" description={hasFilters ? 'Thử bỏ bớt điều kiện lọc.' : undefined} />
          ) : (
            <div className={list.loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
              {/* Bảng trên màn hình lớn */}
              <div className="hidden overflow-hidden rounded-xl border border-stone-200 bg-white md:block">
                <table className="w-full text-sm">
                  <thead className="bg-navy-950 text-left text-xs uppercase tracking-wide text-stone-200">
                    <tr>
                      <th className="w-36 px-4 py-3 font-semibold">Số hiệu</th>
                      <th className="px-4 py-3 font-semibold">Trích yếu</th>
                      <th className="w-28 px-4 py-3 font-semibold">Ban hành</th>
                      <th className="w-40 px-4 py-3 font-semibold">Cơ quan</th>
                      <th className="w-32 px-4 py-3 font-semibold">Hiệu lực</th>
                      <th className="w-10 px-2 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {result.items.map((doc) => (
                      <tr key={doc.id} className="align-top hover:bg-stone-50/70">
                        <td className="px-4 py-3 font-semibold text-navy-950">{doc.documentNumber || '—'}</td>
                        <td className="px-4 py-3">
                          <Link to={portalRoutes.document(doc.slug)} className="font-medium leading-snug text-navy-950 hover:text-gold-dark">
                            {doc.title}
                          </Link>
                          <p className="mt-0.5 text-xs text-slate-400">{label('documentType', doc.documentType)}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatDay(doc.issuedDate) || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{doc.issuingBody || '—'}</td>
                        <td className="px-4 py-3">
                          <EffectBadge status={doc.effectStatus}>{label('effectStatus', doc.effectStatus)}</EffectBadge>
                        </td>
                        <td className="px-2 py-3">
                          {doc.attachments?.[0] && (
                            <a href={assetUrl(doc.attachments[0].fileUrl)} target="_blank" rel="noreferrer" title="Tải văn bản" className="inline-flex text-gold-dark hover:text-navy-950">
                              <FileDown className="h-5 w-5" />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Thẻ trên điện thoại */}
              <ul className="space-y-3 md:hidden">
                {result.items.map((doc) => (
                  <li key={doc.id} className="rounded-xl border border-stone-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs font-bold text-gold-dark">{doc.documentNumber || label('documentType', doc.documentType)}</span>
                      <EffectBadge status={doc.effectStatus}>{label('effectStatus', doc.effectStatus)}</EffectBadge>
                    </div>
                    <Link to={portalRoutes.document(doc.slug)} className="mt-1.5 block font-medium leading-snug text-navy-950">
                      {doc.title}
                    </Link>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      {doc.issuedDate && <span>Ban hành {formatDay(doc.issuedDate)}</span>}
                      {doc.issuingBody && <span>{doc.issuingBody}</span>}
                      {doc.attachments?.[0] && (
                        <a href={assetUrl(doc.attachments[0].fileUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-gold-dark">
                          <FileDown className="h-3.5 w-3.5" /> Tải về
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <PublicPagination page={page} totalPages={result.pagination.totalPages} onChange={(p) => { update({ page: `${p}` }); window.scrollTo(0, 0); }} />
            </div>
          )}
        </div>
      </Container>
    </>
  );
};

export default DocumentsPage;
