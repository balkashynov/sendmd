import type { UploadResponse, DocResponse, ErrorResponse, TtlHours } from "@sendmd/shared";

export async function uploadDoc(content: string, ttlHours: TtlHours): Promise<UploadResponse> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, ttl_hours: ttlHours }),
  });

  if (!res.ok) {
    const err: ErrorResponse = await res.json();
    throw new Error(err.error);
  }

  return res.json();
}

export async function fetchDoc(id: string): Promise<DocResponse> {
  const res = await fetch(`/api/doc/${id}`);

  if (!res.ok) {
    const err: ErrorResponse = await res.json();
    throw new Error(err.error);
  }

  return res.json();
}
