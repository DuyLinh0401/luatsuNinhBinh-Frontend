import { useEffect, useMemo, useState } from 'react';
import { settingApi, menuApi, categoryApi } from '../services/portalService';
import { portalRoutes } from '../utils/portalRoutes';
import { SiteContext } from './siteContext';

const FALLBACK_SETTINGS = {
  general: { siteName: 'Đoàn Luật sư tỉnh Ninh Bình', shortName: 'LawNB' },
  contact: {},
  bankAccounts: [],
  social: {}
};

const SiteProvider = ({ children }) => {
  const [state, setState] = useState({ loaded: false, settings: FALLBACK_SETTINGS, headerMenu: [], footerMenu: [], categories: [] });

  useEffect(() => {
    let alive = true;
    // Mỗi phần lỗi riêng lẻ không làm hỏng cả site
    Promise.allSettled([settingApi.get(), menuApi.get('HEADER'), menuApi.get('FOOTER'), categoryApi.tree({ type: 'POST' })])
      .then(([settings, header, footer, categories]) => {
        if (!alive) return;
        const value = (r, fallback) => (r.status === 'fulfilled' ? r.value : fallback);
        setState({
          loaded: true,
          settings: { ...FALLBACK_SETTINGS, ...value(settings, {}) },
          headerMenu: value(header, []),
          footerMenu: value(footer, []),
          categories: value(categories, [])
        });
      });
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo(() => {
    // id/slug -> { id, name, slug, parentSlug } để dựng link chuyên mục từ dữ liệu bài viết
    const byId = new Map();
    const bySlug = new Map();
    const walk = (nodes, parent) =>
      nodes.forEach((n) => {
        const entry = { id: n.id, name: n.name, slug: n.slug, parentId: parent?.id ?? null, parentSlug: parent?.slug ?? null };
        byId.set(n.id, entry);
        bySlug.set(n.slug, entry);
        walk(n.children || [], n);
      });
    walk(state.categories, null);

    const categoryHref = (category) => {
      if (!category) return '#';
      const entry = byId.get(category.id) || bySlug.get(category.slug);
      return portalRoutes.category(category.slug, entry?.parentSlug);
    };

    return { ...state, categoryById: byId, categoryBySlug: bySlug, categoryHref };
  }, [state]);

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
};

export default SiteProvider;
