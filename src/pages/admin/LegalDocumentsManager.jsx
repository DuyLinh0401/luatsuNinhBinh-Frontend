// Quản lý văn bản pháp luật dùng chung cho admin và nhân viên.
// Nhân viên được tạo/sửa nhưng không được xoá văn bản.
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, ExternalLink, ArrowLeft, Save, ScrollText, Paperclip } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { documentApi, categoryApi, errorMessage } from '../../services/portalService';
import usePortalMeta from '../../hooks/usePortalMeta';
import useAdminList from '../../hooks/useAdminList';
import useConfirm from '../../hooks/useConfirm';
import RichTextEditor from '../../components/common/RichTextEditor';
import {
  PageHeader, Card, Button, IconButton, Field, Input, Textarea, Select, Toggle, Badge, Table, Pagination,
  SearchInput, EmptyState, Spinner
} from '../../components/admin/ui/AdminUI';
import { formatDate, toInputDate, flattenTree } from '../../components/admin/ui/format';
import { AttachmentField } from '../../components/admin/ui/FileFields';
import { portalRoutes } from '../../utils/portalRoutes';

const EFFECT_TONE = { NOT_YET_EFFECTIVE: 'blue', IN_EFFECT: 'green', PARTIALLY_EXPIRED: 'amber', EXPIRED: 'red' };

const EMPTY_DOC = {
  title: '', slug: '', documentNumber: '', documentType: '', categoryId: '', issuingBody: '', signer: '',
  issuedDate: '', effectiveDate: '', expiryDate: '', effectStatus: 'IN_EFFECT', summary: '', content: '',
  isPublished: false, attachments: []
};

const toForm = (doc) => ({
  ...EMPTY_DOC,
  ...Object.fromEntries(Object.entries(doc).filter(([, v]) => v !== null)),
  categoryId: doc.categoryId ?? '',
  issuedDate: toInputDate(doc.issuedDate),
  effectiveDate: toInputDate(doc.effectiveDate),
  expiryDate: toInputDate(doc.expiryDate),
  attachments: (doc.attachments || []).map(({ fileUrl, fileName, mimeType, size }) => ({ fileUrl, fileName, mimeType, size }))
});

// ---------------------------------------------------------------------------
// Trình soạn văn bản
// ---------------------------------------------------------------------------

