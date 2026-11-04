// Footer cổng thông tin: thông tin liên hệ, menu chân trang (từ DB), tài khoản ngân hàng, mạng xã hội
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Printer, ChevronRight } from 'lucide-react';
import BrandLogo from '../common/BrandLogo';
import { FacebookIcon, YoutubeIcon } from './BrandIcons';
import { useSite } from '../../contexts/siteContext';
import { assetUrl } from '../../services/portalService';
import { SmartLink } from './PortalUI';

const SOCIAL = [
  { key: 'facebook', label: 'Facebook', icon: FacebookIcon },
  { key: 'youtube', label: 'YouTube', icon: YoutubeIcon }
];

const telHref = (phone) => `tel:${phone.replace(/[^\d+]/g, '')}`;

const PortalFooter = () => {
  const { settings, footerMenu } = useSite();
  const general = settings.general || {};
  const contact = settings.contact || {};
  const social = settings.social || {};
  const banks = (settings.bankAccounts || []).filter((b) => b.accountNumber);
  const phones = (contact.phones || []).filter(Boolean);
  const siteName = general.siteName || 'Đoàn Luật sư tỉnh Ninh Bình';

  return (
    <footer className="relative mt-auto overflow-hidden bg-navy-950 text-sm text-stone-300">
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:radial-gradient(#C8992B_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="h-1 bg-gradient-to-r from-gold-dark via-gold-hover to-gold-dark" />

      <div className="container relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12">
        {/* Thương hiệu + liên hệ */}
        <div className="lg:col-span-4">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo className="h-16 w-16" />
            <div className="leading-tight">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">Cổng thông tin điện tử</p>
              <p className="text-lg font-bold uppercase text-white">{siteName}</p>
            </div>
          </Link>
          {general.description && <p className="mt-4 text-[13px] leading-relaxed text-stone-400">{general.description}</p>}

          <ul className="mt-5 space-y-2.5 text-[13px]">
            {contact.address && (
              <li className="flex gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{contact.address}</li>
            )}
            {phones.length > 0 && (
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span className="flex flex-wrap gap-x-2">
                  {phones.map((p, i) => (
                    <a key={p} href={telHref(p)} className="hover:text-white">{p}{i < phones.length - 1 && ' –'}</a>
                  ))}
                </span>
              </li>
            )}
            {contact.fax && <li className="flex gap-2.5"><Printer className="mt-0.5 h-4 w-4 shrink-0 text-gold" />Fax: {contact.fax}</li>}
            {contact.email && (
              <li className="flex gap-2.5"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" /><a href={`mailto:${contact.email}`} className="hover:text-white">{contact.email}</a></li>
            )}
            {contact.workingHours && <li className="flex gap-2.5"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{contact.workingHours}</li>}
          </ul>
        </div>

        {/* Menu chân trang */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-5">
          {footerMenu.map((group) => (
            <div key={group.id}>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider !text-white">{group.label}</h3>
              <ul className="space-y-0.5 text-sm lg:space-y-2 lg:text-[13px]">
                {(group.children || []).map((item) => (
                  <li key={item.id}>
                    <SmartLink to={item.url} newTab={item.openInNewTab} className="group inline-flex items-start gap-1 py-1.5 text-stone-400 hover:text-gold-hover lg:py-0">
                      <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-50 group-hover:opacity-100" />
                      {item.label}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Tài khoản ngân hàng */}
        <div className="lg:col-span-3">
          {banks.length > 0 && (
            <>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider !text-white">Tài khoản ngân hàng</h3>
              <ul className="space-y-3">
                {banks.map((b) => (
                  <li key={`${b.bankName}-${b.accountNumber}`} className="flex gap-3 rounded-lg border border-white/[0.08] bg-white/[0.03] p-3">
                    {b.qrImage && (
                      <img src={assetUrl(b.qrImage)} alt={`QR ${b.bankName}`} className="h-16 w-16 shrink-0 rounded bg-white object-contain p-1" />
                    )}
                    <div className="min-w-0 text-[12.5px] leading-relaxed">
                      <p className="font-semibold text-white">{b.bankName}{b.branch && ` – ${b.branch}`}</p>
                      <p className="tabular-nums text-gold-hover">{b.accountNumber}</p>
                      {b.accountName && <p className="truncate text-stone-400">{b.accountName}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="relative border-t border-white/[0.08]">
        <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-stone-500 sm:flex-row sm:px-6">
          <p>{general.copyright || `© ${new Date().getFullYear()} ${siteName}`}</p>
          <div className="flex items-center gap-3">
            {SOCIAL.filter((s) => social[s.key]).map(({ key, label, icon: Icon }) => (
              <a key={key} href={social[key]} target="_blank" rel="noreferrer" aria-label={label} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 hover:border-gold hover:text-gold-hover sm:h-8 sm:w-8">
                <Icon className="h-4 w-4" />
              </a>
            ))}
            {social.zalo && (
              <a href={social.zalo} target="_blank" rel="noreferrer" className="flex h-8 items-center rounded-full border border-white/10 px-3 font-semibold hover:border-gold hover:text-gold-hover">Zalo</a>
            )}
            <Link to="/login" className="py-2 hover:text-stone-300 sm:py-0">Đăng nhập quản trị</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PortalFooter;
