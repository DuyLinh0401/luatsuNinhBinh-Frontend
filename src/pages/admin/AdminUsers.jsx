// Quản lý tài khoản quản trị / nhân viên. Mật khẩu do hệ thống sinh và gửi qua email.
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { UserPlus, Pencil, KeyRound, Lock, LockOpen, Trash2, Mail, Scale, Users, ShieldOff, TimerReset } from 'lucide-react';
import userService from '../../services/userService';
import { errorMessage } from '../../services/portalService';
import { useAuth } from '../../contexts/AuthContext';
import useConfirm from '../../hooks/useConfirm';
import {
  PageHeader, Card, Button, IconButton, Field, Input, Select, Checkbox, Toggle, SearchInput, Badge, Table, Modal, EmptyState
} from '../../components/admin/ui/AdminUI';
import { formatDate } from '../../components/admin/ui/format';

const ROLE_LABELS = { ADMIN: 'Quản trị viên', STAFF: 'Nhân viên' };
const ROLE_TONES = { ADMIN: 'gold', STAFF: 'blue' };
// GUEST không dùng cho tài khoản quản trị
const ASSIGNABLE = ['ADMIN', 'STAFF'];

const EMPTY_FORM = { fullName: '', email: '', username: '', roleNames: ['STAFF'], lawyerId: '', isActive: true };

const lawyerLabel = (l) =>
  [l.name, l.cardNumber && `Thẻ ${l.cardNumber}`, l.certificateNumber && `CCHN ${l.certificateNumber}`].filter(Boolean).join(' · ');

const formatTime = (value) => new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

const StatusBadge = ({ user }) => {
  const main = !user.isActive
    ? <Badge tone="red" dot>Đã khóa</Badge>
    : user.mustChangePassword
      ? <Badge tone="amber" dot>Chờ đổi mật khẩu</Badge>
      : <Badge tone="green" dot>Hoạt động</Badge>;
  return (
    <div className="flex flex-wrap gap-1">
      {main}
      {user.loginLockedUntil && <Badge tone="red">Tạm khóa đăng nhập đến {formatTime(user.loginLockedUntil)}</Badge>}
      {user.twoFactorEnabled
        ? <Badge tone="green">2FA</Badge>
        : user.roles.includes('ADMIN') && <Badge tone="amber">Chưa bật 2FA</Badge>}
    </div>
  );
};

