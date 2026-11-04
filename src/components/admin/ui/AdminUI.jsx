// Bộ component giao diện quản trị dùng chung (tông navy / vàng của DashboardLayout).
// Lưu ý: index.css ép `input, textarea, select { padding ... !important }`, `label { margin-bottom ... !important }`
// và `form > div { margin-bottom }` nên các class dưới đây dùng tiền tố "!" để thắng.
import { useEffect } from 'react';
import { inputClass } from './format';
import { createPortal } from 'react-dom';
import { Loader2, Search, X, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

const cx = (...classes) => classes.filter(Boolean).join(' ');

// ---------- Bố cục ----------

export const PageHeader = ({ title, description, actions, breadcrumb }) => (
  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      {breadcrumb && <div className="mb-1 text-xs font-medium text-slate-400">{breadcrumb}</div>}
      <h2 className="text-2xl font-bold text-navy-950">{title}</h2>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const Card = ({ children, className, padded = true, title, actions }) => (
  <div className={cx('rounded-xl border border-stone-200 bg-white shadow-sm', className)}>
    {(title || actions) && (
      <div className="flex items-center justify-between gap-3 border-b border-stone-200 px-5 py-3.5">
        {title && <h3 className="text-sm font-semibold text-navy-950">{title}</h3>}
        {actions}
      </div>
    )}
    <div className={padded ? 'p-5' : ''}>{children}</div>
  </div>
);

// ---------- Nút ----------

const BUTTON_VARIANTS = {
  primary: 'bg-navy-950 text-white hover:bg-navy-800 shadow-sm',
  gold: 'bg-gold text-navy-950 hover:bg-gold-hover shadow-sm',
  secondary: 'bg-white text-slate-700 border border-stone-300 hover:border-stone-400 hover:bg-stone-50',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
  ghost: 'text-slate-600 hover:bg-stone-100 hover:text-navy-950'
};

const BUTTON_SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2'
};

export const Button = ({ variant = 'primary', size = 'md', icon: Icon, loading, className, children, type = 'button', disabled, ...props }) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={cx(
      'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 disabled:cursor-not-allowed disabled:opacity-60',
      BUTTON_VARIANTS[variant],
      BUTTON_SIZES[size],
      className
    )}
    {...props}
  >
    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon && <Icon className="h-4 w-4" strokeWidth={2} />}
    {children}
  </button>
);

const ICON_TONES = {
  default: 'text-slate-500 hover:bg-stone-100 hover:text-navy-950',
  danger: 'text-slate-500 hover:bg-red-50 hover:text-red-600',
  success: 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-600',
  gold: 'text-slate-500 hover:bg-gold/10 hover:text-gold-dark'
};

export const IconButton = ({ icon: Icon, label, tone = 'default', className, ...props }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    className={cx('inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-40', ICON_TONES[tone], className)}
    {...props}
  >
    <Icon className="h-4 w-4" strokeWidth={1.9} />
  </button>
);

// ---------- Form ----------

export const Form = ({ className, children, ...props }) => (
  <form className={cx('[&>div]:!mb-0', className)} {...props}>
    {children}
  </form>
);

export const Field = ({ label, required, hint, error, children, className, htmlFor }) => (
  <div className={className}>
    {label && (
      <label htmlFor={htmlFor} className="!mb-1.5 block text-[13px] font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
    )}
    {children}
    {error ? (
      <p className="mt-1 text-xs text-red-600">{error}</p>
    ) : (
      hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>
    )}
  </div>
);

// React 19: ref là prop thường nên register() của react-hook-form dùng trực tiếp được
export const Input = ({ className, ...props }) => <input className={cx(inputClass, className)} {...props} />;

export const Textarea = ({ className, rows = 3, ...props }) => (
  <textarea rows={rows} className={cx(inputClass, 'resize-y', className)} {...props} />
);

