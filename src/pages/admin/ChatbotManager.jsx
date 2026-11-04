// Quản trị trợ lý ảo: câu hỏi thường gặp (nguồn ưu tiên cao nhất) + cấu hình lời chào/gợi ý + tình trạng kho tri thức
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Eye, EyeOff, MessageSquareText, ExternalLink, Database, Activity } from 'lucide-react';
import chatbotService from '../../services/chatbotService';
import { errorMessage } from '../../services/portalService';
import { useAuth } from '../../contexts/AuthContext';
import useAdminList from '../../hooks/useAdminList';
import useConfirm from '../../hooks/useConfirm';
import {
  PageHeader, Card, Button, IconButton, Field, Input, Textarea, Checkbox, Toggle, Badge, Tabs, Table, Pagination,
  SearchInput, EmptyState, Spinner, Modal, Form
} from '../../components/admin/ui/AdminUI';
import { formatDate } from '../../components/admin/ui/format';

const fetchFaqs = (params) => chatbotService.listFaqs(params);
const EMPTY_FAQ = { question: '', keywords: '', topic: '', answer: '', order: 0, isPublished: false };

// ---------- Form câu hỏi ----------

const FaqForm = ({ faq, canPublish, onClose, onSaved }) => {
  const [form, setForm] = useState(() => (faq ? { ...EMPTY_FAQ, ...Object.fromEntries(Object.keys(EMPTY_FAQ).map((k) => [k, faq[k] ?? EMPTY_FAQ[k]])) } : EMPTY_FAQ));
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, order: Number(form.order) || 0 };
      if (!canPublish) delete payload.isPublished;
      if (faq) await chatbotService.updateFaq(faq.id, payload);
      else await chatbotService.createFaq(payload);
      toast.success(faq ? 'Đã lưu câu hỏi' : 'Đã thêm câu hỏi');
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
      size="lg"
      onClose={onClose}
      title={faq ? 'Sửa câu hỏi thường gặp' : 'Thêm câu hỏi thường gặp'}
      description="Trợ lý trích dẫn nguyên văn câu trả lời này, vì vậy nội dung cần được Văn phòng Đoàn kiểm tra trước khi hiển thị."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button type="submit" form="faq-form" loading={saving}>{faq ? 'Lưu thay đổi' : 'Thêm câu hỏi'}</Button>
        </>
      }
    >
      <Form id="faq-form" onSubmit={submit} className="space-y-4">
        <Field label="Câu hỏi" required htmlFor="faq-question">
          <Input id="faq-question" value={form.question} onChange={set('question')} maxLength={300} placeholder="VD: Hồ sơ gia nhập Đoàn Luật sư gồm những gì?" required />
        </Field>
        <Field label="Cách hỏi khác / từ khóa" htmlFor="faq-keywords" hint="Cách nhau bởi dấu phẩy, giúp trợ lý nhận ra câu hỏi khi người dân hỏi theo cách khác.">
          <Input id="faq-keywords" value={form.keywords || ''} onChange={set('keywords')} maxLength={500} placeholder="xin vào đoàn, thủ tục kết nạp, giấy tờ gia nhập" />
        </Field>
        <Field label="Câu trả lời" required htmlFor="faq-answer" hint="Viết rõ ràng, đầy đủ căn cứ (số hiệu văn bản, điều khoản nếu có). Tối đa 5.000 ký tự.">
          <Textarea id="faq-answer" rows={8} value={form.answer} onChange={set('answer')} maxLength={5000} required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_140px]">
          <Field label="Chủ đề" htmlFor="faq-topic">
            <Input id="faq-topic" value={form.topic || ''} onChange={set('topic')} maxLength={100} placeholder="VD: Gia nhập Đoàn" />
          </Field>
          <Field label="Thứ tự" htmlFor="faq-order">
            <Input id="faq-order" type="number" value={form.order} onChange={set('order')} />
          </Field>
        </div>
        {canPublish ? (
          <Checkbox checked={form.isPublished} onChange={set('isPublished')} label="Đã duyệt — cho trợ lý dùng câu trả lời này" />
        ) : (
          <p className="text-xs text-slate-500">Câu hỏi được lưu ở trạng thái chờ duyệt. Người có quyền sửa trợ lý ảo sẽ duyệt trước khi trợ lý sử dụng.</p>
        )}
      </Form>
    </Modal>
  );
};

// ---------- Tab câu hỏi thường gặp ----------

