// Tạo bản nháp bài viết từ đường dẫn bằng AI: đọc bài gốc -> tóm tắt -> đối chiếu từng câu với bài gốc.
// Người dùng xem đối chiếu rồi mới đưa bản nháp vào trình soạn bài (không tự đăng).
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Sparkles, Link2, CheckCircle2, AlertTriangle, XCircle, ExternalLink, RotateCcw, Info, ClipboardPaste } from 'lucide-react';
import { aiApi, errorMessage } from '../../services/portalService';
import { Modal, Button, Field, Input, Textarea, Badge, Spinner } from './ui/AdminUI';

const STATUS = {
  verified: { icon: CheckCircle2, className: 'text-emerald-600', label: 'Có căn cứ nguyên văn trong bài gốc' },
  warning: { icon: AlertTriangle, className: 'text-amber-500', label: 'Có căn cứ, nhưng có số liệu / số hiệu không thấy trong bài gốc' },
  unverified: { icon: XCircle, className: 'text-red-600', label: 'Không tìm thấy đoạn căn cứ trong bài gốc' }
};

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Tìm vị trí đoạn trích trong bài gốc (bỏ qua khác biệt khoảng trắng, hoa/thường)
const findQuote = (text, quote) => {
  if (!quote) return null;
  const pattern = new RegExp(quote.trim().split(/\s+/).map(escapeRegExp).join('\\s+'), 'iu');
  const match = pattern.exec(text);
  return match ? { start: match.index, end: match.index + match[0].length } : null;
};

