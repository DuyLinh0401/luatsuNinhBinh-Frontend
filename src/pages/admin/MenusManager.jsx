// Trình sửa menu header / footer: chỉnh cục bộ rồi lưu cả cây một lần
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Plus, Pencil, Trash2, ArrowUp, ArrowDown, IndentIncrease, IndentDecrease, CornerDownRight, ExternalLink, EyeOff, ListTree
} from 'lucide-react';
import { menuApi, categoryApi, pageApi, errorMessage } from '../../services/portalService';
import useConfirm from '../../hooks/useConfirm';
import {
  PageHeader, Card, Button, IconButton, Field, Input, Select, Toggle, Badge, Tabs, EmptyState, Spinner, Modal, Form
} from '../../components/admin/ui/AdminUI';
import { portalRoutes } from '../../utils/portalRoutes';

const MAX_DEPTH = 3;
const LOCATIONS = [
  { value: 'HEADER', label: 'Menu chính' },
  { value: 'FOOTER', label: 'Chân trang' }
];

let tempId = 0;
const newId = () => `tmp-${++tempId}`;
const newNode = (data = {}) => ({ id: newId(), label: '', url: '', isActive: true, openInNewTab: false, children: [], ...data });

// ---------- Thao tác cây (bất biến) ----------

const mapTree = (nodes, fn) => nodes.map((n) => fn({ ...n, children: mapTree(n.children || [], fn) }));

// Trả về [mảng anh em chứa id, vị trí] trên bản sao cây
const locate = (nodes, id) => {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) return [nodes, i];
    const found = locate(nodes[i].children || [], id);
    if (found) return found;
  }
  return null;
};

const cloneTree = (nodes) => mapTree(nodes, (n) => n);

const depthOf = (nodes) => (nodes.length ? 1 + Math.max(...nodes.map((n) => depthOf(n.children || []))) : 0);

const levelOf = (nodes, id, level = 1) => {
  for (const n of nodes) {
    if (n.id === id) return level;
    const found = levelOf(n.children || [], id, level + 1);
    if (found) return found;
  }
  return 0;
};

// Được mount lại (key) mỗi lần mở nên khởi tạo state trực tiếp từ props
const MenuItemForm = ({ item, onClose, onSave }) => {
  const [form, setForm] = useState(item);
  const [error, setError] = useState('');

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value?.target ? value.target.value : value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.label.trim()) return setError('Nhập nhãn hiển thị');
    onSave({ ...form, label: form.label.trim() });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Mục menu"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Huỷ</Button>
          <Button type="submit" form="menu-item-form">Áp dụng</Button>
        </>
      }
    >
      <Form id="menu-item-form" onSubmit={submit} className="space-y-4">
        <Field label="Nhãn" required error={error}>
          <Input value={form.label} onChange={set('label')} autoFocus />
        </Field>
        <Field label="Đường dẫn" hint="Để trống nếu chỉ dùng làm nhóm chứa menu con">
          <Input value={form.url || ''} onChange={set('url')} placeholder="/p/tin-tuc" />
        </Field>
        <div className="space-y-3">
          <Toggle checked={form.isActive} onChange={set('isActive')} label="Hiển thị" />
          <Toggle checked={form.openInNewTab} onChange={set('openInNewTab')} label="Mở trong tab mới" />
        </div>
      </Form>
    </Modal>
  );
};

