// Danh mục quyền: nhãn tiếng Việt, nhóm hiển thị và ghi chú cho trang Phân quyền.
// Mã resource/action phải khớp bảng permissions và checkPermission() ở backend.

export const ACTION_COLUMNS = [
  { key: 'READ', label: 'Xem' },
  { key: 'CREATE', label: 'Thêm' },
  { key: 'UPDATE', label: 'Sửa' },
  { key: 'DELETE', label: 'Xóa' }
];

// Hành động đặc thù của một vài resource, hiển thị ở cột "Đặc biệt"
export const SPECIAL_ACTIONS = {
  PUBLISH: 'Duyệt & đăng',
  ASSIGN: 'Phân công',
  MANAGE: 'Toàn quyền'
};

export const RESOURCE_GROUPS = [
  {
    title: 'Nội dung',
    resources: [
      { key: 'POST', label: 'Bài viết', hint: 'Không có "Duyệt & đăng": bài gửi lên ở trạng thái chờ duyệt, chỉ thấy và sửa bài của mình.' },
      { key: 'LEGAL_DOCUMENT', label: 'Văn bản' },
      { key: 'EVENT', label: 'Lịch công tác' },
      { key: 'PAGE', label: 'Trang giới thiệu' },
      { key: 'CATEGORY', label: 'Chuyên mục' },
      { key: 'CHATBOT', label: 'Trợ lý ảo', hint: 'Câu hỏi thường gặp mà trợ lý dùng để trả lời. "Sửa" gồm cả duyệt/ẩn câu hỏi và cấu hình lời chào.' }
    ]
  },
  {
    title: 'Tổ chức & Thành viên',
    resources: [
      { key: 'LAWYER', label: 'Luật sư thành viên', hint: 'Gồm cả lĩnh vực hành nghề. "Xem" cho phép thấy cả luật sư đang ẩn.' },
      { key: 'PRACTICE_ORGANIZATION', label: 'Tổ chức hành nghề' },
      { key: 'BOARD', label: 'Ban Chủ nhiệm (nhiệm kỳ)' },
      { key: 'MAP', label: 'Trụ sở & Văn phòng', hint: 'Danh sách văn phòng là công khai, quyền "Xem" không có tác dụng.' },
      { key: 'CONTACT', label: 'Hộp thư liên hệ', hint: 'Form liên hệ là công khai, quyền "Thêm" không có tác dụng.' }
    ]
  },
  {
    title: 'Giao diện',
    resources: [
      { key: 'BANNER', label: 'Banner & Liên kết' },
      { key: 'MENU', label: 'Menu điều hướng' },
      { key: 'SETTING', label: 'Cấu hình chung' }
    ]
  },
  {
    title: 'Hệ thống',
    resources: [
      { key: 'USER', label: 'Quản lý nhân sự', adminOnly: true },
      { key: 'ROLE', label: 'Phân quyền', adminOnly: true }
    ]
  }
];

export const ADMIN_ONLY_RESOURCES = RESOURCE_GROUPS
  .flatMap((g) => g.resources)
  .filter((r) => r.adminOnly)
  .map((r) => r.key);

// Vai trò hệ thống: mô tả hiển thị thay cho description trong DB
export const ROLE_INFO = {
  ADMIN: 'Toàn quyền trên hệ thống, không thể giới hạn.',
  STAFF: 'Chuyên viên văn phòng Đoàn: soạn thảo, đăng tải và tra cứu.',
  GUEST: 'Khách truy cập. Trang công khai không yêu cầu đăng nhập nên các quyền này hiện không có tác dụng.'
};
