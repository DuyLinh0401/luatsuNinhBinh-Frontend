// Đổi mật khẩu: bắt buộc ở lần đăng nhập đầu (mật khẩu tạm gửi qua email), hoặc tự đổi từ khu quản trị
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, KeyRound, Eye, EyeOff, Check, Loader2, ArrowLeft, LogOut } from 'lucide-react';
import BrandLogo from '../../components/common/BrandLogo';
import { useAuth } from '../../contexts/AuthContext';
import { errorMessage } from '../../services/portalService';
import { homePathFor } from '../../utils/authRedirect';

const RULES = [
  { label: 'Ít nhất 8 ký tự', test: (p) => p.length >= 8 },
  { label: 'Có chữ hoa', test: (p) => /[A-Z]/.test(p) },
  { label: 'Có chữ thường', test: (p) => /[a-z]/.test(p) },
  { label: 'Có chữ số', test: (p) => /\d/.test(p) }
];

// "!" để thắng quy tắc `input { padding ... !important }` trong index.css
const INPUT_CLASS = 'w-full rounded-lg border border-stone-300 bg-white !py-3 !pl-11 !pr-11 text-sm text-navy-950 placeholder:text-slate-400 shadow-sm transition focus:border-gold focus:outline-none focus:ring-4 focus:ring-gold/15';

const PasswordInput = ({ id, label, icon: Icon, value, onChange, autoComplete, autoFocus }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="!mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          required
          className={INPUT_CLASS}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-stone-100 hover:text-slate-700"
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {visible ? <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.75} /> : <Eye className="h-[18px] w-[18px]" strokeWidth={1.75} />}
        </button>
      </div>
    </div>
  );
};

const ChangePasswordPage = () => {
  const { user, changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  const forced = !!user.mustChangePassword;
  const rulesOk = RULES.every((r) => r.test(next));
  const matches = next.length > 0 && next === confirm;
  const canSubmit = current && rulesOk && matches && !saving;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      const updated = await changePassword(current, next);
      toast.success('Đổi mật khẩu thành công');
      navigate(homePathFor(updated), { replace: true });
    } catch (error) {
      toast.error(errorMessage(error, 'Đổi mật khẩu thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-stone-parchment font-sans">
      <div className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/" className="flex items-center gap-2.5">
          <BrandLogo className="h-11 w-11" />
          <div className="leading-tight">
            <span className="text-lg font-bold tracking-wider text-navy-950">LAWNB</span>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Đoàn Luật Sư Ninh Bình</p>
          </div>
        </Link>
        {forced ? (
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-gold hover:text-navy-950"
          >
            <LogOut className="h-4 w-4" /> Đăng xuất
          </button>
        ) : (
          <Link
            to={homePathFor(user)}
            className="group inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-gold hover:text-navy-950"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Quay lại
          </Link>
        )}
      </div>

      <div className="flex flex-1 items-center justify-center px-6 pb-12 sm:px-10">
        <div className="w-full max-w-[440px] rounded-2xl border border-stone-200 bg-white p-7 shadow-sm sm:p-8">
          <div className="mb-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gold/10">
              <KeyRound className="h-5 w-5 text-gold-dark" />
            </div>
            <h1 className="text-2xl font-bold text-navy-950">
              {forced ? 'Đặt mật khẩu mới' : 'Đổi mật khẩu'}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              {forced
                ? <>Xin chào <strong className="text-navy-950">{user.fullName || user.username}</strong>. Bạn đang dùng mật khẩu tạm được gửi qua email. Vui lòng đặt mật khẩu mới để tiếp tục sử dụng hệ thống.</>
                : 'Sau khi đổi, các thiết bị khác đang đăng nhập tài khoản này sẽ bị đăng xuất.'}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4 [&>div]:!mb-0">
            <PasswordInput
              id="current-password"
              label={forced ? 'Mật khẩu tạm (trong email)' : 'Mật khẩu hiện tại'}
              icon={Lock}
              value={current}
              onChange={setCurrent}
              autoComplete="current-password"
              autoFocus
            />
            <PasswordInput id="new-password" label="Mật khẩu mới" icon={KeyRound} value={next} onChange={setNext} autoComplete="new-password" />

            <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-lg bg-stone-50 px-3.5 py-3">
              {RULES.map((rule) => {
                const ok = rule.test(next);
                return (
                  <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-emerald-700' : 'text-slate-500'}`}>
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full ${ok ? 'bg-emerald-100' : 'bg-stone-200'}`}>
                      {ok && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    {rule.label}
                  </li>
                );
              })}
            </ul>

            <div>
              <PasswordInput id="confirm-password" label="Nhập lại mật khẩu mới" icon={KeyRound} value={confirm} onChange={setConfirm} autoComplete="new-password" />
              {confirm && !matches && <p className="mt-1.5 text-xs text-red-600">Mật khẩu nhập lại không khớp</p>}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy-950 py-3 text-sm font-semibold text-white shadow-lg shadow-navy-950/20 transition hover:bg-navy-900 focus:outline-none focus:ring-4 focus:ring-gold/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...</> : 'Lưu mật khẩu mới'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