const MenusManager = () => {
  const [location, setLocation] = useState('HEADER');
  const [tree, setTree] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null); // { item, parentId|null, isNew }
  const [quickOptions, setQuickOptions] = useState([]);
  const [confirm, confirmDialog] = useConfirm();

  const dirty = useMemo(() => JSON.stringify(tree) !== JSON.stringify(saved), [tree, saved]);

  useEffect(() => {
    let alive = true;
    menuApi.manage(location)
      .then((data) => {
        if (!alive) return;
        setTree(data);
        setSaved(data);
      })
      .catch((error) => toast.error(errorMessage(error, 'Không tải được menu')))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [location]);

  // Nguồn "Chèn nhanh": chuyên mục bài viết và trang tĩnh
  useEffect(() => {
    Promise.all([categoryApi.tree({ type: 'POST' }), pageApi.manage()])
      .then(([categories, pages]) => {
        const catOpts = categories.flatMap((root) => [
          { value: `c-${root.id}`, label: `Chuyên mục: ${root.name}`, url: portalRoutes.category(root.slug), name: root.name },
          ...(root.children || []).map((c) => ({
            value: `c-${c.id}`, label: `Chuyên mục: — ${c.name}`, url: portalRoutes.category(c.slug, root.slug), name: c.name
          }))
        ]);
        const pageOpts = pages.flatMap((root) => [
          { value: `p-${root.id}`, label: `Trang: ${root.title}`, url: portalRoutes.page(root.slug), name: root.title },
          ...(root.children || []).map((p) => ({
            value: `p-${p.id}`, label: `Trang: — ${p.title}`, url: portalRoutes.page(p.slug, root.slug), name: p.title
          }))
        ]);
        setQuickOptions([...catOpts, ...pageOpts]);
      })
      .catch(() => {});
  }, []);

  const switchLocation = async (value) => {
    if (value === location) return;
    if (dirty && !(await confirm({ title: 'Bỏ thay đổi?', message: 'Menu hiện tại có thay đổi chưa lưu. Chuyển tab sẽ bỏ các thay đổi này.', confirmText: 'Bỏ thay đổi' }))) return;
    setLoading(true);
    setLocation(value);
  };

  const update = (fn) => setTree((prev) => {
    const next = cloneTree(prev);
    fn(next);
    return next;
  });

  const move = (id, delta) => update((next) => {
    const [siblings, i] = locate(next, id);
    const j = i + delta;
    if (j < 0 || j >= siblings.length) return;
    [siblings[i], siblings[j]] = [siblings[j], siblings[i]];
  });

  // Thụt vào: thành con cuối của mục anh liền trước
  const indent = (id) => {
    const [siblings, i] = locate(tree, id);
    if (i === 0) return;
    const node = siblings[i];
    if (levelOf(tree, siblings[i - 1].id) + depthOf([node]) > MAX_DEPTH) {
      return toast.error(`Menu tối đa ${MAX_DEPTH} cấp`);
    }
    update((next) => {
      const [sibs, idx] = locate(next, id);
      const [moved] = sibs.splice(idx, 1);
      sibs[idx - 1].children = [...(sibs[idx - 1].children || []), moved];
    });
  };

  // Thụt ra: đứng ngay sau mục cha
  const outdent = (id) => update((next) => {
    const parent = (function findParent(nodes, p) {
      for (const n of nodes) {
        if ((n.children || []).some((c) => c.id === id)) return n;
        const found = findParent(n.children || [], p);
        if (found) return found;
      }
      return null;
    })(next);
    if (!parent) return;
    const idx = parent.children.findIndex((c) => c.id === id);
    const [moved] = parent.children.splice(idx, 1);
    const [parentSiblings, pIdx] = locate(next, parent.id);
    parentSiblings.splice(pIdx + 1, 0, moved);
  });

  const remove = async (node) => {
    const childCount = (node.children || []).length;
    const ok = await confirm({
      title: 'Xoá mục menu',
      message: childCount ? `Xoá "${node.label}" cùng ${childCount} mục con?` : `Xoá "${node.label}"?`,
      confirmText: 'Xoá'
    });
    if (!ok) return;
    update((next) => {
      const [siblings, i] = locate(next, node.id);
      siblings.splice(i, 1);
    });
  };

  const applyEdit = (item) => {
    const { parentId, isNew } = editing;
    update((next) => {
      if (!isNew) {
        const [siblings, i] = locate(next, item.id);
        siblings[i] = { ...siblings[i], ...item, children: siblings[i].children };
      } else if (parentId) {
        const [siblings, i] = locate(next, parentId);
        siblings[i].children = [...(siblings[i].children || []), item];
      } else {
        next.push(item);
      }
    });
    setEditing(null);
  };

  const quickAdd = (value) => {
    const option = quickOptions.find((o) => o.value === value);
    if (!option) return;
    setTree((prev) => [...prev, newNode({ label: option.name, url: option.url })]);
    toast.success(`Đã thêm "${option.name}" vào cuối menu`);
  };

  const save = async () => {
    setSaving(true);
    try {
      const data = await menuApi.save(location, tree);
      setTree(data);
      setSaved(data);
      toast.success('Đã lưu menu');
    } catch (error) {
      toast.error(errorMessage(error, 'Lưu menu thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const renderNode = (node, level, index, siblings) => (
    <li key={node.id}>
      <div
        className={`group flex items-center gap-2 rounded-lg border border-transparent py-2 pr-2 hover:border-stone-200 hover:bg-stone-50 ${node.isActive ? '' : 'opacity-60'}`}
        style={{ paddingLeft: `${12 + (level - 1) * 28}px` }}
      >
        {level > 1 && <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`truncate text-sm ${level === 1 ? 'font-semibold text-navy-950' : 'text-slate-700'}`}>{node.label}</span>
            {!node.isActive && <Badge><EyeOff className="h-3 w-3" /> Ẩn</Badge>}
            {node.openInNewTab && <ExternalLink className="h-3 w-3 text-slate-400" />}
          </div>
          <p className="truncate font-mono text-[11px] text-slate-400">{node.url || '(nhóm, không có đường dẫn)'}</p>
        </div>
        <div className="flex shrink-0 opacity-70 group-hover:opacity-100">
          <IconButton icon={ArrowUp} label="Lên" disabled={index === 0} onClick={() => move(node.id, -1)} />
          <IconButton icon={ArrowDown} label="Xuống" disabled={index === siblings.length - 1} onClick={() => move(node.id, 1)} />
          <IconButton icon={IndentIncrease} label="Thụt vào (thành mục con)" disabled={index === 0} onClick={() => indent(node.id)} />
          <IconButton icon={IndentDecrease} label="Thụt ra" disabled={level === 1} onClick={() => outdent(node.id)} />
          {level < MAX_DEPTH && (
            <IconButton icon={Plus} label="Thêm mục con" tone="gold" onClick={() => setEditing({ item: newNode(), parentId: node.id, isNew: true })} />
          )}
          <IconButton icon={Pencil} label="Sửa" onClick={() => setEditing({ item: node, isNew: false })} />
          <IconButton icon={Trash2} label="Xoá" tone="danger" onClick={() => remove(node)} />
        </div>
      </div>
      {node.children?.length > 0 && (
        <ul>{node.children.map((child, i) => renderNode(child, level + 1, i, node.children))}</ul>
      )}
    </li>
  );

  return (
    <div className="pb-20">
      <PageHeader
        title="Menu"
        description={`Sắp xếp menu chính và chân trang. Tối đa ${MAX_DEPTH} cấp. Thay đổi chỉ có hiệu lực sau khi bấm Lưu.`}
        actions={<Button variant="gold" icon={Plus} onClick={() => setEditing({ item: newNode(), parentId: null, isNew: true })}>Thêm mục</Button>}
      />

      <Card padded={false}>
        <div className="flex flex-col gap-3 px-4 pt-2 sm:flex-row sm:items-end sm:justify-between">
          <Tabs tabs={LOCATIONS} value={location} onChange={switchLocation} />
          <Select
            value=""
            onChange={(e) => quickAdd(e.target.value)}
            options={quickOptions}
            placeholder="Chèn nhanh chuyên mục / trang..."
            className="mb-2 sm:w-80"
          />
        </div>
        <div className="p-3">
          {loading ? (
            <div className="flex justify-center py-16"><Spinner className="h-7 w-7" /></div>
          ) : tree.length ? (
            <ul className="space-y-0.5">{tree.map((node, i) => renderNode(node, 1, i, tree))}</ul>
          ) : (
            <EmptyState icon={ListTree} title="Menu trống" description="Thêm mục mới hoặc chèn nhanh từ chuyên mục, trang tĩnh." />
          )}
        </div>
      </Card>

      {dirty && (
        // sticky trong vùng nội dung để không phụ thuộc độ rộng sidebar (mở rộng / thu gọn)
        <div className="sticky bottom-4 z-30 mt-4 rounded-xl border border-stone-200 bg-white/95 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-600">Menu có thay đổi chưa lưu.</span>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setTree(saved)} disabled={saving}>Hoàn tác</Button>
              <Button variant="gold" onClick={save} loading={saving}>Lưu menu</Button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <MenuItemForm key={editing.item.id} item={editing.item} onClose={() => setEditing(null)} onSave={applyEdit} />
      )}
      {confirmDialog}
    </div>
  );
};

export default MenusManager;
