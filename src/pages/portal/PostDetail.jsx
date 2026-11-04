// Chi tiết bài viết: /bai-viet/:slug
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, Eye, User, Tag } from 'lucide-react';
import { postApi, assetUrl } from '../../services/portalService';
import { useSite } from '../../contexts/siteContext';
import useAsync from '../../hooks/useAsync';
import useRecordView from '../../hooks/useRecordView';
import usePageTitle from '../../hooks/usePageTitle';
import {
  Container, Breadcrumb, PostCard, RichContent, AttachmentList, ShareButtons, NotFoundBlock, Skeleton, SectionTitle, EmptyBlock
} from '../../components/portal/PortalUI';
import PortalSidebar from '../../components/portal/PortalSidebar';
import { formatDateTime } from '../../components/portal/portalFormat';

// Link YouTube (watch, youtu.be, shorts, embed) -> URL nhúng; link khác trả null
const youtubeEmbed = (url = '') => {
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
};

const VideoBlock = ({ url }) => {
  const embed = youtubeEmbed(url);
  return (
    <div className="mt-6 aspect-video overflow-hidden rounded-lg bg-navy-950">
      {embed ? (
        <iframe
          src={embed}
          title="Video"
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video src={assetUrl(url)} controls className="h-full w-full" />
      )}
    </div>
  );
};

const DetailSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-3 w-48" />
    <Skeleton className="h-9 w-full" />
    <Skeleton className="h-9 w-2/3" />
    <Skeleton className="h-4 w-56" />
    <Skeleton className="mt-6 aspect-video w-full" />
    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
  </div>
);

const PostDetail = () => {
  const { slug } = useParams();
  const { categoryHref } = useSite();
  const { data: post, loading, notFound, error } = useAsync(() => postApi.bySlug(slug), [slug]);
  const views = useRecordView('/posts', post?.id, post?.views);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  usePageTitle(post?.metaTitle || post?.title);

  if (notFound) return <NotFoundBlock title="Không tìm thấy bài viết" />;

  const breadcrumb = post
    ? [...(post.breadcrumb || []).map((b) => ({ label: b.name, to: categoryHref(b) })), { label: post.title }]
    : [];

  return (
    <div className="bg-stone-parchment">
      <Container className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0">
          {loading ? (
            <div className="rounded-xl border border-stone-200 bg-white p-5 sm:p-8"><DetailSkeleton /></div>
          ) : error || !post ? (
            <EmptyBlock title="Không tải được bài viết" description="Vui lòng thử lại sau." />
          ) : (
            <>
              <article className="rounded-xl border border-stone-200 bg-white p-5 sm:p-8">
                <Breadcrumb items={breadcrumb} />

                {post.primaryCategory && (
                  <Link
                    to={categoryHref(post.primaryCategory)}
                    className="mt-5 inline-block text-xs font-bold uppercase tracking-wider text-gold-dark hover:text-navy-950"
                  >
                    {post.primaryCategory.name}
                  </Link>
                )}
                <h1 className="mt-2 text-2xl font-bold leading-tight !text-navy-950 sm:text-3xl">{post.title}</h1>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-stone-200 pb-4 text-xs text-slate-500">
                  {post.publishedAt && (
                    <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{formatDateTime(post.publishedAt)}</span>
                  )}
                  {(post.authorDisplay || post.author?.fullName) && (
                    <span className="inline-flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{post.authorDisplay || post.author.fullName}</span>
                  )}
                  <span className="inline-flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" />{views} lượt xem</span>
                </div>

                {post.summary && (
                  <p className="mt-6 border-l-4 border-gold pl-4 text-base font-medium leading-relaxed text-slate-700">{post.summary}</p>
                )}

                {post.format === 'VIDEO' && post.videoUrl ? (
                  <VideoBlock url={post.videoUrl} />
                ) : (
                  post.thumbnail && (
                    <img src={assetUrl(post.thumbnail)} alt={post.title} className="mt-6 w-full rounded-lg object-cover" />
                  )
                )}

                <RichContent html={post.content} className="mt-6" />

                <AttachmentList files={post.attachments} />

                {post.source && (
                  <p className="mt-6 text-right text-sm italic text-slate-500">Nguồn: {post.source}</p>
                )}

                <div className="mt-8 flex flex-col gap-4 border-t border-stone-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  {post.tags?.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Tag className="h-4 w-4 text-slate-400" />
                      {post.tags.map((t) => (
                        <span key={t.id} className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-slate-600">{t.name}</span>
                      ))}
                    </div>
                  ) : <span />}
                  <ShareButtons title={post.title} />
                </div>
              </article>

              {post.related?.length > 0 && (
                <section className="mt-10">
                  <SectionTitle title="Bài viết liên quan" to={post.primaryCategory ? categoryHref(post.primaryCategory) : undefined} />
                  <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3">
                    {post.related.slice(0, 6).map((r) => <PostCard key={r.id} post={r} variant="grid" showCategory={false} />)}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
        <PortalSidebar />
      </Container>
    </div>
  );
};

export default PostDetail;
