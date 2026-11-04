// Tổ chức hành nghề luật sư (văn phòng, công ty luật)
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Building2, ExternalLink } from 'lucide-react';
import { organizationApi, errorMessage } from '../../services/portalService';
import usePortalMeta from '../../hooks/usePortalMeta';
import useAdminList from '../../hooks/useAdminList';
import useConfirm from '../../hooks/useConfirm';
import {
  PageHeader, Card, Button, IconButton, Field, Input, Select, Badge, Table, Pagination, SearchInput, EmptyState, Spinner, Modal, Form
} from '../../components/admin/ui/AdminUI';
import { formatDate, toInputDate } from '../../components/admin/ui/format';
import { portalRoutes } from '../../utils/portalRoutes';

const STATUS_TONE = { ACTIVE: 'green', SUSPENDED: 'amber', DISSOLVED: 'gray' };

const EMPTY_ORG = {
  name: '', type: 'LAW_OFFICE', registrationNumber: '', registrationDate: '', representativeName: '',
  address: '', phone: '', email: '', website: '', status: 'ACTIVE'
};

const FIELDS = Object.keys(EMPTY_ORG);

const toForm = (org) => ({
  ...Object.fromEntries(FIELDS.map((k) => [k, org[k] ?? ''])),
  registrationDate: toInputDate(org.registrationDate)
});

