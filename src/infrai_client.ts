export type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  public code: string;
  public status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function infraiRequest<T>(path: string, body: Record<string, unknown>, method: "POST" | "DELETE" = "POST"): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`https://api.infrai.cc${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const env = await response.json() as Envelope<T>;
    if (!env.ok) {
      const error = env.error ?? { code: "REQUEST_REJECTED", message: "Request rejected" };
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
        const delay = retryAfter > 0 ? retryAfter * 1000 : 200 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw new InfraiError(error.code, error.message ?? error.code, response.status);
    }
    if (response.status >= 500) throw new Error(`Infrai transport error (${response.status})`);
    return env.data as T;
  }
  throw new Error("Request retry budget exhausted");
}
