// Component giao diện công khai của cổng thông tin (tông navy / vàng, chữ serif cho tiêu đề)
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import {
  ChevronRight, Home, Calendar, Eye, FileText, FileSpreadsheet, FileImage, File, Download, ChevronLeft,
  ChevronDown, Link2, Mail, SearchX, SlidersHorizontal
} from 'lucide-react';
import { FacebookIcon } from './BrandIcons';
import { assetUrl } from '../../services/portalService';
import { portalRoutes } from '../../utils/portalRoutes';
import { useSite } from '../../contexts/siteContext';
import { formatDay, formatFileSize, monthShort } from './portalFormat';

const cx = (...c) => c.filter(Boolean).join(' ');

// Link từ dữ liệu (menu, banner): đường dẫn nội bộ dùng router, liên kết ngoài dùng <a>
export const SmartLink = ({ to, newTab, children, ...props }) => {
  if (!to) return <span {...props}>{children}</span>;
  const external = /^(https?:)?\/\//.test(to) || to.startsWith('mailto:') || to.startsWith('tel:');
  if (external || newTab) {
    return (
      <a href={to} target={newTab ? '_blank' : undefined} rel={newTab ? 'noreferrer' : undefined} {...props}>
        {children}
      </a>
    );
  }
  return <Link to={to} {...props}>{children}</Link>;
};

export const Container = ({ className, children }) => (
  <div className={cx('container mx-auto max-w-7xl px-4 sm:px-6', className)}>{children}</div>
);

// ---------- Tiêu đề, breadcrumb ----------

export const Breadcrumb = ({ items = [], light }) => (
  <nav aria-label="Breadcrumb" className={cx('flex flex-wrap items-center gap-1 text-xs', light ? 'text-stone-300' : 'text-slate-500')}>
    <Link to="/" className={cx('-my-1.5 inline-flex items-center gap-1 py-1.5', light ? 'hover:text-white' : 'hover:text-navy-950')}>
      <Home className="h-3.5 w-3.5" /> Trang chủ
    </Link>
    {items.filter(Boolean).map((item, i) => (
      <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1">
        <ChevronRight className="h-3.5 w-3.5 opacity-60" />
        {item.to ? (
          <Link to={item.to} className={cx('-my-1.5 py-1.5', light ? 'hover:text-white' : 'hover:text-navy-950')}>{item.label}</Link>
        ) : (
          <span className={cx('line-clamp-1', light ? 'text-white' : 'text-navy-950')}>{item.label}</span>
        )}
      </span>
    ))}
  </nav>
);

// Dải tiêu đề đầu trang con
export const PageHero = ({ title, description, breadcrumb, children }) => (
  <section className="relative overflow-hidden bg-navy-950">
    <img src="/images/trangan-hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
    <div className="absolute inset-0 bg-gradient-to-r from-navy-950/95 via-navy-900/85 to-brand/60" />
    <Container className="relative py-8 sm:py-10">
      <Breadcrumb items={breadcrumb} light />
      <h1 className="mt-3 text-2xl font-bold !text-white sm:text-3xl">{title}</h1>
      {description && <p className="mt-2 max-w-3xl text-sm text-stone-300">{description}</p>}
      {children}
    </Container>
  </section>
);