// Chỉ mount khi modal mở (key theo user) nên state khởi tạo thẳng từ props
const UserForm = ({ editing, lawyers, onClose, onSaved }) => {
  const [form, setForm] = useState(() => (editing
    ? {
      fullName: editing.fullName || '',
      email: editing.email,
      username: editing.username,
      roleNames: editing.roles,
      lawyerId: editing.lawyer?.id ? String(editing.lawyer.id) : '',
      isActive: editing.isActive
    }
    : EMPTY_FORM));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value?.target ? value.target.value : value }));

  // Hồ sơ chưa liên kết, hoặc đang liên kết với chính tài khoản này
  const lawyerOptions = lawyers
    .filter((l) => !l.userId || l.userId === editing?.id)
    .map((l) => ({ value: String(l.id), label: lawyerLabel(l) }));

  const pickLawyer = (e) => {
    const id = e.target.value;
    const lawyer = lawyers.find((l) => String(l.id) === id);
    setForm((f) => ({
      ...f,
      lawyerId: id,
      // Tạo mới: điền sẵn họ tên / email từ hồ sơ luật sư nếu còn trống
      ...(lawyer && !editing && {
        fullName: f.fullName || lawyer.name,
        email: f.email || lawyer.email || ''
      })
    }));
  };

  const toggleRole = (role) => setForm((f) => ({
    ...f,
    roleNames: f.roleNames.includes(role) ? f.roleNames.filter((r) => r !== role) : [...f.roleNames, role]
  }));

  const validate = () => {
    const next = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Nhập email hợp lệ';
    if (form.username && !/^[a-zA-Z0-9._-]{3,50}$/.test(form.username.trim())) {
      next.username = '3–50 ký tự: chữ không dấu, số, dấu chấm, gạch ngang, gạch dưới';
    }
    if (!form.roleNames.length) next.roleNames = 'Chọn ít nhất một vai trò';
    setErrors(next);
    return !Object.keys(next).length;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      username: form.username.trim(),
      roleNames: form.roleNames,
      lawyerId: form.lawyerId ? Number(form.lawyerId) : null
    };
    try {
      if (editing) {
        await userService.updateUser(editing.id, { ...payload, isActive: form.isActive });
        toast.success('Đã cập nhật tài khoản');
      } else {
        const result = await userService.createUser(payload);
        if (result.data.emailSent) toast.success(result.message, { duration: 6000 });
        else toast.error(result.message, { duration: 10000 });
      }
      onSaved();
    } catch (error) {
      toast.error(errorMessage(error, 'Lưu tài khoản thất bại'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title={editing ? `Sửa tài khoản ${editing.username}` : 'Thêm tài khoản'}
      description={editing ? undefined : 'Mật khẩu tạm sẽ được tạo tự động và gửi tới email bên dưới.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Huỷ</Button>
          <Button type="submit" form="user-form" loading={saving} icon={editing ? undefined : Mail}>
            {editing ? 'Lưu thay đổi' : 'Tạo và gửi email'}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={submit} className="space-y-4 [&>div]:!mb-0">
        <Field
          label="Hồ sơ luật sư liên kết"
          hint="Liên kết để luật sư đăng nhập bằng số chứng chỉ hành nghề hoặc số thẻ luật sư."
        >
          <Select value={form.lawyerId} onChange={pickLawyer} placeholder="— Không liên kết —" options={lawyerOptions} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Họ và tên">
            <Input value={form.fullName} onChange={set('fullName')} placeholder="Nguyễn Văn A" />
          </Field>
          <Field label="Email" required error={errors.email} hint={editing ? undefined : 'Nên dùng Gmail; mật khẩu được gửi vào đây.'}>
            <Input type="email" value={form.email} onChange={set('email')} placeholder="ten@gmail.com" />
          </Field>
        </div>

        <Field
          label="Tên đăng nhập"
          error={errors.username}
          hint={editing ? undefined : 'Để trống sẽ tự lấy phần trước @ của email.'}
        >
          <Input value={form.username} onChange={set('username')} placeholder={editing ? '' : 'Tự động'} />
        </Field>

        <Field label="Vai trò" required error={errors.roleNames}>
          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
            {ASSIGNABLE.map((role) => (
              <Checkbox
                key={role}
                label={ROLE_LABELS[role]}
                checked={form.roleNames.includes(role)}
                onChange={() => toggleRole(role)}
              />
            ))}
          </div>
        </Field>

        {editing && (
          <Toggle
            checked={form.isActive}
            onChange={(value) => setForm((f) => ({ ...f, isActive: value }))}
            label="Cho phép đăng nhập"
            description="Tắt để khóa tài khoản; người dùng bị đăng xuất ngay."
          />
        )}

        {!editing && (
          <div className="flex gap-2.5 rounded-lg bg-gold/5 px-3.5 py-3 text-xs leading-relaxed text-slate-600 ring-1 ring-gold/20">
            <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
            Người dùng nhận mật khẩu tạm qua email và phải đổi mật khẩu ở lần đăng nhập đầu tiên.
          </div>
        )}
      </form>
    </Modal>
  );
};

const AdminUsers = () => {
  const { user: me } = useAuth();
  const [users, setUsers] = useState(null);
  const [lawyers, setLawyers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modal, setModal] = useState({ open: false, editing: null });
  const [busyId, setBusyId] = useState(null);
  const [confirm, confirmDialog] = useConfirm();

  const load = useCallback(() => Promise.all([userService.getUsers(), userService.getLawyerOptions()])
    .then(([u, l]) => {
      setUsers(u);
      setLawyers(l);
    })
    .catch((error) => toast.error(errorMessage(error, 'Không tải được danh sách tài khoản'))), []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (users || []).filter((u) => {
      if (roleFilter === 'LOCKED') { if (u.isActive) return false; } else if (roleFilter && !u.roles.includes(roleFilter)) return false;
      if (!q) return true;
      return [u.fullName, u.username, u.email, u.lawyer?.cardNumber, u.lawyer?.certificateNumber]
        .some((v) => v && v.toLowerCase().includes(q));
    });
  }, [users, search, roleFilter]);

  const run = async (id, action, success) => {
    setBusyId(id);
    try {
      const result = await action();
      toast.success(success || result?.message || 'Đã cập nhật');
      await load();
    } catch (error) {
      toast.error(errorMessage(error, 'Thao tác thất bại'));
    } finally {
      setBusyId(null);
    }
  };

  const resetPassword = async (u) => {
    if (!(await confirm({
      title: 'Cấp lại mật khẩu?',
      message: `Hệ thống sẽ tạo mật khẩu tạm mới và gửi tới ${u.email}. Mật khẩu hiện tại của ${u.fullName || u.username} sẽ không dùng được nữa và mọi phiên đăng nhập bị đăng xuất.`,
      confirmText: 'Cấp lại và gửi email',
      tone: 'primary'
    }))) return;
    run(u.id, () => userService.resetPassword(u.id));
  };

  const toggleActive = async (u) => {
    if (u.isActive && !(await confirm({
      title: 'Khóa tài khoản?',
      message: `${u.fullName || u.username} sẽ bị đăng xuất và không thể đăng nhập cho tới khi được mở khóa.`,
      confirmText: 'Khóa tài khoản'
    }))) return;
    run(u.id, () => userService.updateUser(u.id, { isActive: !u.isActive }), u.isActive ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
  };

  const resetTwoFactor = async (u) => {
    if (!(await confirm({
      title: 'Tắt xác thực 2 bước?',
      message: `Dùng khi ${u.fullName || u.username} mất điện thoại và mã dự phòng. Tài khoản sẽ đăng nhập lại chỉ bằng mật khẩu${u.roles.includes('ADMIN') ? ', sau đó bắt buộc thiết lập 2FA mới' : ''}. Người dùng sẽ nhận email thông báo.`,
      confirmText: 'Tắt 2FA'
    }))) return;
    run(u.id, () => userService.resetTwoFactor(u.id));
  };

  const unlockLogin = (u) => run(u.id, () => userService.unlockLogin(u.id));

  const remove = async (u) => {
    if (!(await confirm({
      title: 'Xóa tài khoản?',
      message: `Xóa vĩnh viễn tài khoản ${u.username}. Nếu tài khoản đã đăng bài hoặc văn bản, hãy khóa thay vì xóa.`,
      confirmText: 'Xóa'
    }))) return;
    run(u.id, () => userService.deleteUser(u.id));
  };

  const columns = [
    {
      key: 'user',
      header: 'Người dùng',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-950 text-xs font-bold text-gold-hover">
            {(u.fullName || u.username).trim().split(/\s+/).pop()[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-navy-950">
              {u.fullName || u.username}
              {u.id === me?.id && <span className="ml-1.5 text-xs font-normal text-slate-400">(bạn)</span>}
            </p>
            <p className="truncate text-xs text-slate-500">@{u.username} · {u.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'roles',
      header: 'Vai trò',
      render: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.roles.map((r) => <Badge key={r} tone={ROLE_TONES[r] || 'gray'}>{ROLE_LABELS[r] || r}</Badge>)}
        </div>
      )
    },
    {
      key: 'lawyer',
      header: 'Luật sư liên kết',
      render: (u) => (u.lawyer ? (
        <div className="text-xs">
          <p className="flex items-center gap-1 font-medium text-navy-950"><Scale className="h-3.5 w-3.5 text-gold-dark" />{u.lawyer.name}</p>
          <p className="mt-0.5 text-slate-500">
            {[u.lawyer.cardNumber && `Thẻ ${u.lawyer.cardNumber}`, u.lawyer.certificateNumber && `CCHN ${u.lawyer.certificateNumber}`].filter(Boolean).join(' · ') || 'Chưa có số thẻ / CCHN'}
          </p>
        </div>
      ) : <span className="text-xs text-slate-400">—</span>)
    },
    { key: 'status', header: 'Trạng thái', render: (u) => <StatusBadge user={u} /> },
    {
      key: 'lastLogin',
      header: 'Đăng nhập gần nhất',
      render: (u) => <span className="whitespace-nowrap text-xs text-slate-500">{u.lastLogin ? formatDate(u.lastLogin, true) : 'Chưa đăng nhập'}</span>
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-px',
      render: (u) => {
        const self = u.id === me?.id;
        const busy = busyId === u.id;
        return (
          <div className="flex justify-end gap-0.5">
            <IconButton icon={Pencil} label="Sửa" onClick={() => setModal({ open: true, editing: u })} />
            <IconButton icon={KeyRound} label="Cấp lại mật khẩu" tone="gold" disabled={busy} onClick={() => resetPassword(u)} />
            {u.loginLockedUntil && (
              <IconButton icon={TimerReset} label="Mở khóa đăng nhập" tone="success" disabled={busy} onClick={() => unlockLogin(u)} />
            )}
            {u.twoFactorEnabled && (
              <IconButton
                icon={ShieldOff}
                label={self ? 'Quản lý 2FA ở trang Bảo mật tài khoản' : 'Tắt xác thực 2 bước'}
                tone="danger"
                disabled={self || busy}
                onClick={() => resetTwoFactor(u)}
              />
            )}
            <IconButton
              icon={u.isActive ? Lock : LockOpen}
              label={self ? 'Không thể tự khóa' : u.isActive ? 'Khóa' : 'Mở khóa'}
              tone={u.isActive ? 'danger' : 'success'}
              disabled={self || busy}
              onClick={() => toggleActive(u)}
            />
            <IconButton icon={Trash2} label={self ? 'Không thể tự xóa' : 'Xóa'} tone="danger" disabled={self || busy} onClick={() => remove(u)} />
          </div>
        );
      }
    }
  ];

  const counts = useMemo(() => ({
    total: users?.length || 0,
    pending: users?.filter((u) => u.isActive && u.mustChangePassword).length || 0
  }), [users]);

  return (
    <div>
      {confirmDialog}
      <PageHeader
        title="Quản lý nhân sự"
        description={`${counts.total} tài khoản${counts.pending ? ` · ${counts.pending} tài khoản chưa đổi mật khẩu tạm` : ''}`}
        actions={<Button icon={UserPlus} onClick={() => setModal({ open: true, editing: null })}>Thêm tài khoản</Button>}
      />

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm tên, email, số thẻ, CCHN..." className="sm:max-w-sm sm:flex-1" />
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="sm:w-48"
            placeholder="Tất cả vai trò"
            options={[
              { value: 'ADMIN', label: 'Quản trị viên' },
              { value: 'STAFF', label: 'Nhân viên' },
              { value: 'LOCKED', label: 'Đã khóa' }
            ]}
          />
        </div>
        <Table
          columns={columns}
          rows={rows}
          loading={!users}
          empty={<EmptyState icon={Users} title="Không có tài khoản phù hợp" />}
        />
      </Card>

      {modal.open && (
        <UserForm
          key={modal.editing?.id || 'new'}
          editing={modal.editing}
          lawyers={lawyers}
          onClose={() => setModal({ open: false, editing: null })}
          onSaved={() => {
            setModal({ open: false, editing: null });
            load();
          }}
        />
      )}
    </div>
  );
};

export default AdminUsers;