const FaqTab = () => {
  const { can } = useAuth();
  const perms = { create: can('CREATE_CHATBOT'), update: can('UPDATE_CHATBOT'), remove: can('DELETE_CHATBOT') };
  const [confirm, confirmDialog] = useConfirm();
  const list = useAdminList(fetchFaqs, { q: '', status: '' });
  const { items, pagination, counts = {}, loading, filters, setFilter, page, setPage, reload } = list;
  const [editing, setEditing] = useState(null);

  const togglePublish = async (faq) => {
    try {
      await chatbotService.updateFaq(faq.id, { isPublished: !faq.isPublished });
      toast.success(faq.isPublished ? 'Đã ẩn khỏi trợ lý' : 'Đã duyệt, trợ lý bắt đầu sử dụng');
      reload();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const remove = async (faq) => {
    const ok = await confirm({ title: 'Xóa câu hỏi', message: `Xóa câu hỏi "${faq.question}"?`, confirmText: 'Xóa câu hỏi' });
    if (!ok) return;
    try {
      await chatbotService.deleteFaq(faq.id);
      toast.success('Đã xóa câu hỏi');
      reload();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const columns = [
    {
      key: 'question',
      header: 'Câu hỏi',
      render: (f) => (
        <div className="min-w-0 max-w-xl">
          <p className="font-medium text-navy-950">{f.question}</p>
          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{f.answer}</p>
        </div>
      )
    },
    { key: 'topic', header: 'Chủ đề', render: (f) => f.topic || '—', className: 'hidden md:table-cell', headerClassName: 'hidden md:table-cell' },
    { key: 'status', header: 'Trạng thái', render: (f) => (f.isPublished ? <Badge tone="green" dot>Đã duyệt</Badge> : <Badge tone="amber" dot>Chờ duyệt</Badge>) },
    { key: 'updatedAt', header: 'Cập nhật', render: (f) => <span className="tabular-nums">{formatDate(f.updatedAt)}</span>, className: 'hidden sm:table-cell', headerClassName: 'hidden sm:table-cell' },
    {
      key: 'actions',
      header: '',
      className: 'w-px whitespace-nowrap text-right',
      render: (f) => (
        <div className="flex justify-end gap-0.5">
          {perms.update && <IconButton icon={f.isPublished ? EyeOff : Eye} label={f.isPublished ? 'Ẩn khỏi trợ lý' : 'Duyệt'} onClick={() => togglePublish(f)} />}
          {perms.update && <IconButton icon={Pencil} label="Sửa" onClick={() => setEditing(f)} />}
          {perms.remove && <IconButton icon={Trash2} label="Xóa" tone="danger" onClick={() => remove(f)} />}
        </div>
      )
    }
  ];

  return (
    <>
      {confirmDialog}
      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {[['', 'Tất cả', counts.all], ['published', 'Đã duyệt', counts.published], ['draft', 'Chờ duyệt', counts.draft]].map(([value, label, count]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter('status', value)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${filters.status === value ? 'bg-navy-950 text-white' : 'bg-stone-100 text-slate-600 hover:bg-stone-200'}`}
              >
                {label}{count !== undefined && <span className="ml-1 tabular-nums opacity-70">{count}</span>}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <SearchInput value={filters.q} onChange={(v) => setFilter('q', v)} placeholder="Tìm câu hỏi…" className="w-full sm:w-64" />
            {perms.create && <Button icon={Plus} onClick={() => setEditing('new')}>Thêm</Button>}
          </div>
        </div>
        <Table
          columns={columns}
          rows={items}
          loading={loading}
          empty={
            <EmptyState
              icon={MessageSquareText}
              title={filters.q || filters.status ? 'Không có câu hỏi phù hợp' : 'Chưa có câu hỏi thường gặp'}
              description="Câu hỏi đã duyệt là nguồn trả lời đáng tin nhất của trợ lý. Nên bắt đầu với các thủ tục người dân hay hỏi: gia nhập Đoàn, tập sự, cấp thẻ, tiếp công dân."
              action={perms.create && !filters.q && <Button icon={Plus} onClick={() => setEditing('new')}>Thêm câu hỏi đầu tiên</Button>}
            />
          }
        />
        <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} onChange={setPage} />
      </Card>
      {editing && (
        <FaqForm
          faq={editing === 'new' ? null : editing}
          canPublish={perms.update}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </>
  );
};

// ---------- Tab cấu hình & tình trạng ----------

const SOURCE_LABELS = { faq: 'Câu hỏi thường gặp', document: 'Văn bản', post: 'Bài viết', page: 'Trang giới thiệu', event: 'Lịch công tác', contact: 'Thông tin liên hệ' };

const SettingsTab = () => {
  const { can } = useAuth();
  const canUpdate = can('UPDATE_CHATBOT');
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    chatbotService
      .getStatus()
      .then((data) => {
        if (!alive) return;
        setStatus(data);
        setForm({ enabled: data.config.enabled, greeting: data.config.greeting, suggestions: [...data.config.suggestions, '', '', '', '', '', ''].slice(0, 6) });
      })
      .catch((error) => toast.error(errorMessage(error)));
    return () => {
      alive = false;
    };
  }, [version]);

  const save = useCallback(async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await chatbotService.updateSettings({ ...form, suggestions: form.suggestions.filter((s) => s.trim()) });
      toast.success('Đã lưu cấu hình trợ lý ảo');
      setVersion((v) => v + 1);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }, [form]);

  if (!status || !form) return <div className="flex justify-center py-16"><Spinner /></div>;
  const t = status.today;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card title="Cấu hình hiển thị">
        <Form onSubmit={save} className="space-y-5">
          <Toggle
            checked={form.enabled}
            disabled={!canUpdate}
            onChange={(v) => setForm((f) => ({ ...f, enabled: v }))}
            label="Bật trợ lý ảo trên cổng thông tin"
            description="Tắt để ẩn nút hỏi đáp ở mọi trang công khai."
          />
          <Field label="Lời chào" htmlFor="bot-greeting">
            <Textarea id="bot-greeting" rows={3} maxLength={500} disabled={!canUpdate} value={form.greeting} onChange={(e) => setForm((f) => ({ ...f, greeting: e.target.value }))} />
          </Field>
          <Field label="Câu hỏi gợi ý" hint="Tối đa 6 câu, hiện khi người dân mở khung hỏi đáp lần đầu. Nên trùng với câu hỏi thường gặp đã duyệt.">
            <div className="space-y-2">
              {form.suggestions.map((s, i) => (
                <Input
                  key={i}
                  value={s}
                  maxLength={120}
                  disabled={!canUpdate}
                  placeholder={`Gợi ý ${i + 1}`}
                  onChange={(e) => setForm((f) => ({ ...f, suggestions: f.suggestions.map((x, j) => (j === i ? e.target.value : x)) }))}
                />
              ))}
            </div>
          </Field>
          {canUpdate && <div className="flex justify-end"><Button type="submit" loading={saving}>Lưu cấu hình</Button></div>}
        </Form>
      </Card>

      <div className="space-y-6">
        <Card title={<span className="inline-flex items-center gap-2"><Database className="h-4 w-4 text-slate-400" />Kho tri thức</span>}>
          <dl className="space-y-1.5 text-sm">
            {Object.entries(SOURCE_LABELS).map(([key, label]) => (
              <div key={key} className="flex justify-between">
                <dt className="text-slate-500">{label}</dt>
                <dd className="tabular-nums text-navy-950">{status.index.sources[key] || 0}</dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-stone-100 pt-1.5">
              <dt className="text-slate-500">Đoạn đã lập chỉ mục</dt>
              <dd className="tabular-nums font-semibold text-navy-950">{status.index.chunks}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Trợ lý chỉ dùng nội dung đã xuất bản và tự cập nhật khi nội dung thay đổi. Trang có nội dung “đang cập nhật” sẽ không giúp trả lời được.
            {status.index.builtAt && <> Lập chỉ mục lúc <span className="tabular-nums">{formatDate(status.index.builtAt, true)}</span>.</>}
          </p>
        </Card>

        <Card title={<span className="inline-flex items-center gap-2"><Activity className="h-4 w-4 text-slate-400" />Hôm nay</span>}>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-slate-500">Câu hỏi</dt><dd className="text-right tabular-nums text-navy-950">{t.questions}</dd>
            <dt className="text-slate-500">Trả lời có nguồn</dt><dd className="text-right tabular-nums text-navy-950">{t.answered}</dd>
            <dt className="text-slate-500">Tra cứu luật sư/tổ chức</dt><dd className="text-right tabular-nums text-navy-950">{t.lookups}</dd>
            <dt className="text-slate-500">Chưa có thông tin</dt><dd className="text-right tabular-nums text-navy-950">{t.noInfo}</dd>
            <dt className="text-slate-500">Ngoài phạm vi</dt><dd className="text-right tabular-nums text-navy-950">{t.outOfScope}</dd>
            <dt className="text-slate-500">Lượt dùng AI</dt><dd className="text-right tabular-nums text-navy-950">{t.aiCalls} / {t.dailyAiLimit}</dd>
          </dl>
          {!t.aiConfigured && <p className="mt-3 text-xs text-amber-700">Chưa cấu hình GEMINI_API_KEY: trợ lý chỉ trả danh sách nguồn liên quan.</p>}
          <p className="mt-3 text-xs text-slate-500">Số liệu tính từ lần khởi động server gần nhất; nhật ký hội thoại chưa được lưu.</p>
          <Button variant="secondary" size="sm" icon={ExternalLink} className="mt-3" onClick={() => window.open('/', '_blank', 'noopener')}>Mở cổng để thử trợ lý</Button>
        </Card>
      </div>
    </div>
  );
};

// ---------- Trang ----------

const ChatbotManager = () => {
  const [tab, setTab] = useState('faq');
  return (
    <div>
      <PageHeader
        title="Trợ lý ảo"
        description="Trợ lý hỏi đáp pháp luật trên cổng thông tin. Chỉ trả lời từ nội dung chính thức đã xuất bản, có trích nguồn; câu hỏi thường gặp đã duyệt được ưu tiên hàng đầu."
      />
      <div className="mb-5">
        <Tabs tabs={[{ value: 'faq', label: 'Câu hỏi thường gặp' }, { value: 'settings', label: 'Cấu hình & tình trạng' }]} value={tab} onChange={setTab} />
      </div>
      {tab === 'faq' ? <FaqTab /> : <SettingsTab />}
    </div>
  );
};

export default ChatbotManager;
