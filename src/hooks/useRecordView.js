// Ghi nhận một lượt xem khi mở trang chi tiết (bài viết, văn bản) và trả về số lượt xem mới nhất.
// Server tự lọc trùng (mỗi trình duyệt 1 lượt / vài giờ), bỏ qua bot và người đang đăng nhập.
import { useEffect, useState } from 'react';
import api from '../services/api';

const VISITOR_KEY = 'lawnb.visitorId';

// Mã ngẫu nhiên cố định cho trình duyệt này (không chứa thông tin cá nhân)
const getVisitorId = () => {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return undefined; // chế độ ẩn danh chặn localStorage: server dùng IP + trình duyệt
  }
};

/**
 * basePath: '/posts' | '/legal-documents'
 * id: id nội dung (chưa tải xong thì undefined)
 * fallback: số lượt xem có sẵn trong dữ liệu chi tiết
 */
const useRecordView = (basePath, id, fallback) => {
  const [result, setResult] = useState(null); // { id, views }

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;
    api.post(`${basePath}/${id}/view`, { visitorId: getVisitorId() })
      .then((res) => { if (!cancelled) setResult({ id, views: res.data.data.views }); })
      .catch(() => {}); // không ảnh hưởng việc đọc bài
    return () => { cancelled = true; };
  }, [basePath, id]);

  return result && result.id === id ? result.views : fallback;
};

export default useRecordView;
