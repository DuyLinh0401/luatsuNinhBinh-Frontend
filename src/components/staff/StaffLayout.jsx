import DashboardLayout from '../common/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { STAFF_SECTIONS } from './staffSections';

const StaffLayout = ({ children }) => {
  const { canAny } = useAuth();

  // Chỉ hiện mục mà vai trò được cấp quyền (cấu hình ở trang Phân quyền)
  const navGroups = STAFF_SECTIONS
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permissions.length || canAny(item.permissions))
    }))
    .filter((group) => group.items.length);

  return (
    <DashboardLayout
      rootPath="/staff"
      brandTitle="LawNB Staff"
      brandSubtitle="Luật sư trực ban"
      roleLabel="Chuyên viên / Luật sư"
      avatarClassName="bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30"
      navGroups={navGroups}
      breadcrumbRoot="Bàn Thụ Lý Hồ Sơ"
      fallbackTitle="Bàn Làm Việc Tư Pháp"
      headerBadge="Đoàn Luật Sư Tỉnh Ninh Bình"
    >
      {children}
    </DashboardLayout>
  );
};

export default StaffLayout;
