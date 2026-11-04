// Luật sư thành viên (dữ liệu cho trang tra cứu công khai). Thay cho AdminLawyers.jsx cũ.
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Users, ExternalLink, Tags, ArrowLeft, Save, Check, X } from 'lucide-react';
import {
  lawyerApi, organizationApi, practiceAreaApi, assetUrl, errorMessage
} from '../../services/portalService';
import usePortalMeta from '../../hooks/usePortalMeta';
import useAdminList from '../../hooks/useAdminList';
import useConfirm from '../../hooks/useConfirm';
import RichTextEditor from '../../components/common/RichTextEditor';
import {
  PageHeader, Card, Button, IconButton, Field, Input, Textarea, Select, Toggle, Checkbox, Badge, Table, Pagination,
  SearchInput, EmptyState, Spinner, Modal
} from '../../components/admin/ui/AdminUI';
import { toInputDate } from '../../components/admin/ui/format';
import { ImageField } from '../../components/admin/ui/FileFields';
import { TagInput } from '../../components/admin/ui/PickerFields';
import { portalRoutes } from '../../utils/portalRoutes';

const STATUS_TONE = { PRACTICING: 'green', SUSPENDED: 'amber', TRANSFERRED: 'blue', REMOVED: 'gray' };

const slugify = (text = '') =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const EMPTY_LAWYER = {
  name: '', slug: '', gender: '', birthYear: '', avatar: '', email: '', phone: '',
  cardNumber: '', cardIssuedDate: '', certificateNumber: '', certificateDate: '', joinedDate: '',
  memberStatus: 'PRACTICING', organizationId: '', practiceAreaIds: [],
  position: '', experience: '', biography: '', education: '', awards: '', languages: [],
  isActive: true, isFeatured: false, order: 0
};

const DATE_FIELDS = ['cardIssuedDate', 'certificateDate', 'joinedDate'];

const toForm = (lawyer) => ({
  ...Object.fromEntries(Object.keys(EMPTY_LAWYER).map((k) => [k, lawyer[k] ?? EMPTY_LAWYER[k]])),
  ...Object.fromEntries(DATE_FIELDS.map((k) => [k, toInputDate(lawyer[k])])),
  organizationId: lawyer.organizationId ?? '',
  practiceAreaIds: (lawyer.practiceAreas || []).map((a) => a.id),
  languages: lawyer.languages || []
});

// ---------------------------------------------------------------------------
// Quản lý lĩnh vực hành nghề
// ---------------------------------------------------------------------------

