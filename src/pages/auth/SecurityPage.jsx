// Bảo mật tài khoản: xác thực 2 bước (Google Authenticator) và đổi mật khẩu.
// ADMIN chưa bật 2FA bị chuyển tới đây và phải thiết lập xong mới vào được khu quản trị.
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ShieldCheck, ShieldAlert, Smartphone, KeyRound, Copy, Download, Loader2,
  ArrowLeft, LogOut, ChevronRight, RefreshCw, ShieldOff, Lock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import { errorMessage } from '../../services/portalService';
import { CHANGE_PASSWORD_PATH, homePathFor } from '../../utils/authRedirect';
import BrandLogo from '../../components/common/BrandLogo';

const APP_LINKS = [
  { label: 'Android (Google Play)', href: 'https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2' },
  { label: 'iPhone (App Store)', href: 'https://apps.apple.com/app/google-authenticator/id388497605' }
];

// "!" để thắng quy tắc `input { padding ... !important }` trong index.css
const INPUT_CLASS = 'w-full rounded-lg border border-stone-300 bg-white !px-4 !py-2.5 text-sm text-navy-950 placeholder:text-slate-400 shadow-sm transition focus:border-gold focus:outline-none focus:ring-4 focus:ring-gold/15';
const CODE_INPUT_CLASS = 'w-full rounded-lg border border-stone-300 bg-white !px-4 !py-2.5 text-center font-mono text-xl tracking-[0.35em] text-navy-950 placeholder:text-slate-300 shadow-sm transition focus:border-gold focus:outline-none focus:ring-4 focus:ring-gold/15';
const PRIMARY_BTN = 'inline-flex items-center justify-center gap-2 rounded-lg bg-navy-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-900 focus:outline-none focus:ring-4 focus:ring-gold/25 disabled:cursor-not-allowed disabled:opacity-50';
const SECONDARY_BTN = 'inline-flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-gold hover:text-navy-950 disabled:cursor-not-allowed disabled:opacity-50';

const digitsOnly = (value) => value.replace(/\D/g, '').slice(0, 6);
const groupSecret = (secret) => secret.replace(/(.{4})/g, '$1 ').trim();

const copyText = async (text, message) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(message);
  } catch {
    toast.error('Không sao chép được, hãy chép thủ công');
  }
};