// Tiêu đề khối: vạch vàng + chữ in hoa + liên kết "Xem tất cả"
// Tiêu đề dài tự xuống dòng bên trong (min-w-0); "Xem tất cả" luôn nằm cùng hàng bên phải
export const SectionTitle = ({ title, to, action, children, className }) => (
  <div className={cx('mb-4 flex items-end justify-between gap-3 border-b-2 border-navy-950', className)}>
    <h2 className="-mb-0.5 flex min-w-0 items-start gap-2 border-b-2 border-gold pb-2 text-[15px] font-bold uppercase leading-snug tracking-wide !text-navy-950">
      <span className="mt-[3px] h-4 w-1 shrink-0 rounded-full bg-gold" />
      {to ? <Link to={to} className="hover:text-gold-dark">{title}</Link> : title}
    </h2>
    {(children || to) && (
      <div className="flex shrink-0 items-center gap-3 pb-2">
        {children}
        {to && (
          <Link to={to} className="-my-2 inline-flex items-center gap-0.5 whitespace-nowrap py-2 text-xs font-semibold text-gold-dark hover:text-navy-950">
            {action || 'Xem tất cả'} <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    )}
  </div>
);

// ---------- Ảnh, ngày ----------

export const Thumb = ({ src, alt = '', className, iconClassName }) =>
  src ? (
    <img src={assetUrl(src)} alt={alt} loading="lazy" className={cx('h-full w-full object-cover', className)} />
  ) : (
    // Bài chưa có ảnh: "ảnh bìa" mặc định gồm nền xanh nhạt có hoa văn chấm và logo mờ
    <div
      className={cx('flex h-full w-full items-center justify-center', className)}
      style={{
        backgroundImage: 'radial-gradient(rgba(15,90,166,0.09) 1px, transparent 1px), linear-gradient(135deg, #E8F0FA, #EEF2F7 55%, #E1E7EF)',
        backgroundSize: '14px 14px, auto'
      }}
    >
      <img src="/brand/logo-192.png" alt="" aria-hidden loading="lazy" className={cx('h-[45%] max-h-28 w-auto opacity-25 grayscale-[35%]', iconClassName)} />
    </div>
  );

// Ô ngày kiểu "28 / Th9"
export const DateBadge = ({ date, className }) => {
  const d = new Date(date);
  return (
    <div className={cx('flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-gold/40 bg-white text-center', className)}>
      <span className="text-xl font-bold leading-none text-navy-950">{`${d.getDate()}`.padStart(2, '0')}</span>
      <span className="mt-0.5 text-[11px] font-semibold uppercase text-gold-dark">{monthShort(d)}</span>
    </div>
  );
};

export const MetaLine = ({ date, views, category, className }) => {
  const { categoryHref } = useSite();
  return (
    <div className={cx('flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500', className)}>
      {category && (
        <Link to={categoryHref(category)} className="font-semibold uppercase tracking-wide text-gold-dark hover:text-navy-950">
          {category.name}
        </Link>
      )}
      {date && (
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" /> {formatDay(date)}
        </span>
      )}
      {views !== undefined && (
        <span className="inline-flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" /> {views}
        </span>
      )}
    </div>
  );
};

// ---------- Thẻ bài viết ----------
// variant: lead (ảnh lớn + tóm tắt) | row (ảnh trái) | compact (ảnh nhỏ) | grid (ảnh trên) | text (chỉ tiêu đề)

export const PostCard = ({ post, variant = 'row', showCategory = true, className }) => {
  const href = portalRoutes.post(post.slug);
  const category = showCategory ? post.primaryCategory : null;

  if (variant === 'lead') {
    return (
      <article className={cx('group', className)}>
        <Link to={href} className={cx('block overflow-hidden rounded-lg bg-stone-100', post.thumbnail ? 'aspect-[16/9]' : 'aspect-[21/9]')}>
          <Thumb src={post.thumbnail} alt={post.title} className="transition-transform duration-500 group-hover:scale-[1.03]"  />
        </Link>
        <MetaLine className="mt-3" category={category} date={post.publishedAt} />
        <h3 className="mt-1.5 text-xl font-bold leading-snug !text-navy-950 sm:text-2xl">
          <Link to={href} className="hover:text-gold-dark">{post.title}</Link>
        </h3>
        {post.summary && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{post.summary}</p>}
      </article>
    );
  }

  if (variant === 'grid') {
    return (
      <article className={cx('group', className)}>
        <Link to={href} className="block aspect-[4/3] overflow-hidden rounded-lg bg-stone-100">
          <Thumb src={post.thumbnail} alt={post.title} className="transition-transform duration-500 group-hover:scale-[1.04]" />
        </Link>
        <h3 className="mt-2.5 line-clamp-3 text-[15px] font-semibold leading-snug !text-navy-950">
          <Link to={href} className="hover:text-gold-dark">{post.title}</Link>
        </h3>
        <MetaLine className="mt-1.5" date={post.publishedAt} />
      </article>
    );
  }

  if (variant === 'compact') {
    return (
      <article className={cx('group flex gap-3', className)}>
        <Link to={href} className="h-[60px] w-20 shrink-0 overflow-hidden rounded-md bg-stone-100">
          <Thumb src={post.thumbnail} alt=""  />
        </Link>
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug !text-navy-950">
            <Link to={href} className="hover:text-gold-dark">{post.title}</Link>
          </h3>
          <p className="mt-1 text-xs text-slate-400">{formatDay(post.publishedAt)}</p>
        </div>
      </article>
    );
  }

  if (variant === 'text') {
    return (
      <article className={cx('group flex gap-2.5', className)}>
        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug !text-navy-950">
            <Link to={href} className="hover:text-gold-dark">{post.title}</Link>
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">{formatDay(post.publishedAt)}</p>
        </div>
      </article>
    );
  }

  // row
  return (
    <article className={cx('group flex gap-4', className)}>
      <Link to={href} className="aspect-[4/3] w-32 shrink-0 overflow-hidden rounded-md bg-stone-100 sm:w-48">
        <Thumb src={post.thumbnail} alt={post.title} className="transition-transform duration-500 group-hover:scale-[1.04]" />
      </Link>
      <div className="min-w-0 flex-1">
        <MetaLine category={category} date={post.publishedAt} />
        <h3 className="mt-1 line-clamp-2 text-base font-bold leading-snug !text-navy-950 sm:text-lg">
          <Link to={href} className="hover:text-gold-dark">{post.title}</Link>
        </h3>
        {post.summary && <p className="mt-1.5 line-clamp-2 hidden text-sm text-slate-600 sm:block">{post.summary}</p>}
      </div>
    </article>
  );
};

// ---------- Nội dung, tệp đính kèm ----------

// HTML từ trình soạn thảo, đã làm sạch bằng DOMPurify trước khi render.
// Nội dung dán từ Word/web thường có &nbsp; giữa mọi từ => cả đoạn thành một "từ" dài và bị cắt
// giữa chữ trên điện thoại; đổi về khoảng trắng thường để xuống dòng đúng chỗ.
export const RichContent = ({ html, className }) => {
  const clean = useMemo(
    () => DOMPurify.sanitize(html || '', { ADD_ATTR: ['target'], FORBID_TAGS: ['style', 'form', 'input'] })
      .replace(/&nbsp;|\u00a0/g, ' '),
    [html]
  );
  return <div className={cx('portal-content', className)} dangerouslySetInnerHTML={{ __html: clean }} />;
};

const fileIcon = (name = '', mime = '') => {
  if (mime.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(name)) return FileImage;
  if (/\.xlsx?$/i.test(name)) return FileSpreadsheet;
  if (/\.(pdf|docx?)$/i.test(name)) return FileText;
  return File;
};

const isPdf = (f) => f.mimeType === 'application/pdf' || /\.pdf$/i.test(f.fileUrl);

// Danh sách tệp đính kèm; PDF đầu tiên mở sẵn trình xem nhúng
export const AttachmentList = ({ files = [], title = 'Tệp đính kèm', embedFirstPdf = true }) => {
  const firstPdf = embedFirstPdf ? files.find(isPdf) : null;
  const [openUrl, setOpenUrl] = useState(firstPdf?.fileUrl || null);
  if (!files.length) return null;

  return (
    <section className="mt-8 space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wide !text-navy-950">{title}</h2>
      <ul className="divide-y divide-stone-200 overflow-hidden rounded-lg border border-stone-200 bg-white">
        {files.map((f) => {
          const Icon = fileIcon(f.fileName, f.mimeType);
          const open = openUrl === f.fileUrl;
          return (
            <li key={f.fileUrl}>
              <div className="flex items-center gap-3 px-4 py-3">
                <Icon className="h-5 w-5 shrink-0 text-gold-dark" strokeWidth={1.6} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-navy-950">{f.fileName}</span>
                {f.size ? <span className="hidden text-xs text-slate-400 sm:inline">{formatFileSize(f.size)}</span> : null}
                {isPdf(f) && (
                  <button
                    type="button"
                    onClick={() => setOpenUrl(open ? null : f.fileUrl)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-stone-100"
                  >
                    {open ? 'Thu gọn' : 'Xem trực tiếp'}
                    <ChevronDown className={cx('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
                  </button>
                )}
                <a
                  href={assetUrl(f.fileUrl)}
                  target="_blank"
                  rel="noreferrer"
                  download={f.fileName}
                  className="inline-flex items-center gap-1 rounded-md bg-navy-950 px-2.5 py-1 text-xs font-semibold text-white hover:bg-navy-800"
                >
                  <Download className="h-3.5 w-3.5" /> Tải về
                </a>
              </div>
              {open && (
                <iframe title={f.fileName} src={assetUrl(f.fileUrl)} className="h-[75vh] w-full border-t border-stone-200 bg-stone-100" />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export const ShareButtons = ({ title }) => {
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const [copied, setCopied] = useState(false);
  const btn = 'inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 text-slate-500 transition-colors hover:border-navy-950 hover:bg-navy-950 hover:text-white';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Chia sẻ</span>
      <a className={btn} href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" aria-label="Chia sẻ Facebook">
        <FacebookIcon className="h-4 w-4" />
      </a>
      <a className={btn} href={`mailto:?subject=${encodeURIComponent(title || '')}&body=${encodeURIComponent(url)}`} aria-label="Gửi email">
        <Mail className="h-4 w-4" />
      </a>
      <button
        type="button"
        className={btn}
        aria-label="Sao chép liên kết"
        onClick={() => navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}
      >
        <Link2 className="h-4 w-4" />
      </button>
      {copied && <span className="text-xs text-emerald-600">Đã sao chép</span>}
    </div>
  );
};

// ---------- Phân trang, trạng thái ----------

export const PublicPagination = ({ page, totalPages, onChange }) => {
  if (!totalPages || totalPages <= 1) return null;
  const pages = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }
  const base = 'inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors';
  return (
    <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Phân trang">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className={cx(base, 'text-slate-600 hover:bg-stone-100 disabled:opacity-40')} aria-label="Trang trước">
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-1 text-slate-400">…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cx(base, p === page ? 'bg-navy-950 text-white' : 'text-slate-600 hover:bg-stone-100')}
          >
            {p}
          </button>
        )
      )}
      <button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)} className={cx(base, 'text-slate-600 hover:bg-stone-100 disabled:opacity-40')} aria-label="Trang sau">
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
};

export const EmptyBlock = ({ title = 'Chưa có nội dung', description, icon: Icon = SearchX }) => (
  <div className="flex flex-col items-center rounded-lg border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
    <Icon className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
    <p className="mt-3 text-sm font-semibold text-navy-950">{title}</p>
    {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
  </div>
);

export const Skeleton = ({ className }) => <div className={cx('animate-pulse rounded-md bg-stone-200/70', className)} />;

export const ListSkeleton = ({ rows = 5 }) => (
  <div className="space-y-5">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex gap-4">
        <Skeleton className="aspect-[4/3] w-32 shrink-0 sm:w-48" />
        <div className="flex-1 space-y-2 py-1">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    ))}
  </div>
);

// Trang không tìm thấy dùng chung (bài viết, văn bản, trang tĩnh...)
export const NotFoundBlock = ({ title = 'Không tìm thấy nội dung', description = 'Nội dung có thể đã bị gỡ hoặc đường dẫn không chính xác.' }) => (
  <Container className="py-20">
    <div className="mx-auto max-w-md text-center">
      <p className="text-6xl font-bold text-gold">404</p>
      <h1 className="mt-4 text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-navy-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
        <Home className="h-4 w-4" /> Về trang chủ
      </Link>
    </div>
  </Container>
);

// Nút "Bộ lọc" chỉ hiện trên điện thoại: gom các ô lọc phụ để kết quả hiện ngay dưới ô tìm kiếm
export const FilterToggle = ({ open, count = 0, onClick, className }) => (
  <button
    type="button"
    onClick={onClick}
    aria-expanded={open}
    className={cx(
      'relative inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium md:hidden',
      open || count ? 'border-navy-950 text-navy-950' : 'border-stone-300 text-slate-600',
      className
    )}
  >
    <SlidersHorizontal className="h-4 w-4" /> Bộ lọc
    {count > 0 && (
      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-navy-950 px-1 text-[11px] font-semibold text-white">{count}</span>
    )}
  </button>
);
