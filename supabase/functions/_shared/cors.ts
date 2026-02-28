const ALLOWED_ORIGINS = [
  "https://icealarm.es",
  "https://www.icealarm.es",
  "https://icealarmespana.com",
  "https://www.icealarmespana.com",
];

export function getCorsHeaders(
  req: Request,
  extraHeaders?: string
): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];

  const baseHeaders =
    "authorization, x-client-info, apikey, content-type";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": extraHeaders
      ? `${baseHeaders}, ${extraHeaders}`
      : baseHeaders,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}
