// src/pages/auth/LoginPage.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { errorMessage } from '../../services/portalService';
import { homePathFor } from '../../utils/authRedirect';
import BrandLogo from '../../components/common/BrandLogo';
import {
  Scale,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Home,
  ShieldCheck,
  Clock,
  Phone,
  Loader2,
  Smartphone,
  KeyRound
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  { role: 'Quản trị viên', username: 'admin', password: 'Admin@123' },
  { role: 'Nhân viên', username: 'staff.nguyen', password: 'Staff@123' }
];

const TRUST_POINTS = [
  { icon: ShieldCheck, text: 'Kết nối mã hoá, bảo mật tuyệt đối hồ sơ' },
  { icon: Clock, text: 'Theo dõi tiến độ vụ việc theo thời gian thực' },
  { icon: Scale, text: '100% luật sư là thành viên Đoàn Luật sư' }
];

// Bước 2 của đăng nhập: mã 6 số từ ứng dụng xác thực, hoặc mã dự phòng
const TwoFactorStep = ({ code, onChange, onSubmit, loading, useBackupCode, onToggleBackup, onBack }) => {
  const ready = useBackupCode ? code.replace(/-/g, '').length === 8 : code.length === 6;
  return (
    <div>
      <div className="mb-7">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gold/10">
          {useBackupCode ? <KeyRound className="h-5 w-5 text-gold-dark" /> : <Smartphone className="h-5 w-5 text-gold-dark" />}
        </div>
        <h2 className="text-3xl font-bold text-navy-950">Xác thực 2 bước</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {useBackupCode
            ? 'Nhập một trong các mã dự phòng (dạng ABCD-EFGH) bạn đã lưu khi bật xác thực 2 bước. Mỗi mã chỉ dùng được một lần.'
            : 'Mở ứng dụng Google Authenticator (hoặc ứng dụng xác thực bạn đã dùng) trên điện thoại và nhập mã 6 số của tài khoản LawNB.'}
        </p>
      </div>

      <form
        className="space-y-5 [&>div]:!mb-0"
        onSubmit={(e) => { e.preventDefault(); if (ready) onSubmit(); }}
      >
        <div>
          <label htmlFor="otp-code" className="!mb-1.5 block text-sm font-medium text-slate-700">
            {useBackupCode ? 'Mã dự phòng' : 'Mã xác thực'}
          </label>
          <input
            id="otp-code"
            key={useBackupCode ? 'backup' : 'totp'}
            type="text"
            inputMode={useBackupCode ? 'text' : 'numeric'}
            autoComplete="one-time-code"
            autoFocus
            value={code}
            onChange={(e) => onChange(e.target.value)}
            placeholder={useBackupCode ? 'ABCD-EFGH' : '000000'}
            readOnly={loading} // readOnly thay vì disabled để giữ focus khi nhập lại sau lỗi
            className="w-full rounded-lg border border-stone-300 bg-white !px-4 !py-3 text-center font-mono text-2xl tracking-[0.4em] text-navy-950 placeholder:text-slate-300 shadow-sm transition focus:border-gold focus:outline-none focus:ring-4 focus:ring-gold/15"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !ready}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy-950 py-3 text-sm font-semibold text-white shadow-lg shadow-navy-950/20 transition hover:bg-navy-900 focus:outline-none focus:ring-4 focus:ring-gold/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang xác thực...</> : 'Xác nhận'}
        </button>
      </form>

      <div className="mt-6 space-y-3 text-center text-sm">
        <button type="button" onClick={onToggleBackup} className="font-medium text-gold-dark hover:text-navy-950 transition-colors">
          {useBackupCode ? 'Dùng mã từ ứng dụng xác thực' : 'Không dùng được điện thoại? Dùng mã dự phòng'}
        </button>
        <div>
          <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-slate-500 hover:text-navy-950 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Quay lại đăng nhập
          </button>
        </div>
        <p className="text-xs text-slate-400">Mất cả điện thoại và mã dự phòng? Liên hệ quản trị viên để được tắt xác thực 2 bước.</p>
      </div>
    </div>
  );
};

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  // Bước 2 (tài khoản đã bật 2FA): token tạm từ server + mã 6 số / mã dự phòng
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const { login, verifyTwoFactor } = useAuth();
  const navigate = useNavigate();

  const finishLogin = (user) => {
    if (user.mustChangePassword) {
      toast('Bạn đang dùng mật khẩu tạm, vui lòng đặt mật khẩu mới.', { icon: '🔑' });
    } else if (user.twoFactorSetupRequired) {
      toast('Tài khoản quản trị cần bật xác thực 2 bước trước khi sử dụng.', { icon: '🛡️' });
    } else {
      toast.success('Đăng nhập thành công!');
    }
    navigate(homePathFor(user), { replace: true });
  };

  const backToCredentials = () => {
    setChallenge(null);
    setCode('');
    setPassword('');
    setUseBackupCode(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(username, password);
      if (result.twoFactorRequired) {
        setChallenge(result.challengeToken);
        setCode('');
        return;
      }
      finishLogin(result.user);
    } catch (error) {
      toast.error(errorMessage(error, 'Đăng nhập thất bại'), { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async (value) => {
    if (loading) return;
    setLoading(true);
    try {
      finishLogin(await verifyTwoFactor(challenge, value));
    } catch (error) {
      toast.error(errorMessage(error, 'Xác thực thất bại'), { duration: 6000 });
      setCode('');
      // Hết phiên xác thực hoặc bị tạm khóa: quay về bước nhập mật khẩu
      if (error.response?.data?.code === 'TWO_FACTOR_CHALLENGE_EXPIRED' || error.response?.status === 429) {
        backToCredentials();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value) => {
    if (useBackupCode) {
      setCode(value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 9));
      return;
    }
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (digits.length === 6) submitCode(digits); // đủ 6 số thì tự gửi
  };

  const fillDemoAccount = (account) => {
    setUsername(account.username);
    setPassword(account.password);
  };

  // Dùng "!" để thắng quy tắc `input { padding: ... !important }` toàn cục trong index.css
  const inputClass = (withTrailing = false) =>
    `w-full rounded-lg border border-stone-300 bg-white !py-3 !pl-11 ${withTrailing ? '!pr-11' : '!pr-4'} text-sm text-navy-950 placeholder:text-slate-400 shadow-sm transition focus:border-gold focus:outline-none focus:ring-4 focus:ring-gold/15`;

  return (
    <div className="min-h-screen flex bg-stone-parchment font-sans">

      {/* Cột thương hiệu */}
      <aside className="relative hidden lg:flex lg:w-[46%] xl:w-1/2 flex-col justify-between overflow-hidden bg-navy-950 p-12 text-white">
        <img
          src="/images/trangan-hero.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950/90 via-navy-950/65 to-navy-950/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-navy-950/60" />

        <Link to="/" className="relative z-10 flex w-fit items-center gap-3.5 group">
          <BrandLogo className="h-16 w-16 drop-shadow-lg transition-transform group-hover:scale-105" />
          <div className="leading-tight">
            <span className="text-xl font-bold tracking-wider text-white transition-colors group-hover:text-gold-hover">LAWNB</span>
            <p className="text-[11px] font-medium uppercase tracking-wide text-stone-300">Đoàn Luật Sư Ninh Bình</p>
          </div>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-lg"
        >
          <span className="inline-block rounded-full border border-gold/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-hover">
            Cổng nội bộ
          </span>
          {/* text-white bắt buộc: index.css ép mọi h1 thành text-navy-950 */}
          <h1 className="mt-5 text-[2.5rem] font-bold leading-[1.15] text-white drop-shadow-sm xl:text-[2.85rem]">
            Vững chãi như <span className="text-gold-hover">đá Hoa Lư</span>,
            <br />
            công minh như <span className="text-gold-hover">nước Tràng An</span>.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-stone-200">
            Hệ thống quản lý hồ sơ, vụ việc và nội dung pháp lý dành cho luật sư và cán bộ Đoàn Luật sư tỉnh Ninh Bình.
          </p>

          <ul className="mt-8 space-y-3">
            {TRUST_POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-stone-200">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/[0.06] ring-1 ring-white/10">
                  <Icon className="h-4 w-4 text-gold-hover" strokeWidth={1.75} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </motion.div>

        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-stone-400">
          <span>© {new Date().getFullYear()} Đoàn Luật Sư Tỉnh Ninh Bình</span>
          <a href="tel:0912345678" className="flex items-center gap-1.5 font-semibold text-gold-hover hover:text-white transition-colors">
            <Phone className="h-3.5 w-3.5" />
            0912 345 678
          </a>
        </div>
      </aside>

      {/* Cột đăng nhập */}
      <main className="flex flex-1 flex-col">
        <div className="flex items-center justify-between px-6 py-5 sm:px-10">
          <Link to="/" className="flex items-center gap-2.5 lg:hidden">
            <BrandLogo className="h-11 w-11" />
            <span className="text-lg font-bold tracking-wider text-navy-950">LAWNB</span>
          </Link>

          <Link
            to="/"
            className="group ml-auto inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-gold hover:text-navy-950"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Về trang chủ
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-10 sm:px-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="w-full max-w-[420px]"
          >
            {challenge ? (
              <TwoFactorStep
                code={code}
                onChange={handleCodeChange}
                onSubmit={() => submitCode(code)}
                loading={loading}
                useBackupCode={useBackupCode}
                onToggleBackup={() => { setUseBackupCode((v) => !v); setCode(''); }}
                onBack={backToCredentials}
              />
            ) : (
            <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-navy-950">Đăng nhập</h2>
              <p className="mt-2 text-sm text-slate-500">
                Chào mừng trở lại. Vui lòng nhập thông tin tài khoản để tiếp tục.
              </p>
            </div>

            <form className="space-y-5 [&>div]:!mb-0" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Tài khoản
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoFocus
                    className={inputClass()}
                    placeholder="Tên đăng nhập hoặc email"
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-400">
                  Luật sư có thể dùng số chứng chỉ hành nghề hoặc số thẻ luật sư.
                </p>
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={inputClass(true)}
                    placeholder="Nhập mật khẩu"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-stone-100 hover:text-slate-700"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.75} /> : <Eye className="h-[18px] w-[18px]" strokeWidth={1.75} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-lg bg-navy-950 py-3 text-sm font-semibold text-white shadow-lg shadow-navy-950/20 transition hover:bg-navy-900 focus:outline-none focus:ring-4 focus:ring-gold/25 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  <>
                    Đăng nhập
                    <ArrowRight className="h-4 w-4 text-gold-hover transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {/* Tài khoản dùng thử */}
            <div className="mt-8">
              <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                <span className="h-px flex-1 bg-stone-200" />
                Tài khoản dùng thử
                <span className="h-px flex-1 bg-stone-200" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.username}
                    type="button"
                    onClick={() => fillDemoAccount(account)}
                    className={`rounded-lg border bg-white px-3 py-2.5 text-left transition hover:border-gold hover:shadow-sm ${
                      username === account.username ? 'border-gold ring-2 ring-gold/15' : 'border-stone-200'
                    }`}
                  >
                    <span className="block text-xs font-semibold text-navy-950">{account.role}</span>
                    <span className="mt-0.5 block truncate text-[11px] text-slate-500">{account.username}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-center text-[11px] text-slate-400">Bấm để tự động điền thông tin đăng nhập</p>
            </div>
            </>
            )}
          </motion.div>
        </div>

        {/* Điều hướng nhanh */}
        <div className="border-t border-stone-200 px-6 py-4 sm:px-10">
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <Link to="/" className="flex items-center gap-1.5 font-medium text-navy-950 hover:text-gold transition-colors">
              <Home className="h-3.5 w-3.5" />
              Trang chủ
            </Link>
            <Link to="/tra-cuu/luat-su" className="hover:text-navy-950 transition-colors">Tra cứu luật sư</Link>
            <Link to="/van-ban" className="hover:text-navy-950 transition-colors">Văn bản</Link>
            <Link to="/lien-he" className="hover:text-navy-950 transition-colors">Liên hệ</Link>
          </nav>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
