import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useParams,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import SiteProvider from "./contexts/SiteProvider";
import PrivateRoute from "./components/common/PrivateRoute";
import PortalHeader from "./components/portal/PortalHeader";
import PortalFooter from "./components/portal/PortalFooter";
import BackToTop from "./components/portal/BackToTop";
// Layouts
import AdminLayout from "./components/admin/AdminLayout";
import StaffLayout from "./components/staff/StaffLayout";

// Cổng thông tin công khai
import HomePage from "./pages/portal/HomePage";
import CategoryPage from "./pages/portal/CategoryPage";
import PostDetail from "./pages/portal/PostDetail";
import SearchPage from "./pages/portal/SearchPage";
import DocumentsPage from "./pages/portal/DocumentsPage";
import DocumentDetail from "./pages/portal/DocumentDetail";
import EventsPage from "./pages/portal/EventsPage";
import EventDetail from "./pages/portal/EventDetail";
import LawyerDirectory from "./pages/portal/LawyerDirectory";
import LawyerProfile from "./pages/portal/LawyerProfile";
import OrganizationsPage from "./pages/portal/OrganizationsPage";
import OrganizationDetail from "./pages/portal/OrganizationDetail";
import StaticPage from "./pages/portal/StaticPage";
import BoardPage from "./pages/portal/BoardPage";
import ContactPage from "./pages/portal/ContactPage";
import PortalNotFound from "./pages/portal/PortalNotFound";
// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import ChangePasswordPage from "./pages/auth/ChangePasswordPage";
import SecurityPage from "./pages/auth/SecurityPage";

// Admin Pages
import PortalDashboard from "./pages/admin/PortalDashboard";
import AdminOffices from "./pages/admin/AdminOffices";
import AdminContacts from "./pages/admin/AdminContacts";
import CloudinaryUsage from "./pages/admin/CloudinaryUsage";
import ChatbotManager from "./pages/admin/ChatbotManager";
import ChatWidget from "./components/portal/ChatWidget";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPermissions from "./pages/admin/AdminPermissions";
// Quản trị cổng thông tin (dùng chung admin / staff)
import PostsManager from "./pages/admin/PostsManager";
import LegalDocumentsManager from "./pages/admin/LegalDocumentsManager";
import EventsManager from "./pages/admin/EventsManager";
import PagesManager from "./pages/admin/PagesManager";
import CategoriesManager from "./pages/admin/CategoriesManager";
import LawyersManager from "./pages/admin/LawyersManager";
import OrganizationsManager from "./pages/admin/OrganizationsManager";
import TermsManager from "./pages/admin/TermsManager";
import BannersManager from "./pages/admin/BannersManager";
import MenusManager from "./pages/admin/MenusManager";
import SettingsManager from "./pages/admin/SettingsManager";
// Staff Pages
import StaffLawyers from "./pages/staff/StaffLawyers";
import { STAFF_ITEMS } from "./components/staff/staffSections";
import { EmptyState } from "./components/admin/ui/AdminUI";
import { ShieldOff } from "lucide-react";

const GuestLayout = () => (
  <div className="min-h-screen flex flex-col bg-stone-parchment">
    <PortalHeader />
    <main className="flex-1">
      <Outlet />
    </main>
    <PortalFooter />
    <BackToTop />
    <ChatWidget />
  </div>
);

// Chuyển hướng URL cũ có tham số (vd /news/:slug -> /bai-viet/:slug)
const RedirectWithSlug = ({ to }) => {
  const { slug } = useParams();
  return <Navigate to={to(slug)} replace />;
};

const adminRoute = (path, Page) => (
  <Route
    key={path}
    path={path}
    element={
      <PrivateRoute allowedRoles={["ADMIN"]}>
        <AdminLayout>
          <Page />
        </AdminLayout>
      </PrivateRoute>
    }
  />
);

// Luật sư: có quyền thêm/sửa/xóa thì dùng trang quản lý, chỉ có quyền xem thì dùng trang tra cứu
const StaffLawyersPage = () => {
  const { canAny } = useAuth();
  return canAny(["CREATE_LAWYER", "UPDATE_LAWYER", "DELETE_LAWYER"]) ? <LawyersManager /> : <StaffLawyers />;
};

const STAFF_PAGES = {
  dashboard: PortalDashboard,
  posts: PostsManager,
  documents: LegalDocumentsManager,
  events: EventsManager,
  pages: PagesManager,
  categories: CategoriesManager,
  lawyers: StaffLawyersPage,
  organizations: OrganizationsManager,
  terms: TermsManager,
  offices: AdminOffices,
  contacts: AdminContacts,
  chatbot: ChatbotManager,
  banners: BannersManager,
  menus: MenusManager,
  settings: SettingsManager,
};

// Chặn mục mà vai trò không được cấp quyền (vd. gõ thẳng URL)
const StaffSection = ({ item }) => {
  const { canAny } = useAuth();
  const Page = STAFF_PAGES[item.key];
  if (item.permissions.length && !canAny(item.permissions)) {
    return (
      <EmptyState
        icon={ShieldOff}
        title="Bạn chưa được cấp quyền truy cập mục này"
        description="Liên hệ quản trị viên để được cấp quyền trong trang Phân quyền."
      />
    );
  }
  return <Page />;
};

