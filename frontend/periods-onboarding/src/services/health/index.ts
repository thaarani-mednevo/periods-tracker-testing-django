
function getBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
}

/**
 * Check backend server liveness and health status.
 */
export async function checkHealth(): Promise<{ status: string; message: string } | null> {
  const targetUrl = getBaseUrl() || "http://localhost:8000";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${targetUrl}/api/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      return (await response.json()) as { status: string; message: string };
    }
    return null;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}
