// Quản lý lịch công tác, lịch họp, bồi dưỡng dùng chung cho admin và nhân viên.
// Nhân viên được tạo/sửa nhưng không được xoá.
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, ExternalLink, CalendarDays, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { eventApi, postApi, errorMessage } from '../../services/portalService';
import usePortalMeta from '../../hooks/usePortalMeta';
import useAdminList from '../../hooks/useAdminList';
import useConfirm from '../../hooks/useConfirm';
import {
  PageHeader, Card, Button, IconButton, Field, Input, Textarea, Select, Toggle, Badge, Table, Pagination,
  SearchInput, EmptyState, Modal, Form
} from '../../components/admin/ui/AdminUI';
import { formatDate, toInputDate } from '../../components/admin/ui/format';
import { portalRoutes } from '../../utils/portalRoutes';

const TYPE_TONE = { MEETING: 'navy', WORK_SCHEDULE: 'blue', TRAINING: 'gold', EXAM: 'amber', CONFERENCE: 'green', OTHER: 'gray' };

const EMPTY_EVENT = {
  title: '', type: 'WORK_SCHEDULE', startAt: '', endAt: '', location: '', description: '',
  registrationUrl: '', registrationDeadline: '', postId: '', isPublished: true
};

const toForm = (event) => ({
  ...EMPTY_EVENT,
  ...Object.fromEntries(Object.entries(event).filter(([, v]) => v !== null)),
  startAt: toInputDate(event.startAt, true),
  endAt: toInputDate(event.endAt, true),
  registrationDeadline: toInputDate(event.registrationDeadline, true),
  postId: event.postId ?? ''
});

