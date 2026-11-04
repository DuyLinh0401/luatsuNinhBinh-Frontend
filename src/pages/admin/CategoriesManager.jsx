// Quản lý chuyên mục nhiều cấp cho bài viết (POST) và văn bản (DOCUMENT)
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, FolderTree, CornerDownRight, LayoutGrid } from 'lucide-react';
import { categoryApi, errorMessage } from '../../services/portalService';
import {
  PageHeader, Card, Button, IconButton, Field, Input, Textarea, Select, Toggle, Badge, Tabs, Table, EmptyState, Modal, Form
} from '../../components/admin/ui/AdminUI';
import { ImageField } from '../../components/admin/ui/FileFields';
import useConfirm from '../../hooks/useConfirm';

const TYPE_TABS = [
  { value: 'POST', label: 'Chuyên mục bài viết' },
  { value: 'DOCUMENT', label: 'Chuyên mục văn bản' }
];

const EMPTY_FORM = {
  name: '', slug: '', parentId: '', description: '', thumbnail: '', order: 0,
  isActive: true, showInMenu: true, showOnHome: false, homeOrder: ''
};

// Cây -> danh sách phẳng kèm độ sâu để hiển thị dạng bảng thụt lề
const flattenWithDepth = (nodes, depth = 0, parent = null) =>
  nodes.flatMap((node) => [{ ...node, depth, parent }, ...flattenWithDepth(node.children || [], depth + 1, node)]);

const subtreeIds = (node) => [node.id, ...(node.children || []).flatMap(subtreeIds)];