const staffRoute = (item) => (
  <Route
    key={item.path}
    path={item.path}
    element={
      <PrivateRoute allowedRoles={["STAFF"]}>
        <StaffLayout>
          <StaffSection item={item} />
        </StaffLayout>
      </PrivateRoute>
    }
  />
);

const AppRoutes = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-950"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Cổng thông tin công khai */}
      <Route element={<GuestLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/p/:slug" element={<CategoryPage />} />
        <Route path="/p/:parent/:slug" element={<CategoryPage />} />
        <Route path="/bai-viet/:slug" element={<PostDetail />} />
        <Route path="/tim-kiem" element={<SearchPage />} />

        <Route path="/van-ban" element={<DocumentsPage />} />
        <Route path="/van-ban/chi-tiet/:slug" element={<DocumentDetail />} />
        <Route path="/van-ban/:category" element={<DocumentsPage />} />

        <Route path="/lich-cong-tac" element={<EventsPage />} />
        <Route path="/lich-cong-tac/:slug" element={<EventDetail />} />

        <Route path="/tra-cuu" element={<Navigate to="/tra-cuu/luat-su" replace />} />
        <Route path="/tra-cuu/luat-su" element={<LawyerDirectory />} />
        <Route path="/tra-cuu/luat-su/:slug" element={<LawyerProfile />} />
        <Route path="/tra-cuu/to-chuc-hanh-nghe" element={<OrganizationsPage />} />
        <Route path="/tra-cuu/to-chuc-hanh-nghe/:slug" element={<OrganizationDetail />} />

        <Route path="/gioi-thieu" element={<StaticPage />} />
        <Route path="/gioi-thieu/ban-chu-nhiem" element={<BoardPage />} />
        <Route path="/gioi-thieu/ban-chu-nhiem/:slug" element={<BoardPage />} />
        <Route path="/gioi-thieu/hoi-dong-khen-thuong-ky-luat" element={<BoardPage />} />
        <Route path="/gioi-thieu/:slug" element={<StaticPage />} />

        <Route path="/lien-he" element={<ContactPage />} />

        {/* URL cũ của site công ty luật */}
        <Route path="/about" element={<Navigate to="/gioi-thieu" replace />} />
        <Route path="/contact" element={<Navigate to="/lien-he" replace />} />
        <Route path="/create-order" element={<Navigate to="/lien-he" replace />} />
        <Route path="/news" element={<Navigate to="/p/tin-tuc" replace />} />
        <Route path="/news/:slug" element={<RedirectWithSlug to={(s) => `/bai-viet/${s}`} />} />
        <Route path="/articles" element={<Navigate to="/p/nghien-cuu-trao-doi" replace />} />
        <Route path="/articles/:slug" element={<RedirectWithSlug to={(s) => `/bai-viet/${s}`} />} />
        <Route path="/lawyers" element={<Navigate to="/tra-cuu/luat-su" replace />} />
        <Route path="/lawyers/:slug" element={<RedirectWithSlug to={(s) => `/tra-cuu/luat-su/${s}`} />} />
        <Route path="/services" element={<Navigate to="/" replace />} />
        <Route path="/services/:slug" element={<Navigate to="/" replace />} />

        {/* Trang tĩnh cấp gốc, vd /ho-so-gia-nhap-doan (route tĩnh ở trên luôn được ưu tiên) */}
        <Route path="/:pageSlug" element={<StaticPage />} />
        <Route path="*" element={<PortalNotFound />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/doi-mat-khau" element={<ChangePasswordPage />} />
      <Route path="/bao-mat" element={<SecurityPage />} />

      {/* Quản trị - Admin */}
      {adminRoute("/admin", PortalDashboard)}
      {adminRoute("/admin/posts", PostsManager)}
      {adminRoute("/admin/documents", LegalDocumentsManager)}
      {adminRoute("/admin/events", EventsManager)}
      {adminRoute("/admin/pages", PagesManager)}
      {adminRoute("/admin/categories", CategoriesManager)}
      {adminRoute("/admin/chatbot", ChatbotManager)}
      {adminRoute("/admin/lawyers", LawyersManager)}
      {adminRoute("/admin/organizations", OrganizationsManager)}
      {adminRoute("/admin/terms", TermsManager)}
      {adminRoute("/admin/offices", AdminOffices)}
      {adminRoute("/admin/contacts", AdminContacts)}
      {adminRoute("/admin/banners", BannersManager)}
      {adminRoute("/admin/menus", MenusManager)}
      {adminRoute("/admin/settings", SettingsManager)}
      {adminRoute("/admin/media/cloudinary", CloudinaryUsage)}
      {adminRoute("/admin/users", AdminUsers)}
      {adminRoute("/admin/permissions", AdminPermissions)}

      {/* Quản trị - Nhân viên */}
      {STAFF_ITEMS.map(staffRoute)}
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <SiteProvider>
          <Toaster position="top-right" />
          <AppRoutes />
        </SiteProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