const DocumentEditor = ({ docId, categoryOptions, onClose }) => {
  const { options } = usePortalMeta();
  const [form, setForm] = useState(EMPTY_DOC);
  const [original, setOriginal] = useState(null);
  const [loading, setLoading] = useState(!!docId);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!docId) return;
    let alive = true;
    documentApi
      .get(docId)
      .then((doc) => {
        if (!alive) return;
        setOriginal(doc);
        setForm(toForm(doc));
      })
      .catch((error) => {
        toast.error(errorMessage(error, 'Không tải được văn bản'));
        onClose(false);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [docId, onClose]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value?.target ? value.target.value : value }));

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = 'Nhập trích yếu văn bản';
    if (!form.documentType) next.documentType = 'Chọn loại văn bản';
    if (!form.categoryId) next.categoryId = 'Chọn chuyên mục';
    if (form.effectiveDate && form.expiryDate && form.expiryDate < form.effectiveDate) {
      next.expiryDate = 'Ngày hết hiệu lực phải sau ngày có hiệu lực';
    }
    setErrors(next);
    if (Object.keys(next).length) toast.error('Vui lòng kiểm tra lại thông tin');
    return !Object.keys(next).length;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const { title, documentNumber, documentType, categoryId, issuingBody, signer, issuedDate, effectiveDate,
        expiryDate, effectStatus, summary, content, isPublished, attachments, slug } = form;
      const payload = {
        title, documentNumber, documentType, categoryId: Number(categoryId), issuingBody, signer,
        issuedDate, effectiveDate, expiryDate, effectStatus, summary, content, isPublished, attachments,
        slug: slug || undefined
      };
      if (docId) await documentApi.update(docId, payload);
      else await documentApi.create(payload);
      toast.success(docId ? 'Đã cập nhật văn bản' : 'Đã thêm văn bản');
      onClose(true);
    } catch (error) {
      toast.error(errorMessage(error, 'Lưu văn bản thất bại'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        breadcrumb={
          <button type="button" onClick={() => onClose(false)} className="inline-flex items-center gap-1 hover:text-navy-950">
            <ArrowLeft className="h-3.5 w-3.5" /> Danh sách văn bản
          </button>
        }
        title={docId ? 'Chỉnh sửa văn bản' : 'Thêm văn bản'}
        actions={
          <>
            {original?.isPublished && (
              <Button variant="ghost" icon={ExternalLink} onClick={() => window.open(portalRoutes.document(original.slug), '_blank')}>
                Xem trên trang
              </Button>
            )}
            <Button variant="gold" icon={Save} loading={saving} onClick={save}>
              Lưu văn bản
            </Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Cột nội dung */}
        <div className="space-y-5">
          <Card>
            <div className="space-y-4">
              <Field label="Trích yếu" required error={errors.title}>
                <Textarea value={form.title} onChange={set('title')} rows={2} placeholder="Ví dụ: Về việc phê duyệt Điều lệ Liên đoàn Luật sư Việt Nam" className="!text-base font-medium" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Số hiệu">
                  <Input value={form.documentNumber} onChange={set('documentNumber')} placeholder="856/QĐ-TTg" />
                </Field>
                <Field label="Đường dẫn (slug)" hint="Để trống để tạo tự động">
                  <Input value={form.slug} onChange={set('slug')} />
                </Field>
                <Field label="Cơ quan ban hành">
                  <Input value={form.issuingBody} onChange={set('issuingBody')} placeholder="Thủ tướng Chính phủ" />
                </Field>
                <Field label="Người ký">
                  <Input value={form.signer} onChange={set('signer')} />
                </Field>
              </div>
              <Field label="Tóm tắt">
                <Textarea value={form.summary} onChange={set('summary')} rows={3} />
              </Field>
            </div>
          </Card>

          <Card title="Tệp văn bản" actions={<span className="text-xs text-slate-400">Bản PDF/Word là nội dung chính của văn bản</span>}>
            <AttachmentField value={form.attachments} onChange={set('attachments')} />
          </Card>

          <Card title="Nội dung văn bản (không bắt buộc)">
            <RichTextEditor value={form.content} onChange={set('content')} height={300} />
          </Card>
        </div>

        {/* Cột thiết lập */}
        <div className="space-y-5">
          <Card title="Công khai">
            <Toggle
              checked={form.isPublished}
              onChange={set('isPublished')}
              label="Hiển thị trên cổng thông tin"
              description="Tắt để lưu nội bộ, chưa công bố"
            />
          </Card>

          <Card title="Phân loại">
            <div className="space-y-4">
              <Field label="Loại văn bản" required error={errors.documentType}>
                <Select value={form.documentType} onChange={set('documentType')} options={options('documentType')} placeholder="Chọn loại văn bản" />
              </Field>
              <Field label="Chuyên mục" required error={errors.categoryId}>
                <Select value={form.categoryId} onChange={set('categoryId')} options={categoryOptions} placeholder="Chọn chuyên mục" />
              </Field>
            </div>
          </Card>

          <Card title="Thời gian & hiệu lực">
            <div className="space-y-4">
              <Field label="Ngày ban hành">
                <Input type="date" value={form.issuedDate} onChange={set('issuedDate')} />
              </Field>
              <Field label="Ngày có hiệu lực">
                <Input type="date" value={form.effectiveDate} onChange={set('effectiveDate')} />
              </Field>
              <Field label="Ngày hết hiệu lực" error={errors.expiryDate}>
                <Input type="date" value={form.expiryDate} onChange={set('expiryDate')} />
              </Field>
              <Field label="Tình trạng hiệu lực">
                <Select value={form.effectStatus} onChange={set('effectStatus')} options={options('effectStatus')} />
              </Field>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Danh sách
// ---------------------------------------------------------------------------

const LegalDocumentsManager = () => {
  const { isAdmin } = useAuth();
  const { label, options } = usePortalMeta();
  const [categoryTree, setCategoryTree] = useState([]);
  const [editing, setEditing] = useState(null); // null | 'new' | id
  const [confirm, confirmDialog] = useConfirm();

  const { items, pagination, loading, filters, setFilter, page, setPage, reload } = useAdminList(documentApi.manage, {
    q: '', category: '', documentType: '', effectStatus: '', isPublished: ''
  });

  useEffect(() => {
    categoryApi.tree({ type: 'DOCUMENT' }).then(setCategoryTree).catch(() => {});
  }, []);

  const flatCategories = useMemo(() => flattenTree(categoryTree), [categoryTree]);
  const filterCategoryOptions = flatCategories.map(({ node, label: text }) => ({ value: node.slug, label: text }));
  const editorCategoryOptions = flatCategories.map(({ value, label: text }) => ({ value, label: text }));

  const remove = async (doc) => {
    const ok = await confirm({
      title: 'Xoá văn bản',
      message: `Xoá vĩnh viễn "${doc.documentNumber || doc.title}" cùng toàn bộ tệp đính kèm? Thao tác này không thể hoàn tác.`,
      confirmText: 'Xoá văn bản'
    });
    if (!ok) return;
    try {
      await documentApi.remove(doc.id);
      toast.success('Đã xoá văn bản');
      reload();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  // Cố định tham chiếu: DocumentEditor dùng onClose trong deps của effect tải văn bản
  const closeEditor = useCallback((changed) => {
    setEditing(null);
    if (changed) reload();
  }, [reload]);

  if (editing) {
    return (
      <DocumentEditor
        key={editing}
        docId={editing === 'new' ? null : editing}
        categoryOptions={editorCategoryOptions}
        onClose={closeEditor}
      />
    );
  }

  const columns = [
    {
      key: 'title',
      header: 'Văn bản',
      render: (doc) => (
        <div className="min-w-[280px]">
          {doc.documentNumber && <div className="text-xs font-semibold text-gold-dark">{doc.documentNumber}</div>}
          <button type="button" onClick={() => setEditing(doc.id)} className="line-clamp-2 text-left font-medium text-navy-950 hover:text-gold-dark">
            {doc.title}
          </button>
          <p className="mt-0.5 flex items-center gap-2 truncate text-xs text-slate-400">
            {doc.category?.name}
            {doc.attachments?.length > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <Paperclip className="h-3 w-3" /> {doc.attachments.length}
              </span>
            )}
          </p>
        </div>
      )
    },
    {
      key: 'documentType',
      header: 'Loại',
      className: 'whitespace-nowrap',
      render: (doc) => label('documentType', doc.documentType)
    },
    {
      key: 'issuingBody',
      header: 'Cơ quan ban hành',
      className: 'text-slate-500',
      render: (doc) => doc.issuingBody || '—'
    },
    {
      key: 'issuedDate',
      header: 'Ngày ban hành',
      className: 'whitespace-nowrap text-slate-500',
      render: (doc) => formatDate(doc.issuedDate)
    },
    {
      key: 'effectStatus',
      header: 'Hiệu lực',
      render: (doc) => <Badge tone={EFFECT_TONE[doc.effectStatus]} dot>{label('effectStatus', doc.effectStatus)}</Badge>
    },
    {
      key: 'isPublished',
      header: 'Công khai',
      render: (doc) => (doc.isPublished ? <Badge tone="green">Công khai</Badge> : <Badge>Nội bộ</Badge>)
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (doc) => (
        <div className="flex justify-end gap-0.5">
          {doc.isPublished && (
            <IconButton icon={ExternalLink} label="Xem trên trang" onClick={() => window.open(portalRoutes.document(doc.slug), '_blank')} />
          )}
          <IconButton icon={Pencil} label="Sửa" onClick={() => setEditing(doc.id)} />
          {isAdmin && <IconButton icon={Trash2} label="Xoá" tone="danger" onClick={() => remove(doc)} />}
        </div>
      )
    }
  ];

  const hasFilter = filters.q || filters.category || filters.documentType || filters.effectStatus || filters.isPublished;

  return (
    <div>
      <PageHeader
        title="Văn bản"
        description="Văn bản của Đoàn, Liên đoàn Luật sư và văn bản Đảng – Nhà nước."
        actions={<Button variant="gold" icon={Plus} onClick={() => setEditing('new')}>Thêm văn bản</Button>}
      />

      <Card padded={false}>
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5">
          <SearchInput value={filters.q} onChange={(v) => setFilter('q', v)} placeholder="Số hiệu, trích yếu..." className="xl:col-span-2" />
          <Select value={filters.category} onChange={(e) => setFilter('category', e.target.value)} options={filterCategoryOptions} placeholder="Tất cả chuyên mục" />
          <Select value={filters.documentType} onChange={(e) => setFilter('documentType', e.target.value)} options={options('documentType')} placeholder="Tất cả loại" />
          <div className="grid grid-cols-2 gap-3">
            <Select value={filters.effectStatus} onChange={(e) => setFilter('effectStatus', e.target.value)} options={options('effectStatus')} placeholder="Hiệu lực" />
            <Select
              value={filters.isPublished}
              onChange={(e) => setFilter('isPublished', e.target.value)}
              options={[{ value: 'true', label: 'Công khai' }, { value: 'false', label: 'Nội bộ' }]}
              placeholder="Hiển thị"
            />
          </div>
        </div>
        <Table
          columns={columns}
          rows={items}
          loading={loading}
          empty={
            <EmptyState
              icon={ScrollText}
              title={hasFilter ? 'Không tìm thấy văn bản phù hợp' : 'Chưa có văn bản'}
              description={hasFilter ? undefined : 'Thêm văn bản và tải lên bản PDF để công bố trên cổng thông tin.'}
            />
          }
        />
        <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} onChange={setPage} />
      </Card>

      {confirmDialog}
    </div>
  );
};

export default LegalDocumentsManager;
