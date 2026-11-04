// Hộp thư liên hệ: thư gửi từ trang Liên hệ của cổng thông tin.
// Bố cục hai khung kiểu hộp thư: danh sách bên trái, nội dung + xử lý bên phải (điện thoại: lần lượt từng khung).
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail, Phone, Trash2, MailOpen, RotateCw, Inbox, Send, CornerDownRight } from 'lucide-react';
import contactService from '../../services/contactService';
import { errorMessage } from '../../services/portalService';
import { useAuth } from '../../contexts/AuthContext';
import useAdminList from '../../hooks/useAdminList';
import useConfirm from '../../hooks/useConfirm';
import {
  PageHeader, Card, Button, IconButton, Field, Select, Textarea, Checkbox, Badge, Tabs, SearchInput, EmptyState, Spinner, Pagination
} from '../../components/admin/ui/AdminUI';
import { formatDate } from '../../components/admin/ui/format';

const STATUS = {
  PENDING: { label: 'Chờ xử lý', tone: 'amber' },
  PROCESSING: { label: 'Đang xử lý', tone: 'blue' },
  COMPLETED: { label: 'Đã xử lý', tone: 'green' },
  CANCELLED: { label: 'Đã đóng', tone: 'gray' }
};
const STATUS_OPTIONS = Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label }));
const TABS = [{ value: '', label: 'Tất cả', countKey: 'ALL' }, ...STATUS_OPTIONS.map((o) => ({ ...o, countKey: o.value }))];

const fetchContacts = (params) => contactService.getContacts(params);

// Hôm nay: giờ; năm nay: ngày/tháng; còn lại: ngày đầy đủ
const shortTime = (value) => {
  const d = new Date(value);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  if (d.getFullYear() === now.getFullYear()) return `${`${d.getDate()}`.padStart(2, '0')}/${`${d.getMonth() + 1}`.padStart(2, '0')}`;
  return formatDate(d);
};

const StatusBadge = ({ status }) => <Badge tone={STATUS[status]?.tone}>{STATUS[status]?.label || status}</Badge>;

// ---------- Danh sách ----------

const ContactRow = ({ contact, active, onSelect }) => (
  <li>
    <button
      type="button"
      onClick={() => onSelect(contact)}
      className={`block w-full border-l-2 px-4 py-3 text-left transition-colors ${
        active ? 'border-brand bg-brand-light/60' : 'border-transparent hover:bg-stone-50'
      }`}
    >
      <div className="flex items-baseline gap-2">
        {!contact.isRead && <span className="h-2 w-2 shrink-0 self-center rounded-full bg-brand" aria-label="Chưa đọc" />}
        <span className={`min-w-0 flex-1 truncate text-sm ${contact.isRead ? 'text-slate-700' : 'font-semibold text-navy-950'}`}>
          {contact.fullName}
        </span>
        <span className="shrink-0 text-xs tabular-nums text-slate-500">{shortTime(contact.createdAt)}</span>
      </div>
      <p className={`mt-0.5 truncate text-sm ${contact.isRead ? 'text-slate-600' : 'font-medium text-navy-950'}`}>
        {contact.subject || '(Không có tiêu đề)'}
      </p>
      <p className="mt-0.5 truncate text-xs text-slate-500">{contact.message}</p>
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
        <StatusBadge status={contact.status} />
        {contact.assignee && <span className="truncate">· {contact.assignee.fullName}</span>}
      </div>
    </button>
  </li>
);

// ---------- Chi tiết ----------

const InfoRow = ({ label, children }) => (
  <div className="flex gap-3 py-1.5 text-sm">
    <dt className="w-24 shrink-0 text-slate-500">{label}</dt>
    <dd className="min-w-0 break-words text-navy-950">{children}</dd>
  </div>
);

