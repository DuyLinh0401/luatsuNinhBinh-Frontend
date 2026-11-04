// Quản lý slider, banner, ô liên kết nhanh và logo đơn vị liên kết trên trang chủ
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { bannerApi, assetUrl, errorMessage } from '../../services/portalService';
import usePortalMeta from '../../hooks/usePortalMeta';
import useConfirm from '../../hooks/useConfirm';
import {
  PageHeader, Card, Button, IconButton, Field, Input, Textarea, Select, Toggle, Badge, Tabs, EmptyState, Spinner, Modal, Form
} from '../../components/admin/ui/AdminUI';
import { formatDate, toInputDate } from '../../components/admin/ui/format';
import { ImageField } from '../../components/admin/ui/FileFields';

const SIZE_HINTS = {
  HOME_SLIDER: 'Khuyến nghị 1920×700px',
  HOME_FEATURED: 'Khuyến nghị 1200×500px',
  HOME_INLINE: 'Khuyến nghị 1200×200px',
  QUICK_LINK: 'Không bắt buộc, có thể dùng biểu tượng',
  PARTNER: 'Logo khuyến nghị 300×150px, nền trong suốt',
  SIDEBAR: 'Khuyến nghị 360×480px'
};

const EMPTY_BANNER = {
  title: '', position: 'HOME_SLIDER', description: '', imageUrl: '', icon: '', linkUrl: '',
  openInNewTab: false, startAt: '', endAt: '', isActive: true
};

// Trạng thái hiển thị thực tế theo lịch
const scheduleState = (banner) => {
  const now = Date.now();
  if (banner.endAt && new Date(banner.endAt).getTime() < now) return 'expired';
  if (banner.startAt && new Date(banner.startAt).getTime() > now) return 'scheduled';
  return 'live';
};

const FORM_FIELDS = Object.keys(EMPTY_BANNER);

