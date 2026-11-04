// Trang liên hệ: /lien-he — thông tin từ cấu hình chung, trụ sở, tài khoản ngân hàng và form liên hệ
import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapPin, Phone, PhoneCall, Printer, Mail, Clock, Copy, Check, Landmark, Send, CheckCircle2, Building2, Navigation } from 'lucide-react';
import contactService from '../../services/contactService';
import officeService from '../../services/officeService';
import { mapSrcOf, directionsUrlOf } from '../../utils/maps';
import { assetUrl, errorMessage } from '../../services/portalService';
import { useSite } from '../../contexts/siteContext';
import useAsync from '../../hooks/useAsync';
import usePageTitle from '../../hooks/usePageTitle';
import { inputClass } from '../../components/admin/ui/format';
import { Container, PageHero, Skeleton } from '../../components/portal/PortalUI';

const EMPTY_FORM = { fullName: '', email: '', phone: '', subject: '', message: '' };

const InfoRow = ({ icon: Icon, label, children }) => (
  <li className="flex gap-3">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/10 ring-1 ring-gold/30">
      <Icon className="h-4 w-4 text-gold-dark" />
    </span>
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-0.5 break-words text-sm text-navy-950">{children}</div>
    </div>
  </li>
);

const Panel = ({ title, children }) => (
  <section className="rounded-xl border border-stone-200 bg-white p-5 sm:p-6">
    <h2 className="mb-4 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide !text-navy-950">
      <span className="h-4 w-1 rounded-full bg-gold" />
      {title}
    </h2>
    {children}
  </section>
);

