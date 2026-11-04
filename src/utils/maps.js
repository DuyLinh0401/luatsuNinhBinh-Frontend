// Tiện ích bản đồ Google Maps cho trụ sở/văn phòng (không cần API key)

const EMBED_URL = /^https:\/\/(www\.|maps\.)?google\.[a-z.]+\/maps(\/embed\?|\?)[^\s"'<>]*$/i;

// mapEmbed có thể là mã <iframe> (dữ liệu cũ) hoặc URL nhúng => URL đã kiểm tra hoặc null
export const embedSrcOf = (mapEmbed) => {
  const raw = `${mapEmbed || ''}`.trim();
  if (!raw) return null;
  const src = (/<iframe[^>]*\ssrc=["']([^"']+)["']/i.exec(raw)?.[1] || raw).replace(/&amp;/g, '&');
  return EMBED_URL.test(src) && (/\/maps\/embed\?/i.test(src) || /[?&]output=embed\b/i.test(src)) ? src : null;
};

// Tọa độ nằm trong mã nhúng dạng pb=...!2d<kinh độ>!3d<vĩ độ>
export const coordsFromEmbed = (mapEmbed) => {
  const src = embedSrcOf(mapEmbed);
  const lng = /!2d(-?\d+(?:\.\d+)?)/.exec(src || '')?.[1];
  const lat = /!3d(-?\d+(?:\.\d+)?)/.exec(src || '')?.[1];
  return lat && lng ? { latitude: Number(Number(lat).toFixed(6)), longitude: Number(Number(lng).toFixed(6)) } : null;
};

export const hasCoords = (o) => o?.latitude != null && o?.longitude != null;

// Bản đồ để hiển thị: ưu tiên mã nhúng, không có thì dựng từ tọa độ
export const mapSrcOf = (office) => {
  const embed = embedSrcOf(office?.mapEmbed);
  if (embed) return embed;
  if (hasCoords(office)) return `https://maps.google.com/maps?q=${office.latitude},${office.longitude}&z=16&hl=vi&output=embed`;
  return null;
};

// Liên kết mở Google Maps để chỉ đường
export const directionsUrlOf = (office) => {
  // Ưu tiên tọa độ trong mã nhúng để khớp với bản đồ đang hiển thị
  const coords = coordsFromEmbed(office?.mapEmbed) || (hasCoords(office) ? office : null);
  const destination = coords ? `${coords.latitude},${coords.longitude}` : office?.address;
  return destination ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}` : null;
};

// Khoảng cách (km) giữa hai điểm — dùng để phát hiện tọa độ lệch so với bản đồ nhúng
export const distanceKm = (a, b) => {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
};

// Vấn đề dữ liệu của một văn phòng (hiển thị cảnh báo ở trang quản trị)
export const officeIssues = (office) => {
  const issues = [];
  const fromEmbed = coordsFromEmbed(office.mapEmbed);
  if (office.mapEmbed && !embedSrcOf(office.mapEmbed)) issues.push('Mã nhúng bản đồ không hợp lệ');
  if (!mapSrcOf(office)) issues.push('Chưa có vị trí trên bản đồ');
  if (fromEmbed && hasCoords(office) && distanceKm(fromEmbed, office) > 1) {
    issues.push(`Tọa độ lệch ${Math.round(distanceKm(fromEmbed, office))} km so với bản đồ nhúng`);
  }
  return issues;
};
