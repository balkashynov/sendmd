export type TtlHours = 1 | 24 | 168 | 720;

export interface UploadResponse {
  id: string;
  url: string;
  expires_at: string;
}

export interface DocResponse {
  id: string;
  content: string;
  size_bytes: number;
  views: number;
  ttl_hours: TtlHours;
  created_at: string;
  expires_at: string;
}

export interface ErrorResponse {
  error: string;
  code?: string;
}
