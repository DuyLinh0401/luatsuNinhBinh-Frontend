// Các mục của khu vực nhân viên. Mỗi mục hiện khi user có ít nhất một quyền trong `permissions`
// (rỗng = luôn hiện). Dùng chung cho menu StaffLayout và route guard trong App.
import {
  LayoutDashboard,
  FileText,
  ScrollText,
  CalendarDays,
  BookOpen,
  FolderTree,
  Users,
  Building2,
  Landmark,
  MapPin,
  Inbox,
  Image as ImageIcon,
  Menu,
  Settings,
  Bot
} from 'lucide-react';

const writeOf = (resource) => ['CREATE', 'UPDATE', 'DELETE'].map((action) => `${action}_${resource}`);

export const STAFF_SECTIONS = [
  {
    groupTitle: 'Bàn làm việc',
    items: [
      { key: 'dashboard', path: '/staff', icon: LayoutDashboard, label: 'Tiến độ cá nhân', permissions: [] }
    ]
  },
  {
    groupTitle: 'Soạn thảo & Đăng tải',
    items: [
      { key: 'posts', path: '/staff/posts', icon: FileText, label: 'Bài viết của tôi', permissions: [...writeOf('POST'), 'PUBLISH_POST'] },
      { key: 'documents', path: '/staff/documents', icon: ScrollText, label: 'Văn bản', permissions: writeOf('LEGAL_DOCUMENT') },
      { key: 'events', path: '/staff/events', icon: CalendarDays, label: 'Lịch công tác', permissions: writeOf('EVENT') },
      { key: 'pages', path: '/staff/pages', icon: BookOpen, label: 'Trang giới thiệu', permissions: writeOf('PAGE') },
      { key: 'categories', path: '/staff/categories', icon: FolderTree, label: 'Chuyên mục', permissions: writeOf('CATEGORY') },
      { key: 'chatbot', path: '/staff/chatbot', icon: Bot, label: 'Trợ lý ảo', permissions: ['READ_CHATBOT', ...writeOf('CHATBOT')] }
    ]
  },
  {
    groupTitle: 'Tổ chức & Thành viên',
    items: [
      { key: 'lawyers', path: '/staff/lawyers', icon: Users, label: 'Luật sư thành viên', permissions: ['READ_LAWYER', ...writeOf('LAWYER')] },
      { key: 'organizations', path: '/staff/organizations', icon: Building2, label: 'Tổ chức hành nghề', permissions: writeOf('PRACTICE_ORGANIZATION') },
      { key: 'terms', path: '/staff/terms', icon: Landmark, label: 'Ban Chủ nhiệm', permissions: writeOf('BOARD') },
      { key: 'offices', path: '/staff/offices', icon: MapPin, label: 'Trụ sở & Văn phòng', permissions: writeOf('MAP') },
      { key: 'contacts', path: '/staff/contacts', icon: Inbox, label: 'Hộp thư liên hệ', permissions: ['READ_CONTACT'] }
    ]
  },
  {
    groupTitle: 'Giao diện',
    items: [
      { key: 'banners', path: '/staff/banners', icon: ImageIcon, label: 'Banner & Liên kết', permissions: writeOf('BANNER') },
      { key: 'menus', path: '/staff/menus', icon: Menu, label: 'Menu điều hướng', permissions: ['UPDATE_MENU'] },
      { key: 'settings', path: '/staff/settings', icon: Settings, label: 'Cấu hình chung', permissions: ['UPDATE_SETTING'] }
    ]
  }
];

export const STAFF_ITEMS = STAFF_SECTIONS.flatMap((group) => group.items);
