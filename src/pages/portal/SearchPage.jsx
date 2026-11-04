// Tìm kiếm toàn site: /tim-kiem?q=...&tab=posts|documents|lawyers&page=
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ScrollText, ChevronRight } from 'lucide-react';
import { portalApi, postApi, documentApi, lawyerApi, assetUrl } from '../../services/portalService';
import { portalRoutes } from '../../utils/portalRoutes';
import useAsync from '../../hooks/useAsync';
import usePageTitle from '../../hooks/usePageTitle';
import usePortalMeta from '../../hooks/usePortalMeta';
import {
  Container, PageHero, PostCard, PublicPagination, EmptyBlock, ListSkeleton, SectionTitle
} from '../../components/portal/PortalUI';
import { formatDay } from '../../components/portal/portalFormat';

const TABS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'posts', label: 'Bài viết' },
  { value: 'documents', label: 'Văn bản' },
  { value: 'lawyers', label: 'Luật sư' }
];

const PAGE_SIZE = 10;

const SearchForm = ({ initial, onSubmit }) => {
  const [value, setValue] = useState(initial);
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(value.trim()); }}
      className="mt-5 flex max-w-2xl gap-2 [&>div]:!mb-0"
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Nhập từ khoá: tiêu đề bài viết, số hiệu văn bản, tên luật sư..."
          className="w-full rounded-lg border-0 bg-white !py-3 !pl-11 !pr-4 text-sm text-navy-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-gold"
          autoFocus
        />
      </div>
      <button type="submit" className="shrink-0 rounded-lg bg-gold px-5 text-sm font-semibold text-navy-950 hover:bg-gold-hover">
        Tìm kiếm
      </button>
    </form>
  );
};

const DocumentRow = ({ doc }) => {
  const { label } = usePortalMeta();
  return (
    <li className="flex gap-3 py-4">
      <ScrollText className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" strokeWidth={1.6} />
      <div className="min-w-0">
        <Link to={portalRoutes.document(doc.slug)} className="font-semibold leading-snug text-navy-950 hover:text-gold-dark">
          {doc.documentNumber && <span className="text-gold-dark">{doc.documentNumber} – </span>}
          {doc.title}
        </Link>
        <p className="mt-1 text-xs text-slate-500">
          {label('documentType', doc.documentType)}
          {doc.issuedDate && ` · Ban hành ${formatDay(doc.issuedDate)}`}
        </p>
      </div>
    </li>
  );
};

