import { useEffect, useState } from 'react';

// Tải dữ liệu bất đồng bộ theo deps. loading được suy ra (không setState đồng bộ trong effect).
// const { data, loading, error, notFound, previous } = useAsync(() => postApi.bySlug(slug), [slug]);
const useAsync = (factory, deps) => {
  const key = JSON.stringify(deps);
  const [state, setState] = useState({ key: null, data: null, error: null });

  useEffect(() => {
    let alive = true;
    factory()
      .then((data) => alive && setState({ key, data, error: null }))
      .catch((error) => alive && setState({ key, data: null, error }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const current = state.key === key;
  return {
    data: current ? state.data : null,
    // Dữ liệu của lần tải trước, để giữ danh sách khi chuyển trang thay vì nháy trắng
    previous: state.data,
    loading: !current,
    error: current ? state.error : null,
    notFound: current && state.error?.response?.status === 404
  };
};

export default useAsync;