const ContactDetail = ({ contact, assignees, onChanged, onDeleted, onBack }) => {
  const { can, user } = useAuth();
  const [confirm, confirmDialog] = useConfirm();
  const [reply, setReply] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [saving, setSaving] = useState('');

  const canUpdate = can('UPDATE_CONTACT');
  const canAssign = can('ASSIGN_CONTACT');
  const canDelete = can('DELETE_CONTACT');

  const run = async (key, action, successText) => {
    setSaving(key);
    try {
      const updated = await action();
      if (successText) toast.success(successText);
      if (updated) onChanged(updated);
      return true;
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
    } finally {
      setSaving('');
    }
  };

  const changeStatus = (status) =>
    run('status', () => contactService.updateContact(contact.id, { status }), `Đã chuyển sang "${STATUS[status].label}"`);

  const assign = (value) =>
    run('assign', () => contactService.assignContact(contact.id, value ? Number(value) : null), value ? 'Đã phân công' : 'Đã bỏ phân công');

  const markUnread = () => run('unread', () => contactService.updateContact(contact.id, { isRead: false }), 'Đã đánh dấu chưa đọc');

  const submitReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return toast.error('Vui lòng nhập nội dung phản hồi');
    const ok = await run(
      'reply',
      () => contactService.updateContact(contact.id, { response: reply.trim(), sendEmail }),
      sendEmail ? `Đã gửi phản hồi tới ${contact.email}` : 'Đã lưu kết quả xử lý'
    );
    if (ok) setReply('');
  };

  const remove = async () => {
    const ok = await confirm({
      title: 'Xóa liên hệ',
      message: `Xóa liên hệ của "${contact.fullName}"? Thao tác này không hoàn tác được.`,
      confirmText: 'Xóa liên hệ'
    });
    if (!ok) return;
    run('delete', async () => {
      await contactService.deleteContact(contact.id);
      onDeleted(contact.id);
    }, 'Đã xóa liên hệ');
  };

  return (
    <div className="flex h-full flex-col">
      {confirmDialog}
      {/* Thanh công cụ */}
      <div className="flex items-center gap-2 border-b border-stone-200 px-4 py-2.5 sm:px-6">
        <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={onBack} className="lg:hidden">Danh sách</Button>
        <span className="hidden text-xs tabular-nums text-slate-500 lg:inline">Mã liên hệ #{contact.id}</span>
        <div className="ml-auto flex items-center gap-1">
          {canUpdate && <IconButton icon={MailOpen} label="Đánh dấu chưa đọc" onClick={markUnread} disabled={!!saving} />}
          {canDelete && <IconButton icon={Trash2} label="Xóa liên hệ" tone="danger" onClick={remove} disabled={!!saving} />}
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6">
        {/* Thư gốc */}
        <section>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="min-w-0 text-lg font-semibold leading-snug text-navy-950">{contact.subject || '(Không có tiêu đề)'}</h3>
            <StatusBadge status={contact.status} />
          </div>
          <dl className="mt-3 border-y border-stone-100 py-2">
            <InfoRow label="Người gửi"><span className="font-medium">{contact.fullName}</span></InfoRow>
            <InfoRow label="Email">
              <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1.5 text-brand hover:underline">
                <Mail className="h-3.5 w-3.5" />{contact.email}
              </a>
            </InfoRow>
            <InfoRow label="Điện thoại">
              <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-1.5 text-brand hover:underline">
                <Phone className="h-3.5 w-3.5" />{contact.phone}
              </a>
            </InfoRow>
            <InfoRow label="Thời gian gửi"><span className="tabular-nums">{formatDate(contact.createdAt, true)}</span></InfoRow>
          </dl>
          <div className="mt-4 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-slate-800">{contact.message}</div>
        </section>

        {/* Phản hồi đã gửi */}
        {contact.response && (
          <section className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <CornerDownRight className="h-3.5 w-3.5" />
              Phản hồi lúc <span className="tabular-nums">{formatDate(contact.respondedAt, true)}</span>
            </p>
            <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">{contact.response}</div>
          </section>
        )}

        {/* Xử lý */}
        {(canUpdate || canAssign) && (
          <section className="grid gap-4 border-t border-stone-200 pt-5 sm:grid-cols-2">
            {canAssign ? (
              <Field label="Cán bộ phụ trách" htmlFor="contact-assignee">
                <Select
                  id="contact-assignee"
                  value={contact.assignedTo || ''}
                  onChange={(e) => assign(e.target.value)}
                  disabled={saving === 'assign'}
                  placeholder="Chưa phân công"
                >
                  {assignees.map((u) => (
                    <option key={u.id} value={u.id}>{u.fullName || u.username}{u.id === user?.id ? ' (tôi)' : ''}</option>
                  ))}
                </Select>
              </Field>
            ) : (
              <Field label="Cán bộ phụ trách"><p className="py-2 text-sm text-navy-950">{contact.assignee?.fullName || 'Chưa phân công'}</p></Field>
            )}
            {canUpdate && (
              <Field label="Trạng thái" htmlFor="contact-status">
                <Select
                  id="contact-status"
                  value={contact.status}
                  onChange={(e) => changeStatus(e.target.value)}
                  disabled={saving === 'status'}
                  options={STATUS_OPTIONS}
                />
              </Field>
            )}
          </section>
        )}

        {canUpdate && (
          <form onSubmit={submitReply} className="space-y-3 [&>div]:!mb-0">
            <Field
              label={contact.response ? 'Phản hồi bổ sung' : 'Phản hồi'}
              htmlFor="contact-reply"
              hint={contact.response ? 'Nội dung mới sẽ thay thế phản hồi đã lưu ở trên.' : undefined}
            >
              <Textarea
                id="contact-reply"
                rows={5}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={`Kính gửi ông/bà ${contact.fullName}, ...`}
              />
            </Field>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Checkbox
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                label={<span>Gửi email tới <span className="font-medium text-navy-950">{contact.email}</span></span>}
              />
              <Button type="submit" icon={sendEmail ? Send : undefined} loading={saving === 'reply'}>
                {sendEmail ? 'Gửi phản hồi' : 'Lưu kết quả xử lý'}
              </Button>
            </div>
            <p className="text-xs text-slate-500">Sau khi phản hồi, liên hệ được chuyển sang "Đã xử lý".</p>
          </form>
        )}
      </div>
    </div>
  );
};