// Được mount lại (key) mỗi lần mở nên khởi tạo state trực tiếp từ props
const BannerForm = ({ banner, defaultPosition, onClose, onSaved }) => {
  const { options } = usePortalMeta();
  const [form, setForm] = useState(() =>
    banner
      ? {
          ...EMPTY_BANNER,
          ...Object.fromEntries(FORM_FIELDS.filter((k) => banner[k] !== null && banner[k] !== undefined).map((k) => [k, banner[k]])),
          startAt: toInputDate(banner.startAt, true),
          endAt: toInputDate(banner.endAt, true)
        }
      : { ...EMPTY_BANNER, position: defaultPosition || 'HOME_SLIDER' }
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value?.target ? value.target.value : value }));

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.title.trim()) next.title = 'Nhập tiêu đề';
    if (form.startAt && form.endAt && form.endAt < form.startAt) next.endAt = 'Ngày kết thúc phải sau ngày bắt đầu';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const payload = { ...form };
      payload.startAt = form.startAt || null;
      payload.endAt = form.endAt || null;
      if (payload.position !== 'QUICK_LINK') payload.icon = '';
      if (banner) await bannerApi.update(banner.id, payload);
      else await bannerApi.create(payload);
      toast.success(banner ? 'Đã cập nhật banner' : 'Đã thêm banner');
      onSaved(payload.position);
    } catch (error) {
      toast.error(errorMessage(error, 'Lưu banner thất bại'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={banner ? 'Sửa banner' : 'Thêm banner'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Huỷ</Button>
          <Button type="submit" form="banner-form" loading={saving}>Lưu</Button>
        </>
      }
    >
      <Form id="banner-form" onSubmit={submit} className="grid gap-5 md:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-4">
          <Field label="Tiêu đề" required error={errors.title}>
            <Input value={form.title} onChange={set('title')} />
          </Field>
          <Field label="Vị trí" required>
            <Select value={form.position} onChange={set('position')} options={options('bannerPosition')} />
          </Field>
          <Field label="Mô tả">
            <Textarea value={form.description} onChange={set('description')} rows={2} />
          </Field>
          {form.position === 'QUICK_LINK' && (
            <Field label="Biểu tượng" hint="Tên biểu tượng lucide, ví dụ GraduationCap, FileBadge, UserPlus, Search">
              <Input value={form.icon} onChange={set('icon')} placeholder="GraduationCap" />
            </Field>
          )}
          <Field label="Đường dẫn" hint="Đường dẫn nội bộ (/p/tin-tuc) hoặc đầy đủ (https://...)">
            <Input value={form.linkUrl} onChange={set('linkUrl')} placeholder="/p/thong-bao-thong-tin" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Hiển thị từ">
              <Input type="datetime-local" value={form.startAt} onChange={set('startAt')} />
            </Field>
            <Field label="Đến" error={errors.endAt}>
              <Input type="datetime-local" value={form.endAt} onChange={set('endAt')} />
            </Field>
          </div>
          <div className="space-y-3">
            <Toggle checked={form.isActive} onChange={set('isActive')} label="Đang bật" />
            <Toggle checked={form.openInNewTab} onChange={set('openInNewTab')} label="Mở trong tab mới" />
          </div>
        </div>
        <Field label="Hình ảnh" hint={SIZE_HINTS[form.position]}>
          <ImageField value={form.imageUrl} onChange={set('imageUrl')} aspect={form.position === 'PARTNER' ? 'aspect-[2/1]' : 'aspect-video'} />
        </Field>
      </Form>
    </Modal>
  );
};

const BannersManager = () => {
  const { options, label } = usePortalMeta();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState('HOME_SLIDER');
  const [editing, setEditing] = useState(null); // null | 'new' | banner
  const [confirm, confirmDialog] = useConfirm();

  const load = useCallback(async () => {
    try {
      setBanners(await bannerApi.manage());
    } catch (error) {
      toast.error(errorMessage(error, 'Không tải được banner'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bannerApi.manage()
      .then(setBanners)
      .catch((error) => toast.error(errorMessage(error, 'Không tải được banner')))
      .finally(() => setLoading(false));
  }, []);

  const tabs = options('bannerPosition').map((o) => ({
    value: o.value,
    label: o.label,
    count: banners.filter((b) => b.position === o.value).length
  }));

  const current = useMemo(
    () => banners.filter((b) => b.position === position).sort((a, b) => a.order - b.order || a.id - b.id),
    [banners, position]
  );

  // Đổi chỗ với banner kế bên rồi ghi lại thứ tự của những banner bị thay đổi
  const move = async (index, delta) => {
    const next = [...current];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    const changed = next.map((b, i) => ({ ...b, order: i })).filter((b, i) => current.find((c) => c.id === b.id).order !== i);
    try {
      await Promise.all(changed.map((b) => bannerApi.update(b.id, { order: b.order })));
      load();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const toggleActive = async (banner) => {
    try {
      await bannerApi.update(banner.id, { isActive: !banner.isActive });
      setBanners((list) => list.map((b) => (b.id === banner.id ? { ...b, isActive: !b.isActive } : b)));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const remove = async (banner) => {
    const ok = await confirm({ title: 'Xoá banner', message: `Xoá "${banner.title}"?`, confirmText: 'Xoá' });
    if (!ok) return;
    try {
      await bannerApi.remove(banner.id);
      toast.success('Đã xoá banner');
      load();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const onSaved = (savedPosition) => {
    setEditing(null);
    setPosition(savedPosition);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Banner & liên kết"
        description="Slider, banner thông báo, ô liên kết nhanh và logo đơn vị liên kết trên trang chủ."
        actions={<Button variant="gold" icon={Plus} onClick={() => setEditing('new')}>Thêm banner</Button>}
      />

      <Card padded={false}>
        <div className="px-4 pt-2">
          <Tabs tabs={tabs} value={position} onChange={setPosition} />
        </div>
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-16"><Spinner className="h-7 w-7" /></div>
          ) : !current.length ? (
            <EmptyState
              icon={ImageIcon}
              title={`Chưa có mục nào ở "${label('bannerPosition', position)}"`}
              action={<Button size="sm" icon={Plus} onClick={() => setEditing('new')}>Thêm mới</Button>}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {current.map((banner, i) => {
                const state = scheduleState(banner);
                return (
                  <div key={banner.id} className={`overflow-hidden rounded-xl border border-stone-200 bg-white ${banner.isActive ? '' : 'opacity-60'}`}>
                    <div className={`flex items-center justify-center bg-stone-100 ${banner.position === 'PARTNER' ? 'aspect-[2/1] p-4' : 'aspect-video'}`}>
                      {banner.imageUrl ? (
                        <img
                          src={assetUrl(banner.imageUrl)}
                          alt=""
                          className={banner.position === 'PARTNER' ? 'max-h-full max-w-full object-contain' : 'h-full w-full object-cover'}
                        />
                      ) : banner.icon ? (
                        <span className="rounded-md bg-white px-2.5 py-1 font-mono text-xs text-slate-600 ring-1 ring-stone-200">{banner.icon}</span>
                      ) : (
                        <ImageIcon className="h-7 w-7 text-slate-300" />
                      )}
                    </div>
                    <div className="space-y-2 p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-semibold text-navy-950">{banner.title}</p>
                        <span className="shrink-0 text-xs tabular-nums text-slate-400">#{i + 1}</span>
                      </div>
                      {banner.linkUrl && (
                        <a href={banner.linkUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 truncate text-xs text-gold-dark hover:underline">
                          <ExternalLink className="h-3 w-3 shrink-0" /> <span className="truncate">{banner.linkUrl}</span>
                        </a>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {!banner.isActive && <Badge>Đang tắt</Badge>}
                        {state === 'expired' && <Badge tone="red">Hết hạn</Badge>}
                        {state === 'scheduled' && <Badge tone="amber">Chưa tới lịch</Badge>}
                        {banner.isActive && state === 'live' && <Badge tone="green" dot>Đang hiển thị</Badge>}
                        {(banner.startAt || banner.endAt) && (
                          <Badge tone="blue">{formatDate(banner.startAt)} → {formatDate(banner.endAt)}</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between border-t border-stone-100 pt-2">
                        <Toggle checked={banner.isActive} onChange={() => toggleActive(banner)} />
                        <div className="flex">
                          <IconButton icon={ArrowUp} label="Lên" disabled={i === 0} onClick={() => move(i, -1)} />
                          <IconButton icon={ArrowDown} label="Xuống" disabled={i === current.length - 1} onClick={() => move(i, 1)} />
                          <IconButton icon={Pencil} label="Sửa" onClick={() => setEditing(banner)} />
                          <IconButton icon={Trash2} label="Xoá" tone="danger" onClick={() => remove(banner)} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {editing && (
        <BannerForm
          key={editing === 'new' ? 'new' : editing.id}
          banner={editing === 'new' ? null : editing}
          defaultPosition={position}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      )}
      {confirmDialog}
    </div>
  );
};

export default BannersManager;
