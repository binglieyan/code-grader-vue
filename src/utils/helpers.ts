export const formatDateTime = (
  value: string | number | Date | null | undefined,
): string => {
  if (!value) return '未设置';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('zh-CN', { hour12: false });
};

export const buildQueryString = (
  params: Record<string, string | number | boolean | null | undefined> = {},
): string => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.append(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

export const toArray = <T>(
  value: T | { records: T[] } | null | undefined,
): T[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray((value as { records?: T[] })?.records))
    return (value as { records: T[] }).records;
  return [];
};

export const toPageData = <T>(
  value: { records?: T[]; total?: number } | null | undefined,
): { records: T[]; total: number } => ({
  records: Array.isArray(value?.records) ? value.records : [],
  total: Number(value?.total || 0),
});

export const decodeEscapedText = (value: string | null | undefined): string => {
  if (typeof value !== 'string' || !value) return value || '';

  return value
    .replace(/(?<!\\)\\r\\n/g, '\n')
    .replace(/(?<!\\)\\n/g, '\n')
    .replace(/(?<!\\)\\t/g, '\t')
    .replace(/(?<!\\)\\r/g, '\r')
    .replace(/\\\\/g, '\\');
};

export const encodeEscapedText = (value: string | null | undefined): string => {
  if (typeof value !== 'string' || !value) return value || '';

  return value
    .replace(/\r\n/g, '\n')
    .replace(/\\/g, '\\\\')
    .replace(/\t/g, '\\t')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
};
