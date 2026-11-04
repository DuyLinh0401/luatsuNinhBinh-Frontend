// Hàm định dạng và hằng số dùng chung cho giao diện quản trị

export const formatDate = (value, withTime = false) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    ...(withTime && { hour: '2-digit', minute: '2-digit' })
  });
};

// Date -> 'YYYY-MM-DD' hoặc 'YYYY-MM-DDTHH:mm' cho input date/datetime-local
export const toInputDate = (value, withTime = false) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => `${n}`.padStart(2, '0');
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return withTime ? `${date}T${pad(d.getHours())}:${pad(d.getMinutes())}` : date;
};

export const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

// index.css ép padding !important cho mọi input nên phải dùng "!px-3 !py-2"
export const inputClass =
  'block w-full rounded-lg border border-stone-300 bg-white !px-3 !py-2 text-sm text-navy-950 placeholder:text-slate-400 shadow-sm transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 disabled:bg-stone-100 disabled:text-slate-500';

// Làm phẳng cây chuyên mục/trang để dùng trong <select> (tên thụt lề theo cấp)
export const flattenTree = (tree, depth = 0) =>
  tree.flatMap((node) => [
    { value: node.id, label: `${'— '.repeat(depth)}${node.name ?? node.title}`, node },
    ...flattenTree(node.children || [], depth + 1)
  ]);