const PracticeAreasModal = ({ open, onClose, areas, onChanged }) => {
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [confirm, confirmDialog] = useConfirm();

  const run = async (action, message) => {
    try {
      await action();
      toast.success(message);
      onChanged();
      return true;
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
    }
  };

  const add = async () => {
    if (!draft.trim()) return;
    if (await run(() => practiceAreaApi.create({ name: draft.trim(), order: areas.length }), 'Đã thêm lĩnh vực')) setDraft('');
  };

  const rename = async (area) => {
    if (!editName.trim()) return;
    if (await run(() => practiceAreaApi.update(area.id, { name: editName.trim() }), 'Đã đổi tên lĩnh vực')) setEditingId(null);
  };

  const remove = async (area) => {
    const ok = await confirm({
      title: 'Xoá lĩnh vực',
      message: `Xoá "${area.name}"? ${area._count?.lawyers || 0} luật sư đang gắn lĩnh vực này sẽ bị gỡ liên kết.`,
      confirmText: 'Xoá lĩnh vực'
    });
    if (ok) run(() => practiceAreaApi.remove(area.id), 'Đã xoá lĩnh vực');
  };

  return (
    <Modal open={open} onClose={onClose} title="Lĩnh vực hành nghề" description="Dùng để lọc trong trang tra cứu luật sư.">
      <div className="mb-4 flex gap-2">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Tên lĩnh vực mới" />
        <Button icon={Plus} onClick={add}>Thêm</Button>
      </div>
      <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
        {areas.map((area) => (
          <li key={area.id} className="flex items-center gap-2 px-3 py-2">
            {editingId === area.id ? (
              <>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && rename(area)} autoFocus />
                <IconButton icon={Check} label="Lưu" tone="success" onClick={() => rename(area)} />
                <IconButton icon={X} label="Huỷ" onClick={() => setEditingId(null)} />
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-navy-950">{area.name}</span>
                <span className="text-xs text-slate-400">{area._count?.lawyers || 0} luật sư</span>
                <IconButton icon={Pencil} label="Đổi tên" onClick={() => { setEditingId(area.id); setEditName(area.name); }} />
                <IconButton icon={Trash2} label="Xoá" tone="danger" onClick={() => remove(area)} />
              </>
            )}
          </li>
        ))}
        {!areas.length && <li className="px-3 py-4 text-center text-sm text-slate-400">Chưa có lĩnh vực</li>}
      </ul>
      {confirmDialog}
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Hồ sơ luật sư
// ---------------------------------------------------------------------------

const LawyerEditor = ({ lawyerId, organizations, areas, onClose }) => {
  const { options } = usePortalMeta();
  const [form, setForm] = useState(EMPTY_LAWYER);
  const [slugTouched, setSlugTouched] = useState(!!lawyerId);
  const [loading, setLoading] = useState(!!lawyerId);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!lawyerId) return;
    let alive = true;
    lawyerApi
      .get(lawyerId)
      .then((lawyer) => alive && setForm(toForm(lawyer)))
      .catch((error) => {
        toast.error(errorMessage(error, 'Không tải được hồ sơ luật sư'));
        onClose(false);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [lawyerId, onClose]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value?.target ? value.target.value : value }));

  const setName = (e) => {
    const name = e.target.value;
    setForm((f) => ({ ...f, name, ...(!slugTouched && { slug: slugify(name) }) }));
  };

  const toggleArea = (id) =>
    setForm((f) => ({
      ...f,
      practiceAreaIds: f.practiceAreaIds.includes(id) ? f.practiceAreaIds.filter((x) => x !== id) : [...f.practiceAreaIds, id]
    }));

  const save = async () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Nhập họ tên';
    if (!form.slug.trim()) next.slug = 'Nhập đường dẫn';
    setErrors(next);
    if (Object.keys(next).length) {
      toast.error('Vui lòng kiểm tra lại thông tin');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        slug: slugify(form.slug),
        gender: form.gender || null,
        organizationId: form.organizationId || null,
        birthYear: form.birthYear || null,
        experience: form.experience || null
      };
      if (lawyerId) await lawyerApi.update(lawyerId, payload);
      else await lawyerApi.create(payload);
      toast.success(lawyerId ? 'Đã cập nhật hồ sơ luật sư' : 'Đã thêm luật sư');
      onClose(true);
    } catch (error) {
      toast.error(errorMessage(error, 'Lưu hồ sơ thất bại'));
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
            <ArrowLeft className="h-3.5 w-3.5" /> Danh sách luật sư
          </button>
        }
        title={lawyerId ? form.name || 'Hồ sơ luật sư' : 'Thêm luật sư thành viên'}
        actions={
          <>
            {lawyerId && (
              <Button variant="ghost" icon={ExternalLink} onClick={() => window.open(portalRoutes.lawyer(form.slug), '_blank')}>
                Xem trên trang
              </Button>
            )}
            <Button variant="gold" icon={Save} loading={saving} onClick={save}>Lưu hồ sơ</Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <Card title="Thông tin cá nhân">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Họ và tên" required error={errors.name}>
                <Input value={form.name} onChange={setName} />
              </Field>
              <Field label="Đường dẫn (slug)" required error={errors.slug}>
                <Input value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug')(e); }} />
              </Field>
              <Field label="Giới tính">
                <Select value={form.gender} onChange={set('gender')} options={options('gender')} placeholder="— Chọn —" />
              </Field>
              <Field label="Năm sinh">
                <Input type="number" value={form.birthYear} onChange={set('birthYear')} />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.email} onChange={set('email')} />
              </Field>
              <Field label="Điện thoại">
                <Input value={form.phone} onChange={set('phone')} />
              </Field>
            </div>
          </Card>

          <Card title="Hành nghề">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Số thẻ luật sư">
                <Input value={form.cardNumber} onChange={set('cardNumber')} />
              </Field>
              <Field label="Ngày cấp thẻ">
                <Input type="date" value={form.cardIssuedDate} onChange={set('cardIssuedDate')} />
              </Field>
              <Field label="Số chứng chỉ hành nghề">
                <Input value={form.certificateNumber} onChange={set('certificateNumber')} />
              </Field>
              <Field label="Ngày cấp chứng chỉ">
                <Input type="date" value={form.certificateDate} onChange={set('certificateDate')} />
              </Field>
              <Field label="Ngày gia nhập Đoàn">
                <Input type="date" value={form.joinedDate} onChange={set('joinedDate')} />
              </Field>
              <Field label="Trạng thái hành nghề">
                <Select value={form.memberStatus} onChange={set('memberStatus')} options={options('lawyerStatus')} />
              </Field>
              <Field label="Tổ chức hành nghề" className="sm:col-span-2">
                <Select
                  value={form.organizationId}
                  onChange={set('organizationId')}
                  options={organizations.map((o) => ({ value: o.id, label: o.name }))}
                  placeholder="— Chưa thuộc tổ chức —"
                />
              </Field>
              <Field label="Lĩnh vực hành nghề" className="sm:col-span-2">
                <div className="grid gap-2 rounded-lg border border-stone-200 p-3 sm:grid-cols-2">
                  {areas.map((area) => (
                    <Checkbox
                      key={area.id}
                      label={area.name}
                      checked={form.practiceAreaIds.includes(area.id)}
                      onChange={() => toggleArea(area.id)}
                    />
                  ))}
                  {!areas.length && <span className="text-sm text-slate-400">Chưa có lĩnh vực</span>}
                </div>
              </Field>
            </div>
          </Card>

          <Card title="Hồ sơ giới thiệu">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Chức danh">
                  <Input value={form.position} onChange={set('position')} placeholder="Ví dụ: Trưởng Văn phòng" />
                </Field>
                <Field label="Số năm kinh nghiệm">
                  <Input type="number" value={form.experience} onChange={set('experience')} />
                </Field>
              </div>
              <Field label="Tiểu sử">
                <RichTextEditor value={form.biography} onChange={set('biography')} height={220} />
              </Field>
              <Field label="Học vấn">
                <Textarea value={form.education} onChange={set('education')} rows={3} />
              </Field>
              <Field label="Khen thưởng">
                <Textarea value={form.awards} onChange={set('awards')} rows={3} />
              </Field>
              <Field label="Ngoại ngữ">
                <TagInput value={form.languages} onChange={set('languages')} placeholder="Nhập ngoại ngữ rồi nhấn Enter" />
              </Field>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Ảnh chân dung">
            <ImageField value={form.avatar} onChange={set('avatar')} aspect="aspect-[3/4]" />
          </Card>
          <Card title="Hiển thị">
            <div className="space-y-4">
              <Toggle checked={form.isActive} onChange={set('isActive')} label="Hiển thị công khai" description="Tắt để ẩn khỏi trang tra cứu" />
              <Toggle checked={form.isFeatured} onChange={set('isFeatured')} label="Luật sư tiêu biểu" />
              <Field label="Thứ tự">
                <Input type="number" value={form.order} onChange={set('order')} />
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

