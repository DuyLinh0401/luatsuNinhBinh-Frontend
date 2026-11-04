// Header cổng thông tin: thanh thông tin, dải thương hiệu + tìm kiếm, thanh menu (từ DB, dính khi cuộn)
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Menu, X, ChevronDown, Phone, Clock, MapPin, LayoutDashboard, LogIn, Home } from 'lucide-react';
import BrandLogo from '../common/BrandLogo';
import { useAuth } from '../../contexts/AuthContext';
import { useSite } from '../../contexts/siteContext';
import { SmartLink } from './PortalUI';

const isActivePath = (url, pathname) => {
  if (!url) return false;
  if (url === '/') return pathname === '/';
  return pathname === url || pathname.startsWith(`${url}/`);
};

const itemActive = (item, pathname) =>
  isActivePath(item.url, pathname) || (item.children || []).some((c) => itemActive(c, pathname));

const SearchBox = ({ className, autoFocus, onDone }) => {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  return (
    <form
      role="search"
      className={`relative [&>div]:!mb-0 ${className || ''}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim().length < 2) return;
        navigate(`/tim-kiem?q=${encodeURIComponent(q.trim())}`);
        setQ('');
        onDone?.();
      }}
    >
      <input
        type="search"
        value={q}
        autoFocus={autoFocus}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Tìm bài viết, văn bản, luật sư..."
        aria-label="Tìm kiếm"
        className="w-full rounded-full border border-stone-300 bg-white !py-2 !pl-4 !pr-11 text-sm text-navy-950 placeholder:text-slate-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
      />
      <button type="submit" aria-label="Tìm kiếm" className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-white hover:bg-brand-dark">
        <Search className="h-4 w-4" />
      </button>
    </form>
  );
};

// Mục menu cấp 1 trên desktop, có dropdown khi có mục con
const DesktopItem = ({ item, pathname, alignRight }) => {
  const [open, setOpen] = useState(false);
  const active = itemActive(item, pathname);
  const hasChildren = item.children?.length > 0;
  const isHome = item.url === '/';

  return (
    <li className="relative" onMouseEnter={() => hasChildren && setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <SmartLink
        to={item.url}
        newTab={item.openInNewTab}
        aria-haspopup={hasChildren || undefined}
        aria-expanded={hasChildren ? open : undefined}
        onFocus={() => hasChildren && setOpen(true)}
        className={`relative flex h-12 items-center gap-1 whitespace-nowrap px-3 text-[13.5px] font-semibold transition-colors ${
          active ? 'bg-white/[0.08] text-white' : 'text-white/90 hover:bg-white/10 hover:text-white'
        } ${open ? 'bg-white/10' : ''}`}
      >
        {isHome ? <Home className="h-4 w-4" aria-label={item.label} /> : item.label}
        {hasChildren && <ChevronDown className={`h-3.5 w-3.5 opacity-70 transition-transform ${open ? 'rotate-180' : ''}`} />}
        {active && <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-t bg-gold" />}
      </SmartLink>

      {hasChildren && open && (
        <div className={`absolute top-full z-50 pt-0 ${alignRight ? 'right-0' : 'left-0'}`}>
          <ul className="min-w-[260px] rounded-b-xl border-t-2 border-gold bg-white py-2 shadow-2xl shadow-navy-950/20 ring-1 ring-black/5 animate-fade-in">
            {item.children.map((child) => {
              const childActive = itemActive(child, pathname);
              return (
                <li key={child.id}>
                  <SmartLink
                    to={child.url}
                    newTab={child.openInNewTab}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                      childActive ? 'bg-gold/10 font-semibold text-navy-950' : 'text-slate-700 hover:bg-stone-50 hover:text-navy-950'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${childActive ? 'bg-gold' : 'bg-stone-300'}`} />
                    {child.label}
                  </SmartLink>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </li>
  );
};