const EventForm = ({ event, posts, onClose }) => {
  const { options } = usePortalMeta();
  const [form, setForm] = useState(() => (event ? toForm(event) : EMPTY_EVENT));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value?.target ? value.target.value : value }));

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = 'Nhập tên sự kiện';
    if (!form.startAt) next.startAt = 'Chọn thời gian bắt đầu';
    if (form.startAt && form.endAt && form.endAt < form.startAt) next.endAt = 'Thời gian kết thúc phải sau thời gian bắt đầu';
    setErrors(next);
    return !Object.keys(next).length;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const { title, type, startAt, endAt, location, description, registrationUrl, registrationDeadline, postId, isPublished } = form;
      const payload = {
        title, type, location, description, registrationUrl, isPublished, postId,
        // datetime-local là giờ địa phương; gửi ISO để backend lưu đúng múi giờ
        startAt: new Date(startAt).toISOString(),
        endAt: endAt ? new Date(endAt).toISOString() : '',
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline).toISOString() : ''
      };
      if (event) await eventApi.update(event.id, payload);
      else await eventApi.create(payload);
      toast.success(event ? 'Đã cập nhật sự kiện' : 'Đã thêm sự kiện');
      onClose(true);
    } catch (error) {
      toast.error(errorMessage(error, 'Lưu sự kiện thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const postOptions = posts.map((p) => ({ value: p.id, label: p.title }));
  // Bài đang gắn có thể không nằm trong 50 bài gần nhất
  if (event?.post && !posts.some((p) => p.id === event.post.id)) postOptions.unshift({ value: event.post.id, label: event.post.title });

  return (
    <Modal
      open
      onClose={() => onClose(false)}
      size="lg"
      title={event ? 'Sửa sự kiện' : 'Thêm sự kiện'}
      footer={
        <>
          <Button variant="secondary" onClick={() => onClose(false)}>Huỷ</Button>
          <Button variant="gold" type="submit" form="event-form" loading={saving}>Lưu</Button>
        </>
      }
    >
      <Form id="event-form" onSubmit={submit} className="space-y-4">
        <Field label="Tên sự kiện" required error={errors.title}>
          <Input value={form.title} onChange={set('title')} placeholder="Ví dụ: Họp Ban Chủ nhiệm tháng 11" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Loại">
            <Select value={form.type} onChange={set('type')} options={options('eventType')} />
          </Field>
          <Field label="Địa điểm">
            <Input value={form.location} onChange={set('location')} placeholder="Trụ sở Đoàn Luật sư" />
          </Field>
          <Field label="Bắt đầu" required error={errors.startAt}>
            <Input type="datetime-local" value={form.startAt} onChange={set('startAt')} />
          </Field>
          <Field label="Kết thúc" error={errors.endAt}>
            <Input type="datetime-local" value={form.endAt} onChange={set('endAt')} />
          </Field>
        </div>
        <Field label="Mô tả">
          <Textarea value={form.description} onChange={set('description')} rows={3} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Link đăng ký" hint="Nếu sự kiện cần đăng ký tham dự">
            <Input value={form.registrationUrl} onChange={set('registrationUrl')} placeholder="https://..." />
          </Field>
          <Field label="Hạn đăng ký">
            <Input type="datetime-local" value={form.registrationDeadline} onChange={set('registrationDeadline')} />
          </Field>
        </div>
        <Field label="Bài thông báo liên quan">
          <Select value={form.postId} onChange={set('postId')} options={postOptions} placeholder="Không gắn bài viết" />
        </Field>
        <Toggle checked={form.isPublished} onChange={set('isPublished')} label="Hiển thị trên cổng thông tin" />
      </Form>
    </Modal>
  );
};

const EventsManager = () => {
  const { isAdmin } = useAuth();
  const { label, options } = usePortalMeta();
  const [editing, setEditing] = useState(null); // null | 'new' | event
  const [posts, setPosts] = useState([]);
  const [confirm, confirmDialog] = useConfirm();

  const { items, pagination, loading, filters, setFilter, page, setPage, reload } = useAdminList(eventApi.manage, {
    q: '', type: '', upcoming: ''
  });

  useEffect(() => {
    postApi.manage({ status: 'PUBLISHED', limit: 50 }).then((data) => setPosts(data.items || [])).catch(() => {});
  }, []);

  const remove = async (event) => {
    const ok = await confirm({
      title: 'Xoá sự kiện',
      message: `Xoá "${event.title}" khỏi lịch công tác?`,
      confirmText: 'Xoá sự kiện'
    });
    if (!ok) return;
    try {
      await eventApi.remove(event.id);
      toast.success('Đã xoá sự kiện');
      reload();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const closeForm = (changed) => {
    setEditing(null);
    if (changed) reload();
  };

  const columns = [
    {
      key: 'time',
      header: 'Thời gian',
      className: 'whitespace-nowrap',
      render: (event) => (
        <div>
          <div className="font-medium text-navy-950">{formatDate(event.startAt, true)}</div>
          {event.endAt && <div className="text-xs text-slate-400">đến {formatDate(event.endAt, true)}</div>}
        </div>
      )
    },
    {
      key: 'title',
      header: 'Sự kiện',
      render: (event) => (
        <div className="min-w-[240px]">
          <button type="button" onClick={() => setEditing(event)} className="line-clamp-2 text-left font-medium text-navy-950 hover:text-gold-dark">
            {event.title}
          </button>
          {event.location && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-400">
              <MapPin className="h-3 w-3 shrink-0" /> {event.location}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'type',
      header: 'Loại',
      render: (event) => <Badge tone={TYPE_TONE[event.type]}>{label('eventType', event.type)}</Badge>
    },
    {
      key: 'registration',
      header: 'Hạn đăng ký',
      className: 'whitespace-nowrap text-slate-500',
      render: (event) => (event.registrationDeadline ? formatDate(event.registrationDeadline, true) : '—')
    },
    {
      key: 'isPublished',
      header: 'Công khai',
      render: (event) => (event.isPublished ? <Badge tone="green">Công khai</Badge> : <Badge>Ẩn</Badge>)
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (event) => (
        <div className="flex justify-end gap-0.5">
          {event.isPublished && (
            <IconButton icon={ExternalLink} label="Xem trên trang" onClick={() => window.open(portalRoutes.event(event.slug), '_blank')} />
          )}
          <IconButton icon={Pencil} label="Sửa" onClick={() => setEditing(event)} />
          {isAdmin && <IconButton icon={Trash2} label="Xoá" tone="danger" onClick={() => remove(event)} />}
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Lịch công tác"
        description="Lịch họp, lịch công tác, bồi dưỡng nghiệp vụ và kiểm tra tập sự."
        actions={<Button variant="gold" icon={Plus} onClick={() => setEditing('new')}>Thêm sự kiện</Button>}
      />

      <Card padded={false}>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <SearchInput value={filters.q} onChange={(v) => setFilter('q', v)} placeholder="Tìm theo tên sự kiện..." className="sm:w-80" />
          <Select
            value={filters.type}
            onChange={(e) => setFilter('type', e.target.value)}
            options={options('eventType')}
            placeholder="Tất cả loại"
            className="sm:w-60"
          />
          <Toggle checked={filters.upcoming === 'true'} onChange={(v) => setFilter('upcoming', v ? 'true' : '')} label="Sắp diễn ra" />
        </div>
        <Table
          columns={columns}
          rows={items}
          loading={loading}
          empty={
            <EmptyState
              icon={CalendarDays}
              title={filters.q || filters.type || filters.upcoming ? 'Không có sự kiện phù hợp' : 'Chưa có sự kiện'}
            />
          }
        />
        <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} onChange={setPage} />
      </Card>

      {editing && <EventForm event={editing === 'new' ? null : editing} posts={posts} onClose={closeForm} />}
      {confirmDialog}
    </div>
  );
};

export default EventsManager;
