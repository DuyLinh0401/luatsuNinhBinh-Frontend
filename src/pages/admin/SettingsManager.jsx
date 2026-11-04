// Cấu hình chung: thông tin đơn vị, liên hệ, tài khoản ngân hàng, mạng xã hội
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, ArrowUp, ArrowDown, Save } from 'lucide-react';
import { settingApi, errorMessage } from '../../services/portalService';
import { PageHeader, Card, Button, IconButton, Field, Input, Textarea, Spinner } from '../../components/admin/ui/AdminUI';
import { ImageField } from '../../components/admin/ui/FileFields';

const EMPTY_BANK = { bankName: '', branch: '', accountNumber: '', accountName: '', qrImage: '' };

// Card có nút Lưu riêng cho từng nhóm cấu hình
const Section = ({ title, description, saving, onSave, children }) => (
  <Card
    title={title}
    actions={<Button size="sm" icon={Save} loading={saving} onClick={onSave}>Lưu</Button>}
  >
    {description && <p className="-mt-1 mb-4 text-xs text-slate-400">{description}</p>}
    {children}
  </Card>
);

const SettingsManager = () => {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    settingApi.get()
      .then((data) => setSettings({
        ...data,
        general: data.general || {},
        contact: { ...data.contact, phones: data.contact?.phones?.length ? data.contact.phones : [''] },
        bankAccounts: Array.isArray(data.bankAccounts) ? data.bankAccounts : [],
        social: data.social || {}
      }))
      .catch((error) => toast.error(errorMessage(error, 'Không tải được cấu hình')));
  }, []);

  if (!settings) {
    return <div className="flex justify-center py-24"><Spinner className="h-7 w-7" /></div>;
  }

  // set('contact', 'email')(event) ; giữ nguyên các key khác trong object
  const set = (group, key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setSettings((s) => ({ ...s, [group]: { ...s[group], [key]: value } }));
  };

  const save = async (key, value) => {
    setSaving(key);
    try {
      await settingApi.update({ [key]: value });
      toast.success('Đã lưu cấu hình');
    } catch (error) {
      toast.error(errorMessage(error, 'Lưu cấu hình thất bại'));
    } finally {
      setSaving(null);
    }
  };

  const { general, contact, bankAccounts, social } = settings;

  const setPhones = (phones) => setSettings((s) => ({ ...s, contact: { ...s.contact, phones } }));
  const setBanks = (list) => setSettings((s) => ({ ...s, bankAccounts: list }));
  const setBank = (index, key, value) => setBanks(bankAccounts.map((b, i) => (i === index ? { ...b, [key]: value } : b)));
  const moveBank = (index, delta) => {
    const next = [...bankAccounts];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    setBanks(next);
  };

  return (
    <div>
      <PageHeader title="Cấu hình chung" description="Thông tin hiển thị ở header, footer và trang liên hệ." />

      <div className="grid gap-5 xl:grid-cols-2">
        <Section title="Thông tin chung" saving={saving === 'general'} onSave={() => save('general', general)}>
          <div className="space-y-4">
            <Field label="Tên đơn vị">
              <Input value={general.siteName || ''} onChange={set('general', 'siteName')} />
            </Field>
            <Field label="Tên viết tắt">
              <Input value={general.shortName || ''} onChange={set('general', 'shortName')} />
            </Field>
            <Field label="Mô tả" hint="Dùng cho thẻ mô tả SEO của trang chủ">
              <Textarea value={general.description || ''} onChange={set('general', 'description')} rows={2} />
            </Field>
            <Field label="Dòng bản quyền">
              <Input value={general.copyright || ''} onChange={set('general', 'copyright')} />
            </Field>
          </div>
        </Section>

        <Section
          title="Liên hệ"
          saving={saving === 'contact'}
          onSave={() => save('contact', { ...contact, phones: contact.phones.map((p) => p.trim()).filter(Boolean) })}
        >
          <div className="space-y-4">
            <Field label="Số điện thoại">
              <div className="space-y-2">
                {contact.phones.map((phone, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={phone} onChange={(e) => setPhones(contact.phones.map((p, j) => (j === i ? e.target.value : p)))} />
                    <IconButton icon={Trash2} label="Bỏ số" tone="danger" disabled={contact.phones.length === 1} onClick={() => setPhones(contact.phones.filter((_, j) => j !== i))} />
                  </div>
                ))}
                <Button size="sm" variant="ghost" icon={Plus} onClick={() => setPhones([...contact.phones, ''])}>Thêm số</Button>
              </div>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Đường dây nóng">
                <Input value={contact.hotline || ''} onChange={set('contact', 'hotline')} />
              </Field>
              <Field label="Fax">
                <Input value={contact.fax || ''} onChange={set('contact', 'fax')} />
              </Field>
            </div>
            <Field label="Email">
              <Input type="email" value={contact.email || ''} onChange={set('contact', 'email')} />
            </Field>
            <Field label="Địa chỉ">
              <Textarea value={contact.address || ''} onChange={set('contact', 'address')} rows={2} />
            </Field>
            <Field label="Giờ làm việc">
              <Input value={contact.workingHours || ''} onChange={set('contact', 'workingHours')} />
            </Field>
          </div>
        </Section>

        <Section
          title="Tài khoản ngân hàng"
          description="Hiển thị ở chân trang và trang liên hệ để nộp phí thành viên."
          saving={saving === 'bankAccounts'}
          onSave={() => save('bankAccounts', bankAccounts)}
        >
          <div className="space-y-4">
            {bankAccounts.map((bank, i) => (
              <div key={i} className="rounded-lg border border-stone-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tài khoản {i + 1}</span>
                  <div className="flex">
                    <IconButton icon={ArrowUp} label="Lên" disabled={i === 0} onClick={() => moveBank(i, -1)} />
                    <IconButton icon={ArrowDown} label="Xuống" disabled={i === bankAccounts.length - 1} onClick={() => moveBank(i, 1)} />
                    <IconButton icon={Trash2} label="Xoá tài khoản" tone="danger" onClick={() => setBanks(bankAccounts.filter((_, j) => j !== i))} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_140px]">
                  <div className="space-y-3">
                    <Field label="Ngân hàng">
                      <Input value={bank.bankName || ''} onChange={(e) => setBank(i, 'bankName', e.target.value)} placeholder="Ví dụ: BIDV" />
                    </Field>
                    <Field label="Chi nhánh">
                      <Input value={bank.branch || ''} onChange={(e) => setBank(i, 'branch', e.target.value)} />
                    </Field>
                    <Field label="Số tài khoản">
                      <Input value={bank.accountNumber || ''} onChange={(e) => setBank(i, 'accountNumber', e.target.value)} />
                    </Field>
                    <Field label="Chủ tài khoản">
                      <Input value={bank.accountName || ''} onChange={(e) => setBank(i, 'accountName', e.target.value)} />
                    </Field>
                  </div>
                  <Field label="Mã QR">
                    <ImageField value={bank.qrImage} onChange={(v) => setBank(i, 'qrImage', v)} aspect="aspect-square" />
                  </Field>
                </div>
              </div>
            ))}
            <Button variant="secondary" size="sm" icon={Plus} onClick={() => setBanks([...bankAccounts, { ...EMPTY_BANK }])}>
              Thêm tài khoản
            </Button>
          </div>
        </Section>

        <Section title="Mạng xã hội" saving={saving === 'social'} onSave={() => save('social', social)}>
          <div className="space-y-4">
            {[
              ['facebook', 'Facebook', 'https://facebook.com/...'],
              ['youtube', 'YouTube', 'https://youtube.com/@...'],
              ['zalo', 'Zalo', 'https://zalo.me/...'],
              ['tiktok', 'TikTok', 'https://tiktok.com/@...']
            ].map(([key, text, placeholder]) => (
              <Field key={key} label={text}>
                <Input value={social[key] || ''} onChange={set('social', key)} placeholder={placeholder} />
              </Field>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
};

export default SettingsManager;