const MobileItem = ({ item, pathname, onNavigate }) => {
  const active = itemActive(item, pathname);
  const [open, setOpen] = useState(active);
  const hasChildren = item.children?.length > 0;

  return (
    <li className="border-b border-white/[0.06]">
      <div className="flex items-center">
        <SmartLink
          to={item.url}
          newTab={item.openInNewTab}
          onClick={onNavigate}
          className={`flex-1 px-4 py-3 text-[15px] font-medium ${active ? 'text-gold-hover' : 'text-stone-100'}`}
        >
          {item.label}
        </SmartLink>
        {hasChildren && (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Thu gọn' : 'Mở rộng'}
            aria-expanded={open}
            className="flex h-12 w-12 items-center justify-center text-stone-400"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
      {hasChildren && open && (
        <ul className="bg-black/20 pb-2">
          {item.children.map((child) => (
            <li key={child.id}>
              <SmartLink
                to={child.url}
                newTab={child.openInNewTab}
                onClick={onNavigate}
                className={`block py-2 pl-8 pr-4 text-sm ${isActivePath(child.url, pathname) ? 'font-semibold text-gold-hover' : 'text-stone-300'}`}
              >
                {child.label}
              </SmartLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

const PortalHeader = () => {
  const { settings, headerMenu } = useSite();
  const { user, isAdmin, isStaff } = useAuth();
  const { pathname } = useLocation();
  // Lưu đường dẫn lúc mở drawer: chuyển trang (kể cả Back) là drawer tự đóng
  const [drawerPath, setDrawerPath] = useState(null);
  const drawer = drawerPath === pathname;
  const setDrawer = (open) => setDrawerPath(open ? pathname : null);

  const general = settings.general || {};
  const contact = settings.contact || {};
  const siteName = general.siteName || 'Đoàn Luật sư tỉnh Ninh Bình';
  const dashboard = isAdmin ? '/admin' : isStaff ? '/staff' : null;

  // Khoá cuộn trang khi mở menu di động
  useEffect(() => {
    if (!drawer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawer]);

  return (
    <>
      {/* Thanh thông tin */}
      <div className="hidden border-b border-stone-200 bg-stone-warm text-xs text-slate-600 lg:block">
        <div className="container mx-auto flex h-9 max-w-7xl items-center justify-between gap-6 px-6">
          <div className="flex min-w-0 items-center gap-5">
            {contact.address && (
              <span className="flex min-w-0 items-center gap-1.5 truncate"><MapPin className="h-3.5 w-3.5 shrink-0 text-brand" />{contact.address}</span>
            )}
            {contact.workingHours && (
              <span className="flex items-center gap-1.5 whitespace-nowrap"><Clock className="h-3.5 w-3.5 text-brand" />{contact.workingHours}</span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-5">
            {contact.hotline && (
              <a href={`tel:${contact.hotline.replace(/\s/g, '')}`} className="flex items-center gap-1.5 font-semibold text-brand hover:text-navy-950">
                <Phone className="h-3.5 w-3.5" /> {contact.hotline}
              </a>
            )}
            {user ? (
              dashboard && (
                <Link to={dashboard} className="flex items-center gap-1.5 font-medium hover:text-brand">
                  <LayoutDashboard className="h-3.5 w-3.5 text-brand" /> Trang quản trị
                </Link>
              )
            ) : (
              <Link to="/login" className="flex items-center gap-1.5 font-medium hover:text-brand">
                <LogIn className="h-3.5 w-3.5 text-brand" /> Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Dải thương hiệu */}
      {/* Điện thoại / máy tính bảng: dải này dính trên cùng để luôn mở được menu; màn hình rộng thì thanh menu bên dưới mới dính */}
      <div className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85 xl:static xl:bg-white">
        <div className="container mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6 sm:py-3 lg:py-4">
          <Link to="/" className="group flex min-w-0 items-center gap-3">
            <BrandLogo className="h-12 w-12 transition-transform group-hover:scale-[1.03] sm:h-14 sm:w-14 lg:h-[72px] lg:w-[72px]" />
            <div className="min-w-0 leading-tight">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-dark sm:text-[11px] sm:tracking-[0.18em]">Cổng thông tin điện tử</p>
              {/* Điện thoại: tên dài xuống tối đa 2 dòng thay vì bị cắt */}
              <p className="line-clamp-2 text-[15px] font-bold uppercase leading-tight tracking-wide text-navy-950 sm:truncate sm:text-xl lg:text-2xl">{siteName}</p>
            </div>
          </Link>

          <SearchBox className="hidden w-80 lg:block" />

          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Mở menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-stone-300 text-navy-950 xl:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Thanh menu (desktop) */}
      <nav className="sticky top-0 z-40 hidden bg-brand shadow-md shadow-navy-950/20 xl:block" aria-label="Điều hướng chính">
        <ul className="container mx-auto flex max-w-7xl items-stretch px-3">
          {headerMenu.map((item, i) => (
            <DesktopItem key={item.id} item={item} pathname={pathname} alignRight={i >= headerMenu.length - 3} />
          ))}
        </ul>
      </nav>

      {/* Menu di động */}
      {drawer && (
        <div className="fixed inset-0 z-[70] xl:hidden">
          <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-[2px]" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-navy-950 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
              <Link to="/" onClick={() => setDrawer(false)} className="flex min-w-0 items-center gap-2.5">
                <BrandLogo className="h-10 w-10" />
                <span className="line-clamp-2 text-sm font-bold uppercase leading-tight text-white">{siteName}</span>
              </Link>
              <button type="button" onClick={() => setDrawer(false)} aria-label="Đóng menu" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-stone-300 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="border-b border-white/[0.08] p-4">
              <SearchBox onDone={() => setDrawer(false)} />
            </div>
            <ul className="flex-1 overflow-y-auto">
              {headerMenu.map((item) => (
                <MobileItem key={item.id} item={item} pathname={pathname} onNavigate={() => setDrawer(false)} />
              ))}
            </ul>
            <div className="space-y-2 border-t border-white/[0.08] p-4 text-sm">
              {contact.hotline && (
                <a href={`tel:${contact.hotline.replace(/\s/g, '')}`} className="flex items-center gap-2 font-semibold text-gold-hover">
                  <Phone className="h-4 w-4" /> {contact.hotline}
                </a>
              )}
              {user ? (
                dashboard && <Link to={dashboard} className="flex items-center gap-2 text-stone-200"><LayoutDashboard className="h-4 w-4 text-gold" /> Trang quản trị</Link>
              ) : (
                <Link to="/login" className="flex items-center gap-2 text-stone-200"><LogIn className="h-4 w-4 text-gold" /> Đăng nhập</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PortalHeader;
