// Trợ lý ảo pháp luật cho khách (góc phải dưới). Chỉ trả lời từ nội dung chính thức trên cổng, có trích nguồn.
// Điện thoại: mở toàn màn hình. Hội thoại giữ trong sessionStorage để không mất khi tải lại trang.
// Dùng inset-x-0 inset-y-0 thay cho inset-0: index.css có quy tắc cũ ".fixed.inset-0" phủ nền tối + blur cho modal.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquareText, X, Send, RotateCcw, Scale, Users, Mail, ExternalLink, ShieldAlert } from 'lucide-react';
import chatbotService from '../../services/chatbotService';
import BrandLogo from '../common/BrandLogo';

const STORAGE_KEY = 'lawnb-chat';
const MAX_LENGTH = 500;

const loadSaved = () => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved.slice(-30) : [];
  } catch {
    return [];
  }
};

// Nội dung dạng chữ của một tin nhắn (gửi kèm làm ngữ cảnh cho câu hỏi tiếp nối)
const plainText = (m) => (m.role === 'user' ? m.text : m.data?.sentences ? m.data.sentences.map((s) => s.text).join(' ') : m.data?.text || '');

const SmartAnchor = ({ to, children, className, onNavigate }) =>
  /^https?:\/\//.test(to) ? (
    <a href={to} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>
  ) : (
    <Link to={to} className={className} onClick={onNavigate}>{children}</Link>
  );

// ---------- Hiển thị câu trả lời ----------

const Sources = ({ sources, onNavigate }) => (
  <div className="mt-3 border-t border-stone-100 pt-2.5">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Nguồn tham khảo</p>
    <ol className="mt-1.5 space-y-1.5">
      {sources.map((s) => (
        <li key={s.n} className="flex gap-2 text-[13px] leading-snug">
          <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded bg-brand-light text-[10px] font-semibold text-brand">{s.n}</span>
          <span className="min-w-0">
            <span className="text-slate-500">{s.typeLabel}: </span>
            {s.url ? (
              <SmartAnchor to={s.url} onNavigate={onNavigate} className="font-medium text-brand hover:underline">{s.title}</SmartAnchor>
            ) : (
              <span className="font-medium text-navy-950">{s.title}</span>
            )}
            {s.note && <span className={`ml-1 text-xs ${/hết hiệu lực/i.test(s.note) ? 'font-semibold text-red-700' : 'text-slate-500'}`}>({s.note})</span>}
            {s.excerpt && !s.url && <span className="mt-0.5 block whitespace-pre-line text-xs text-slate-600">{s.excerpt}</span>}
          </span>
        </li>
      ))}
    </ol>
  </div>
);

const LinkButtons = ({ links, onNavigate }) => (
  <div className="mt-3 flex flex-wrap gap-2">
    {links.map((l) => (
      <SmartAnchor key={l.url} to={l.url} onNavigate={onNavigate} className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-navy-950 hover:border-brand hover:text-brand">
        {l.label} <ExternalLink className="h-3 w-3" />
      </SmartAnchor>
    ))}
  </div>
);

const LawyerCallout = ({ onNavigate }) => (
  <div className="mt-3 rounded-lg border border-gold/40 bg-gold/10 px-3 py-2.5 text-[13px] text-navy-950">
    <p className="flex items-center gap-1.5 font-semibold"><Scale className="h-3.5 w-3.5 text-gold-dark" /> Vụ việc cụ thể nên được luật sư tư vấn trực tiếp</p>
    <div className="mt-2 flex flex-wrap gap-2">
      <SmartAnchor to="/tra-cuu/luat-su" onNavigate={onNavigate} className="inline-flex items-center gap-1 rounded-full bg-navy-950 px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-800">
        <Users className="h-3 w-3" /> Tìm luật sư
      </SmartAnchor>
      <SmartAnchor to="/lien-he" onNavigate={onNavigate} className="inline-flex items-center gap-1 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-navy-950 hover:border-brand">
        <Mail className="h-3 w-3" /> Gửi câu hỏi tới Đoàn
      </SmartAnchor>
    </div>
  </div>
);

