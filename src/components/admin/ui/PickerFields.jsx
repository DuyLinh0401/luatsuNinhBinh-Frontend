import { useState } from 'react';
import { X, Star } from 'lucide-react';
import { inputClass } from './format';

// Chọn nhiều chuyên mục từ cây + đánh dấu chuyên mục chính (dùng cho breadcrumb)
// tree: [{ id, name, children: [...] }]
export const CategoryPicker = ({ tree = [], value = [], primaryId, onChange }) => {
  const toggle = (id) => {
    const next = value.includes(id) ? value.filter((v) => v !== id) : [...value, id];
    const nextPrimary = next.includes(primaryId) ? primaryId : next[0] ?? null;
    onChange(next, nextPrimary);
  };

  const renderNode = (node, depth) => {
    const checked = value.includes(node.id);
    const isPrimary = checked && node.id === primaryId;
    return (
      <div key={node.id}>
        <div
          className={`group flex items-center gap-2 rounded-md py-1.5 pr-2 transition-colors ${checked ? 'bg-gold/5' : 'hover:bg-stone-50'}`}
          style={{ paddingLeft: `${8 + depth * 18}px` }}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={() => toggle(node.id)}
            className="!p-0 h-4 w-4 shrink-0 rounded border-stone-300 text-navy-950"
            id={`cat-${node.id}`}
          />
          <label htmlFor={`cat-${node.id}`} className={`!mb-0 flex-1 cursor-pointer text-sm ${depth === 0 ? 'font-semibold text-navy-950' : 'text-slate-700'}`}>
            {node.name}
          </label>
          {checked && (
            <button
              type="button"
              onClick={() => onChange(value, node.id)}
              title={isPrimary ? 'Chuyên mục chính' : 'Đặt làm chuyên mục chính'}
              className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
                isPrimary ? 'bg-gold text-navy-950' : 'text-slate-400 opacity-0 hover:text-gold-dark group-hover:opacity-100'
              }`}
            >
              <Star className="h-3 w-3" fill={isPrimary ? 'currentColor' : 'none'} />
              {isPrimary ? 'Chính' : 'Đặt chính'}
            </button>
          )}
        </div>
        {node.children?.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="max-h-72 overflow-y-auto rounded-lg border border-stone-200 p-1.5">
      {tree.length ? tree.map((n) => renderNode(n, 0)) : <p className="p-3 text-sm text-slate-400">Chưa có chuyên mục</p>}
    </div>
  );
};

// Nhập tag: Enter hoặc dấu phẩy để thêm
export const TagInput = ({ value = [], onChange, placeholder = 'Nhập tag rồi nhấn Enter' }) => {
  const [draft, setDraft] = useState('');

  const add = (raw) => {
    const names = raw.split(',').map((t) => t.trim()).filter(Boolean);
    const next = [...value];
    names.forEach((n) => {
      if (!next.some((t) => t.toLowerCase() === n.toLowerCase())) next.push(n);
    });
    onChange(next);
    setDraft('');
  };

  return (
    <div className={`${inputClass} flex min-h-[38px] flex-wrap items-center gap-1.5 !py-1.5 focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20`}>
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-slate-700">
          {tag}
          <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} className="text-slate-400 hover:text-red-600" aria-label={`Bỏ ${tag}`}>
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ',') && draft.trim()) {
            e.preventDefault();
            add(draft);
          } else if (e.key === 'Backspace' && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => draft.trim() && add(draft)}
        placeholder={value.length ? '' : placeholder}
        className="min-w-[120px] flex-1 border-0 bg-transparent !p-0 text-sm shadow-none focus:outline-none focus:ring-0"
      />
    </div>
  );
};
