// Trụ sở & văn phòng hiển thị ở trang Liên hệ.
// Danh sách bên trái (sắp xếp, đặt trụ sở chính, ẩn/hiện), bản đồ của văn phòng đang chọn bên phải.
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Plus, Pencil, Trash2, Star, Eye, EyeOff, ChevronUp, ChevronDown, MapPin, Phone, Mail, Clock, ExternalLink,
  Navigation, AlertTriangle, Building2
} from 'lucide-react';
import officeService from '../../services/officeService';
import { errorMessage } from '../../services/portalService';
import { useAuth } from '../../contexts/AuthContext';
import useConfirm from '../../hooks/useConfirm';
import {
  PageHeader, Card, Button, IconButton, Field, Input, Textarea, Checkbox, Badge, EmptyState, Spinner, Modal, Form
} from '../../components/admin/ui/AdminUI';
import { embedSrcOf, coordsFromEmbed, hasCoords, mapSrcOf, directionsUrlOf, officeIssues } from '../../utils/maps';

const EMPTY = { name: '', address: '', phone: '', email: '', workingHours: '', mapEmbed: '', latitude: '', longitude: '', isMain: false, isActive: true };

const MapFrame = ({ src, title, className = 'h-64' }) =>
  src ? (
    <iframe title={title} src={src} className={`w-full border-0 ${className}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
  ) : (
    <div className={`flex flex-col items-center justify-center gap-2 bg-stone-50 text-center text-sm text-slate-500 ${className}`}>
      <MapPin className="h-6 w-6 text-slate-300" />
      Chưa có vị trí bản đồ
    </div>
  );

// ---------- Form thêm/sửa ----------

const OfficeForm = ({ office, onClose, onSaved }) => {
  const [form, setForm] = useState(() =>
    office
      ? {
          ...EMPTY,
          ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, office[k] ?? EMPTY[k]])),
          mapEmbed: embedSrcOf(office.mapEmbed) || office.mapEmbed || ''
        }
      : EMPTY
  );
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const embedSrc = embedSrcOf(form.mapEmbed);
  const embedInvalid = form.mapEmbed.trim() && !embedSrc;
  const fromEmbed = coordsFromEmbed(form.mapEmbed);
  const preview = mapSrcOf({ mapEmbed: form.mapEmbed, latitude: form.latitude === '' ? null : form.latitude, longitude: form.longitude === '' ? null : form.longitude });

  const submit = async (e) => {
    e.preventDefault();
    if (embedInvalid) return toast.error('Mã nhúng bản đồ không hợp lệ');
    setSaving(true);
    try {
      const payload = {
        ...form,
        mapEmbed: embedSrc || '',
        latitude: fromEmbed ? fromEmbed.latitude : form.latitude,
        longitude: fromEmbed ? fromEmbed.longitude : form.longitude
      };
      if (office) await officeService.updateOffice(office.id, payload);
      else await officeService.createOffice(payload);
      toast.success(office ? 'Đã lưu văn phòng' : 'Đã thêm văn phòng');
      onSaved();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      size="xl"
      onClose={onClose}
      title={office ? 'Sửa văn phòng' : 'Thêm văn phòng'}
      description="Thông tin hiển thị ở trang Liên hệ của cổng thông tin."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button type="submit" form="office-form" loading={saving}>{office ? 'Lưu thay đổi' : 'Thêm văn phòng'}</Button>
        </>
      }
    >
      <Form id="office-form" onSubmit={submit} className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Field label="Tên văn phòng" required htmlFor="office-name">
            <Input id="office-name" value={form.name} onChange={set('name')} placeholder="VD: Trụ sở Đoàn Luật sư tỉnh Ninh Bình" required />
          </Field>
          <Field label="Địa chỉ" required htmlFor="office-address">
            <Textarea id="office-address" rows={2} value={form.address} onChange={set('address')} placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố" required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Điện thoại" required htmlFor="office-phone">
              <Input id="office-phone" value={form.phone} onChange={set('phone')} placeholder="0229 3xxx xxx" required />
            </Field>
            <Field label="Email" htmlFor="office-email">
              <Input id="office-email" type="email" value={form.email || ''} onChange={set('email')} placeholder="vanphong@…" />
            </Field>
          </div>
          <Field label="Giờ làm việc" htmlFor="office-hours">
            <Input id="office-hours" value={form.workingHours || ''} onChange={set('workingHours')} placeholder="Thứ 2 – Thứ 6: 7:30 – 17:00" />
          </Field>
          <div className="space-y-2.5 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
            <Checkbox
              checked={form.isMain}
              onChange={set('isMain')}
              disabled={office?.isMain}
              label={office?.isMain ? 'Trụ sở chính (đặt văn phòng khác làm trụ sở chính để thay đổi)' : 'Đặt làm trụ sở chính'}
            />
            <Checkbox
              checked={form.isActive}
              onChange={set('isActive')}
              disabled={form.isMain}
              label={form.isMain ? 'Hiển thị trên trang Liên hệ (trụ sở chính luôn hiển thị)' : 'Hiển thị trên trang Liên hệ'}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Field
            label="Bản đồ Google Maps"
            htmlFor="office-map"
            error={embedInvalid ? 'Không nhận ra mã nhúng Google Maps.' : undefined}
            hint={!embedInvalid ? 'Google Maps → tìm địa điểm → Chia sẻ → Nhúng bản đồ → Sao chép HTML, rồi dán vào đây.' : undefined}
          >
            <Textarea
              id="office-map"
              rows={3}
              value={form.mapEmbed}
              onChange={set('mapEmbed')}
              placeholder='<iframe src="https://www.google.com/maps/embed?pb=…"></iframe>'
              className="text-xs"
            />
          </Field>

          <div className="overflow-hidden rounded-lg border border-stone-200">
            <MapFrame src={preview} title="Xem trước bản đồ" className="h-56" />
          </div>

          {fromEmbed ? (
            <p className="text-xs text-slate-500">
              Tọa độ lấy từ bản đồ: <span className="tabular-nums text-navy-950">{fromEmbed.latitude}, {fromEmbed.longitude}</span>
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Vĩ độ" htmlFor="office-lat" hint="Dùng khi không có mã nhúng">
                <Input id="office-lat" type="number" step="any" value={form.latitude ?? ''} onChange={set('latitude')} placeholder="20.2506" />
              </Field>
              <Field label="Kinh độ" htmlFor="office-lng">
                <Input id="office-lng" type="number" step="any" value={form.longitude ?? ''} onChange={set('longitude')} placeholder="105.9745" />
              </Field>
            </div>
          )}
        </div>
      </Form>
    </Modal>
  );
};

// ---------- Danh sách ----------

const OfficeRow = ({ office, index, total, selected, perms, busy, onSelect, onMove, onEdit, onSetMain, onToggle, onDelete }) => {
  const issues = officeIssues(office);
  return (
    <li
      className={`flex gap-3 px-4 py-4 transition-colors sm:px-5 ${selected ? 'bg-brand-light/50' : 'hover:bg-stone-50'} ${office.isActive ? '' : 'opacity-70'}`}
    >
      {perms.update && (
        <div className="flex flex-col">
          <IconButton icon={ChevronUp} label="Đưa lên" disabled={busy || index === 0} onClick={() => onMove(index, -1)} className="!h-7 !w-7" />
          <IconButton icon={ChevronDown} label="Đưa xuống" disabled={busy || index === total - 1} onClick={() => onMove(index, 1)} className="!h-7 !w-7" />
        </div>
      )}

      <button type="button" onClick={() => onSelect(office.id)} className="min-w-0 flex-1 text-left">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-navy-950">{office.name}</span>
          {office.isMain && <Badge tone="gold">Trụ sở chính</Badge>}
          {!office.isActive && <Badge tone="gray">Đang ẩn</Badge>}
        </div>
        <p className="mt-1 flex gap-1.5 text-sm text-slate-600">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          {office.address}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{office.phone}</span>
          {office.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{office.email}</span>}
          {office.workingHours && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{office.workingHours}</span>}
        </div>
        {issues.length > 0 && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5" />
            {issues.join(' · ')}
          </p>
        )}
      </button>

      <div className="flex shrink-0 items-start gap-0.5">
        {perms.update && !office.isMain && office.isActive && (
          <IconButton icon={Star} label="Đặt làm trụ sở chính" disabled={busy} onClick={() => onSetMain(office)} />
        )}
        {perms.update && !office.isMain && (
          <IconButton icon={office.isActive ? EyeOff : Eye} label={office.isActive ? 'Ẩn khỏi trang Liên hệ' : 'Hiển thị lại'} disabled={busy} onClick={() => onToggle(office)} />
        )}
        {perms.update && <IconButton icon={Pencil} label="Sửa" onClick={() => onEdit(office)} />}
        {perms.remove && <IconButton icon={Trash2} label="Xóa" tone="danger" disabled={busy} onClick={() => onDelete(office)} />}
      </div>
    </li>
  );
};

// ---------- Trang ----------

const AdminOffices = () => {
  const { can } = useAuth();
  const perms = { create: can('CREATE_MAP'), update: can('UPDATE_MAP'), remove: can('DELETE_MAP') };
  const [confirm, confirmDialog] = useConfirm();
  const [offices, setOffices] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | office
  const [busy, setBusy] = useState(false);

  const [version, setVersion] = useState(0);
  const load = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let alive = true;
    officeService
      .getManageOffices()
      .then((data) => alive && setOffices(data))
      .catch((error) => {
        if (!alive) return;
        toast.error(errorMessage(error, 'Không tải được danh sách văn phòng'));
        setOffices((prev) => prev || []);
      });
    return () => {
      alive = false;
    };
  }, [version]);

  const list = useMemo(() => offices || [], [offices]);
  const selected = list.find((o) => o.id === selectedId) || list.find((o) => o.isMain) || list[0];
  const visibleCount = list.filter((o) => o.isActive).length;

  const act = async (action, successText) => {
    setBusy(true);
    try {
      await action();
      if (successText) toast.success(successText);
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const move = (index, delta) => {
    const ids = list.map((o) => o.id);
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    act(() => officeService.reorderOffices(ids));
  };

  const setMain = (office) => act(() => officeService.updateOffice(office.id, { isMain: true }), `"${office.name}" là trụ sở chính`);

  const toggle = (office) =>
    act(() => officeService.updateOffice(office.id, { isActive: !office.isActive }), office.isActive ? 'Đã ẩn khỏi trang Liên hệ' : 'Đã hiển thị lại');

  const remove = async (office) => {
    const ok = await confirm({
      title: 'Xóa văn phòng',
      message: office.isMain && list.length > 1
        ? `Xóa "${office.name}"? Văn phòng đang hiển thị kế tiếp trong danh sách sẽ trở thành trụ sở chính.`
        : `Xóa "${office.name}"? Thao tác này không hoàn tác được.`,
      confirmText: 'Xóa văn phòng'
    });
    if (ok) act(() => officeService.deleteOffice(office.id), 'Đã xóa văn phòng');
  };

  const directions = selected && directionsUrlOf(selected);

  return (
    <div>
      {confirmDialog}
      <PageHeader
        title="Trụ sở & Văn phòng"
        description="Hiển thị ở trang Liên hệ. Trụ sở chính đứng đầu danh sách và được đặt bản đồ lớn; thứ tự các văn phòng còn lại theo danh sách dưới đây."
        actions={
          <>
            <Button variant="secondary" icon={ExternalLink} onClick={() => window.open('/lien-he', '_blank', 'noopener')}>
              Xem trang Liên hệ
            </Button>
            {perms.create && <Button icon={Plus} onClick={() => setEditing('new')}>Thêm văn phòng</Button>}
          </>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card
          padded={false}
          title={offices ? `${list.length} văn phòng · ${visibleCount} đang hiển thị` : 'Danh sách văn phòng'}
        >
          {!offices ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : list.length ? (
            <ul className="divide-y divide-stone-100">
              {list.map((o, i) => (
                <OfficeRow
                  key={o.id}
                  office={o}
                  index={i}
                  total={list.length}
                  selected={selected?.id === o.id}
                  perms={perms}
                  busy={busy}
                  onSelect={setSelectedId}
                  onMove={move}
                  onEdit={setEditing}
                  onSetMain={setMain}
                  onToggle={toggle}
                  onDelete={remove}
                />
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Building2}
              title="Chưa có văn phòng nào"
              description="Thêm trụ sở của Đoàn để hiển thị địa chỉ và bản đồ ở trang Liên hệ."
              action={perms.create && <Button icon={Plus} onClick={() => setEditing('new')}>Thêm văn phòng</Button>}
            />
          )}
        </Card>

        {selected && (
          <Card padded={false} className="overflow-hidden xl:sticky xl:top-6">
            <div className="border-b border-stone-200 px-5 py-3.5">
              <p className="text-xs font-medium text-slate-500">Bản đồ</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-navy-950">{selected.name}</p>
            </div>
            <MapFrame key={selected.id} src={mapSrcOf(selected)} title={`Bản đồ ${selected.name}`} className="h-72" />
            <div className="space-y-2 px-5 py-4 text-sm">
              {hasCoords(selected) && (
                <p className="text-slate-500">
                  Tọa độ: <span className="tabular-nums text-navy-950">{selected.latitude}, {selected.longitude}</span>
                </p>
              )}
              {directions && (
                <a href={directions} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-brand hover:underline">
                  <Navigation className="h-3.5 w-3.5" /> Mở chỉ đường trên Google Maps
                </a>
              )}
            </div>
          </Card>
        )}
      </div>

      {editing && (
        <OfficeForm
          office={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
};

export default AdminOffices;