const BotMessage = ({ data, onNavigate }) => (
  <div className="max-w-[92%] rounded-2xl rounded-tl-sm border border-stone-200 bg-white px-3.5 py-3 text-[14px] leading-relaxed text-slate-800 shadow-sm">
    {data.type === 'answer' ? (
      <p>
        {data.sentences.map((s, i) => (
          <span key={i}>
            {s.text}
            <sup className="ml-0.5 font-semibold text-brand">[{s.source}]</sup>{' '}
          </span>
        ))}
      </p>
    ) : (
      <p className="whitespace-pre-line">{data.text}</p>
    )}

    {data.items?.length > 0 && (
      <ul className="mt-2.5 space-y-2">
        {data.items.map((item) => (
          <li key={item.url} className="rounded-lg border border-stone-200 px-3 py-2">
            <SmartAnchor to={item.url} onNavigate={onNavigate} className="font-semibold text-brand hover:underline">{item.title}</SmartAnchor>
            {item.lines.length > 0 && <p className="mt-0.5 text-xs text-slate-600">{item.lines.join(' · ')}</p>}
          </li>
        ))}
      </ul>
    )}

    {data.sources?.length > 0 && <Sources sources={data.sources} onNavigate={onNavigate} />}
    {data.needsLawyer && <LawyerCallout onNavigate={onNavigate} />}
    {/* Khung "gặp luật sư" đã có 2 nút tra cứu / gửi câu hỏi => bỏ các liên kết trùng */}
    {(() => {
      const links = (data.links || []).filter((l) => !data.needsLawyer || !['/lien-he', '/tra-cuu/luat-su'].includes(l.url));
      return links.length > 0 && <LinkButtons links={links} onNavigate={onNavigate} />;
    })()}
    {data.disclaimer && <p className="mt-2.5 text-[11px] italic text-slate-500">{data.disclaimer}</p>}
  </div>
);

// ---------- Widget ----------

