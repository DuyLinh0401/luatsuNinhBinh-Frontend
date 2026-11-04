import { useEffect, useState } from 'react';
import { portalApi } from '../services/portalService';

// Nhãn tiếng Việt cho enum, tải một lần và dùng chung cho mọi component
let cache = null;
let pending = null;

const loadMeta = () => {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = portalApi.meta().then((data) => {
      cache = data;
      return data;
    }).finally(() => {
      pending = null;
    });
  }
  return pending;
};

const usePortalMeta = () => {
  const [meta, setMeta] = useState(cache);

  useEffect(() => {
    if (cache) return;
    let alive = true;
    loadMeta().then((data) => alive && setMeta(data)).catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // label('documentType', 'DECREE') -> 'Nghị định'
  const label = (group, value) => meta?.[group]?.[value] ?? value ?? '';
  const options = (group) => Object.entries(meta?.[group] || {}).map(([value, text]) => ({ value, label: text }));

  return { meta, label, options, ready: !!meta };
};

export default usePortalMeta;
