// Phân quyền theo vai trò: ma trận chức năng × hành động
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Lock, Users, Undo2, Save, Info, ShieldCheck } from 'lucide-react';
import userService from '../../services/userService';
import { errorMessage } from '../../services/portalService';
import { PageHeader, Card, Button, Badge, Spinner, EmptyState } from '../../components/admin/ui/AdminUI';
import useConfirm from '../../hooks/useConfirm';
import {
  ACTION_COLUMNS, SPECIAL_ACTIONS, RESOURCE_GROUPS, ADMIN_ONLY_RESOURCES, ROLE_INFO
} from '../../utils/permissionCatalog';

const cx = (...classes) => classes.filter(Boolean).join(' ');

const CHECKBOX_CLASS = '!p-0 h-4 w-4 cursor-pointer rounded border-stone-300 text-navy-950 focus:ring-gold/40 disabled:cursor-not-allowed disabled:opacity-50';

// Số quyền khác nhau giữa hai tập
const diffCount = (a, b) => [...a].filter((x) => !b.has(x)).length + [...b].filter((x) => !a.has(x)).length;

const AdminPermissions = () => {
  const [data, setData] = useState(null);
  const [roleId, setRoleId] = useState(null);
  const [draft, setDraft] = useState(() => new Set());
  const [saving, setSaving] = useState(false);
  const [confirm, confirmDialog] = useConfirm();

  const load = useCallback(() => userService.getRolesAndPermissions().then((d) => {
    setData(d);
    return d;
  }), []);

  useEffect(() => {
    load()
      .then((d) => {
        const first = d.roles.find((r) => !r.locked) || d.roles[0];
        if (first) {
          setRoleId(first.id);
          setDraft(new Set(first.permissions));
        }
      })
      .catch((error) => toast.error(errorMessage(error, 'Không tải được dữ liệu phân quyền')));
  }, [load]);

  const role = data?.roles.find((r) => r.id === roleId);
  const saved = useMemo(() => new Set(role?.permissions || []), [role]);
  const changes = role && !role.locked ? diffCount(draft, saved) : 0;
  const dirty = changes > 0;

  // Cảnh báo khi đóng tab lúc còn thay đổi chưa lưu
  useEffect(() => {
    if (!dirty) return undefined;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // { POST: { READ: perm, CREATE: perm, PUBLISH: perm, ... } }
  const byResource = useMemo(() => {
    const map = {};
    (data?.permissions || []).forEach((p) => {
      (map[p.resource] ||= {})[p.action] = p;
    });
    return map;
  }, [data]);

  // Nhóm theo danh mục; resource có trong DB nhưng chưa khai báo => nhóm "Khác" để không bị ẩn
  const groups = useMemo(() => {
    const known = new Set();
    const result = RESOURCE_GROUPS.map((g) => ({
      ...g,
      resources: g.resources.filter((r) => {
        known.add(r.key);
        return byResource[r.key];
      })
    })).filter((g) => g.resources.length);
    const others = Object.keys(byResource).filter((k) => !known.has(k));
    if (others.length) result.push({ title: 'Khác', resources: others.map((key) => ({ key, label: key })) });
    return result;
  }, [byResource]);

  if (!data) {
    return <div className="flex justify-center py-24"><Spinner className="h-7 w-7" /></div>;
  }

  const locked = !!role?.locked;
  const editable = (resource) => !locked && !ADMIN_ONLY_RESOURCES.includes(resource);
  const isChecked = (perm) => locked || draft.has(perm.name);
  const rowPerms = (resource) => Object.values(byResource[resource] || {});

  // Bật quyền bất kỳ => tự bật "Xem"; tắt "Xem" => tắt toàn bộ quyền của chức năng đó
  const apply = (next, resource, action, on) => {
    const perms = byResource[resource];
    const perm = perms?.[action];
    if (!perm) return;
    if (on) {
      next.add(perm.name);
      if (action !== 'READ' && perms.READ) next.add(perms.READ.name);
    } else {
      next.delete(perm.name);
      if (action === 'READ') Object.values(perms).forEach((p) => next.delete(p.name));
    }
  };

  const update = (fn) => setDraft((prev) => {
    const next = new Set(prev);
    fn(next);
    return next;
  });

  const toggle = (resource, action) => {
    const on = !draft.has(byResource[resource][action].name);
    update((next) => apply(next, resource, action, on));
  };

  const toggleRow = (resource) => {
    const perms = rowPerms(resource);
    const on = !perms.every((p) => draft.has(p.name));
    update((next) => perms.forEach((p) => apply(next, resource, p.action, on)));
  };

  const toggleColumn = (action) => {
    const resources = Object.keys(byResource).filter((r) => editable(r) && byResource[r][action]);
    const on = !resources.every((r) => draft.has(byResource[r][action].name));
    update((next) => resources.forEach((r) => apply(next, r, action, on)));
  };

  const selectRole = async (next) => {
    if (next.id === roleId) return;
    if (dirty && !(await confirm({
      title: 'Bỏ thay đổi chưa lưu?',
      message: `Vai trò ${role.name} còn ${changes} thay đổi chưa lưu. Chuyển vai trò sẽ bỏ các thay đổi này.`,
      confirmText: 'Bỏ thay đổi'
    }))) return;
    setRoleId(next.id);
    setDraft(new Set(next.permissions));
  };

  const save = async () => {
    setSaving(true);
    try {
      await userService.updateRolePermissions(role.id, [...draft]);
      const fresh = await load();
      const updated = fresh.roles.find((r) => r.id === role.id);
      setDraft(new Set(updated?.permissions || []));
      toast.success(`Đã lưu phân quyền cho ${role.name}`);
    } catch (error) {
      toast.error(errorMessage(error, 'Lưu phân quyền thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const grantedCount = locked ? data.permissions.length : draft.size;

  return (
    <div>
      {confirmDialog}
      <PageHeader
        title="Phân quyền"
        description="Chọn vai trò rồi tích các chức năng được phép. Thay đổi có hiệu lực ngay khi lưu; nhân viên tải lại trang để thấy menu mới."
      />

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Danh sách vai trò */}
        <Card title="Vai trò" padded={false} className="self-start">
          <ul className="divide-y divide-stone-100">
            {data.roles.map((r) => {
              const active = r.id === roleId;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => selectRole(r)}
                    className={cx(
                      'relative w-full px-5 py-3.5 text-left transition-colors',
                      active ? 'bg-stone-50' : 'hover:bg-stone-50/60'
                    )}
                  >
                    {active && <span className="absolute inset-y-0 left-0 w-0.5 bg-gold" />}
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-navy-950">
                        {r.locked && <Lock className="h-3.5 w-3.5 text-gold-dark" />}
                        {r.name}
                      </span>
                      <Badge tone={active ? 'navy' : 'gray'}>
                        <Users className="h-3 w-3" />
                        {r.userCount}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{ROLE_INFO[r.name] || r.description}</p>
                    <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                      {r.locked ? 'Toàn quyền' : `${r.permissions.length} quyền`}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Ma trận quyền */}
        <div className="min-w-0 space-y-4">
          {!role ? (
            <Card><EmptyState icon={ShieldCheck} title="Chưa có vai trò" /></Card>
          ) : (
            <Card
              padded={false}
              title={`Quyền của vai trò ${role.name}`}
              actions={
                <span className="text-xs text-slate-500">
                  {grantedCount}/{data.permissions.length} quyền
                  {dirty && <Badge tone="amber" className="ml-2">{changes} thay đổi</Badge>}
                </span>
              }
            >
              {locked && (
                <div className="flex items-start gap-2.5 border-b border-stone-200 bg-gold/5 px-5 py-3 text-sm text-slate-600">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
                  <span>
                    <strong className="text-navy-950">{role.name}</strong> luôn có toàn quyền trên hệ thống và không thể giới hạn.
                    Để giới hạn quyền của một người, hãy gán họ vai trò khác ở trang Quản lý nhân sự.
                  </span>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50 text-xs font-semibold text-slate-500">
                      <th className="sticky left-0 z-10 bg-stone-50 px-5 py-2.5 text-left">Chức năng</th>
                      {ACTION_COLUMNS.map((col) => (
                        <th key={col.key} className="w-20 px-2 py-2.5 text-center">
                          <button
                            type="button"
                            disabled={locked}
                            onClick={() => toggleColumn(col.key)}
                            title={locked ? undefined : `Chọn / bỏ cả cột "${col.label}"`}
                            className="rounded px-1.5 py-0.5 transition-colors enabled:hover:bg-stone-200 enabled:hover:text-navy-950"
                          >
                            {col.label}
                          </button>
                        </th>
                      ))}
                      <th className="px-3 py-2.5 text-left">Đặc biệt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((group) => (
                      <GroupRows
                        key={group.title}
                        group={group}
                        byResource={byResource}
                        editable={editable}
                        locked={locked}
                        isChecked={isChecked}
                        onToggle={toggle}
                        onToggleRow={toggleRow}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <Card>
            <div className="flex gap-3 text-xs leading-relaxed text-slate-500">
              <Info className="h-4 w-4 shrink-0 text-slate-400" />
              <ul className="list-disc space-y-1 pl-4">
                <li>Tích <strong>Thêm / Sửa / Xóa</strong> sẽ tự bật <strong>Xem</strong>; bỏ <strong>Xem</strong> sẽ bỏ toàn bộ quyền của chức năng đó.</li>
                <li>Bấm vào tên chức năng để chọn / bỏ cả hàng, bấm tiêu đề cột để chọn / bỏ cả cột.</li>
                <li>Menu khu vực nhân viên tự hiện các mục mà vai trò có quyền Thêm, Sửa hoặc Xóa.</li>
                <li><strong>Quản lý nhân sự</strong> và <strong>Phân quyền</strong> chỉ dành cho ADMIN, vì người có quyền này có thể tự nâng mình thành quản trị viên.</li>
              </ul>
            </div>
          </Card>

          {dirty && (
            <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-navy-950 px-4 py-3 text-sm text-white shadow-lg">
              <span>Có <strong className="text-gold-hover">{changes}</strong> thay đổi chưa lưu cho vai trò {role.name}</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  icon={Undo2}
                  className="text-slate-300 hover:bg-white/10 hover:text-white"
                  onClick={() => setDraft(new Set(saved))}
                  disabled={saving}
                >
                  Hoàn tác
                </Button>
                <Button size="sm" variant="gold" icon={Save} loading={saving} onClick={save}>Lưu thay đổi</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const GroupRows = ({ group, byResource, editable, locked, isChecked, onToggle, onToggleRow }) => (
  <>
    <tr>
      <td colSpan={ACTION_COLUMNS.length + 2} className="border-b border-stone-200 bg-stone-50/60 px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-gold-dark">
        {group.title}
      </td>
    </tr>
    {group.resources.map((res) => {
      const perms = byResource[res.key];
      const canEdit = editable(res.key);
      const specials = Object.keys(perms).filter((a) => !ACTION_COLUMNS.some((c) => c.key === a));
      return (
        <tr key={res.key} className="border-b border-stone-100 last:border-0">
          <td className="sticky left-0 z-10 w-[45%] min-w-[200px] bg-white px-5 py-3 align-top">
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => onToggleRow(res.key)}
              title={canEdit ? 'Chọn / bỏ cả hàng' : undefined}
              className="text-left font-medium text-navy-950 enabled:hover:text-gold-dark disabled:cursor-default"
            >
              {res.label}
            </button>
            {res.adminOnly && !locked && (
              <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                <Lock className="h-3 w-3" /> Chỉ ADMIN
              </span>
            )}
            {res.hint && <p className="mt-0.5 max-w-md text-xs leading-relaxed text-slate-400">{res.hint}</p>}
          </td>
          {ACTION_COLUMNS.map((col) => (
            <td key={col.key} className="px-2 py-3 text-center align-top">
              {perms[col.key] ? (
                <input
                  type="checkbox"
                  aria-label={`${col.label} ${res.label}`}
                  className={CHECKBOX_CLASS}
                  checked={isChecked(perms[col.key])}
                  disabled={!canEdit}
                  onChange={() => onToggle(res.key, col.key)}
                />
              ) : (
                <span className="text-stone-300">—</span>
              )}
            </td>
          ))}
          <td className="px-3 py-3 align-top">
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {specials.map((action) => (
                <label key={action} className="!mb-0 inline-flex cursor-pointer items-center gap-2 whitespace-nowrap text-xs text-slate-600">
                  <input
                    type="checkbox"
                    className={CHECKBOX_CLASS}
                    checked={isChecked(perms[action])}
                    disabled={!canEdit}
                    onChange={() => onToggle(res.key, action)}
                  />
                  {SPECIAL_ACTIONS[action] || action}
                </label>
              ))}
            </div>
          </td>
        </tr>
      );
    })}
  </>
);

export default AdminPermissions;
