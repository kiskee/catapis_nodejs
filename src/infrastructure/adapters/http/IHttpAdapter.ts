export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeoutMs?: number;
  baseURL?: string;
}

export interface IHttpAdapter {
  get<T = any>(url: string, opts?: RequestOptions): Promise<T>;
  post<T = any>(url: string, data?: any, opts?: RequestOptions): Promise<T>;
  put<T = any>(url: string, data?: any, opts?: RequestOptions): Promise<T>;
  patch<T = any>(url: string, data?: any, opts?: RequestOptions): Promise<T>;
  delete<T = any>(url: string, opts?: RequestOptions): Promise<T>;
}
