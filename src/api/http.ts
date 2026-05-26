const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: BodyInit | null;
  skipAuth?: boolean;
  isDownload?: boolean;
}

interface DownloadResponse {
  blob: Blob;
  filename: string | null;
  contentType: string | null;
}

const inferContentType = (body: unknown): Record<string, string> => {
  if (body instanceof FormData) return {};
  return { 'Content-Type': 'application/json' };
};

export async function request<T = unknown>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = localStorage.getItem('code-grader-token') || '';
  const headers = {
    ...inferContentType(options.body),
    ...(!options.skipAuth && token ? { token } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: options.method || 'GET',
    headers,
    body:
      options.body && !(options.body instanceof FormData)
        ? JSON.stringify(options.body)
        : options.body,
  });

  // 处理下载响应
  if (options.isDownload) {
    if (!response.ok) {
      let payload;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }
      throw new Error(payload?.message || `请求失败 (${response.status})`);
    }
    return {
      blob: await response.blob(),
      filename: getFilenameFromContentDisposition(
        response.headers.get('Content-Disposition'),
      ),
      contentType: response.headers.get('Content-Type'),
    } as T;
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.message || `请求失败 (${response.status})`);
  }

  if (payload && typeof payload.code === 'number' && payload.code !== 200) {
    throw new Error(payload.message || '接口返回异常');
  }

  return payload?.data ?? payload;
}

// 从 Content-Disposition 头提取文件名
function getFilenameFromContentDisposition(
  contentDisposition: string | null,
): string | null {
  if (!contentDisposition) return null;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''(.+)/i);
  if (utf8Match && utf8Match[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const match = contentDisposition.match(/filename="?([^"]+)"?/i);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

export const http = {
  get: <T = unknown>(url: string) => request<T>(url),
  post: <T = unknown>(url: string, body?: unknown) =>
    request<T>(url, { method: 'POST', body: body as BodyInit | null }),
  put: <T = unknown>(url: string, body?: unknown) =>
    request<T>(url, { method: 'PUT', body: body as BodyInit | null }),
  delete: <T = unknown>(url: string) => request<T>(url, { method: 'DELETE' }),
  postPublic: <T = unknown>(url: string, body?: unknown) =>
    request<T>(url, {
      method: 'POST',
      body: body as BodyInit | null,
      skipAuth: true,
    }),
  download: (url: string) =>
    request<DownloadResponse>(url, { isDownload: true }),
};