const OrganizationForm = ({ orgId, onClose }) => {
  const { options } = usePortalMeta();
  const [form, setForm] = useState(EMPTY_ORG);
  const [loading, setLoading] = useState(!!orgId);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!orgId) return;
    let alive = true;
    organizationApi
      .get(orgId)
      .then((org) => alive && setForm(toForm(org)))
      .catch((error) => {
        toast.error(errorMessage(error, 'Không tải được tổ chức'));
        onClose(false);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [orgId, onClose]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = 'Nhập tên tổ chức';
    if (!form.type) next.type = 'Chọn loại hình';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      if (orgId) await organizationApi.update(orgId, form);
      else await organizationApi.create(form);
      toast.success(orgId ? 'Đã cập nhật tổ chức' : 'Đã thêm tổ chức hành nghề');
      onClose(true);
    } catch (error) {
      toast.error(errorMessage(error, 'Lưu tổ chức thất bại'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={() => onClose(false)}
      size="lg"
      title={orgId ? 'Sửa tổ chức hành nghề' : 'Thêm tổ chức hành nghề'}
      footer={
        <>
          <Button variant="secondary" onClick={() => onClose(false)}>Huỷ</Button>
          <Button variant="gold" type="submit" form="org-form" loading={saving} disabled={loading}>Lưu</Button>
        </>
      }
    >
      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : (
        <Form id="org-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Tên tổ chức" required error={errors.name} className="sm:col-span-2">
            <Input value={form.name} onChange={set('name')} placeholder="Ví dụ: Văn phòng Luật sư Tràng An" />
          </Field>
          <Field label="Loại hình" required error={errors.type}>
            <Select value={form.type} onChange={set('type')} options={options('organizationType')} />
          </Field>
          <Field label="Trạng thái">
            <Select value={form.status} onChange={set('status')} options={options('organizationStatus')} />
          </Field>
          <Field label="Số giấy đăng ký hoạt động">
            <Input value={form.registrationNumber} onChange={set('registrationNumber')} />
          </Field>
          <Field label="Ngày cấp">
            <Input type="date" value={form.registrationDate} onChange={set('registrationDate')} />
          </Field>
          <Field label="Người đại diện / Trưởng văn phòng" className="sm:col-span-2">
            <Input value={form.representativeName} onChange={set('representativeName')} />
          </Field>
          <Field label="Địa chỉ trụ sở" className="sm:col-span-2">
            <Input value={form.address} onChange={set('address')} />
          </Field>
          <Field label="Điện thoại">
            <Input value={form.phone} onChange={set('phone')} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={set('email')} />
          </Field>
          <Field label="Website" className="sm:col-span-2">
            <Input value={form.website} onChange={set('website')} placeholder="https://" />
          </Field>
        </Form>
      )}
    </Modal>
  );
};

const OrganizationsManager = () => {
  const { label, options } = usePortalMeta();
  const [editing, setEditing] = useState(null); // null | 'new' | id
  const [confirm, confirmDialog] = useConfirm();
  const { items, pagination, loading, filters, setFilter, page, setPage, reload } = useAdminList(
    organizationApi.list,
    { q: '', type: '', status: '' }
  );

  const closeForm = useCallback((changed) => {
    setEditing(null);
    if (changed) reload();
  }, [reload]);

  const remove = async (org) => {
    const ok = await confirm({
      title: 'Xoá tổ chức hành nghề',
      message: `Xoá "${org.name}"? Chỉ xoá được khi tổ chức không còn luật sư nào.`,
      confirmText: 'Xoá tổ chức'
    });
    if (!ok) return;
    try {
      await organizationApi.remove(org.id);
      toast.success('Đã xoá tổ chức');
      reload();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Tổ chức',
      render: (org) => (
        <div className="min-w-[240px]">
          <button type="button" onClick={() => setEditing(org.id)} className="text-left font-medium text-navy-950 hover:text-gold-dark">
            {org.name}
          </button>
          <p className="mt-0.5 text-xs text-slate-400">
            {org.registrationNumber ? `Số ĐKHĐ: ${org.registrationNumber}` : 'Chưa có số ĐKHĐ'}
            {org.registrationDate && ` · ${formatDate(org.registrationDate)}`}
          </p>
        </div>
      )
    },
    { key: 'type', header: 'Loại hình', className: 'text-slate-600', render: (org) => label('organizationType', org.type) },
    { key: 'representativeName', header: 'Người đại diện', className: 'whitespace-nowrap text-slate-600', render: (org) => org.representativeName || '—' },
    { key: 'lawyers', header: 'Luật sư', className: 'tabular-nums text-slate-600', render: (org) => org._count?.lawyers ?? 0 },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (org) => <Badge tone={STATUS_TONE[org.status]} dot>{label('organizationStatus', org.status)}</Badge>
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (org) => (
        <div className="flex justify-end gap-0.5">
          <IconButton icon={ExternalLink} label="Xem trên trang" onClick={() => window.open(portalRoutes.organization(org.slug), '_blank')} />
          <IconButton icon={Pencil} label="Sửa" onClick={() => setEditing(org.id)} />
          <IconButton icon={Trash2} label="Xoá" tone="danger" onClick={() => remove(org)} />
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Tổ chức hành nghề"
        description="Văn phòng luật sư, công ty luật thuộc Đoàn — dữ liệu cho trang tra cứu công khai."
        actions={<Button variant="gold" icon={Plus} onClick={() => setEditing('new')}>Thêm tổ chức</Button>}
      />

      <Card padded={false}>
        <div className="flex flex-col gap-3 p-4 sm:flex-row">
          <SearchInput value={filters.q} onChange={(v) => setFilter('q', v)} placeholder="Tên, số ĐKHĐ, người đại diện, địa chỉ..." className="sm:w-80" />
          <Select value={filters.type} onChange={(e) => setFilter('type', e.target.value)} options={options('organizationType')} placeholder="Tất cả loại hình" className="sm:w-72" />
          <Select value={filters.status} onChange={(e) => setFilter('status', e.target.value)} options={options('organizationStatus')} placeholder="Mọi trạng thái" className="sm:w-56" />
        </div>
        <Table
          columns={columns}
          rows={items}
          loading={loading}
          empty={<EmptyState icon={Building2} title={filters.q || filters.type || filters.status ? 'Không tìm thấy tổ chức phù hợp' : 'Chưa có tổ chức hành nghề'} />}
        />
        <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} onChange={setPage} />
      </Card>

      {editing && <OrganizationForm key={editing} orgId={editing === 'new' ? null : editing} onClose={closeForm} />}
      {confirmDialog}
    </div>
  );
};

export default OrganizationsManager;