const BankAccount = ({ account }) => {
  const [copied, setCopied] = useState(false);
  const copy = () =>
    navigator.clipboard?.writeText(account.accountNumber.replace(/\s/g, '')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-stone-200 p-4 sm:flex-row sm:items-center">
      {account.qrImage && (
        <img src={assetUrl(account.qrImage)} alt={`Mã QR ${account.bankName || ''}`} className="h-28 w-28 shrink-0 rounded-md border border-stone-200 bg-white object-contain p-1" />
      )}
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold text-navy-950">
          {account.bankName}
          {account.branch && <span className="font-normal text-slate-500"> – {account.branch}</span>}
        </p>
        {account.accountName && <p className="mt-0.5 text-slate-600">Chủ tài khoản: {account.accountName}</p>}
        {account.accountNumber && (
          <div className="mt-2 flex items-center gap-2">
            <span className="tabular-nums text-base font-semibold tracking-wide text-navy-950">{account.accountNumber}</span>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1 rounded-md border border-stone-300 px-2 py-1 text-xs font-medium text-slate-600 hover:border-navy-950 hover:text-navy-950"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Đã chép' : 'Sao chép'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ContactForm = () => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.fullName.trim()) next.fullName = 'Vui lòng nhập họ tên';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Email không hợp lệ';
    if (!/^[0-9+\s.()-]{8,15}$/.test(form.phone.trim())) next.phone = 'Số điện thoại không hợp lệ';
    if (form.message.trim().length < 10) next.message = 'Nội dung cần ít nhất 10 ký tự';
    setErrors(next);
    return !Object.keys(next).length;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSending(true);
    try {
      await contactService.createContact({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: form.subject.trim() || null,
        message: form.message.trim()
      });
      setSent(true);
      setForm(EMPTY_FORM);
    } catch (error) {
      toast.error(errorMessage(error, 'Gửi thất bại, vui lòng thử lại sau'));
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-600" strokeWidth={1.5} />
        <h3 className="mt-4 text-xl font-bold !text-navy-950">Đã gửi liên hệ</h3>
        <p className="mt-2 max-w-sm text-sm text-slate-600">Cảm ơn bạn. Văn phòng Đoàn sẽ phản hồi qua email hoặc điện thoại trong thời gian sớm nhất.</p>
        <button type="button" onClick={() => setSent(false)} className="mt-5 text-sm font-semibold text-gold-dark hover:text-navy-950">
          Gửi liên hệ khác
        </button>
      </div>
    );
  }

  const field = (key, labelText, { required, type = 'text', textarea, placeholder } = {}) => (
    <div className={textarea ? 'sm:col-span-2' : ''}>
      <label htmlFor={`contact-${key}`} className="!mb-1.5 block text-[13px] font-medium text-slate-700">
        {labelText}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {textarea ? (
        <textarea id={`contact-${key}`} rows={6} value={form[key]} onChange={set(key)} placeholder={placeholder} className={`${inputClass} resize-y`} />
      ) : (
        <input id={`contact-${key}`} type={type} value={form[key]} onChange={set(key)} placeholder={placeholder} className={inputClass} />
      )}
      {errors[key] && <p className="mt-1 text-xs text-red-600">{errors[key]}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2 [&>div]:!mb-0">
      {field('fullName', 'Họ và tên', { required: true })}
      {field('phone', 'Số điện thoại', { required: true, type: 'tel' })}
      <div className="sm:col-span-2">
        <label htmlFor="contact-email" className="!mb-1.5 block text-[13px] font-medium text-slate-700">
          Email<span className="ml-0.5 text-red-500">*</span>
        </label>
        <input id="contact-email" type="email" value={form.email} onChange={set('email')} className={inputClass} />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
      </div>
      <div className="sm:col-span-2">{field('subject', 'Tiêu đề')}</div>
      {field('message', 'Nội dung', { required: true, textarea: true, placeholder: 'Nội dung cần liên hệ, kiến nghị hoặc phản ánh...' })}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={sending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-navy-950 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-60 sm:w-auto"
        >
          <Send className="h-4 w-4 text-gold-hover" />
          {sending ? 'Đang gửi...' : 'Gửi liên hệ'}
        </button>
      </div>
    </form>
  );
};

const ContactPage = () => {
  usePageTitle('Liên hệ');
  const { settings } = useSite();
  const contact = settings.contact || {};
  const bankAccounts = (settings.bankAccounts || []).filter((a) => a.accountNumber || a.bankName);
  const { data: offices, loading } = useAsync(() => officeService.getOffices(), []);

  const officeList = [...(offices || [])].filter((o) => o.isActive !== false).sort((a, b) => Number(b.isMain) - Number(a.isMain) || a.order - b.order);
  const mainOffice = officeList[0];
  const mapSrc = mapSrcOf(mainOffice);
  const mainDirections = directionsUrlOf(mainOffice);
  const phones = (contact.phones || []).filter(Boolean);

  return (
    <>
      <PageHero
        title="Liên hệ"
        description={`Văn phòng ${settings.general?.siteName || 'Đoàn Luật sư tỉnh Ninh Bình'} luôn sẵn sàng tiếp nhận thông tin, kiến nghị của luật sư và người dân.`}
        breadcrumb={[{ label: 'Liên hệ' }]}
      />

      <Container className="grid gap-6 py-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-6">
          <Panel title="Thông tin liên hệ">
            <ul className="space-y-4">
              {contact.address && <InfoRow icon={MapPin} label="Địa chỉ">{contact.address}</InfoRow>}
              {phones.length > 0 && (
                <InfoRow icon={Phone} label="Điện thoại">
                  {phones.map((p, i) => (
                    <span key={p}>
                      {i > 0 && ' – '}
                      <a href={`tel:${p.replace(/[^0-9+]/g, '')}`} className="hover:text-gold-dark">{p}</a>
                    </span>
                  ))}
                </InfoRow>
              )}
              {contact.hotline && (
                <InfoRow icon={PhoneCall} label="Đường dây nóng">
                  <a href={`tel:${contact.hotline.replace(/[^0-9+]/g, '')}`} className="font-semibold hover:text-gold-dark">{contact.hotline}</a>
                </InfoRow>
              )}
              {contact.fax && <InfoRow icon={Printer} label="Fax">{contact.fax}</InfoRow>}
              {contact.email && (
                <InfoRow icon={Mail} label="Email">
                  <a href={`mailto:${contact.email}`} className="hover:text-gold-dark">{contact.email}</a>
                </InfoRow>
              )}
              {contact.workingHours && <InfoRow icon={Clock} label="Giờ làm việc">{contact.workingHours}</InfoRow>}
            </ul>
          </Panel>

          {bankAccounts.length > 0 && (
            <Panel title="Tài khoản ngân hàng">
              <div className="space-y-3">
                {bankAccounts.map((a, i) => <BankAccount key={`${a.accountNumber}-${i}`} account={a} />)}
              </div>
            </Panel>
          )}

          {(loading || officeList.length > 0) && (
            <Panel title="Trụ sở & Văn phòng">
              {loading ? (
                <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {officeList.map((o) => (
                    <li key={o.id} className="py-3 first:pt-0 last:pb-0">
                      <p className="flex items-center gap-2 text-sm font-semibold text-navy-950">
                        <Building2 className="h-4 w-4 shrink-0 text-gold-dark" />
                        {o.name}
                        {o.isMain && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-gold-dark">Trụ sở chính</span>}
                      </p>
                      <p className="mt-1 pl-6 text-sm text-slate-600">{o.address}</p>
                      <p className="mt-0.5 pl-6 text-xs text-slate-500">
                        {o.phone && <a href={`tel:${o.phone.replace(/[^0-9+]/g, '')}`} className="hover:text-gold-dark">{o.phone}</a>}
                        {o.email && <> · <a href={`mailto:${o.email}`} className="hover:text-gold-dark">{o.email}</a></>}
                        {o.workingHours && <> · {o.workingHours}</>}
                      </p>
                      {directionsUrlOf(o) && (
                        <a href={directionsUrlOf(o)} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 pl-6 text-xs font-medium text-brand hover:underline">
                          <Navigation className="h-3 w-3" /> Chỉ đường
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}
        </div>

        <div className="space-y-6">
          <Panel title="Gửi liên hệ">
            <p className="mb-5 text-sm text-slate-500">
              Để tra cứu thông tin luật sư, vui lòng dùng chức năng{' '}
              <Link to="/tra-cuu/luat-su" className="font-semibold text-gold-dark hover:text-navy-950">tra cứu luật sư</Link>.
            </p>
            <ContactForm />
          </Panel>

          {mapSrc && (
            <section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
              <div className="flex items-center gap-2 border-b border-stone-200 px-5 py-3 text-sm font-semibold text-navy-950">
                <Landmark className="h-4 w-4 shrink-0 text-gold-dark" />
                <span className="min-w-0 flex-1 truncate">{mainOffice.name}</span>
                {mainDirections && (
                  <a href={mainDirections} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand hover:underline">
                    <Navigation className="h-3.5 w-3.5" /> Chỉ đường
                  </a>
                )}
              </div>
              <iframe
                title={`Bản đồ ${mainOffice.name}`}
                src={mapSrc}
                className="h-80 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </section>
          )}
        </div>
      </Container>
    </>
  );
};

export default ContactPage;
