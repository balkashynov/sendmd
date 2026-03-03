// ── DB Row Types ──

export interface Doc {
  id: string;
  size_bytes: number;
  views: number;
  ttl_hours: 1 | 24 | 168 | 720;
  created_at: string;
  expires_at: string;
  upload_ip: string | null;
  content_type: string;
  is_deleted: boolean;
  flagged: boolean;
}

export interface UploadEvent {
  id: number;
  doc_id: string | null;
  ip: string;
  created_at: string;
  size_bytes: number | null;
  was_rejected: boolean;
  reject_reason: string | null;
}

export interface ViewEvent {
  id: number;
  doc_id: string;
  viewed_at: string;
  viewer_ip: string | null;
  referer: string | null;
}

export interface FlaggedIp {
  ip: string;
  reason: string | null;
  flagged_at: string;
  is_blocked: boolean;
}

// ── Request / Response Types ──

export type TtlHours = 1 | 24 | 168 | 720;

export interface UploadRequest {
  content: string;
  ttl_hours: TtlHours;
}

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
