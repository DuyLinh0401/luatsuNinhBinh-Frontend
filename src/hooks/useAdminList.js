import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { errorMessage } from '../services/portalService';

const EMPTY = { items: [], pagination: { total: 0, totalPages: 0 } };

// Danh sách quản trị phân trang phía server.
// fetcher(params) trả về { items, pagination, ...extra } và phải cố định giữa các lần render
// (truyền hàm cấp module như postApi.manage, không truyền arrow function inline).
const useAdminList = (fetcher, initialFilters = {}, { pageSize = 20, debounceKeys = ['q'] } = {}) => {
  const [filters, setFilters] = useState(initialFilters);
  const [debounced, setDebounced] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState({ key: null, data: EMPTY });

  // Ô gõ chữ (tìm kiếm) trễ 350ms, các bộ lọc khác áp dụng ngay
  useEffect(() => {
    const typing = debounceKeys.some((k) => filters[k] !== debounced[k]);
    const timer = setTimeout(() => setDebounced(filters), typing ? 350 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const params = Object.fromEntries(
    Object.entries({ ...debounced, page, limit: pageSize }).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  );
  const key = JSON.stringify([params, version]);

  useEffect(() => {
    let alive = true;
    fetcher(JSON.parse(key)[0])
      .then((data) => alive && setResult({ key, data }))
      .catch((error) => {
        if (!alive) return;
        toast.error(errorMessage(error, 'Không tải được dữ liệu'));
        setResult((prev) => ({ ...prev, key }));
      });
    return () => {
      alive = false;
    };
  }, [fetcher, key]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  const setFilter = (k, value) => {
    setFilters((prev) => ({ ...prev, [k]: value }));
    setPage(1);
  };

  const data = result.data || EMPTY;
  return {
    ...data,
    items: data.items || [],
    pagination: data.pagination || EMPTY.pagination,
    loading: result.key !== key,
    filters,
    setFilter,
    setFilters,
    page,
    setPage,
    reload
  };
};

export default useAdminList;