const LawyerRow = ({ lawyer }) => {
  const { label } = usePortalMeta();
  return (
    <li className="py-3">
      <Link to={portalRoutes.lawyer(lawyer.slug)} className="group flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-100 font-semibold text-slate-500">
          {lawyer.avatar ? <img src={assetUrl(lawyer.avatar)} alt="" className="h-full w-full object-cover" /> : lawyer.name.charAt(0)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-navy-950 group-hover:text-gold-dark">{lawyer.name}</span>
          <span className="block text-xs text-slate-500">
            {lawyer.cardNumber ? `Số thẻ ${lawyer.cardNumber}` : 'Chưa cập nhật số thẻ'} · {label('lawyerStatus', lawyer.memberStatus)}
          </span>
        </span>
        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-gold-dark" />
      </Link>
    </li>
  );
};

// Danh sách đầy đủ có phân trang cho từng tab
const FULL_LOADERS = {
  posts: (q, page) => postApi.list({ q, page, limit: PAGE_SIZE }),
  documents: (q, page) => documentApi.list({ q, page, limit: PAGE_SIZE }),
  lawyers: (q, page) => lawyerApi.directory({ q, page, limit: PAGE_SIZE })
};

const SearchPage = () => {
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') || '').trim();
  const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'all';
  const page = Math.max(parseInt(params.get('page')) || 1, 1);
  const valid = q.length >= 2;

  usePageTitle(q ? `Tìm kiếm: ${q}` : 'Tìm kiếm');

  const summary = useAsync(() => (valid ? portalApi.search({ q, limit: PAGE_SIZE }) : Promise.resolve(null)), [q]);
  const full = useAsync(
    () => (valid && tab !== 'all' ? FULL_LOADERS[tab](q, page) : Promise.resolve(null)),
    [q, tab, page]
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [q, tab, page]);

  const update = (next) => {
    const merged = { q, tab, page: 1, ...next };
    const clean = {};
    if (merged.q) clean.q = merged.q;
    if (merged.tab !== 'all') clean.tab = merged.tab;
    if (merged.page > 1) clean.page = `${merged.page}`;
    setParams(clean);
  };

  const s = summary.data;
  const counts = {
    posts: s?.posts.total ?? 0,
    documents: s?.documents.total ?? 0,
    lawyers: s?.lawyers.total ?? 0
  };
  counts.all = counts.posts + counts.documents + counts.lawyers;

  const renderItems = (kind, items) => {
    if (kind === 'posts') {
      return (
        <div className="divide-y divide-stone-200">
          {items.map((p) => <PostCard key={p.id} post={p} variant="row" className="py-5" />)}
        </div>
      );
    }
    if (kind === 'documents') {
      return <ul className="divide-y divide-stone-200">{items.map((d) => <DocumentRow key={d.id} doc={d} />)}</ul>;
    }
    return <ul className="divide-y divide-stone-200">{items.map((l) => <LawyerRow key={l.id} lawyer={l} />)}</ul>;
  };

  const renderAll = () => {
    if (summary.loading) return <ListSkeleton rows={4} />;
    if (!counts.all) {
      return <EmptyBlock title={`Không tìm thấy kết quả cho “${q}”`} description="Hãy thử từ khoá ngắn hơn hoặc kiểm tra lại chính tả." />;
    }
    return (
      <div className="space-y-8">
        {['posts', 'documents', 'lawyers'].map((kind) => {
          const group = s[kind];
          if (!group.total) return null;
          const tabLabel = TABS.find((t) => t.value === kind).label;
          return (
            <section key={kind} className="rounded-xl border border-stone-200 bg-white px-4 pt-4 sm:px-5">
              <SectionTitle title={`${tabLabel} (${group.total})`} className="!mb-0" />
              {renderItems(kind, group.items.slice(0, 5))}
              {group.total > 5 && (
                <button
                  type="button"
                  onClick={() => update({ tab: kind })}
                  className="flex w-full items-center justify-center gap-1 border-t border-stone-200 py-3 text-sm font-semibold text-gold-dark hover:text-navy-950"
                >
                  Xem thêm {group.total - 5} kết quả <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </section>
          );
        })}
      </div>
    );
  };

  const renderTab = () => {
    const list = full.data || (full.loading ? full.previous : null);
    if (!list) return <ListSkeleton rows={5} />;
    if (!list.items.length) return <EmptyBlock title={`Không có kết quả trong mục này cho “${q}”`} />;
    return (
      <>
        <div className={`rounded-xl border border-stone-200 bg-white px-4 sm:px-5 ${full.loading ? 'opacity-60' : ''}`}>
          {renderItems(tab, list.items)}
        </div>
        <PublicPagination page={page} totalPages={list.pagination?.totalPages} onChange={(p) => update({ tab, page: p })} />
      </>
    );
  };

  return (
    <div className="bg-stone-parchment">
      <PageHero title="Tìm kiếm" breadcrumb={[{ label: 'Tìm kiếm' }]}>
        <SearchForm key={q} initial={q} onSubmit={(value) => update({ q: value, tab: 'all' })} />
      </PageHero>

      <Container className="py-8">
        {!valid ? (
          <EmptyBlock icon={Search} title="Nhập ít nhất 2 ký tự để tìm kiếm" description="Tìm trong bài viết, văn bản và danh sách luật sư thành viên." />
        ) : (
          <>
            <div className="mb-6 flex gap-1 overflow-x-auto overflow-y-hidden shadow-[inset_0_-1px_0_theme(colors.stone.200)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {TABS.map((t) => {
                const active = t.value === tab;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => update({ tab: t.value })}
                    className={`relative flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                      active ? 'border-gold text-navy-950' : 'border-transparent text-slate-500 hover:text-navy-950'
                    }`}
                  >
                    {t.label}
                    {s && (
                      <span className={`rounded-full px-1.5 text-[11px] ${active ? 'bg-navy-950 text-white' : 'bg-stone-200 text-slate-600'}`}>
                        {counts[t.value]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mx-auto max-w-4xl">{tab === 'all' ? renderAll() : renderTab()}</div>
          </>
        )}
      </Container>
    </div>
  );
};

export default SearchPage;