// ---------- Mã dự phòng (chỉ hiển thị một lần) ----------
const BackupCodesPanel = ({ codes, username, onDone, doneLabel }) => {
  const [saved, setSaved] = useState(false);
  const text = [
    'LawNB - Đoàn Luật sư Ninh Bình',
    `Mã dự phòng xác thực 2 bước của tài khoản: ${username}`,
    `Tạo lúc: ${new Date().toLocaleString('vi-VN')}`,
    'Mỗi mã chỉ dùng được một lần.',
    '',
    ...codes
  ].join('\n');

  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `lawnb-ma-du-phong-${username}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>Lưu các mã này ở nơi an toàn</strong> (in ra giấy hoặc lưu trong trình quản lý mật khẩu).
        Khi mất điện thoại, bạn dùng một mã để đăng nhập. Mỗi mã chỉ dùng được một lần và
        <strong> sẽ không hiển thị lại</strong>.
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-stone-50 p-4 font-mono text-sm text-navy-950">
        {codes.map((c) => <li key={c} className="text-center tracking-wider">{c}</li>)}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => copyText(codes.join('\n'), 'Đã sao chép mã dự phòng')} className={SECONDARY_BTN}>
          <Copy className="h-4 w-4" /> Sao chép
        </button>
        <button type="button" onClick={download} className={SECONDARY_BTN}>
          <Download className="h-4 w-4" /> Tải về (.txt)
        </button>
      </div>
      <label className="!mb-0 mt-5 flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="h-4 w-4 accent-[#C8992B]" />
        Tôi đã lưu các mã dự phòng
      </label>
      <button type="button" disabled={!saved} onClick={onDone} className={`${PRIMARY_BTN} mt-4 w-full`}>
        {doneLabel}
      </button>
    </div>
  );
};

// ---------- Thiết lập 2FA: cài app -> quét QR -> nhập mã ----------
const SetupWizard = ({ onEnabled, onCancel }) => {
  const [setup, setSetup] = useState(null);
  const [starting, setStarting] = useState(false);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const start = async () => {
    setStarting(true);
    try {
      setSetup(await authService.startTwoFactorSetup());
    } catch (error) {
      toast.error(errorMessage(error, 'Không tạo được mã QR'));
    } finally {
      setStarting(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setVerifying(true);
    try {
      onEnabled(await authService.enableTwoFactor(code));
    } catch (error) {
      toast.error(errorMessage(error, 'Không bật được xác thực 2 bước'));
      setCode('');
    } finally {
      setVerifying(false);
    }
  };

  if (!setup) {
    return (
      <div>
        <ol className="space-y-3 text-sm text-slate-600">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-950 text-xs font-bold text-white">1</span>
            <div>
              Cài ứng dụng <strong className="text-navy-950">Google Authenticator</strong> trên điện thoại (miễn phí):{' '}
              {APP_LINKS.map((l, i) => (
                <span key={l.href}>
                  {i > 0 && ' · '}
                  <a href={l.href} target="_blank" rel="noreferrer" className="font-medium text-gold-dark underline-offset-2 hover:underline">{l.label}</a>
                </span>
              ))}
              . Microsoft Authenticator hoặc Authy cũng dùng được.
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-950 text-xs font-bold text-white">2</span>
            Quét mã QR hiển thị ở bước tiếp theo bằng ứng dụng.
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-950 text-xs font-bold text-white">3</span>
            Nhập mã 6 số ứng dụng hiển thị để xác nhận, sau đó lưu lại mã dự phòng.
          </li>
        </ol>
        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" onClick={start} disabled={starting} className={PRIMARY_BTN}>
            {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
            Đã cài ứng dụng, tiếp tục
          </button>
          {onCancel && <button type="button" onClick={onCancel} className={SECONDARY_BTN}>Hủy</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-[200px_1fr]">
      <div className="text-center">
        <img src={setup.qrDataUrl} alt="Mã QR thiết lập xác thực 2 bước" className="mx-auto h-[200px] w-[200px] rounded-lg border border-stone-200 bg-white p-2" />
        <button type="button" onClick={() => setShowSecret((v) => !v)} className="mt-2 text-xs font-medium text-gold-dark hover:text-navy-950">
          {showSecret ? 'Ẩn mã nhập tay' : 'Không quét được? Nhập mã thủ công'}
        </button>
        {showSecret && (
          <button
            type="button"
            onClick={() => copyText(setup.secret, 'Đã sao chép mã')}
            className="mt-2 w-full rounded-md bg-stone-100 px-2 py-1.5 font-mono text-xs leading-relaxed text-navy-950 hover:bg-stone-200"
            title="Bấm để sao chép"
          >
            {groupSecret(setup.secret)}
          </button>
        )}
      </div>
      <form onSubmit={verify} className="[&>div]:!mb-0">
        <p className="text-sm text-slate-600">
          Mở Google Authenticator, bấm <strong>+</strong> → <strong>Quét mã QR</strong>. Ứng dụng sẽ thêm tài khoản
          <strong> Đoàn Luật sư Ninh Bình</strong> và hiển thị mã 6 số đổi mỗi 30 giây.
        </p>
        <div className="mt-4">
          <label htmlFor="setup-code" className="!mb-1.5 block text-sm font-medium text-slate-700">Mã 6 số trên ứng dụng</label>
          <input
            id="setup-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            value={code}
            onChange={(e) => setCode(digitsOnly(e.target.value))}
            placeholder="000000"
            className={CODE_INPUT_CLASS}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" disabled={code.length !== 6 || verifying} className={PRIMARY_BTN}>
            {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Xác nhận và bật
          </button>
          {onCancel && <button type="button" onClick={onCancel} className={SECONDARY_BTN}>Hủy</button>}
        </div>
      </form>
    </div>
  );
};

// ---------- Form nhỏ: xác nhận bằng mã (và mật khẩu) ----------
const ConfirmForm = ({ withPassword, allowBackup, submitLabel, danger, onSubmit, onCancel }) => {
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const codeOk = /^\d{6}$/.test(code) || (allowBackup && code.replace(/[^A-Z0-9]/gi, '').length === 8);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSubmit({ password, code });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-lg border border-stone-200 bg-stone-50 p-4 [&>div]:!mb-0">
      {withPassword && (
        <div>
          <label htmlFor="confirm-password" className="!mb-1.5 block text-sm font-medium text-slate-700">Mật khẩu hiện tại</label>
          <input id="confirm-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={INPUT_CLASS} />
        </div>
      )}
      <div>
        <label htmlFor="confirm-code" className="!mb-1.5 block text-sm font-medium text-slate-700">
          Mã 6 số trên ứng dụng{allowBackup ? ' (hoặc mã dự phòng)' : ''}
        </label>
        <input
          id="confirm-code"
          type="text"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 9))}
          className={INPUT_CLASS}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy || !codeOk || (withPassword && !password)}
          className={danger ? `${PRIMARY_BTN} !bg-red-600 hover:!bg-red-700` : PRIMARY_BTN}
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} {submitLabel}
        </button>
        <button type="button" onClick={onCancel} className={SECONDARY_BTN}>Hủy</button>
      </div>
    </form>
  );
};

const SecurityPage = () => {
  const { user, logout, setCurrentUser } = useAuth();
  const navigate = useNavigate();
  // 'setup' | 'regen' | 'disable' | null
  const [panel, setPanel] = useState(null);
  // Mã dự phòng vừa tạo (bật 2FA / tạo lại) - chỉ hiển thị một lần
  const [freshCodes, setFreshCodes] = useState(null);
  // Vào trang do bị bắt buộc thiết lập 2FA (ghi nhớ để sau khi bật xong vẫn giữ giao diện này)
  const [arrivedForced] = useState(() => !!user?.twoFactorSetupRequired);

  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to={CHANGE_PASSWORD_PATH} replace />;

  const forced = !!user.twoFactorSetupRequired;
  // Vừa bật xong trong chế độ bắt buộc: vẫn ở màn hình này để lưu mã dự phòng
  const finishingForced = arrivedForced && !!freshCodes;

  const handleEnabled = ({ user: updated, backupCodes }) => {
    setFreshCodes(backupCodes);
    setCurrentUser(updated);
    toast.success('Đã bật xác thực 2 bước');
  };

  const handleRegenerate = async ({ code }) => {
    try {
      const { user: updated, backupCodes } = await authService.regenerateBackupCodes(code);
      setCurrentUser(updated);
      setFreshCodes(backupCodes);
      toast.success('Đã tạo bộ mã dự phòng mới');
    } catch (error) {
      toast.error(errorMessage(error, 'Không tạo được mã dự phòng'));
    }
  };

  const handleDisable = async ({ password, code }) => {
    try {
      setCurrentUser(await authService.disableTwoFactor(password, code));
      setPanel(null);
      toast.success('Đã tắt xác thực 2 bước');
    } catch (error) {
      toast.error(errorMessage(error, 'Không tắt được xác thực 2 bước'));
    }
  };

  const closeCodes = () => {
    setFreshCodes(null);
    setPanel(null);
    if (finishingForced) navigate(homePathFor(user), { replace: true });
  };

  const signOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const showForcedLayout = forced || finishingForced;
  const backupLow = user.twoFactorEnabled && user.backupCodesLeft <= 2;

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
        {showForcedLayout ? (
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

      <div className="flex flex-1 justify-center px-4 pb-12 sm:px-10">
        <div className="w-full max-w-[640px] space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-navy-950 sm:text-3xl">
              {showForcedLayout ? 'Bật xác thực 2 bước' : 'Bảo mật tài khoản'}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              {showForcedLayout
                ? <>Xin chào <strong className="text-navy-950">{user.fullName || user.username}</strong>. Tài khoản quản trị bắt buộc dùng xác thực 2 bước: ngoài mật khẩu, mỗi lần đăng nhập cần thêm mã 6 số từ điện thoại. Kẻ gian có được mật khẩu cũng không đăng nhập được.</>
                : 'Quản lý mật khẩu và xác thực 2 bước cho tài khoản của bạn.'}
            </p>
          </div>

          {/* Xác thực 2 bước */}
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-start gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${user.twoFactorEnabled ? 'bg-emerald-50' : 'bg-gold/10'}`}>
                {user.twoFactorEnabled ? <ShieldCheck className="h-5 w-5 text-emerald-600" /> : <ShieldAlert className="h-5 w-5 text-gold-dark" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-navy-950">Xác thực 2 bước</h2>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${user.twoFactorEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-slate-500'}`}>
                    {user.twoFactorEnabled ? 'Đang bật' : 'Chưa bật'}
                  </span>
                  {user.twoFactorRequired && (
                    <span className="rounded-full bg-navy-950/5 px-2 py-0.5 text-xs font-medium text-navy-950">Bắt buộc với quản trị viên</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Dùng ứng dụng Google Authenticator trên điện thoại để tạo mã đăng nhập.
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-stone-100 pt-5">
              {freshCodes ? (
                <BackupCodesPanel
                  codes={freshCodes}
                  username={user.username}
                  onDone={closeCodes}
                  doneLabel={finishingForced ? 'Hoàn tất, vào trang quản trị' : 'Xong'}
                />
              ) : !user.twoFactorEnabled ? (
                panel === 'setup' || forced ? (
                  <SetupWizard onEnabled={handleEnabled} onCancel={forced ? null : () => setPanel(null)} />
                ) : (
                  <button type="button" onClick={() => setPanel('setup')} className={PRIMARY_BTN}>
                    <ShieldCheck className="h-4 w-4" /> Bật xác thực 2 bước
                  </button>
                )
              ) : (
                <div>
                  <div className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm ${backupLow ? 'bg-amber-50 text-amber-900' : 'bg-stone-50 text-slate-600'}`}>
                    <span className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4" />
                      Còn <strong>{user.backupCodesLeft}</strong> mã dự phòng chưa dùng
                      {backupLow && ' — nên tạo bộ mới'}
                    </span>
                  </div>
                  {panel === 'regen' ? (
                    <ConfirmForm submitLabel="Tạo bộ mã mới" onSubmit={handleRegenerate} onCancel={() => setPanel(null)} />
                  ) : panel === 'disable' ? (
                    <ConfirmForm withPassword allowBackup danger submitLabel="Tắt xác thực 2 bước" onSubmit={handleDisable} onCancel={() => setPanel(null)} />
                  ) : (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" onClick={() => setPanel('regen')} className={SECONDARY_BTN}>
                        <RefreshCw className="h-4 w-4" /> Tạo mã dự phòng mới
                      </button>
                      {!user.twoFactorRequired && (
                        <button type="button" onClick={() => setPanel('disable')} className={`${SECONDARY_BTN} hover:!border-red-300 hover:!text-red-600`}>
                          <ShieldOff className="h-4 w-4" /> Tắt xác thực 2 bước
                        </button>
                      )}
                    </div>
                  )}
                  <p className="mt-4 text-xs text-slate-400">
                    Đổi điện thoại hoặc mất điện thoại? Đăng nhập bằng mã dự phòng
                    {user.twoFactorRequired ? ', rồi nhờ quản trị viên khác tắt 2FA để thiết lập lại.' : ', tắt rồi bật lại 2FA trên điện thoại mới.'}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Mật khẩu */}
          {!showForcedLayout && (
            <Link
              to={CHANGE_PASSWORD_PATH}
              className="group flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-gold sm:px-7"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/10">
                <Lock className="h-5 w-5 text-gold-dark" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-navy-950">Mật khẩu</h2>
                <p className="mt-0.5 text-sm text-slate-500">Đổi mật khẩu đăng nhập. Các thiết bị khác sẽ bị đăng xuất.</p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityPage;
