// Ban Chủ nhiệm / Hội đồng khen thưởng, kỷ luật theo nhiệm kỳ
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, ArrowUp, ArrowDown, Users, Save, UserPlus, X } from 'lucide-react';
import { termApi, lawyerApi, assetUrl, errorMessage } from '../../services/portalService';
import usePortalMeta from '../../hooks/usePortalMeta';
import useConfirm from '../../hooks/useConfirm';
import {
  PageHeader, Card, Button, IconButton, Field, Input, Textarea, Select, Toggle, Badge, EmptyState, Spinner, Modal
} from '../../components/admin/ui/AdminUI';
import { ImageField } from '../../components/admin/ui/FileFields';

const BOARDS = ['EXECUTIVE_BOARD', 'REWARD_DISCIPLINE_COUNCIL'];

const EMPTY_TERM = {
  name: '', startYear: '', endYear: '', isCurrent: false, description: '', coverImage: '', members: []
};

const newMember = (board) => ({
  key: `${Date.now()}-${Math.random()}`,
  board, fullName: '', position: 'MEMBER', positionTitle: '', lawyerId: '', photo: ''
});

const toForm = (term) => ({
  name: term.name || '',
  startYear: term.startYear ?? '',
  endYear: term.endYear ?? '',
  isCurrent: !!term.isCurrent,
  description: term.description || '',
  coverImage: term.coverImage || '',
  members: (term.members || []).map((m) => ({
    key: `m-${m.id}`,
    board: m.board,
    fullName: m.fullName,
    position: m.position,
    positionTitle: m.positionTitle || '',
    lawyerId: m.lawyerId ?? '',
    photo: m.photo || ''
  }))
});

// Ảnh thành viên nhỏ: bấm để mở hộp chọn ảnh
const MemberPhoto = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-stone-200 bg-stone-50 text-slate-400 hover:border-gold"
        title="Ảnh thành viên"
      >
        {value ? <img src={assetUrl(value)} alt="" className="h-full w-full object-cover" /> : <UserPlus className="h-5 w-5" />}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} size="sm" title="Ảnh thành viên"
        footer={<Button onClick={() => setOpen(false)}>Xong</Button>}
      >
        <ImageField value={value} onChange={onChange} aspect="aspect-square" className="mx-auto max-w-[220px]" />
      </Modal>
    </>
  );
};

