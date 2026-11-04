// Quản lý trang tĩnh: Giới thiệu, Quy chế, Hướng dẫn hồ sơ...
// Bên trái là cây trang, bên phải là trình soạn của trang đang chọn.
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Save, Trash2, ExternalLink, FileText, ChevronRight, EyeOff } from 'lucide-react';
import { pageApi, errorMessage } from '../../services/portalService';
import RichTextEditor from '../../components/common/RichTextEditor';
import {
  PageHeader, Card, Button, Field, Input, Textarea, Select, Toggle, EmptyState, Spinner
} from '../../components/admin/ui/AdminUI';
import { flattenTree } from '../../components/admin/ui/format';
import { AttachmentField, ImageField } from '../../components/admin/ui/FileFields';
import useConfirm from '../../hooks/useConfirm';
import { portalRoutes } from '../../utils/portalRoutes';

const EMPTY_PAGE = {
  title: '', slug: '', parentId: '', order: 0, isPublished: true, summary: '', content: '',
  thumbnail: '', attachments: [], metaTitle: '', metaDescription: ''
};

const subtreeIds = (node) => [node.id, ...(node.children || []).flatMap(subtreeIds)];

const toForm = (page) => ({
  ...EMPTY_PAGE,
  ...Object.fromEntries(Object.entries(page).filter(([, v]) => v !== null)),
  parentId: page.parentId ?? '',
  attachments: (page.attachments || []).map(({ fileUrl, fileName, mimeType, size }) => ({ fileUrl, fileName, mimeType, size }))
});