const CategoriesManager = () => {
  const [type, setType] = useState('POST');
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState({ key: null, tree: [] });
  const [editing, setEditing] = useState(null); // null | { id?, ...form }
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirm, confirmDialog] = useConfirm();

  const key = `${type}-${version}`;
  const loading = result.key !== key;
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let alive = true;
    categoryApi
      .all({ type })
      .then((tree) => alive && setResult({ key, tree }))
      .catch((error) => {
        if (!alive) return;
        toast.error(errorMessage(error, 'Không tải được chuyên mục'));
        setResult({ key, tree: [] });
      });
    return () => {
      alive = false;
    };
  }, [type, key]);

  const rows = useMemo(() => flattenWithDepth(result.tree), [result.tree]);

  const homeSections = useMemo(
    () => rows.filter((c) => c.showOnHome).sort((a, b) => (a.homeOrder ?? 999) - (b.homeOrder ?? 999)),
    [rows]
  );

  // Chuyên mục cha hợp lệ: cùng loại, không phải chính nó và không nằm trong nhánh con của nó
  const editingId = editing?.id;
  const parentOptions = useMemo(() => {
    const current = editingId ? rows.find((r) => r.id === editingId) : null;
    const excluded = current ? subtreeIds(current) : [];
    return rows
      .filter((r) => !excluded.includes(r.id))
      .map((r) => ({ value: r.id, label: `${'— '.repeat(r.depth)}${r.name}` }));
  }, [rows, editingId]);

  const openCreate = (parentId = '') => {
    setErrors({});
    setEditing({ ...EMPTY_FORM, parentId });
  };

  const openEdit = (category) => {
    setErrors({});
    setEditing({
      ...EMPTY_FORM,
      id: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId ?? '',
      description: category.description || '',
      thumbnail: category.thumbnail || '',
      order: category.order ?? 0,
      isActive: category.isActive,
      showInMenu: category.showInMenu,
      showOnHome: category.showOnHome,
      homeOrder: category.homeOrder ?? ''
    });
  };

  const set = (field) => (value) => setEditing((f) => ({ ...f, [field]: value?.target ? value.target.value : value }));

  const save = async (e) => {
    e.preventDefault();
    if (!editing.name.trim()) {
      setErrors({ name: 'Nhập tên chuyên mục' });
      return;
    }
    setSaving(true);
    try {
      const { id, ...form } = editing;
      const payload = {
        ...form,
        type,
        slug: form.slug.trim() || undefined,
        parentId: form.parentId === '' ? null : Number(form.parentId),
        order: Number(form.order) || 0,
        homeOrder: form.showOnHome && form.homeOrder !== '' ? Number(form.homeOrder) : null
      };
      if (id) await categoryApi.update(id, payload);
      else await categoryApi.create(payload);
      toast.success(id ? 'Đã cập nhật chuyên mục' : 'Đã tạo chuyên mục');
      setEditing(null);
      reload();
    } catch (error) {
      toast.error(errorMessage(error, 'Lưu chuyên mục thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (category) => {
    const ok = await confirm({
      title: 'Xoá chuyên mục',
      message: `Xoá chuyên mục "${category.name}"? Chỉ xoá được khi chuyên mục không còn chuyên mục con và nội dung.`,
      confirmText: 'Xoá chuyên mục'
    });
    if (!ok) return;
    try {
      await categoryApi.remove(category.id);
      toast.success('Đã xoá chuyên mục');
      reload();
    } catch (error) {
      toast.error(errorMessage(error, 'Xoá chuyên mục thất bại'));
    }
  };

  const countLabel = type === 'POST' ? 'Số bài' : 'Số văn bản';

  const columns = [
    {
      key: 'name',
      header: 'Chuyên mục',
      render: (c) => (
        <div className="flex min-w-[260px] items-center gap-1.5" style={{ paddingLeft: `${c.depth * 22}px` }}>
          {c.depth > 0 && <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />}
          <div className="min-w-0">
            <p className={`truncate ${c.depth === 0 ? 'font-semibold' : 'font-medium'} ${c.isActive ? 'text-navy-950' : 'text-slate-400'}`}>
              {c.name}
            </p>
            <p className="truncate text-xs text-slate-400">/{c.slug}</p>
          </div>
        </div>
      )
    },
    {
      key: 'count',
      header: countLabel,
      className: 'tabular-nums text-slate-500',
      render: (c) => (type === 'POST' ? c._count?.posts : c._count?.legalDocuments) ?? 0
    },
    {
      key: 'flags',
      header: 'Hiển thị',
      render: (c) => (
        <div className="flex flex-wrap gap-1">
          {!c.isActive && <Badge tone="red">Ẩn</Badge>}
          {c.showInMenu && <Badge tone="blue">Menu</Badge>}
          {c.showOnHome && <Badge tone="gold">Trang chủ #{c.homeOrder ?? '—'}</Badge>}
        </div>
      )
    },
    { key: 'order', header: 'Thứ tự', className: 'tabular-nums text-slate-500' },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (c) => (
        <div className="flex justify-end gap-0.5">
          <IconButton icon={Plus} label="Thêm chuyên mục con" tone="gold" onClick={() => openCreate(c.id)} />
          <IconButton icon={Pencil} label="Sửa" onClick={() => openEdit(c)} />
          <IconButton icon={Trash2} label="Xoá" tone="danger" onClick={() => remove(c)} />
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Chuyên mục"
        description="Cây chuyên mục dùng cho menu, trang danh sách và các khối trên trang chủ."
        actions={<Button variant="gold" icon={Plus} onClick={() => openCreate()}>Thêm chuyên mục</Button>}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card padded={false}>
          <div className="px-4 pt-2">
            <Tabs tabs={TYPE_TABS} value={type} onChange={setType} />
          </div>
          <Table
            columns={columns}
            rows={rows}
            loading={loading}
            empty={
              <EmptyState
                icon={FolderTree}
                title="Chưa có chuyên mục"
                action={<Button size="sm" icon={Plus} onClick={() => openCreate()}>Thêm chuyên mục</Button>}
              />
            }
          />
        </Card>

        {type === 'POST' && (
          <Card title="Khối trang chủ" actions={<LayoutGrid className="h-4 w-4 text-slate-400" />}>
            <p className="mb-3 text-xs text-slate-500">
              Thứ tự các khối tin hiển thị trên trang chủ. Bật "Hiện trên trang chủ" và đặt thứ tự trong form chuyên mục.
            </p>
            {homeSections.length ? (
              <ol className="space-y-1.5">
                {homeSections.map((c) => (
                  <li key={c.id} className="flex items-center gap-2.5 rounded-md bg-stone-50 px-2.5 py-1.5 text-sm">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy-950 text-[11px] font-semibold text-white">
                      {c.homeOrder ?? '?'}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-navy-950">{c.name}</span>
                    {c.parent && <span className="truncate text-[11px] text-slate-400">{c.parent.name}</span>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-slate-400">Chưa có chuyên mục nào hiển thị trên trang chủ.</p>
            )}
          </Card>
        )}
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        size="lg"
        title={editing?.id ? 'Sửa chuyên mục' : 'Thêm chuyên mục'}
        description={TYPE_TABS.find((t) => t.value === type)?.label}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>Huỷ</Button>
            <Button type="submit" form="category-form" loading={saving}>Lưu</Button>
          </>
        }
      >
        {editing && (
          <Form id="category-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <Field label="Tên chuyên mục" required error={errors.name} className="sm:col-span-2">
              <Input value={editing.name} onChange={set('name')} autoFocus />
            </Field>
            <Field label="Đường dẫn (slug)" hint="Để trống để tạo tự động">
              <Input value={editing.slug} onChange={set('slug')} />
            </Field>
            <Field label="Chuyên mục cha">
              <Select value={editing.parentId} onChange={set('parentId')} options={parentOptions} placeholder="— Không (cấp gốc)" />
            </Field>
            <Field label="Mô tả" className="sm:col-span-2">
              <Textarea value={editing.description} onChange={set('description')} rows={2} />
            </Field>
            <Field label="Ảnh đại diện">
              <ImageField value={editing.thumbnail} onChange={set('thumbnail')} />
            </Field>
            <div className="space-y-4">
              <Field label="Thứ tự" hint="Số nhỏ hiển thị trước">
                <Input type="number" value={editing.order} onChange={set('order')} />
              </Field>
              <Toggle checked={editing.isActive} onChange={set('isActive')} label="Đang hoạt động" description="Tắt để ẩn khỏi trang công khai" />
              <Toggle checked={editing.showInMenu} onChange={set('showInMenu')} label="Hiện trong menu" />
              <Toggle checked={editing.showOnHome} onChange={set('showOnHome')} label="Hiện trên trang chủ" description="Thành một khối tin trên trang chủ" />
              {editing.showOnHome && (
                <Field label="Thứ tự khối trang chủ">
                  <Input type="number" min={1} value={editing.homeOrder} onChange={set('homeOrder')} />
                </Field>
              )}
            </div>
          </Form>
        )}
      </Modal>

      {confirmDialog}
    </div>
  );
};

export default CategoriesManager;
