import { useEffect } from 'react';

const SITE = 'Đoàn Luật sư tỉnh Ninh Bình';

// Đặt tiêu đề tab trình duyệt: "<title> | Đoàn Luật sư tỉnh Ninh Bình"
const usePageTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE}` : SITE;
  }, [title]);
};

export default usePageTitle;