const TermEditor = ({ termId, lawyers, onSaved, onDeleted }) => {
  const { options } = usePortalMeta();
  const [form, setForm] = useState(EMPTY_TERM);
  const [loading, setLoading] = useState(!!termId);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [confirm, confirmDialog] = useConfirm();

  useEffect(() => {
    if (!termId) return;
    let alive = true;
    termApi
      .get(termId)
      .then((term) => alive && setForm(toForm(term)))
      .catch((error) => toast.error(errorMessage(error, 'Không tải được nhiệm kỳ')))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [termId]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value?.target ? value.target.value : value }));

  const updateMember = (key, patch) =>
    setForm((f) => ({ ...f, members: f.members.map((m) => (m.key === key ? { ...m, ...patch } : m)) }));

  const linkLawyer = (member, lawyerId) => {
    const lawyer = lawyers.find((l) => `${l.id}` === `${lawyerId}`);
    updateMember(member.key, {
      lawyerId,
      ...(lawyer && !member.fullName && { fullName: lawyer.name }),
      ...(lawyer && !member.photo && lawyer.avatar && { photo: lawyer.avatar })
    });
  };

  // Đổi chỗ trong cùng một ban
  const moveMember = (member, delta) =>
    setForm((f) => {
      const board = f.members.filter((m) => m.board === member.board);
      const idx = board.findIndex((m) => m.key === member.key);
      const target = board[idx + delta];
      if (!target) return f;
      const members = [...f.members];
      const a = members.findIndex((m) => m.key === member.key);
      const b = members.findIndex((m) => m.key === target.key);
      [members[a], members[b]] = [members[b], members[a]];
      return { ...f, members };
    });

  const save = async () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Nhập tên nhiệm kỳ';
    if (!form.startYear) next.startYear = 'Nhập năm bắt đầu';
    if (form.endYear && Number(form.endYear) < Number(form.startYear)) next.endYear = 'Năm kết thúc phải sau năm bắt đầu';
    if (form.members.some((m) => !m.fullName.trim())) next.members = 'Có thành viên chưa nhập họ tên';
    setErrors(next);
    if (Object.keys(next).length) {
      toast.error('Vui lòng kiểm tra lại thông tin');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        endYear: form.endYear || null,
        members: BOARDS.flatMap((board) =>
          form.members
            .filter((m) => m.board === board)
            .map((m, order) => ({
              board: m.board,
              fullName: m.fullName,
              position: m.position,
              positionTitle: m.positionTitle,
              photo: m.photo,
              lawyerId: m.lawyerId || null,
              order
            }))
        )
      };
      const saved = termId ? await termApi.update(termId, payload) : await termApi.create(payload);
      toast.success(termId ? 'Đã cập nhật nhiệm kỳ' : 'Đã tạo nhiệm kỳ');
      onSaved(saved.id);
    } catch (error) {
      toast.error(errorMessage(error, 'Lưu nhiệm kỳ thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const ok = await confirm({
      title: 'Xoá nhiệm kỳ',
      message: `Xoá "${form.name}" cùng toàn bộ danh sách thành viên? Thao tác này không thể hoàn tác.`,
      confirmText: 'Xoá nhiệm kỳ'
    });
    if (!ok) return;
    try {
      await termApi.remove(termId);
      toast.success('Đã xoá nhiệm kỳ');
      onDeleted();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  const lawyerOptions = lawyers.map((l) => ({ value: l.id, label: l.name }));

  return (
    <div className="space-y-5">
      <Card
        title={termId ? 'Thông tin nhiệm kỳ' : 'Nhiệm kỳ mới'}
        actions={
          <div className="flex gap-2">
            {termId && <Button variant="ghost" size="sm" icon={Trash2} onClick={remove}>Xoá</Button>}
            <Button variant="gold" size="sm" icon={Save} loading={saving} onClick={save}>Lưu nhiệm kỳ</Button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="space-y-4">
            <Field label="Tên nhiệm kỳ" required error={errors.name}>
              <Input value={form.name} onChange={set('name')} placeholder="Ví dụ: Nhiệm kỳ V (2022 - 2027)" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Năm bắt đầu" required error={errors.startYear}>
                <Input type="number" value={form.startYear} onChange={set('startYear')} />
              </Field>
              <Field label="Năm kết thúc" error={errors.endYear}>
                <Input type="number" value={form.endYear} onChange={set('endYear')} />
              </Field>
            </div>
            <Toggle
              checked={form.isCurrent}
              onChange={set('isCurrent')}
              label="Nhiệm kỳ hiện tại"
              description="Chỉ một nhiệm kỳ được đánh dấu hiện tại; bật ở đây sẽ tự bỏ đánh dấu nhiệm kỳ khác"
            />
            <Field label="Giới thiệu">
              <Textarea value={form.description} onChange={set('description')} rows={3} />
            </Field>
          </div>
          <Field label="Ảnh bìa">
            <ImageField value={form.coverImage} onChange={set('coverImage')} />
          </Field>
        </div>
      </Card>

      {errors.members && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{errors.members}</div>
      )}

      {BOARDS.map((board) => {
        const members = form.members.filter((m) => m.board === board);
        return (
          <Card
            key={board}
            title={`${options('boardType').find((o) => o.value === board)?.label || board} (${members.length})`}
            actions={
              <Button variant="secondary" size="sm" icon={Plus} onClick={() => setForm((f) => ({ ...f, members: [...f.members, newMember(board)] }))}>
                Thêm thành viên
              </Button>
            }
            padded={false}
          >
            {members.length ? (
              <ul className="divide-y divide-stone-100">
                {members.map((m, i) => (
                  <li key={m.key} className="flex flex-col gap-3 px-5 py-3 lg:flex-row lg:items-center">
                    <MemberPhoto value={m.photo} onChange={(photo) => updateMember(m.key, { photo })} />
                    <div className="grid flex-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      <Input value={m.fullName} onChange={(e) => updateMember(m.key, { fullName: e.target.value })} placeholder="Họ và tên *" />
                      <Select value={m.position} onChange={(e) => updateMember(m.key, { position: e.target.value })} options={options('boardPosition')} />
                      <Input value={m.positionTitle} onChange={(e) => updateMember(m.key, { positionTitle: e.target.value })} placeholder="Chức danh hiển thị (tuỳ chọn)" />
                      <Select value={m.lawyerId} onChange={(e) => linkLawyer(m, e.target.value)} options={lawyerOptions} placeholder="— Liên kết luật sư —" />
                    </div>
                    <div className="flex shrink-0 justify-end">
                      <IconButton icon={ArrowUp} label="Lên" disabled={i === 0} onClick={() => moveMember(m, -1)} />
                      <IconButton icon={ArrowDown} label="Xuống" disabled={i === members.length - 1} onClick={() => moveMember(m, 1)} />
                      <IconButton icon={X} label="Bỏ thành viên" tone="danger" onClick={() => setForm((f) => ({ ...f, members: f.members.filter((x) => x.key !== m.key) }))} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-6 text-center text-sm text-slate-400">Chưa có thành viên</p>
            )}
          </Card>
        );
      })}

      {confirmDialog}
    </div>
  );
};

const TermsManager = () => {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lawyers, setLawyers] = useState([]);
  const [selected, setSelected] = useState(null); // null | 'new' | id
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    termApi
      .list()
      .then((data) => {
        if (!alive) return;
        setTerms(data);
        setSelected((cur) => cur ?? data[0]?.id ?? 'new');
      })
      .catch((error) => toast.error(errorMessage(error, 'Không tải được danh sách nhiệm kỳ')))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [version]);

  useEffect(() => {
    lawyerApi.all().then(setLawyers).catch(() => {});
  }, []);

  const handleSaved = useCallback((id) => {
    setSelected(id);
    setVersion((v) => v + 1);
  }, []);

  const handleDeleted = useCallback(() => {
    setSelected(null);
    setVersion((v) => v + 1);
  }, []);

  return (
    <div>
      <PageHeader
        title="Ban Chủ nhiệm các nhiệm kỳ"
        description="Danh sách Ban Chủ nhiệm và Hội đồng khen thưởng, kỷ luật theo từng nhiệm kỳ."
        actions={<Button variant="gold" icon={Plus} onClick={() => setSelected('new')}>Thêm nhiệm kỳ</Button>}
      />

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card padded={false} className="h-fit">
          {loading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : terms.length ? (
            <ul className="divide-y divide-stone-100">
              {terms.map((term) => (
                <li key={term.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(term.id)}
                    className={`w-full px-4 py-3 text-left transition-colors ${selected === term.id ? 'bg-gold/10' : 'hover:bg-stone-50'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-navy-950">{term.name}</span>
                      {term.isCurrent && <Badge tone="gold">Hiện tại</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {term.startYear}{term.endYear ? ` – ${term.endYear}` : ''} · {term._count?.members || 0} thành viên
                    </p>
                    {term.chairman && <p className="mt-0.5 truncate text-xs text-slate-400">Chủ nhiệm: {term.chairman}</p>}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Users} title="Chưa có nhiệm kỳ" />
          )}
        </Card>

        {selected && (
          <TermEditor
            key={selected}
            termId={selected === 'new' ? null : selected}
            lawyers={lawyers}
            onSaved={handleSaved}
            onDeleted={handleDeleted}
          />
        )}
      </div>
    </div>
  );
};

export default TermsManager;
