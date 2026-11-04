// Quản lý bài viết dùng chung cho admin (/admin/posts) và nhân viên (/staff/posts).
// Người có quyền duyệt (admin) xuất bản trực tiếp; nhân viên chỉ lưu nháp / gửi duyệt.
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Plus, Pencil, Trash2, CheckCircle2, Undo2, ExternalLink, ArrowLeft, Send, Save, Pin, Star, FileText, Eye, Archive, Sparkles
} from 'lucide-react';
import AiDraftModal from '../../components/admin/AiDraftModal';
import { useAuth } from '../../contexts/AuthContext';
import { postApi, categoryApi, assetUrl, errorMessage } from '../../services/portalService';
import usePortalMeta from '../../hooks/usePortalMeta';
import useAdminList from '../../hooks/useAdminList';
import RichTextEditor from '../../components/common/RichTextEditor';
import {
  PageHeader, Card, Button, IconButton, Field, Input, Textarea, Select, Toggle, Badge, Tabs, Table, Pagination,
  SearchInput, EmptyState, Spinner
} from '../../components/admin/ui/AdminUI';
import { formatDate, toInputDate, flattenTree } from '../../components/admin/ui/format';
import useConfirm from '../../hooks/useConfirm';
import { AttachmentField, ImageField, VideoField } from '../../components/admin/ui/FileFields';
import { CategoryPicker, TagInput } from '../../components/admin/ui/PickerFields';
import { portalRoutes } from '../../utils/portalRoutes';

const STATUS_TONE = { DRAFT: 'gray', PENDING: 'amber', PUBLISHED: 'green', ARCHIVED: 'blue' };

const EMPTY_POST = {
  title: '', slug: '', summary: '', content: '', thumbnail: '', format: 'STANDARD', videoUrl: '',
  status: 'DRAFT', isPinned: false, isFeatured: false, authorDisplay: 'Đoàn Luật sư tỉnh Ninh Bình',
  source: '', metaTitle: '', metaDescription: '', publishedAt: '',
  categoryIds: [], primaryCategoryId: null, tags: [], attachments: []
};

const toForm = (post) => ({
  ...EMPTY_POST,
  ...Object.fromEntries(Object.entries(post).filter(([, v]) => v !== null)),
  publishedAt: toInputDate(post.publishedAt, true),
  categoryIds: post.categories.map((c) => c.id),
  primaryCategoryId: post.primaryCategory?.id ?? null,
  tags: (post.tags || []).map((t) => t.name),
  attachments: (post.attachments || []).map(({ fileUrl, fileName, mimeType, size }) => ({ fileUrl, fileName, mimeType, size }))
});

// ---------------------------------------------------------------------------
// Trình soạn bài
// ---------------------------------------------------------------------------

