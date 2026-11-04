// Theo dõi dung lượng & mức tiêu thụ Cloudinary (Quản lý media → Dung lượng Cloudinary).
// Số liệu tính phí lấy từ Usage API (qua cache server); số ảnh/video/raw lấy từ Search API khi đồng bộ — hai nguồn hiển thị tách riêng.
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  RefreshCw, HardDrive, Activity, Wand2, Layers, Coins, AlertTriangle, Image as ImageIcon, Film, FileArchive,
  Copy, ExternalLink, ChevronRight, ChevronLeft, Info, LineChart as LineChartIcon
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import cloudinaryService from '../../services/cloudinaryService';
import { errorMessage } from '../../services/portalService';
import {
  PageHeader, Card, Button, Badge, Tabs, SearchInput, Select, Input, EmptyState, Spinner, Table
} from '../../components/admin/ui/AdminUI';
import { formatDate } from '../../components/admin/ui/format';

// ---------- Định dạng ----------

const formatBytes = (bytes) => {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toLocaleString('vi-VN', { maximumFractionDigits: value < 10 ? 2 : 1 })} ${units[i]}`;
};
const formatNumber = (n, digits = 0) => (n == null ? '—' : n.toLocaleString('vi-VN', { maximumFractionDigits: digits }));
// Nhãn trục Y ngắn gọn (không xuống dòng): 572 MB, 1,2 GB
const axisLabel = (value, unit) => {
  if (unit !== 'bytes') return formatNumber(value, unit === 'credits' ? 2 : 0);
  if (value >= 1024 ** 3) return `${formatNumber(value / 1024 ** 3, 1)} GB`;
  if (value >= 1024 ** 2) return `${formatNumber(value / 1024 ** 2, 0)} MB`;
  return formatBytes(value);
};
const formatValue = (value, unit) => (unit === 'bytes' ? formatBytes(value) : formatNumber(value, unit === 'credits' ? 2 : 0));

const STATUS = {
  normal: { label: 'Bình thường', tone: 'green', bar: 'bg-emerald-500' },
  warning: { label: 'Cảnh báo', tone: 'amber', bar: 'bg-amber-500' },
  critical: { label: 'Nghiêm trọng', tone: 'red', bar: 'bg-orange-600' },
  danger: { label: 'Nguy hiểm', tone: 'red', bar: 'bg-red-600' },
  unknown: { label: 'Không có giới hạn riêng', tone: 'gray', bar: 'bg-stone-300' }
};

const CACHE_SOURCE = { cache: 'bộ nhớ đệm', snapshot: 'lần đồng bộ gần nhất', cloudinary: 'Cloudinary (vừa lấy)' };

// ---------- Thẻ tổng quan ----------

const SummaryCard = ({ icon: Icon, title, metric, unit, note }) => {
  const status = STATUS[metric?.status] || STATUS.unknown;
  const hasLimit = metric?.limit != null;
  const percent = metric?.usedPercent;
  return (
    <div className="flex flex-col rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <Icon className="h-4 w-4 text-slate-400" /> {title}
        </span>
        {metric?.available !== false && percent != null && <Badge tone={status.tone}>{status.label}</Badge>}
      </div>
      {metric?.available === false ? (
        <p className="mt-3 text-sm text-slate-500">Usage API không trả về số liệu này.</p>
      ) : (
        <>
          <p className="mt-2 text-2xl font-bold tabular-nums text-navy-950">{formatValue(metric?.usage, unit)}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {hasLimit ? (
              <>Giới hạn <span className="tabular-nums">{formatValue(metric.limit, unit)}</span> · còn lại <span className="tabular-nums">{formatValue(metric.remaining, unit)}</span></>
            ) : (
              'Không có giới hạn riêng — không tính %'
            )}
          </p>
          {percent != null && (
            <>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-100">
                <div className={`h-full rounded-full ${status.bar}`} style={{ width: `${Math.min(percent, 100)}%` }} />
              </div>
              <p className="mt-1.5 text-xs font-semibold tabular-nums text-navy-950">{formatNumber(percent, 2)}%</p>
            </>
          )}
          {metric?.credits != null && (
            <p className="mt-1.5 text-xs text-slate-500">Quy đổi: <span className="tabular-nums text-navy-950">{formatNumber(metric.credits, 2)}</span> credits</p>
          )}
        </>
      )}
      {note && <p className="mt-2 border-t border-stone-100 pt-2 text-[11px] leading-snug text-slate-400">{note}</p>}
    </div>
  );
};

// ---------- Biểu đồ lịch sử ----------

const CHARTS = [
  { key: 'storageUsage', title: 'Storage', unit: 'bytes', color: '#0F5AA6' },
  { key: 'bandwidthUsage', title: 'Bandwidth', unit: 'bytes', color: '#2A5FA0' },
  { key: 'transformationsUsage', title: 'Transformations', unit: 'count', color: '#9A7413' },
  { key: 'creditsUsage', title: 'Credits', unit: 'credits', color: '#C8992B' }
];

const HistoryChart = ({ points, chart }) => {
  const data = points.filter((p) => p[chart.key] != null).map((p) => ({ date: p.date.slice(5).split('-').reverse().join('/'), value: p[chart.key] }));
  return (
    <div className="rounded-lg border border-stone-200 p-3">
      <p className="mb-2 text-sm font-medium text-navy-950">{chart.title}</p>
      {data.length ? (
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#EEF2F7" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={{ stroke: '#DCE4EE' }} />
              <YAxis width={72} tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} tickFormatter={(v) => axisLabel(v, chart.unit)} />
              <Tooltip formatter={(v) => [formatValue(v, chart.unit), chart.title]} labelFormatter={(l) => `Ngày ${l}`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Line type="monotone" dataKey="value" stroke={chart.color} strokeWidth={2} dot={{ r: data.length > 20 ? 0 : 3 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-10 text-center text-xs text-slate-400">Không có số liệu cho chỉ số này</p>
      )}
    </div>
  );
};

const HistorySection = ({ version }) => {
  const [range, setRange] = useState('30d');
  const [state, setState] = useState({ key: null, data: null, error: null });
  const key = `${range}:${version}`;

  useEffect(() => {
    let alive = true;
    cloudinaryService
      .getHistory(range)
      .then((data) => alive && setState({ key, data, error: null }))
      .catch((error) => alive && setState({ key, data: null, error: errorMessage(error) }));
    return () => {
      alive = false;
    };
  }, [range, key]);

  const loading = state.key !== key;
  const points = state.data?.points || [];

  return (
    <Card padded={false} title="Lịch sử tiêu thụ" actions={<span className="text-xs text-slate-500">Mỗi ngày lấy lần đồng bộ cuối cùng</span>}>
      <div className="px-2 sm:px-4">
        <Tabs tabs={[{ value: '7d', label: '7 ngày' }, { value: '30d', label: '30 ngày' }, { value: '90d', label: '90 ngày' }]} value={range} onChange={setRange} />
      </div>
      <div className="p-4 sm:p-5">
        {loading && !state.data ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : state.error ? (
          <EmptyState icon={AlertTriangle} title="Không tải được lịch sử" description={state.error} />
        ) : points.length === 0 ? (
          <EmptyState
            icon={LineChartIcon}
            title="Chưa có lịch sử trong khoảng thời gian này"
            description="Lịch sử được tạo từ các lần đồng bộ. Bấm “Đồng bộ Cloudinary” hoặc chờ lần đồng bộ định kỳ tiếp theo; biểu đồ sẽ có điểm đầu tiên ngay sau đó."
          />
        ) : (
          <>
            {points.length === 1 && (
              <p className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
                <Info className="h-3.5 w-3.5" /> Mới có 1 ngày dữ liệu; đường xu hướng sẽ rõ dần sau các lần đồng bộ tiếp theo.
              </p>
            )}
            <div className={`grid gap-4 md:grid-cols-2 ${loading ? 'opacity-60' : ''}`}>
              {CHARTS.map((c) => <HistoryChart key={c.key} chart={c} points={points} />)}
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

// ---------- Thống kê media ----------

const StatItem = ({ icon: Icon, label, value, sub }) => (
  <div className="flex items-start gap-3 rounded-lg border border-stone-200 px-4 py-3">
    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
    <div className="min-w-0">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold tabular-nums text-navy-950">{value}</p>
      {sub && <p className="text-xs tabular-nums text-slate-500">{sub}</p>}
    </div>
  </div>
);

const MediaStats = ({ stats }) => {
  const counted = stats.countedAt != null;
  const bytesSub = (bytes) => (bytes == null ? null : `${formatBytes(bytes)}${stats.bytesComplete === false ? ' (một phần)' : ''}`);
  return (
    <Card title="Thống kê tài nguyên">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <StatItem icon={Layers} label="Tổng tài nguyên" value={formatNumber(stats.total)} sub="Usage API" />
        <StatItem icon={Copy} label="Derived resources" value={formatNumber(stats.derived)} sub="Usage API" />
        <StatItem icon={ImageIcon} label="Hình ảnh" value={formatNumber(stats.imageCount)} sub={bytesSub(stats.imageBytes)} />
        <StatItem icon={Film} label="Video" value={formatNumber(stats.videoCount)} sub={bytesSub(stats.videoBytes)} />
        <StatItem icon={FileArchive} label="Raw files" value={formatNumber(stats.rawCount)} sub={bytesSub(stats.rawBytes)} />
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        {counted
          ? <>Số lượng và dung lượng theo loại lấy từ Search API lúc đồng bộ {formatDate(stats.countedAt, true)}. Đây là thống kê tham khảo, <strong>không cộng vào</strong> dung lượng tính phí của Usage API (Usage API còn tính cả bản sao derived và bản sao lưu).</>
          : 'Chưa có số lượng theo loại: bấm “Đồng bộ Cloudinary” để đếm qua Search API.'}
      </p>
    </Card>
  );
};

// ---------- Danh sách tài nguyên ----------

const RESOURCE_TYPES = [
  { value: 'all', label: 'Mọi loại' },
  { value: 'image', label: 'Hình ảnh' },
  { value: 'video', label: 'Video' },
  { value: 'raw', label: 'Raw' }
];
const SORTS = [
  { value: 'created_at:desc', label: 'Mới nhất' },
  { value: 'created_at:asc', label: 'Cũ nhất' },
  { value: 'bytes:desc', label: 'Dung lượng lớn nhất' },
  { value: 'bytes:asc', label: 'Dung lượng nhỏ nhất' }
];
const TYPE_ICON = { image: ImageIcon, video: Film, raw: FileArchive };

const ResourceBrowser = () => {
  const [filters, setFilters] = useState({ q: '', type: 'all', format: '', sort: 'created_at:desc' });
  const [debounced, setDebounced] = useState(filters);
  const [cursors, setCursors] = useState([null]); // cursor của từng trang đã đi qua
  const [state, setState] = useState({ key: null, data: null, error: null });

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(filters), 400);
    return () => clearTimeout(timer);
  }, [filters]);

  const cursor = cursors[cursors.length - 1];
  const [sortBy, order] = debounced.sort.split(':');
  const params = {
    q: debounced.q.trim() || undefined,
    resource_type: debounced.type,
    format: debounced.format.trim().toLowerCase() || undefined,
    sort_by: sortBy,
    order,
    limit: 20,
    cursor: cursor || undefined
  };
  const key = JSON.stringify(params);

  useEffect(() => {
    let alive = true;
    cloudinaryService
      .getResources(JSON.parse(key))
      .then((data) => alive && setState({ key, data, error: null }))
      .catch((error) => alive && setState({ key, data: null, error: errorMessage(error) }));
    return () => {
      alive = false;
    };
  }, [key]);

  const setFilter = (k, v) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setCursors([null]);
  };

  const loading = state.key !== key;
  const items = state.data?.items || [];

  const columns = [
    {
      key: 'publicId',
      header: 'Tài nguyên',
      render: (r) => {
        const Icon = TYPE_ICON[r.resourceType] || FileArchive;
        return (
          <div className="flex min-w-0 items-center gap-2.5">
            <Icon className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="max-w-[18rem] truncate font-medium text-navy-950 sm:max-w-md" title={r.publicId}>{r.publicId}</span>
          </div>
        );
      }
    },
    { key: 'format', header: 'Định dạng', render: (r) => <span className="uppercase">{r.format || '—'}</span> },
    { key: 'size', header: 'Kích thước', render: (r) => (r.width && r.height ? <span className="tabular-nums">{r.width}×{r.height}</span> : '—'), className: 'hidden md:table-cell', headerClassName: 'hidden md:table-cell' },
    { key: 'bytes', header: 'Dung lượng', render: (r) => <span className="tabular-nums">{formatBytes(r.bytes)}</span>, className: 'text-right', headerClassName: 'text-right' },
    { key: 'createdAt', header: 'Ngày tải lên', render: (r) => <span className="tabular-nums">{formatDate(r.createdAt)}</span>, className: 'hidden sm:table-cell', headerClassName: 'hidden sm:table-cell' },
    {
      key: 'open',
      header: '',
      render: (r) => r.secureUrl && (
        <a href={r.secureUrl} target="_blank" rel="noopener noreferrer" title="Mở tệp gốc" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-stone-100 hover:text-navy-950">
          <ExternalLink className="h-4 w-4" />
        </a>
      ),
      className: 'w-10'
    }
  ];

  return (
    <Card padded={false} title="Tài nguyên trên Cloudinary" actions={state.data?.totalCount != null && <span className="text-xs text-slate-500">{formatNumber(state.data.totalCount)} kết quả</span>}>
      <div className="grid gap-3 border-b border-stone-200 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
        <SearchInput value={filters.q} onChange={(v) => setFilter('q', v)} placeholder="Tên tệp hoặc thư mục (vd lawnb/images)" />
        <Select value={filters.type} onChange={(e) => setFilter('type', e.target.value)} options={RESOURCE_TYPES} aria-label="Loại tài nguyên" />
        <Input value={filters.format} onChange={(e) => setFilter('format', e.target.value)} placeholder="Định dạng (jpg, mp4…)" aria-label="Định dạng" maxLength={10} />
        <Select value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)} options={SORTS} aria-label="Sắp xếp" />
      </div>
      {state.error && !loading ? (
        <EmptyState icon={AlertTriangle} title="Không tải được danh sách" description={state.error} />
      ) : (
        <Table columns={columns} rows={items} loading={loading} rowKey="assetId" empty={<EmptyState title="Không có tài nguyên phù hợp" description="Thử đổi từ khóa hoặc bộ lọc." />} />
      )}
      <div className="flex items-center justify-between gap-3 border-t border-stone-200 px-4 py-3 text-sm text-slate-500">
        <span>Trang {cursors.length}</span>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={ChevronLeft} disabled={cursors.length === 1 || loading} onClick={() => setCursors((c) => c.slice(0, -1))}>Trước</Button>
          <Button variant="secondary" size="sm" disabled={!state.data?.nextCursor || loading} onClick={() => setCursors((c) => [...c, state.data.nextCursor])}>
            Sau <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

// ---------- Trang ----------

const CloudinaryUsage = () => {
  const [overview, setOverview] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [version, setVersion] = useState(0); // tăng sau mỗi lần đồng bộ để tải lại lịch sử

  useEffect(() => {
    let alive = true;
    cloudinaryService
      .getOverview()
      .then((data) => {
        if (!alive) return;
        setOverview(data);
        setLoadError(null);
      })
      .catch((error) => alive && setLoadError(errorMessage(error, 'Không tải được số liệu Cloudinary')));
    return () => {
      alive = false;
    };
  }, [version]);

  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await cloudinaryService.sync();
      if (result.data.deduplicated) {
        const nextAt = new Date(result.data.nextAllowedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        toast(`${result.message} Có thể đồng bộ lại sau ${nextAt}.`, { icon: 'ℹ️' });
      } else {
        toast.success(result.message);
      }
      if (result.data.resourceStatsErrors?.length) toast.error('Không đếm được một số loại tài nguyên qua Search API.');
      setVersion((v) => v + 1);
    } catch (error) {
      toast.error(errorMessage(error, 'Đồng bộ thất bại'));
    } finally {
      setSyncing(false);
    }
  }, []);

  const usage = overview?.usage;
  const lastSync = overview?.lastSync;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Quản lý media"
        title="Dung lượng Cloudinary"
        description="Mức sử dụng tài nguyên lưu trữ ảnh/video của cổng thông tin. Số liệu tính phí lấy từ Cloudinary Usage API."
        actions={
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <Button icon={RefreshCw} loading={syncing} onClick={sync}>Đồng bộ Cloudinary</Button>
            <span className="text-xs text-slate-500">
              {lastSync ? <>Đồng bộ lần cuối: <span className="tabular-nums">{formatDate(lastSync.syncedAt, true)}</span> ({lastSync.source === 'scheduled' ? 'định kỳ' : 'thủ công'})</> : 'Chưa đồng bộ lần nào'}
            </span>
          </div>
        }
      />

      {!overview && !loadError && <div className="flex justify-center py-20"><Spinner /></div>}
      {loadError && !overview && (
        <Card><EmptyState icon={AlertTriangle} title="Không tải được số liệu" description={loadError} action={<Button variant="secondary" onClick={() => setVersion((v) => v + 1)}>Thử lại</Button>} /></Card>
      )}

      {overview && (
        <>
          {overview.warnings.map((w) => (
            <div key={w.code} className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {w.message}
            </div>
          ))}

          {overview.alerts.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> Tài nguyên đang gần chạm giới hạn</p>
              <ul className="mt-1.5 space-y-0.5 pl-6">
                {overview.alerts.map((a) => (
                  <li key={a.key}>{a.label}: <span className="font-semibold tabular-nums">{formatNumber(a.usedPercent, 2)}%</span> — {STATUS[a.status].label.toLowerCase()}</li>
                ))}
              </ul>
            </div>
          )}

          {usage && (
            <>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>Gói: <span className="font-semibold text-navy-950">{usage.plan || '—'}</span></span>
                <span>Số liệu Cloudinary chốt ngày: <span className="tabular-nums text-navy-950">{usage.usageDate ? formatDate(usage.usageDate) : '—'}</span></span>
                {overview.cache && (
                  <span>Nguồn: {CACHE_SOURCE[overview.cache.source]}, cập nhật <span className="tabular-nums">{formatDate(overview.cache.fetchedAt, true)}</span> (cache {overview.cache.ttlMinutes} phút)</span>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <SummaryCard icon={HardDrive} title="Storage" unit="bytes" metric={usage.storage} />
                <SummaryCard icon={Activity} title="Bandwidth" unit="bytes" metric={usage.bandwidth} />
                <SummaryCard icon={Wand2} title="Transformations" unit="count" metric={usage.transformations} />
                <SummaryCard
                  icon={Layers}
                  title="Tổng tài nguyên"
                  unit="count"
                  metric={{ available: usage.resources.total != null, usage: usage.resources.total, limit: null, usedPercent: null, status: 'unknown' }}
                  note={usage.resources.derived != null ? `Kèm ${formatNumber(usage.resources.derived)} derived resources` : undefined}
                />
                <SummaryCard icon={Coins} title="Credits" unit="credits" metric={usage.credits} />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card title="Thành phần tiêu thụ credits">
                  {usage.credits.breakdown.length ? (
                    <ul className="space-y-3">
                      {usage.credits.breakdown.map((b) => (
                        <li key={b.key}>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-700">{b.label}</span>
                            <span className="tabular-nums text-navy-950">{formatNumber(b.credits, 2)} credits{b.share != null && <span className="text-slate-500"> · {formatNumber(b.share, 1)}%</span>}</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-stone-100">
                            <div className="h-full rounded-full bg-brand" style={{ width: `${b.share || 0}%` }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">Usage API không trả về phân tách credits cho gói này.</p>
                  )}
                </Card>

                <Card title="Giới hạn & ghi chú dữ liệu">
                  {usage.mediaLimits && (
                    <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                      {usage.mediaLimits.image_max_size_bytes != null && <><dt className="text-slate-500">Ảnh tối đa / tệp</dt><dd className="tabular-nums text-navy-950">{formatBytes(usage.mediaLimits.image_max_size_bytes)}</dd></>}
                      {usage.mediaLimits.video_max_size_bytes != null && <><dt className="text-slate-500">Video tối đa / tệp</dt><dd className="tabular-nums text-navy-950">{formatBytes(usage.mediaLimits.video_max_size_bytes)}</dd></>}
                      {usage.mediaLimits.raw_max_size_bytes != null && <><dt className="text-slate-500">Raw tối đa / tệp</dt><dd className="tabular-nums text-navy-950">{formatBytes(usage.mediaLimits.raw_max_size_bytes)}</dd></>}
                      {usage.rateLimit && <><dt className="text-slate-500">Admin API còn lại</dt><dd className="tabular-nums text-navy-950">{usage.rateLimit.remaining ?? '—'} / {usage.rateLimit.allowed} lượt/giờ</dd></>}
                    </dl>
                  )}
                  <ul className="space-y-1.5 text-xs leading-relaxed text-slate-500">
                    {usage.notes.map((n) => <li key={n} className="flex gap-1.5"><Info className="mt-0.5 h-3 w-3 shrink-0" />{n}</li>)}
                    <li className="flex gap-1.5">
                      <Info className="mt-0.5 h-3 w-3 shrink-0" />
                      Ngưỡng cảnh báo là cấu hình của hệ thống: cảnh báo từ {overview.thresholds.warning}%, nghiêm trọng từ {overview.thresholds.critical}%, nguy hiểm từ {overview.thresholds.danger}%.
                    </li>
                  </ul>
                </Card>
              </div>
            </>
          )}

          <MediaStats stats={overview.mediaStats} />
          <HistorySection version={version} />
          <ResourceBrowser />
        </>
      )}
    </div>
  );
};

export default CloudinaryUsage;