const PageTree = ({ nodes, selectedId, onSelect, depth = 0 }) => (
  <ul className={depth ? 'ml-3 border-l border-stone-200 pl-2' : ''}>
    {nodes.map((node) => (
      <li key={node.id}>
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
            selectedId === node.id ? 'bg-gold/10 font-semibold text-navy-950' : 'text-slate-700 hover:bg-stone-50'
          }`}
        >
          {node.children?.length ? (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          ) : (
            <FileText className="h-3.5 w-3.5 shrink-0 text-slate-300" />
          )}
          <span className={`min-w-0 flex-1 truncate ${node.isPublished ? '' : 'text-slate-400'}`}>{node.title}</span>
          {!node.isPublished && <EyeOff className="h-3.5 w-3.5 shrink-0 text-slate-400" title="Chưa xuất bản" />}
        </button>
        {node.children?.length > 0 && (
          <PageTree nodes={node.children} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />
        )}
      </li>
    ))}
  </ul>
);

const PagesManager = () => {
  const [version, setVersion] = useState(0);
  const [treeResult, setTreeResult] = useState({ version: null, tree: [] });
  const [selected, setSelected] = useState(null); // null | 'new' | id
  const [form, setForm] = useState(EMPTY_PAGE);
  const [original, setOriginal] = useState(null);
  const [loadingPage, setLoadingPage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [confirm, confirmDialog] = useConfirm();

  const treeLoading = treeResult.version !== version;
  const reloadTree = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let alive = true;
    pageApi
      .manage()
      .then((tree) => alive && setTreeResult({ version, tree }))
      .catch((error) => {
        if (!alive) return;
        toast.error(errorMessage(error, 'Không tải được danh sách trang'));
        setTreeResult({ version, tree: [] });
      });
    return () => {
      alive = false;
    };
  }, [version]);

  const flat = useMemo(() => flattenTree(treeResult.tree), [treeResult.tree]);

  // Trang cha hợp lệ: không phải chính nó và không thuộc nhánh con của nó
  const parentOptions = useMemo(() => {
    const current = typeof selected === 'number' ? flat.find((f) => f.value === selected)?.node : null;
    const excluded = current ? subtreeIds(current) : [];
    return flat.filter((f) => !excluded.includes(f.value)).map(({ value, label }) => ({ value, label }));
  }, [flat, selected]);

  const openNew = () => {
    setSelected('new');
    setOriginal(null);
    setForm(EMPTY_PAGE);
    setErrors({});
  };

  const openPage = async (id) => {
    setSelected(id);
    setErrors({});
    setLoadingPage(true);
    try {
      const page = await pageApi.get(id);
      setOriginal(page);
      setForm(toForm(page));
    } catch (error) {
      toast.error(errorMessage(error, 'Không tải được trang'));
      setSelected(null);
    } finally {
      setLoadingPage(false);
    }
  };

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value?.target ? value.target.value : value }));

  const save = async () => {
    const next = {};
    if (!form.title.trim()) next.title = 'Nhập tiêu đề trang';
    if (!form.content || form.content === '<p><br></p>') next.content = 'Nội dung không được để trống';
    setErrors(next);
    if (Object.keys(next).length) {
      toast.error('Vui lòng kiểm tra lại thông tin');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        slug: form.slug.trim() || undefined,
        parentId: form.parentId === '' ? null : Number(form.parentId),
        order: Number(form.order) || 0,
        isPublished: form.isPublished,
        summary: form.summary,
        content: form.content,
        thumbnail: form.thumbnail,
        attachments: form.attachments,
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription
      };
      const saved = selected === 'new' ? await pageApi.create(payload) : await pageApi.update(selected, payload);
      toast.success(selected === 'new' ? 'Đã tạo trang' : 'Đã lưu trang');
      reloadTree();
      await openPage(saved.id);
    } catch (error) {
      toast.error(errorMessage(error, 'Lưu trang thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const ok = await confirm({
      title: 'Xoá trang',
      message: `Xoá trang "${original.title}" cùng tệp đính kèm? Trang có trang con sẽ không xoá được.`,
      confirmText: 'Xoá trang'
    });
    if (!ok) return;
    try {
      await pageApi.remove(original.id);
      toast.success('Đã xoá trang');
      setSelected(null);
      setOriginal(null);
      reloadTree();
    } catch (error) {
      toast.error(errorMessage(error, 'Xoá trang thất bại'));
    }
  };

  const parentSlug = original?.parentId ? flat.find((f) => f.value === original.parentId)?.node.slug : undefined;

  return (
    <div>
      <PageHeader
        title="Trang giới thiệu"
        description="Các trang nội dung cố định: giới thiệu Đoàn, quy chế, hướng dẫn hồ sơ..."
        actions={<Button variant="gold" icon={Plus} onClick={openNew}>Thêm trang</Button>}
      />

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card title="Danh sách trang" padded={false}>
          <div className="max-h-[70vh] overflow-y-auto p-2">
            {treeLoading && !treeResult.tree.length ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : treeResult.tree.length ? (
              <PageTree nodes={treeResult.tree} selectedId={selected} onSelect={openPage} />
            ) : (
              <p className="p-3 text-sm text-slate-400">Chưa có trang nào.</p>
            )}
          </div>
        </Card>

        {!selected ? (
          <Card>
            <EmptyState
              icon={FileText}
              title="Chọn một trang để chỉnh sửa"
              description="Hoặc tạo trang mới cho phần giới thiệu, quy chế, hướng dẫn thủ tục."
              action={<Button size="sm" icon={Plus} onClick={openNew}>Thêm trang</Button>}
            />
          </Card>
        ) : loadingPage ? (
          <Card><div className="flex justify-center py-16"><Spinner className="h-7 w-7" /></div></Card>
        ) : (
          <div className="space-y-5">
            <Card
              title={selected === 'new' ? 'Trang mới' : original?.title}
              actions={
                <div className="flex gap-2">
                  {original?.isPublished && (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={ExternalLink}
                      onClick={() => window.open(portalRoutes.page(original.slug, parentSlug), '_blank')}
                    >
                      Xem trên trang
                    </Button>
                  )}
                  {original && (
                    <Button size="sm" variant="secondary" icon={Trash2} onClick={remove}>Xoá</Button>
                  )}
                  <Button size="sm" variant="gold" icon={Save} loading={saving} onClick={save}>Lưu</Button>
                </div>
              }
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tiêu đề" required error={errors.title} className="sm:col-span-2">
                  <Input value={form.title} onChange={set('title')} className="!text-base font-medium" />
                </Field>
                <Field label="Đường dẫn (slug)" hint="Để trống để tạo tự động từ tiêu đề">
                  <Input value={form.slug} onChange={set('slug')} />
                </Field>
                <Field label="Trang cha">
                  <Select value={form.parentId} onChange={set('parentId')} options={parentOptions} placeholder="— Không (cấp gốc)" />
                </Field>
                <Field label="Thứ tự" hint="Số nhỏ hiển thị trước">
                  <Input type="number" value={form.order} onChange={set('order')} />
                </Field>
                <div className="flex items-end pb-1">
                  <Toggle checked={form.isPublished} onChange={set('isPublished')} label="Xuất bản" description="Tắt để ẩn khỏi trang công khai" />
                </div>
                <Field label="Tóm tắt" className="sm:col-span-2">
                  <Textarea value={form.summary} onChange={set('summary')} rows={2} />
                </Field>
                <Field label="Nội dung" required error={errors.content} className="sm:col-span-2">
                  <RichTextEditor value={form.content} onChange={set('content')} height={420} />
                </Field>
              </div>
            </Card>

            <div className="grid gap-5 xl:grid-cols-2">
              <Card title="Ảnh đại diện">
                <ImageField value={form.thumbnail} onChange={set('thumbnail')} />
              </Card>
              <Card title="Tối ưu tìm kiếm (SEO)">
                <div className="space-y-4">
                  <Field label="Tiêu đề SEO" hint="Mặc định dùng tiêu đề trang">
                    <Input value={form.metaTitle} onChange={set('metaTitle')} />
                  </Field>
                  <Field label="Mô tả SEO" hint="Mặc định dùng phần tóm tắt">
                    <Textarea value={form.metaDescription} onChange={set('metaDescription')} rows={3} />
                  </Field>
                </div>
              </Card>
            </div>

            <Card title="Tệp đính kèm" actions={<span className="text-xs text-slate-400">Quy chế, biểu mẫu, hồ sơ mẫu...</span>}>
              <AttachmentField value={form.attachments} onChange={set('attachments')} />
            </Card>
          </div>
        )}
      </div>

      {confirmDialog}
    </div>
  );
};

export default PagesManager;