const ChatWidget = () => {
  const [config, setConfig] = useState(null);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(loadSaved);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatbotService.getConfig().then(setConfig).catch(() => setConfig(null));
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      // trình duyệt chặn lưu trữ: hội thoại chỉ mất khi tải lại trang
    }
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending, open]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    // Điện thoại: khóa cuộn trang phía sau khi khung chat chiếm toàn màn hình
    const small = window.matchMedia('(max-width: 639px)').matches;
    const overflow = document.body.style.overflow;
    if (small) document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  const send = useCallback(async (text) => {
    const question = text.replace(/\s+/g, ' ').trim();
    if (!question || sending) return;
    const history = messages.slice(-6).map((m) => ({ role: m.role, content: plainText(m).slice(0, MAX_LENGTH) })).filter((m) => m.content);
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setInput('');
    setSending(true);
    try {
      const data = await chatbotService.ask(question, history);
      setMessages((prev) => [...prev, { role: 'assistant', data }]);
    } catch (error) {
      const message = error?.response?.data?.message || 'Không kết nối được trợ lý. Vui lòng thử lại sau.';
      setMessages((prev) => [...prev, { role: 'assistant', data: { type: 'error', text: message } }]);
    } finally {
      setSending(false);
    }
  }, [messages, sending]);

  // Điện thoại: bấm liên kết trong câu trả lời thì đóng khung để thấy trang đích
  const onNavigate = () => {
    if (window.matchMedia('(max-width: 639px)').matches) setOpen(false);
  };

  if (!config?.enabled) return null;

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Mở trợ lý pháp luật"
          className="fixed bottom-4 right-4 z-40 flex h-14 items-center gap-2 rounded-full bg-navy-950 pl-4 pr-4 text-white shadow-lg shadow-navy-950/30 ring-1 ring-white/10 transition-colors hover:bg-navy-800 sm:bottom-5 sm:right-6 sm:pr-5"
        >
          <MessageSquareText className="h-6 w-6 shrink-0" />
          <span className="hidden text-sm font-semibold sm:inline">Hỏi đáp pháp luật</span>
        </button>
      )}

      {open && (
        <section
          role="dialog"
          aria-label="Trợ lý pháp luật"
          className="fixed inset-x-0 inset-y-0 z-50 flex flex-col bg-stone-50 sm:inset-auto sm:bottom-5 sm:right-6 sm:h-[min(640px,calc(100vh-2.5rem))] sm:w-[400px] sm:overflow-hidden sm:rounded-2xl sm:border sm:border-stone-200 sm:shadow-2xl sm:shadow-navy-950/20"
        >
          {/* Đầu khung */}
          <header className="flex shrink-0 items-center gap-3 bg-navy-950 px-4 py-3 text-white">
            <BrandLogo className="h-9 w-9 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Trợ lý pháp luật</p>
              <p className="truncate text-xs text-stone-300">Đoàn Luật sư tỉnh Ninh Bình</p>
            </div>
            {messages.length > 0 && (
              <button type="button" onClick={() => setMessages([])} aria-label="Bắt đầu cuộc trò chuyện mới" title="Cuộc trò chuyện mới" className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-300 hover:bg-white/10 hover:text-white">
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
            <button type="button" onClick={() => setOpen(false)} aria-label="Đóng" className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-300 hover:bg-white/10 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </header>

          {/* Hội thoại */}
          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-3.5 py-4" aria-live="polite">
            <div className="max-w-[92%] rounded-2xl rounded-tl-sm border border-stone-200 bg-white px-3.5 py-3 text-[14px] leading-relaxed text-slate-800 shadow-sm">
              {config.greeting}
              <p className="mt-2 flex gap-1.5 text-xs text-slate-500">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Vui lòng không nhập số CCCD, số điện thoại hay thông tin nhạy cảm về vụ việc cá nhân.
              </p>
            </div>

            {messages.length === 0 && config.suggestions?.length > 0 && (
              <div className="flex flex-wrap gap-2 pl-1">
                {config.suggestions.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} className="rounded-full border border-brand/30 bg-white px-3 py-1.5 text-left text-[13px] text-brand hover:border-brand hover:bg-brand-light">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) =>
              m.role === 'user' ? (
                <div key={i} className="flex justify-end">
                  <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-tr-sm bg-brand px-3.5 py-2.5 text-[14px] leading-relaxed text-white">{m.text}</p>
                </div>
              ) : (
                <div key={i}><BotMessage data={m.data} onNavigate={onNavigate} /></div>
              )
            )}

            {sending && (
              <div className="inline-flex items-center gap-2 rounded-2xl rounded-tl-sm border border-stone-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-500">
                <span className="flex gap-1">
                  {[0, 1, 2].map((d) => <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${d * 150}ms` }} />)}
                </span>
                Đang tìm trong nội dung của cổng…
              </div>
            )}
          </div>

          {/* Ô nhập */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="shrink-0 border-t border-stone-200 bg-white px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3"
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                maxLength={MAX_LENGTH}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Đặt câu hỏi về pháp luật…"
                aria-label="Câu hỏi"
                className="max-h-28 min-h-[42px] flex-1 resize-none rounded-xl border border-stone-300 bg-white !px-3 !py-2.5 text-[16px] leading-snug text-navy-950 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 sm:text-sm"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  e.currentTarget.style.height = 'auto';
                  e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 112)}px`;
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                aria-label="Gửi câu hỏi"
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-navy-950 text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 flex justify-between gap-2 text-[11px] text-slate-500">
              <span>Trả lời dựa trên nội dung chính thức của cổng; chỉ mang tính tham khảo.</span>
              {input.length > MAX_LENGTH - 100 && <span className="shrink-0 tabular-nums">{input.length}/{MAX_LENGTH}</span>}
            </p>
          </form>
        </section>
      )}
    </>
  );
};

export default ChatWidget;
