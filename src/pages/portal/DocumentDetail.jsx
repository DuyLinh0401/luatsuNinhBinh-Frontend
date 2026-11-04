// Chi tiết văn bản: /van-ban/chi-tiet/:slug
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ScrollText, ChevronRight, Eye } from 'lucide-react';
import { documentApi } from '../../services/portalService';
import { portalRoutes } from '../../utils/portalRoutes';
import useAsync from '../../hooks/useAsync';
import useRecordView from '../../hooks/useRecordView';
import usePageTitle from '../../hooks/usePageTitle';
import usePortalMeta from '../../hooks/usePortalMeta';
import {
  Container, Breadcrumb, RichContent, AttachmentList, ShareButtons, Skeleton, NotFoundBlock
} from '../../components/portal/PortalUI';
import { formatDay } from '../../components/portal/portalFormat';
import { EffectBadge } from './DocumentsPage';

const DocumentDetail = () => {
  const { slug } = useParams();
  const { label } = usePortalMeta();
  const { data: doc, loading, notFound, error } = useAsync(() => documentApi.bySlug(slug), [slug]);
  const views = useRecordView('/legal-documents', doc?.id, doc?.views);
  usePageTitle(doc?.title);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (notFound || (error && !loading)) {
    return <NotFoundBlock title="Không tìm thấy văn bản" />;
  }

  if (loading || !doc) {
    return (
      <Container className="py-10">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="mt-5 h-9 w-3/4" />
        <Skeleton className="mt-6 h-56" />
      </Container>
    );
  }

  const attributes = [
    ['Số hiệu', doc.documentNumber],
    ['Loại văn bản', label('documentType', doc.documentType)],
    ['Cơ quan ban hành', doc.issuingBody],
    ['Người ký', doc.signer],
    ['Ngày ban hành', formatDay(doc.issuedDate)],
    ['Ngày có hiệu lực', formatDay(doc.effectiveDate)],
    ['Ngày hết hiệu lực', formatDay(doc.expiryDate)],
    ['Tình trạng hiệu lực', doc.effectStatus && <EffectBadge status={doc.effectStatus}>{label('effectStatus', doc.effectStatus)}</EffectBadge>]
  ].filter(([, value]) => value);

  const category = doc.category;

  return (
    <Container className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <article className="min-w-0">
        <Breadcrumb
          items={[
            { label: 'Văn bản', to: portalRoutes.documents() },
            category && { label: category.name, to: portalRoutes.documents(category.slug) },
            { label: doc.title }
          ]}
        />

        <h1 className="mt-4 text-2xl font-bold leading-snug !text-navy-950 sm:text-3xl">{doc.title}</h1>
        <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500">
          <Eye className="h-3.5 w-3.5" /> {views} lượt xem
        </p>

        <dl className="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white text-sm">
          {attributes.map(([name, value]) => (
            <div key={name} className="grid grid-cols-[minmax(0,140px)_minmax(0,1fr)] border-b border-stone-100 last:border-0 sm:grid-cols-[200px_minmax(0,1fr)]">
              <dt className="bg-stone-50 px-4 py-2.5 font-medium text-slate-500">{name}</dt>
              <dd className="px-4 py-2.5 font-medium text-navy-950">{value}</dd>
            </div>
          ))}
        </dl>

        {doc.summary && (
          <p className="mt-6 border-l-[3px] border-gold bg-white px-4 py-3 text-[15px] leading-relaxed text-slate-700">{doc.summary}</p>
        )}

        {doc.content && <RichContent html={doc.content} className="mt-6" />}

        <AttachmentList files={doc.attachments} title="Toàn văn văn bản" />

        <div className="mt-8 border-t border-stone-200 pt-5">
          <ShareButtons title={doc.title} />
        </div>
      </article>

      <aside className="space-y-6">
        {category && (
          <Link
            to={portalRoutes.documents(category.slug)}
            className="flex items-center gap-4 rounded-xl bg-navy-950 p-5 text-white transition-colors hover:bg-navy-900"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gold/15 ring-1 ring-gold/40">
              <ScrollText className="h-5 w-5 text-gold-hover" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs text-stone-300">Chuyên mục</span>
              <span className="block text-base font-bold">{category.name}</span>
            </span>
            <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-gold" />
          </Link>
        )}

        {doc.related?.length > 0 && (
          <section className="rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="mb-4 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide !text-navy-950">
              <span className="h-4 w-1 rounded-full bg-gold" />
              Văn bản cùng chuyên mục
            </h2>
            <ul className="divide-y divide-stone-100">
              {doc.related.map((r) => (
                <li key={r.id} className="py-3 first:pt-0 last:pb-0">
                  {r.documentNumber && <span className="text-xs font-bold text-gold-dark">{r.documentNumber}</span>}
                  <Link to={portalRoutes.document(r.slug)} className="mt-0.5 line-clamp-3 block text-[13px] leading-snug text-navy-950 hover:text-gold-dark">
                    {r.title}
                  </Link>
                  {r.issuedDate && <span className="text-xs text-slate-500">{formatDay(r.issuedDate)}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </aside>
    </Container>
  );
};

export default DocumentDetail;