const PostEditor = ({ postId, categoryTree, canPublish, onClose, aiDraft }) => {
  const { options } = usePortalMeta();
  // aiDraft: bản nháp do AI soạn từ một đường dẫn (chỉ khi viết bài mới)
  const [form, setForm] = useState(() => (aiDraft ? { ...EMPTY_POST, ...aiDraft.draft } : EMPTY_POST));
  const [original, setOriginal] = useState(null);
  const [loading, setLoading] = useState(!!postId);
  const [saving, setSaving] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!postId) return;
    let alive = true;
    postApi
      .get(postId)
      .then((post) => {
        if (!alive) return;
        setOriginal(post);
        setForm(toForm(post));
      })
      .catch((error) => {
        toast.error(errorMessage(error, 'Không tải được bài viết'));
        onClose(false);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [postId, onClose]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value?.target ? value.target.value : value }));
  const locked = !canPublish && original?.status === 'PUBLISHED';

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = 'Nhập tiêu đề bài viết';
    if (!form.content || form.content === '<p><br></p>') next.content = 'Nội dung không được để trống';
    if (!form.categoryIds.length) next.categoryIds = 'Chọn ít nhất một chuyên mục';
    if (form.format === 'VIDEO' && !form.videoUrl) next.videoUrl = 'Nhập đường dẫn video';
    setErrors(next);
    if (Object.keys(next).length) toast.error('Vui lòng kiểm tra lại thông tin');
    return !Object.keys(next).length;
  };

  const save = async (status) => {
    if (!validate()) return;
    setSaving(status);
    try {
      const payload = { ...form, status, publishedAt: form.publishedAt || undefined, slug: form.slug || undefined };
      const saved = postId ? await postApi.update(postId, payload) : await postApi.create(payload);
      const messages = {
        DRAFT: 'Đã lưu bản nháp',
        PENDING: 'Đã gửi bài chờ duyệt',
        PUBLISHED: 'Đã xuất bản bài viết',
        ARCHIVED: 'Đã chuyển vào lưu trữ'
      };
      toast.success(messages[saved.status] || 'Đã lưu');
      onClose(true);
    } catch (error) {
      toast.error(errorMessage(error, 'Lưu bài viết thất bại'));
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  const isPublished = original?.status === 'PUBLISHED';

  return (
    <div>
      <PageHeader
        breadcrumb={
          <button type="button" onClick={() => onClose(false)} className="inline-flex items-center gap-1 hover:text-navy-950">
            <ArrowLeft className="h-3.5 w-3.5" /> Danh sách bài viết
          </button>
        }
        title={postId ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}
        actions={
          <>
            {isPublished && (
              <Button variant="ghost" icon={ExternalLink} onClick={() => window.open(portalRoutes.post(original.slug), '_blank')}>
                Xem trên trang
              </Button>
            )}
            {!locked && !isPublished && (
              <Button variant="secondary" icon={Save} loading={saving === 'DRAFT'} onClick={() => save('DRAFT')}>
                Lưu nháp
              </Button>
            )}
            {!locked &&
              (canPublish ? (
                <Button variant="gold" icon={CheckCircle2} loading={saving === 'PUBLISHED'} onClick={() => save('PUBLISHED')}>
                  {isPublished ? 'Cập nhật' : 'Xuất bản'}
                </Button>
              ) : (
                <Button icon={Send} loading={saving === 'PENDING'} onClick={() => save('PENDING')}>
                  Gửi duyệt
                </Button>
              ))}
          </>
        }
      />

      {locked && (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Bài viết đã được xuất bản. Bạn không thể chỉnh sửa, vui lòng liên hệ quản trị viên nếu cần thay đổi.
        </div>
      )}

      {aiDraft && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-brand/20 bg-brand-light px-4 py-3 text-sm text-slate-700">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <div>
            Bản nháp do AI tóm tắt từ{' '}
            <a href={aiDraft.source.url} target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:underline">
              {aiDraft.source.siteName}
            </a>
            {aiDraft.stats.verified < aiDraft.stats.total && (
              <> — <b className="text-amber-700">{aiDraft.stats.total - aiDraft.stats.verified} câu cần kiểm tra lại</b></>
            )}
            . Hãy đối chiếu với bài gốc, chọn chuyên mục rồi lưu nháp hoặc gửi duyệt.
          </div>
        </div>
      )}

      <fieldset disabled={locked} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Cột nội dung */}
        <div className="space-y-5">
          <Card>
            <div className="space-y-4">
              <Field label="Tiêu đề" required error={errors.title}>
                <Input value={form.title} onChange={set('title')} placeholder="Ví dụ: Thông báo V/v tổ chức bồi dưỡng nghiệp vụ năm 2026" className="!text-base font-medium" />
              </Field>
              <Field label="Đường dẫn (slug)" hint="Để trống để tạo tự động từ tiêu đề">
                <Input value={form.slug} onChange={set('slug')} placeholder="tu-dong-tao-tu-tieu-de" />
              </Field>
              <Field label="Tóm tắt" hint="Hiển thị ở danh sách bài và khi chia sẻ">
                <Textarea value={form.summary} onChange={set('summary')} rows={3} />
              </Field>
              <Field label="Nội dung" required error={errors.content}>
                <RichTextEditor value={form.content} onChange={set('content')} height={380} />
              </Field>
            </div>
          </Card>

          <Card title="Tệp đính kèm" actions={<span className="text-xs text-slate-400">Văn bản scan, công văn, biểu mẫu...</span>}>
            <AttachmentField value={form.attachments} onChange={set('attachments')} />
          </Card>

          <Card title="Tối ưu tìm kiếm (SEO)">
            <div className="space-y-4">
              <Field label="Tiêu đề SEO" hint="Mặc định dùng tiêu đề bài viết">
                <Input value={form.metaTitle} onChange={set('metaTitle')} />
              </Field>
              <Field label="Mô tả SEO" hint="Mặc định dùng phần tóm tắt">
                <Textarea value={form.metaDescription} onChange={set('metaDescription')} rows={2} />
              </Field>
            </div>
          </Card>
        </div>

        {/* Cột thiết lập */}
        <div className="space-y-5">
          <Card title="Xuất bản">
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Trạng thái</span>
                <Badge tone={STATUS_TONE[original?.status || 'DRAFT']} dot>
                  {options('postStatus').find((o) => o.value === (original?.status || 'DRAFT'))?.label || 'Bản nháp'}
                </Badge>
              </div>
              {original?.reviewedBy && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Người duyệt</span>
                  <span className="font-medium text-navy-950">{original.reviewedBy.fullName}</span>
                </div>
              )}
              {canPublish && (
                <>
                  <Field label="Ngày đăng" hint="Để trống = thời điểm xuất bản">
                    <Input type="datetime-local" value={form.publishedAt} onChange={set('publishedAt')} />
                  </Field>
                  <div className="space-y-3 border-t border-stone-100 pt-4">
                    <Toggle checked={form.isFeatured} onChange={set('isFeatured')} label="Tin nổi bật" description="Hiện ở khối tin nổi bật trang chủ" />
                    <Toggle checked={form.isPinned} onChange={set('isPinned')} label="Ghim đầu chuyên mục" />
                  </div>
                  {isPublished && (
                    <Button variant="secondary" size="sm" icon={Archive} className="w-full" loading={saving === 'ARCHIVED'} onClick={() => save('ARCHIVED')}>
                      Gỡ xuống & lưu trữ
                    </Button>
                  )}
                </>
              )}
            </div>
          </Card>

          <Card title="Chuyên mục">
            <Field error={errors.categoryIds} hint="Đánh dấu ★ cho chuyên mục chính (dùng làm đường dẫn breadcrumb)">
              <CategoryPicker
                tree={categoryTree}
                value={form.categoryIds}
                primaryId={form.primaryCategoryId}
                onChange={(ids, primary) => setForm((f) => ({ ...f, categoryIds: ids, primaryCategoryId: primary }))}
              />
            </Field>
          </Card>

          <Card title="Ảnh đại diện">
            <ImageField value={form.thumbnail} onChange={set('thumbnail')} />
          </Card>

          <Card title="Thông tin khác">
            <div className="space-y-4">
              <Field label="Định dạng">
                <Select value={form.format} onChange={set('format')} options={options('postFormat')} />
              </Field>
              {form.format === 'VIDEO' && (
                <Field label="Video" required error={errors.videoUrl}>
                  <VideoField value={form.videoUrl} onChange={set('videoUrl')} />
                </Field>
              )}
              <Field label="Tag">
                <TagInput value={form.tags} onChange={set('tags')} />
              </Field>
              <Field label="Tên hiển thị người đăng">
                <Input value={form.authorDisplay} onChange={set('authorDisplay')} />
              </Field>
              <Field label="Nguồn">
                <Input value={form.source} onChange={set('source')} placeholder="Ví dụ: Liên đoàn Luật sư Việt Nam" />
              </Field>
            </div>
          </Card>
        </div>
      </fieldset>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Danh sách