const SourcePanel = ({ text, highlight }) => {
  const range = useMemo(() => findQuote(text, highlight), [text, highlight]);

  // Cuộn tới đoạn được tô sáng (callback ref: chạy khi <mark> được gắn vào DOM)
  const attachMark = (el) => {
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  return (
    <div className="h-[55vh] overflow-y-auto whitespace-pre-wrap rounded-lg border border-stone-200 bg-stone-50 p-4 text-[13px] leading-relaxed text-slate-700">
      {range ? (
        <>
          {text.slice(0, range.start)}
          <mark key={highlight} ref={attachMark} className="rounded bg-gold/30 px-0.5 text-navy-950">{text.slice(range.start, range.end)}</mark>
          {text.slice(range.end)}
        </>
      ) : text}
    </div>
  );
};

const MIN_PASTE_CHARS = 300;

const AiDraftModal = ({ open, onClose, onUse }) => {
  // 'url': server tự đọc bài; 'paste': người dùng dán nội dung (trang chặn tải tự động)
  const [mode, setMode] = useState('url');
  const [url, setUrl] = useState('');
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [blocked, setBlocked] = useState(null); // thông báo khi trang nguồn chặn tải tự động
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(null); // "sectionIndex-sentenceIndex"
  const [acknowledged, setAcknowledged] = useState(false);

  const reset = () => {
    setResult(null);
    setSelected(null);
    setAcknowledged(false);
    setBlocked(null);
  };

  const clearInputs = () => {
    setUrl('');
    setPasteTitle('');
    setPasteText('');
    setMode('url');
  };

  const close = () => {
    if (loading) return;
    reset();
    clearInputs();
    onClose();
  };

  const canSubmit = mode === 'url'
    ? !!url.trim()
    : !!url.trim() && pasteText.trim().length >= MIN_PASTE_CHARS;

  const generate = async (e) => {
    e?.preventDefault();
    if (!canSubmit) return;
    reset();
    setLoading(true);
    try {
      const payload = mode === 'url'
        ? { url: url.trim() }
        : { url: url.trim(), title: pasteTitle.trim(), text: pasteText };
      setResult(await aiApi.postDraft(payload));
    } catch (error) {
      if (error.response?.data?.code === 'SOURCE_BLOCKED') {
        setBlocked(errorMessage(error));
      } else {
        toast.error(errorMessage(error, 'Không tạo được bản nháp'), { duration: 7000 });
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next) => {
    setMode(next);
    setBlocked(null);
  };

  const use = () => {
    onUse({ draft: result.draft, source: result.source, stats: result.stats });
    reset();
    clearInputs();
  };

  const selectedSentence = selected && (() => {
    const [si, ti] = selected.split('-').map(Number);
    return result.sections[si]?.sentences[ti];
  })();

  const stats = result?.stats;
  const footer = result ? (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <label className="!mb-0 flex cursor-pointer items-start gap-2 text-xs text-slate-600 sm:max-w-md">
        <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#0F5AA6]" />
        Tôi hiểu đây là bản nháp do AI soạn và sẽ đối chiếu với bài gốc trước khi gửi duyệt hoặc xuất bản.
      </label>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" icon={RotateCcw} onClick={generate} disabled={loading}>Tạo lại</Button>
        <Button variant="gold" icon={Sparkles} onClick={use} disabled={!acknowledged}>Đưa vào trình soạn bài</Button>
      </div>
    </div>
  ) : null;

  return (
    <Modal
      open={open}
      onClose={close}
      size="xl"
      title="Tạo bài viết từ bài gốc (AI)"
      description="AI đọc bài gốc và soạn bản tóm tắt. Mỗi câu kèm đoạn căn cứ nguyên văn để bạn đối chiếu."
      footer={footer}
    >
      {/* Chọn cách lấy bài gốc */}
      <div className="mb-4 inline-flex rounded-lg bg-stone-100 p-1 text-sm">
        {[
          { value: 'url', label: 'Đọc từ link', icon: Link2 },
          { value: 'paste', label: 'Dán nội dung', icon: ClipboardPaste }
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => switchMode(tab.value)}
            disabled={loading}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors ${
              mode === tab.value ? 'bg-white text-navy-950 shadow-sm' : 'text-slate-500 hover:text-navy-950'
            }`}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={generate} className="space-y-3 [&>div]:!mb-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Field label="Đường dẫn bài viết gốc" htmlFor="ai-url" hint={mode === 'paste' ? 'Dùng để ghi nguồn cuối bài' : undefined} className="flex-1">
            <Input
              id="ai-url"
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={mode === 'url' ? 'https://lsvn.vn/...' : 'https://phapluat.gov.vn/...'}
              disabled={loading}
            />
          </Field>
          {mode === 'url' && (
            <Button type="submit" variant="primary" icon={Link2} loading={loading} disabled={!canSubmit}>
              {result ? 'Đọc link khác' : 'Đọc và tóm tắt'}
            </Button>
          )}
        </div>

        {mode === 'paste' && !result && (
          <>
            <Field label="Tiêu đề bài gốc" htmlFor="ai-title" hint="Để trống thì lấy dòng đầu của nội dung">
              <Input id="ai-title" value={pasteTitle} onChange={(e) => setPasteTitle(e.target.value)} disabled={loading} />
            </Field>
            <Field
              label="Nội dung bài gốc"
              htmlFor="ai-text"
              hint={`Mở bài trên trình duyệt, chọn toàn bộ phần nội dung (Ctrl+A / kéo chọn), sao chép rồi dán vào đây. Đã nhập ${pasteText.trim().length.toLocaleString('vi-VN')} ký tự${pasteText.trim().length < MIN_PASTE_CHARS ? ` (cần ít nhất ${MIN_PASTE_CHARS})` : ''}.`}
            >
              <Textarea id="ai-text" rows={10} value={pasteText} onChange={(e) => setPasteText(e.target.value)} disabled={loading} />
            </Field>
            <div className="flex justify-end">
              <Button type="submit" variant="primary" icon={Sparkles} loading={loading} disabled={!canSubmit}>Tóm tắt nội dung đã dán</Button>
            </div>
          </>
        )}
        {mode === 'paste' && result && (
          <div className="flex justify-end">
            <Button variant="secondary" icon={ClipboardPaste} onClick={reset} disabled={loading}>Dán bài khác</Button>
          </div>
        )}
      </form>

      {blocked && !loading && (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="flex-1">{blocked}</p>
          <Button variant="secondary" size="sm" icon={ClipboardPaste} onClick={() => switchMode('paste')}>Chuyển sang Dán nội dung</Button>
        </div>
      )}

      {loading && (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed border-stone-300 py-12 text-center">
          <Spinner className="h-7 w-7" />
          <p className="text-sm font-medium text-navy-950">{mode === 'url' ? 'Đang đọc bài gốc và soạn bản tóm tắt...' : 'Đang soạn bản tóm tắt...'}</p>
          <p className="text-xs text-slate-500">Thường mất 30-90 giây. Vui lòng không đóng cửa sổ.</p>
        </div>
      )}

      {!loading && !result && !blocked && mode === 'url' && (
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-brand-light px-3 py-2.5 text-xs text-slate-600">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          Chỉ đọc được bài từ các trang nguồn được phép (cổng thông tin cơ quan nhà nước, Liên đoàn Luật sư, báo pháp luật...).
          Trang có lớp chống truy cập tự động (vd phapluat.gov.vn) hoặc cần đăng nhập thì dùng mục "Dán nội dung".
          Bản nháp chưa được lưu cho tới khi bạn đưa vào trình soạn bài và bấm lưu.
        </p>
      )}

      {result && !loading && (
        <div className="mt-5 space-y-4">
          {/* Tổng quan đối chiếu */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge tone="green">{stats.verified}/{stats.total} câu có căn cứ</Badge>
            {stats.warning > 0 && <Badge tone="amber">{stats.warning} câu cần kiểm tra số liệu</Badge>}
            {stats.unverified > 0 && <Badge tone="red">{stats.unverified} câu không tìm thấy căn cứ</Badge>}
            <span className="ml-auto text-slate-400">Model: {result.model}</span>
          </div>

          {result.notes.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">Lưu ý từ AI cho người duyệt</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {result.notes.map((n) => <li key={n}>{n}</li>)}
              </ul>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Bản nháp */}
            <div className="min-w-0">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Bản nháp — bấm vào câu để xem căn cứ</p>
              <div className="h-[55vh] overflow-y-auto rounded-lg border border-stone-200 p-4">
                <h4 className="text-lg font-bold text-navy-950">{result.draft.title}</h4>
                <p className="mt-2 text-sm italic text-slate-600">{result.draft.summary}</p>
                {result.excerptMissingFacts.length > 0 && (
                  <p className="mt-1 text-xs text-amber-700">⚠ Phần tóm lược có số liệu không thấy trong bài gốc: {result.excerptMissingFacts.join(', ')}</p>
                )}
                {result.sections.map((section, si) => (
                  <div key={si} className="mt-4">
                    {section.heading && <h5 className="mb-1.5 text-sm font-semibold text-navy-950">{section.heading}</h5>}
                    <ul className="space-y-1">
                      {section.sentences.map((s, ti) => {
                        const key = `${si}-${ti}`;
                        const meta = STATUS[s.status];
                        return (
                          <li key={key}>
                            <button
                              type="button"
                              onClick={() => setSelected(key)}
                              title={meta.label}
                              className={`flex w-full gap-2 rounded-md px-2 py-1.5 text-left text-sm leading-relaxed transition-colors ${
                                selected === key ? 'bg-gold/15 ring-1 ring-gold/50' : 'hover:bg-stone-50'
                              }`}
                            >
                              <meta.icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.className}`} />
                              <span className="text-slate-800">
                                {s.text}
                                {s.missingFacts.length > 0 && (
                                  <span className="mt-0.5 block text-xs text-amber-700">Không thấy trong bài gốc: {s.missingFacts.join(', ')}</span>
                                )}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Bài gốc */}
            <div className="min-w-0">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">Bài gốc — {result.source.siteName}</p>
                <a href={result.source.url} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand hover:underline">
                  Mở trang gốc <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <SourcePanel text={result.source.text} highlight={selectedSentence?.quoteFound ? selectedSentence.sourceQuote : null} />
              {selectedSentence && !selectedSentence.quoteFound && (
                <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
                  Đoạn AI dẫn làm căn cứ không có nguyên văn trong bài gốc: “{selectedSentence.sourceQuote}”. Hãy kiểm tra kỹ hoặc xóa câu này.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default AiDraftModal;
