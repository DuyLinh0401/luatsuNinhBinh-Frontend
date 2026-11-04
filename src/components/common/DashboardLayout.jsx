import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import BrandLogo from './BrandLogo';
import {
  LogOut,
  Menu,
  ExternalLink,
  Landmark,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck
} from 'lucide-react';

const COLLAPSE_KEY = 'lawnb.sidebarCollapsed';

const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
};

const isPathActive = (itemPath, pathname, rootPath) =>
  itemPath === rootPath
    ? pathname === itemPath
    : pathname === itemPath || pathname.startsWith(`${itemPath}/`);

// Tooltip hiển thị khi sidebar thu gọn
const CollapsedTooltip = ({ label }) => (
  <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-navy-800 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity group-hover:opacity-100 z-50">
    {label}
  </span>
);

const NavItem = ({ item, active, collapsed, onNavigate }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`group relative flex h-9 items-center gap-3 rounded-md text-[13px] transition-colors ${
        collapsed ? 'justify-center px-0' : 'px-2.5'
      } ${
        active
          ? 'bg-white/[0.07] text-white font-semibold'
          : 'text-slate-400 font-medium hover:bg-white/[0.04] hover:text-slate-100'
      }`}
    >
      {active && (
        <span className="absolute -left-3 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-gold" />
      )}
      <Icon
        strokeWidth={1.75}
        className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-gold-hover' : 'text-slate-500 group-hover:text-slate-300'}`}
      />
      {collapsed ? <CollapsedTooltip label={item.label} /> : <span className="truncate">{item.label}</span>}
    </Link>
  );
};

/**
 * Khung giao diện dùng chung cho khu vực quản trị (admin) và nhân viên (staff).
 */
const DashboardLayout = ({
  children,
  rootPath,
  brandTitle,
  brandSubtitle,
  roleLabel,
  avatarClassName,
  navGroups,
  breadcrumbRoot,
  fallbackTitle,
  headerBadge
}) => {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      // bỏ qua khi trình duyệt chặn localStorage
    }
  }, [collapsed]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const currentLabel = () => {
    for (const group of navGroups) {
      const found = group.items.find(i => isPathActive(i.path, location.pathname, rootPath));
      if (found) return found.label;
    }
    return fallbackTitle;
  };

  // Trên mobile sidebar luôn hiển thị đầy đủ
  const isCollapsed = collapsed && !mobileOpen;
  const displayName = user?.fullName || user?.username;
  const initial = (displayName || 'A').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-stone-parchment text-slate-800 font-sans flex flex-col">

      {/* Lớp phủ mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full flex-col bg-navy-950 border-r border-white/[0.06] transition-[width,transform] duration-300 ${
          isCollapsed ? 'lg:w-[68px]' : 'lg:w-60'
        } w-64 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Thương hiệu */}
        <div className={`flex h-14 shrink-0 items-center border-b border-white/[0.06] ${isCollapsed ? 'justify-center px-0' : 'justify-between px-4'}`}>
          {isCollapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              className="group relative flex h-10 w-10 items-center justify-center rounded-md"
              aria-label="Mở rộng menu"
            >
              <BrandLogo className="h-10 w-10 transition-opacity group-hover:opacity-0" />
              <PanelLeftOpen className="absolute h-4 w-4 text-gold-hover opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={2} />
              <CollapsedTooltip label="Mở rộng menu" />
            </button>
          ) : (
            <>
              <Link to={rootPath} className="flex min-w-0 items-center gap-2.5">
                <BrandLogo className="h-10 w-10" />
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-[15px] font-bold text-white">{brandTitle}</p>
                  <p className="truncate text-[10px] font-medium uppercase tracking-[0.12em] text-gold">{brandSubtitle}</p>
                </div>
              </Link>
              <button
                onClick={() => (mobileOpen ? setMobileOpen(false) : setCollapsed(true))}
                className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-white"
                aria-label="Thu gọn menu"
                title="Thu gọn menu"
              >
                <PanelLeftClose className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </button>
            </>
          )}
        </div>

        {/* Điều hướng */}
        <nav className={`sidebar-scroll flex-1 px-3 py-4 ${isCollapsed ? 'overflow-visible' : 'overflow-y-auto overflow-x-hidden'}`}>
          {navGroups.map((group, gIdx) => (
            <div key={group.groupTitle} className={gIdx > 0 ? 'mt-5' : ''}>
              {isCollapsed ? (
                gIdx > 0 && <div className="mx-2 mb-3 -mt-2 h-px bg-white/[0.06]" />
              ) : (
                <p className="mb-1.5 px-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  {group.groupTitle}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <NavItem
                    key={item.path}
                    item={item}
                    collapsed={isCollapsed}
                    onNavigate={() => setMobileOpen(false)}
                    active={isPathActive(item.path, location.pathname, rootPath)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Chân sidebar */}
        <div className="shrink-0 border-t border-white/[0.06] p-3 space-y-2">
          <Link
            to="/"
            target="_blank"
            className={`group relative flex h-9 items-center gap-3 rounded-md text-[13px] font-medium text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-100 ${
              isCollapsed ? 'justify-center' : 'px-2.5'
            }`}
          >
            <ExternalLink className="h-[18px] w-[18px] shrink-0 text-slate-500 group-hover:text-gold" strokeWidth={1.75} />
            {isCollapsed ? <CollapsedTooltip label="Xem cổng công cộng" /> : <span>Xem cổng công cộng</span>}
          </Link>

          <div className={`flex items-center rounded-lg bg-white/[0.03] ring-1 ring-white/[0.05] ${isCollapsed ? 'flex-col gap-2 py-2' : 'gap-2.5 p-2'}`}>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarClassName}`}>
              {initial}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-white">{displayName}</p>
                <p className="truncate text-[11px] text-slate-500">{roleLabel}</p>
              </div>
            )}
            <Link
              to="/bao-mat"
              className="group relative rounded-md p-1.5 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-gold-hover"
              aria-label="Bảo mật tài khoản"
              title={isCollapsed ? undefined : 'Bảo mật tài khoản'}
            >
              <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
              {isCollapsed && <CollapsedTooltip label="Bảo mật tài khoản" />}
            </Link>
            <button
              onClick={handleLogout}
              className="group relative rounded-md p-1.5 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
              aria-label="Đăng xuất"
              title={isCollapsed ? undefined : 'Đăng xuất'}
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
              {isCollapsed && <CollapsedTooltip label="Đăng xuất" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Nội dung chính */}
      <div className={`flex flex-1 flex-col transition-[margin] duration-300 ${collapsed ? 'lg:ml-[68px]' : 'lg:ml-60'}`}>

        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-stone-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="-ml-1 rounded-md p-1.5 text-slate-600 hover:bg-stone-100 lg:hidden"
              aria-label="Mở menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="hidden text-xs font-semibold uppercase tracking-wider text-slate-400 sm:inline">
              {breadcrumbRoot}
            </span>
            <span className="hidden text-stone-300 sm:inline">/</span>
            <h1 className="truncate text-base font-bold text-navy-950">
              {currentLabel()}
            </h1>
          </div>

          <div className="flex items-center gap-5">
            <div className="hidden items-center gap-2 rounded-full border border-stone-200 bg-stone-100 px-3 py-1.5 text-xs text-slate-600 md:flex">
              <Landmark className="h-3.5 w-3.5 text-gold" />
              <span>{headerBadge}</span>
            </div>
            <span className="hidden text-xs font-medium text-slate-500 lg:inline">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>

    </div>
  );
};

export default DashboardLayout;