// ---------- Trang ----------

const AdminContacts = () => {
  const { can } = useAuth();
  const list = useAdminList(fetchContacts, { status: '', q: '', unread: '', mine: '' });
  const { items, pagination, counts = {}, loading, filters, setFilter, page, setPage, reload } = list;
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [assignees, setAssignees] = useState([]);

  // Chỉ người có quyền phân công mới cần (và mới được gọi) danh sách cán bộ
  const canAssign = can('ASSIGN_CONTACT');
  useEffect(() => {
    if (!canAssign) return;
    contactService.getAssignees().then(setAssignees).catch(() => setAssignees([]));
  }, [canAssign]);

  // Mở chi tiết: tải bản đầy đủ (server đánh dấu đã đọc)
  const open = useCallback(async (contact) => {
    setSelected(contact);
    setDetailLoading(true);
    try {
      const full = await contactService.getContactById(contact.id);
      setSelected(full);
      if (!contact.isRead) reload();
    } catch (error) {
      toast.error(errorMessage(error));
      setSelected(null);
    } finally {
      setDetailLoading(false);
    }
  }, [reload]);

  const onChanged = (updated) => {
    setSelected(updated);
    reload();
  };

  const onDeleted = () => {
    setSelected(null);
    reload();
  };

  const tabs = TABS.map((t) => ({ value: t.value, label: t.label, count: counts[t.countKey] }));
  const hasFilter = filters.q || filters.unread || filters.mine;

  return (
    <div>
      <PageHeader
        title="Hộp thư liên hệ"
        description="Thư gửi từ trang Liên hệ của cổng thông tin. Phân công cán bộ, theo dõi và phản hồi qua email."
        actions={<Button variant="secondary" icon={RotateCw} onClick={reload}>Làm mới</Button>}
      />

      <Card padded={false} className="overflow-hidden">
        <div className={`px-2 sm:px-4 ${selected ? 'hidden lg:block' : ''}`}>
          <Tabs tabs={tabs} value={filters.status} onChange={(v) => setFilter('status', v)} />
        </div>

        <div className="grid lg:h-[calc(100vh-15rem)] lg:min-h-[560px] lg:grid-cols-[minmax(300px,380px)_1fr]">
          {/* Khung danh sách */}
          <div className={`flex min-h-0 flex-col border-stone-200 lg:border-r ${selected ? 'hidden lg:flex' : 'flex'}`}>
            <div className="space-y-2.5 border-b border-stone-200 p-3">
              <SearchInput value={filters.q} onChange={(v) => setFilter('q', v)} placeholder="Tìm tên, email, SĐT, nội dung…" />
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-0.5">
                <Checkbox
                  checked={filters.unread === '1'}
                  onChange={(e) => setFilter('unread', e.target.checked ? '1' : '')}
                  label={<>Chưa đọc{counts.UNREAD ? <span className="ml-1 tabular-nums text-slate-500">({counts.UNREAD})</span> : null}</>}
                />
                <Checkbox checked={filters.mine === '1'} onChange={(e) => setFilter('mine', e.target.checked ? '1' : '')} label="Giao cho tôi" />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading && !items.length ? (
                <div className="flex justify-center py-12"><Spinner /></div>
              ) : items.length ? (
                <ul className={`divide-y divide-stone-100 ${loading ? 'opacity-60' : ''}`}>
                  {items.map((c) => (
                    <ContactRow key={c.id} contact={c} active={selected?.id === c.id} onSelect={open} />
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={Inbox}
                  title={hasFilter || filters.status ? 'Không có liên hệ phù hợp' : 'Chưa có liên hệ nào'}
                  description={hasFilter || filters.status ? 'Thử bỏ bớt bộ lọc hoặc đổi từ khóa.' : 'Thư người dân gửi từ trang Liên hệ sẽ hiển thị tại đây.'}
                />
              )}
            </div>
            <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} onChange={setPage} />
          </div>

          {/* Khung chi tiết */}
          <div className={`min-h-0 ${selected ? 'block' : 'hidden lg:block'}`}>
            {selected ? (
              detailLoading && !selected.message ? (
                <div className="flex justify-center py-16"><Spinner /></div>
              ) : (
                <ContactDetail
                  key={selected.id}
                  contact={selected}
                  assignees={assignees}
                  onChanged={onChanged}
                  onDeleted={onDeleted}
                  onBack={() => setSelected(null)}
                />
              )
            ) : (
              <div className="flex h-full items-center justify-center">
                <EmptyState icon={Mail} title="Chọn một liên hệ để xem" description="Nội dung thư, thông tin người gửi và phần xử lý sẽ hiển thị tại đây." />
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminContacts;