const LawyersManager = () => {
  const { label, options } = usePortalMeta();
  const [editing, setEditing] = useState(null); // null | 'new' | id
  const [organizations, setOrganizations] = useState([]);
  const [areas, setAreas] = useState([]);
  const [showAreas, setShowAreas] = useState(false);
  const [confirm, confirmDialog] = useConfirm();
  const { items, pagination, loading, filters, setFilter, page, setPage, reload } = useAdminList(
    lawyerApi.manage,
    { q: '', organization: '', practiceArea: '', memberStatus: '', isActive: '' }
  );

  const loadAreas = useCallback(() => {
    practiceAreaApi.list().then(setAreas).catch(() => {});
  }, []);

  useEffect(() => {
    organizationApi.list({ limit: 100 }).then((data) => setOrganizations(data.items || [])).catch(() => {});
    loadAreas();
  }, [loadAreas]);

  const closeEditor = useCallback((changed) => {
    setEditing(null);
    if (changed) reload();
  }, [reload]);

  const remove = async (lawyer) => {
    const ok = await confirm({
      title: 'Xoá luật sư',
      message: `Xoá hồ sơ "${lawyer.name}"? Nếu chỉ tạm ẩn, hãy tắt "Hiển thị công khai" thay vì xoá.`,
      confirmText: 'Xoá hồ sơ'
    });
    if (!ok) return;
    try {
      await lawyerApi.remove(lawyer.id);
      toast.success('Đã xoá hồ sơ luật sư');
      reload();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  if (editing) {
    return (
      <LawyerEditor
        key={editing}
        lawyerId={editing === 'new' ? null : editing}
        organizations={organizations}
        areas={areas}
        onClose={closeEditor}
      />
    );
  }

  const columns = [
    {
      key: 'name',
      header: 'Luật sư',
      render: (l) => (
        <div className="flex min-w-[200px] items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-100 text-sm font-semibold text-slate-500">
            {l.avatar ? <img src={assetUrl(l.avatar)} alt="" className="h-full w-full object-cover" /> : l.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <button type="button" onClick={() => setEditing(l.id)} className="text-left font-medium text-navy-950 hover:text-gold-dark">
              {l.name}
            </button>
            <div className="flex items-center gap-1.5">
              {l.birthYear && <span className="text-xs text-slate-400">Sinh năm {l.birthYear}</span>}
              {!l.isActive && <Badge>Đang ẩn</Badge>}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'numbers',
      header: 'Số thẻ / Số CCHN',
      className: 'whitespace-nowrap text-slate-600',
      render: (l) => (
        <div className="text-xs">
          <div>{l.cardNumber || '—'}</div>
          <div className="text-slate-400">{l.certificateNumber || '—'}</div>
        </div>
      )
    },
    { key: 'organization', header: 'Tổ chức hành nghề', className: 'text-slate-600', render: (l) => l.organization?.name || '—' },
    {
      key: 'areas',
      header: 'Lĩnh vực',
      render: (l) => (
        <div className="flex max-w-[240px] flex-wrap gap-1">
          {l.practiceAreas.map((a) => <Badge key={a.id}>{a.name}</Badge>)}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (l) => <Badge tone={STATUS_TONE[l.memberStatus]} dot>{label('lawyerStatus', l.memberStatus)}</Badge>
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (l) => (
        <div className="flex justify-end gap-0.5">
          <IconButton icon={ExternalLink} label="Xem trên trang" onClick={() => window.open(portalRoutes.lawyer(l.slug), '_blank')} />
          <IconButton icon={Pencil} label="Sửa" onClick={() => setEditing(l.id)} />
          <IconButton icon={Trash2} label="Xoá" tone="danger" onClick={() => remove(l)} />
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Luật sư thành viên"
        description="Hồ sơ luật sư dùng cho trang tra cứu công khai. Luật sư đang ẩn không xuất hiện ở trang tra cứu."
        actions={
          <>
            <Button variant="secondary" icon={Tags} onClick={() => setShowAreas(true)}>Lĩnh vực hành nghề</Button>
            <Button variant="gold" icon={Plus} onClick={() => setEditing('new')}>Thêm luật sư</Button>
          </>
        }
      />

      <Card padded={false}>
        <div className="flex flex-col gap-3 p-4 lg:flex-row">
          <SearchInput value={filters.q} onChange={(v) => setFilter('q', v)} placeholder="Họ tên, số thẻ, số CCHN..." className="lg:w-72" />
          <Select
            value={filters.organization}
            onChange={(e) => setFilter('organization', e.target.value)}
            options={organizations.map((o) => ({ value: o.id, label: o.name }))}
            placeholder="Mọi tổ chức hành nghề"
            className="lg:w-64"
          />
          <Select
            value={filters.practiceArea}
            onChange={(e) => setFilter('practiceArea', e.target.value)}
            options={areas.map((a) => ({ value: a.slug, label: a.name }))}
            placeholder="Mọi lĩnh vực"
            className="lg:w-52"
          />
          <Select
            value={filters.memberStatus}
            onChange={(e) => setFilter('memberStatus', e.target.value)}
            options={options('lawyerStatus')}
            placeholder="Mọi trạng thái"
            className="lg:w-52"
          />
          <Select
            value={filters.isActive}
            onChange={(e) => setFilter('isActive', e.target.value)}
            options={[{ value: 'true', label: 'Đang hiển thị' }, { value: 'false', label: 'Đang ẩn' }]}
            placeholder="Hiển thị: tất cả"
            className="lg:w-44"
          />
        </div>
        <Table
          columns={columns}
          rows={items}
          loading={loading}
          empty={<EmptyState icon={Users} title={filters.q ? 'Không tìm thấy luật sư phù hợp' : 'Chưa có luật sư'} />}
        />
        <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} onChange={setPage} />
      </Card>

      <PracticeAreasModal open={showAreas} onClose={() => setShowAreas(false)} areas={areas} onChanged={loadAreas} />
      {confirmDialog}
    </div>
  );
};

export default LawyersManager;
