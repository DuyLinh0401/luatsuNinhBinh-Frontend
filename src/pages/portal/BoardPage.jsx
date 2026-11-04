// Ban Chủ nhiệm / Hội đồng khen thưởng, kỷ luật theo nhiệm kỳ
// Routes: /gioi-thieu/ban-chu-nhiem, /gioi-thieu/ban-chu-nhiem/:slug, /gioi-thieu/hoi-dong-khen-thuong-ky-luat
import { useEffect, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { Users } from 'lucide-react';
import { termApi, assetUrl } from '../../services/portalService';
import { portalRoutes } from '../../utils/portalRoutes';
import useAsync from '../../hooks/useAsync';
import usePageTitle from '../../hooks/usePageTitle';
import usePortalMeta from '../../hooks/usePortalMeta';
import {
  Container, PageHero, SectionTitle, RichContent, EmptyBlock, Skeleton, NotFoundBlock
} from '../../components/portal/PortalUI';

const COUNCIL_PATH = '/gioi-thieu/hoi-dong-khen-thuong-ky-luat';

const BOARDS = {
  EXECUTIVE_BOARD: { title: 'Ban Chủ nhiệm', description: 'Ban Chủ nhiệm Đoàn Luật sư tỉnh Ninh Bình qua các nhiệm kỳ.' },
  REWARD_DISCIPLINE_COUNCIL: { title: 'Hội đồng khen thưởng, kỷ luật', description: 'Hội đồng khen thưởng, kỷ luật Đoàn Luật sư tỉnh Ninh Bình qua các nhiệm kỳ.' }
};

const initials = (name = '') =>
  name.trim().split(/\s+/).slice(-2).map((w) => w.charAt(0)).join('').toUpperCase();

// Tải danh sách nhiệm kỳ + nhiệm kỳ cần hiển thị (theo slug, hoặc hiện tại, hoặc mới nhất)
const loadBoard = async (slug) => {
  const terms = await termApi.list();
  if (slug) return { terms, term: await termApi.bySlug(slug) };
  if (!terms.length) return { terms, term: null };
  try {
    return { terms, term: await termApi.current() };
  } catch (error) {
    if (error?.response?.status !== 404) throw error;
    return { terms, term: await termApi.bySlug(terms[0].slug) };
  }
};

const Avatar = ({ member, className }) => {
  const [failed, setFailed] = useState(false);
  return member.photo && !failed ? (
    <img src={assetUrl(member.photo)} alt={member.fullName} onError={() => setFailed(true)} className={`object-cover ${className}`} />
  ) : (
    <div className={`flex items-center justify-center bg-gradient-to-br from-navy-900 to-navy-700 font-bold text-gold-hover ${className}`}>
      {initials(member.fullName)}
    </div>
  );
};

const MemberName = ({ member, className }) =>
  member.lawyer?.slug ? (
    <Link to={portalRoutes.lawyer(member.lawyer.slug)} className={`hover:text-gold-dark ${className}`}>{member.fullName}</Link>
  ) : (
    <span className={className}>{member.fullName}</span>
  );

const MemberCard = ({ member, title }) => (
  <div className="flex flex-col items-center rounded-xl border border-stone-200 bg-white p-5 text-center">
    <Avatar member={member} className="h-24 w-24 rounded-full text-2xl ring-4 ring-stone-100" />
    <MemberName member={member} className="mt-3 text-base font-bold text-navy-950" />
    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gold-dark">{title}</p>
  </div>
);

const BoardPage = () => {
  const { slug: routeSlug } = useParams();
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  const { label } = usePortalMeta();
  const boardKey = pathname.startsWith(COUNCIL_PATH) ? 'REWARD_DISCIPLINE_COUNCIL' : 'EXECUTIVE_BOARD';
  const board = BOARDS[boardKey];
  const isCouncil = boardKey === 'REWARD_DISCIPLINE_COUNCIL';
  // Hội đồng không có route theo slug: chọn nhiệm kỳ qua ?nhiem-ky=
  const slug = routeSlug ?? (isCouncil ? searchParams.get('nhiem-ky') : null) ?? undefined;
  const { data, loading, notFound, error } = useAsync(() => loadBoard(slug), [slug]);

  usePageTitle(data?.term ? `${board.title} – ${data.term.name}` : board.title);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug, boardKey]);

  if (notFound) return <NotFoundBlock title="Không tìm thấy nhiệm kỳ" />;

  const breadcrumb = [
    { label: 'Giới thiệu', to: '/gioi-thieu' },
    { label: board.title, to: slug ? (isCouncil ? COUNCIL_PATH : '/gioi-thieu/ban-chu-nhiem') : undefined },
    slug && data?.term && { label: data.term.name }
  ];

  const term = data?.term;
  const terms = data?.terms || [];
  const members = term?.boards?.[boardKey] || [];
  const roleTitle = (m) => m.positionTitle || label('boardPosition', m.position);
  const chairmen = members.filter((m) => m.position === 'CHAIRMAN');
  const vices = members.filter((m) => m.position === 'VICE_CHAIRMAN');
  const others = members.filter((m) => m.position !== 'CHAIRMAN' && m.position !== 'VICE_CHAIRMAN');

  const termHref = (t) => (isCouncil ? `${COUNCIL_PATH}?nhiem-ky=${t.slug}` : portalRoutes.term(t.slug));

  return (
    <>
      <PageHero title={board.title} description={board.description} breadcrumb={breadcrumb} />

      <Container className="py-8">
        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-10 w-2/3" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-56" />)}
            </div>
          </div>
        ) : error && !term ? (
          <EmptyBlock title="Không tải được dữ liệu" description="Vui lòng thử lại sau." />
        ) : !term ? (
          <EmptyBlock icon={Users} title="Thông tin Ban Chủ nhiệm đang được cập nhật" description="Danh sách các nhiệm kỳ sẽ sớm được công bố." />
        ) : (
          <>
            {/* Chọn nhiệm kỳ */}
            {terms.length > 1 && (
              <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
                {terms.map((t) => {
                  const active = t.slug === term.slug;
                  return (
                    <Link
                      key={t.id}
                      to={termHref(t)}
                      aria-current={active ? 'page' : undefined}
                      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                        active ? 'border-navy-950 bg-navy-950 text-white' : 'border-stone-300 bg-white text-slate-600 hover:border-navy-950 hover:text-navy-950'
                      }`}
                    >
                      {t.name}
                      {t.isCurrent && (
                        <span className={`rounded-full px-1.5 text-[10px] font-semibold uppercase ${active ? 'bg-gold text-navy-950' : 'bg-gold/15 text-gold-dark'}`}>
                          Hiện tại
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}

            <SectionTitle title={`${board.title} – ${term.name}`} />

            {!members.length ? (
              <EmptyBlock icon={Users} title="Danh sách thành viên đang được cập nhật" />
            ) : (
              <div className="space-y-8">
                {chairmen.map((m) => (
                  <div key={m.id} className="flex flex-col items-center gap-6 rounded-2xl bg-navy-950 p-6 text-center sm:flex-row sm:p-8 sm:text-left">
                    <Avatar member={m} className="h-36 w-36 shrink-0 rounded-full text-4xl ring-4 ring-gold/50" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold-hover">{roleTitle(m)}</p>
                      <MemberName member={m} className="mt-2 block text-2xl font-bold text-white sm:text-3xl" />
                      <p className="mt-2 text-sm text-stone-300">{term.name}</p>
                    </div>
                  </div>
                ))}

                {vices.length > 0 && (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {vices.map((m) => <MemberCard key={m.id} member={m} title={roleTitle(m)} />)}
                  </div>
                )}

                {others.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {others.map((m) => <MemberCard key={m.id} member={m} title={roleTitle(m)} />)}
                  </div>
                )}
              </div>
            )}

            {term.description && (
              <div className="mt-10 rounded-xl border border-stone-200 bg-white p-5 sm:p-8">
                <RichContent html={term.description} />
              </div>
            )}
          </>
        )}
      </Container>
    </>
  );
};

export default BoardPage;
