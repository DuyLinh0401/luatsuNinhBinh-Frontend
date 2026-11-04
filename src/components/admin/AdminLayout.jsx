import React from 'react';
import {
  LayoutDashboard,
  Inbox,
  MapPin,
  FileText,
  Users,
  ShieldCheck,
  UserCheck,
  ScrollText,
  CalendarDays,
  FolderTree,
  Landmark,
  Building2,
  BookOpen,
  Image as ImageIcon,
  Menu,
  Settings,
  HardDrive,
  Bot
} from 'lucide-react';
import DashboardLayout from '../common/DashboardLayout';

const navGroups = [
  {
    groupTitle: 'Tổng quan',
    items: [
      { path: '/admin', icon: LayoutDashboard, label: 'Bảng điều khiển' },
    ]
  },
  {
    groupTitle: 'Nội dung',
    items: [
      { path: '/admin/posts', icon: FileText, label: 'Bài viết' },
      { path: '/admin/documents', icon: ScrollText, label: 'Văn bản' },
      { path: '/admin/events', icon: CalendarDays, label: 'Lịch công tác' },
      { path: '/admin/pages', icon: BookOpen, label: 'Trang giới thiệu' },
      { path: '/admin/categories', icon: FolderTree, label: 'Chuyên mục' },
      { path: '/admin/chatbot', icon: Bot, label: 'Trợ lý ảo' },
    ]
  },
  {
    groupTitle: 'Tổ chức & Thành viên',
    items: [
      { path: '/admin/lawyers', icon: Users, label: 'Luật sư thành viên' },
      { path: '/admin/organizations', icon: Building2, label: 'Tổ chức hành nghề' },
      { path: '/admin/terms', icon: Landmark, label: 'Ban Chủ nhiệm' },
      { path: '/admin/offices', icon: MapPin, label: 'Trụ sở & Văn phòng' },
      { path: '/admin/contacts', icon: Inbox, label: 'Hộp thư liên hệ' },
    ]
  },
  {
    groupTitle: 'Giao diện',
    items: [
      { path: '/admin/banners', icon: ImageIcon, label: 'Banner & Liên kết' },
      { path: '/admin/menus', icon: Menu, label: 'Menu điều hướng' },
      { path: '/admin/settings', icon: Settings, label: 'Cấu hình chung' },
    ]
  },
  {
    groupTitle: 'Quản lý media',
    items: [
      { path: '/admin/media/cloudinary', icon: HardDrive, label: 'Dung lượng Cloudinary' },
    ]
  },
  {
    groupTitle: 'Hệ thống',
    items: [
      { path: '/admin/users', icon: UserCheck, label: 'Quản lý nhân sự' },
      { path: '/admin/permissions', icon: ShieldCheck, label: 'Phân quyền bảo mật' },
    ]
  }
];

const AdminLayout = ({ children }) => (
  <DashboardLayout
    rootPath="/admin"
    brandTitle="System Admin"
    brandSubtitle="Tư pháp Ninh Bình"
    roleLabel="Quản trị cấp cao"
    avatarClassName="bg-gold/15 text-gold-hover ring-1 ring-gold/30"
    navGroups={navGroups}
    breadcrumbRoot="Quản Trị Tư Pháp"
    fallbackTitle="Hệ Thống Quản Trị"
    headerBadge="Đoàn Luật Sư Tỉnh Ninh Bình • Phiên bản 2.4"
  >
    {children}
  </DashboardLayout>
);

export default AdminLayout;