export const Select = ({ className, options = [], placeholder, children, ...props }) => (
  <select className={cx(inputClass, '!pr-8', className)} {...props}>
    {placeholder !== undefined && <option value="">{placeholder}</option>}
    {options.map((o) => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
    {children}
  </select>
);

export const Checkbox = ({ label, className, ...props }) => (
  <label className={cx('!mb-0 inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700', className)}>
    <input type="checkbox" className="!p-0 h-4 w-4 rounded border-stone-300 text-navy-950 focus:ring-gold/40" {...props} />
    {label}
  </label>
);

export const Toggle = ({ checked, onChange, label, description, disabled }) => (
  <label className={cx('!mb-0 flex items-start gap-3', disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer')}>
    <button
      type="button"
      role="switch"
      aria-checked={!!checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative mt-0.5 inline-flex h-5 w-9 shrink-0 rounded-full transition-colors',
        checked ? 'bg-navy-950' : 'bg-stone-300'
      )}
    >
      <span className={cx('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-4' : 'translate-x-0.5')} />
    </button>
    {(label || description) && (
      <span className="min-w-0">
        {label && <span className="block text-sm font-medium text-slate-700">{label}</span>}
        {description && <span className="block text-xs text-slate-400">{description}</span>}
      </span>
    )}
  </label>
);

export const SearchInput = ({ value, onChange, placeholder = 'Tìm kiếm...', className }) => (
  <div className={cx('relative', className)}>
    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    <input
      type="search"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cx(inputClass, '!pl-9')}
    />
  </div>
);

// ---------- Hiển thị ----------

const BADGE_TONES = {
  gray: 'bg-stone-100 text-slate-600 ring-stone-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
  gold: 'bg-gold/10 text-gold-dark ring-gold/30',
  navy: 'bg-navy-950 text-white ring-navy-950'
};

export const Badge = ({ tone = 'gray', children, className, dot }) => (
  <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', BADGE_TONES[tone], className)}>
    {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
    {children}
  </span>
);

// Thanh tab gạch chân. Đường kẻ nền vẽ bằng shadow inset và gạch chân tab đang chọn nằm TRONG khung
// (không dùng -mb-px) nên không tràn => không hiện thanh cuộn; nhiều tab trên màn nhỏ vẫn vuốt ngang được.
export const Tabs = ({ tabs, value, onChange }) => (
  <div
    role="tablist"
    className="flex gap-1 overflow-x-auto overflow-y-hidden shadow-[inset_0_-1px_0_theme(colors.stone.200)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
  >
    {tabs.map((tab) => {
      const active = tab.value === value;
      return (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(tab.value)}
          className={cx(
            'relative flex shrink-0 items-center gap-2 whitespace-nowrap px-3.5 py-2.5 text-sm font-medium transition-colors',
            active ? 'text-navy-950' : 'text-slate-500 hover:text-navy-950'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cx('rounded-full px-1.5 text-[11px] font-semibold', active ? 'bg-navy-950 text-white' : 'bg-stone-100 text-slate-500')}>
              {tab.count}
            </span>
          )}
          <span
            aria-hidden
            className={cx('absolute inset-x-2 bottom-0 h-0.5 rounded-full transition-colors', active ? 'bg-gold' : 'bg-transparent')}
          />
        </button>
      );
    })}
  </div>
);

export const EmptyState = ({ icon: Icon = Inbox, title = 'Chưa có dữ liệu', description, action }) => (
  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
      <Icon className="h-6 w-6 text-slate-400" strokeWidth={1.6} />
    </div>
    <p className="text-sm font-semibold text-navy-950">{title}</p>
    {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const Spinner = ({ className }) => <Loader2 className={cx('h-5 w-5 animate-spin text-slate-400', className)} />;

// columns: [{ key, header, render?: (row) => node, className?, headerClassName? }]
export const Table = ({ columns, rows, loading, rowKey = 'id', empty, onRowClick }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead>
        <tr className="border-b border-stone-200 bg-stone-50/70">
          {columns.map((col) => (
            <th
              key={col.key}
              className={cx('px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500', col.headerClassName)}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-stone-100">
        {loading && !rows.length ? (
          [...Array(5)].map((_, i) => (
            <tr key={i}>
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3.5">
                  <div className="h-4 animate-pulse rounded bg-stone-100" />
                </td>
              ))}
            </tr>
          ))
        ) : rows.length ? (
          rows.map((row) => (
            <tr
              key={row[rowKey]}
              onClick={onRowClick && (() => onRowClick(row))}
              className={cx('transition-colors hover:bg-stone-50/80', onRowClick && 'cursor-pointer', loading && 'opacity-60')}
            >
              {columns.map((col) => (
                <td key={col.key} className={cx('px-4 py-3 align-middle text-slate-700', col.className)}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={columns.length}>{empty || <EmptyState />}</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export const Pagination = ({ page, totalPages, total, onChange }) => {
  if (!total) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-stone-200 px-4 py-3 text-sm text-slate-500">
      <span>
        Tổng <span className="font-semibold text-navy-950">{total}</span> bản ghi
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <IconButton icon={ChevronLeft} label="Trang trước" disabled={page <= 1} onClick={() => onChange(page - 1)} />
          <span className="px-2 tabular-nums">
            {page} / {totalPages}
          </span>
          <IconButton icon={ChevronRight} label="Trang sau" disabled={page >= totalPages} onClick={() => onChange(page + 1)} />
        </div>
      )}
    </div>
  );
};

// ---------- Hộp thoại ----------

const MODAL_SIZES = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };

export const Modal = ({ open, onClose, title, description, size = 'md', children, footer }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-navy-950/50 p-4 backdrop-blur-[2px] sm:p-8">
      <div className="absolute inset-0" onClick={onClose} />
      <div className={cx('relative my-auto w-full rounded-2xl bg-white shadow-2xl ring-1 ring-black/5', MODAL_SIZES[size])}>
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-navy-950">{title}</h3>
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          <IconButton icon={X} label="Đóng" onClick={onClose} />
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 rounded-b-2xl border-t border-stone-200 bg-stone-50 px-6 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