// ---------------------------------------------------------------------------

const PostsManager = () => {
  const { isAdmin } = useAuth();
  const canPublish = !!isAdmin;
  const { label } = usePortalMeta();
  const [categoryTree, setCategoryTree] = useState([]);
  const [editing, setEditing] = useState(null); // null | 'new' | id
  const [aiOpen, setAiOpen] = useState(false);
  const [aiDraft, setAiDraft] = useState(null); // bản nháp AI đưa vào trình soạn bài mới
  const [confirm, confirmDialog] = useConfirm();

  const list = useAdminList(postApi.manage, { status: '', q: '', category: '' });
  const { items, pagination, statusCounts = {}, loading, filters, setFilter, page, setPage, reload } = list;

  useEffect(() => {
    categoryApi.tree({ type: 'POST' }).then(setCategoryTree).catch(() => {});
  }, []);

  const categoryOptions = useMemo(
    () => flattenTree(categoryTree).map(({ node, label: text }) => ({ value: node.slug, label: text })),
    [categoryTree]
  );

  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const tabs = [
    { value: '', label: 'Tất cả', count: total },
    { value: 'PENDING', label: 'Chờ duyệt', count: statusCounts.PENDING || 0 },
    { value: 'PUBLISHED', label: 'Đã xuất bản', count: statusCounts.PUBLISHED || 0 },
    { value: 'DRAFT', label: 'Bản nháp', count: statusCounts.DRAFT || 0 },
    { value: 'ARCHIVED', label: 'Lưu trữ', count: statusCounts.ARCHIVED || 0 }
  ];

  const changeStatus = async (post, status, message) => {
    try {
      await postApi.setStatus(post.id, status);
      toast.success(message);
      reload();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const remove = async (post) => {
    const ok = await confirm({
      title: 'Xoá bài viết',
      message: `Xoá vĩnh viễn "${post.title}" cùng toàn bộ tệp đính kèm? Thao tác này không thể hoàn tác.`,
      confirmText: 'Xoá bài viết'
    });
    if (!ok) return;
    try {
      await postApi.remove(post.id);
      toast.success('Đã xoá bài viết');
      reload();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  // Cố định tham chiếu: PostEditor dùng onClose trong deps của effect tải bài
  const closeEditor = useCallback((changed) => {
    setEditing(null);
    setAiDraft(null);
    if (changed) reload();
  }, [reload]);

  const applyAiDraft = (result) => {
    setAiOpen(false);
    setAiDraft(result);
    setEditing('new');
  };

  if (editing) {
    return (
      <PostEditor
        key={editing}
        postId={editing === 'new' ? null : editing}
        categoryTree={categoryTree}
        canPublish={canPublish}
        onClose={closeEditor}
        aiDraft={editing === 'new' ? aiDraft : null}
      />
    );
  }

  const columns = [
    {
      key: 'title',
      header: 'Bài viết',
      render: (post) => (
        <div className="flex min-w-[280px] items-center gap-3">
          <div className="h-11 w-16 shrink-0 overflow-hidden rounded-md bg-stone-100">
            {post.thumbnail ? (
              <img src={assetUrl(post.thumbnail)} alt="" className="h-full w-full object-cover" />
            ) : (
              <FileText className="m-auto mt-3 h-5 w-5 text-slate-300" />
            )}
          </div>
          <div className="min-w-0">
            <button type="button" onClick={() => setEditing(post.id)} className="line-clamp-2 text-left font-medium text-navy-950 hover:text-gold-dark">
              {post.isPinned && <Pin className="mr-1 inline h-3.5 w-3.5 text-gold-dark" />}
              {post.isFeatured && <Star className="mr-1 inline h-3.5 w-3.5 fill-gold text-gold" />}
              {post.title}
            </button>
            <p className="mt-0.5 truncate text-xs text-slate-400">
              {post.categories.map((c) => c.name).join(' · ')}
            </p>
          </div>
        </div>
      )
    },
    {
      key: 'author',
      header: 'Người viết',
      className: 'whitespace-nowrap text-slate-500',
      render: (post) => post.author?.fullName || '—'
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (post) => <Badge tone={STATUS_TONE[post.status]} dot>{label('postStatus', post.status)}</Badge>
    },
    {
      key: 'views',
      header: 'Lượt xem',
      className: 'tabular-nums text-slate-500',
      render: (post) => (
        <span className="inline-flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" /> {post.views}
        </span>
      )
    },
    {
      key: 'date',
      header: 'Ngày',
      className: 'whitespace-nowrap text-slate-500',
      render: (post) => (
        <div>
          <div>{formatDate(post.publishedAt || post.updatedAt)}</div>
          <div className="text-[11px] text-slate-400">{post.publishedAt ? 'Ngày đăng' : 'Cập nhật'}</div>
        </div>
      )
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (post) => {
        const ownEditable = canPublish || post.status !== 'PUBLISHED';
        return (
          <div className="flex justify-end gap-0.5">
            {canPublish && post.status === 'PENDING' && (
              <>
                <IconButton icon={CheckCircle2} label="Duyệt & xuất bản" tone="success" onClick={() => changeStatus(post, 'PUBLISHED', 'Đã duyệt và xuất bản')} />
                <IconButton icon={Undo2} label="Trả về bản nháp" tone="gold" onClick={() => changeStatus(post, 'DRAFT', 'Đã trả bài về bản nháp')} />
              </>
            )}
            {post.status === 'PUBLISHED' && (
              <IconButton icon={ExternalLink} label="Xem trên trang" onClick={() => window.open(portalRoutes.post(post.slug), '_blank')} />
            )}
            <IconButton icon={Pencil} label={ownEditable ? 'Sửa' : 'Xem'} onClick={() => setEditing(post.id)} />
            {(canPublish || post.status !== 'PUBLISHED') && (
              <IconButton icon={Trash2} label="Xoá" tone="danger" onClick={() => remove(post)} />
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div>
      <PageHeader
        title="Bài viết"
        description={
          canPublish
            ? 'Quản lý tin tức, thông báo và duyệt bài do nhân viên gửi lên.'
            : 'Bài viết của bạn. Bài gửi duyệt sẽ được quản trị viên xem xét trước khi xuất bản.'
        }
        actions={
          <>
            <Button variant="secondary" icon={Sparkles} onClick={() => setAiOpen(true)}>Tạo từ liên kết (AI)</Button>
            <Button variant="gold" icon={Plus} onClick={() => setEditing('new')}>Viết bài mới</Button>
          </>
        }
      />

      <AiDraftModal open={aiOpen} onClose={() => setAiOpen(false)} onUse={applyAiDraft} />

      {canPublish && statusCounts.PENDING > 0 && filters.status !== 'PENDING' && (
        <button
          type="button"
          onClick={() => setFilter('status', 'PENDING')}
          className="mb-4 flex w-full items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-left text-sm text-amber-800 hover:bg-amber-100"
        >
          <Send className="h-4 w-4" />
          Có <b>{statusCounts.PENDING}</b> bài đang chờ duyệt. Bấm để xem.
        </button>
      )}

      <Card padded={false}>
        <div className="px-4 pt-2">
          <Tabs tabs={tabs} value={filters.status} onChange={(v) => setFilter('status', v)} />
        </div>
        <div className="flex flex-col gap-3 p-4 sm:flex-row">
          <SearchInput value={filters.q} onChange={(v) => setFilter('q', v)} placeholder="Tìm theo tiêu đề, tóm tắt..." className="sm:w-80" />
          <Select
            value={filters.category}
            onChange={(e) => setFilter('category', e.target.value)}
            options={categoryOptions}
            placeholder="Tất cả chuyên mục"
            className="sm:w-72"
          />
        </div>
        <Table
          columns={columns}
          rows={items}
          loading={loading}
          empty={
            <EmptyState
              icon={FileText}
              title={filters.q || filters.category ? 'Không tìm thấy bài viết phù hợp' : 'Chưa có bài viết'}
              description={filters.status === 'PENDING' ? 'Không có bài nào đang chờ duyệt.' : undefined}
            />
          }
        />
        <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} onChange={setPage} />
      </Card>

      {confirmDialog}
    </div>
  );
};

export default PostsManager;
