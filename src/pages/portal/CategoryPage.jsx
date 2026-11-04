// Trang chuyên mục: /p/:slug và /p/:parent/:slug (luôn dùng slug cuối)
import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { categoryApi, postApi } from '../../services/portalService';
import { useSite } from '../../contexts/siteContext';
import useAsync from '../../hooks/useAsync';
import usePageTitle from '../../hooks/usePageTitle';
import {
  Container, PageHero, PostCard, PublicPagination, EmptyBlock, ListSkeleton, NotFoundBlock, Skeleton
} from '../../components/portal/PortalUI';
import PortalSidebar from '../../components/portal/PortalSidebar';

const MEDIA_SLUG = 'hinh-anh-video';

const SubNav = ({ category }) => {
  const { categoryHref } = useSite();
  // Chuyên mục gốc: "Tất cả" + các mục con; chuyên mục con: mục cha + các mục cùng cấp
  const root = category.parent || category;
  const items = category.parent ? category.siblings : category.children;
  if (!items?.length) return null;

  const chip = (active) =>
    `whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors ${
      active ? 'bg-navy-950 text-white' : 'bg-white text-slate-600 ring-1 ring-stone-200 hover:text-navy-950 hover:ring-gold/60'
    }`;

  return (
    <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      <Link to={categoryHref(root)} className={chip(!category.parent)}>Tất cả</Link>
      {items.map((c) => (
        <Link key={c.id} to={categoryHref(c)} className={chip(c.id === category.id)}>
          {c.name}
        </Link>
      ))}
    </div>
  );
};

const CategoryPage = () => {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const page = Math.max(parseInt(params.get('page')) || 1, 1);
  const { categoryHref } = useSite();

  const cat = useAsync(() => categoryApi.bySlug(slug), [slug]);
  const posts = useAsync(() => postApi.list({ category: slug, page, limit: 12 }), [slug, page]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug, page]);

  usePageTitle(cat.data?.name);

  if (cat.notFound) return <NotFoundBlock title="Không tìm thấy chuyên mục" />;

  const category = cat.data;
  // Khi chỉ đổi trang (cùng chuyên mục) giữ danh sách cũ thay vì nháy skeleton
  const list = posts.data || (posts.loading && category ? posts.previous : null);
  const items = list?.items || [];
  const isMedia = slug === MEDIA_SLUG;

  const breadcrumb = (category?.breadcrumb || []).map((b, i, arr) =>
    i === arr.length - 1 ? { label: b.name } : { label: b.name, to: categoryHref(b) }
  );

  const goToPage = (p) => setParams(p > 1 ? { page: `${p}` } : {});

  const renderPosts = () => {
    if (!list) return <ListSkeleton rows={6} />;
    if (!items.length) {
      return <EmptyBlock title="Chuyên mục chưa có bài viết" description="Nội dung sẽ được cập nhật trong thời gian tới." />;
    }
    if (isMedia) {
      return (
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3">
          {items.map((post) => <PostCard key={post.id} post={post} variant="grid" />)}
        </div>
      );
    }
    const [lead, ...rest] = page === 1 ? items : [null, ...items];
    return (
      <div>
        {lead && (
          <div className="mb-6 rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
            <PostCard post={lead} variant="lead" showCategory={!!category?.children?.length} />
          </div>
        )}
        <div className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white px-4 sm:px-5">
          {rest.map((post) => (
            <PostCard key={post.id} post={post} variant="row" showCategory={!!category?.children?.length} className="py-5" />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-stone-parchment">
      {category ? (
        <PageHero title={category.name} description={category.description} breadcrumb={breadcrumb} />
      ) : (
        <section className="bg-navy-950">
          <Container className="py-10">
            <Skeleton className="h-3 w-40 bg-white/10" />
            <Skeleton className="mt-4 h-8 w-72 bg-white/10" />
          </Container>
        </section>
      )}

      <Container className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0">
          {category && <SubNav category={category} />}
          {cat.error && !cat.notFound ? (
            <EmptyBlock title="Không tải được chuyên mục" description="Vui lòng thử lại sau." />
          ) : (
            <div className={posts.loading && list ? 'opacity-60 transition-opacity' : ''}>{renderPosts()}</div>
          )}
          <PublicPagination page={page} totalPages={list?.pagination?.totalPages} onChange={goToPage} />
        </main>
        <PortalSidebar />
      </Container>
    </div>
  );
};

export default CategoryPage;
