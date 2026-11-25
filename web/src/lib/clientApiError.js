export async function getApiErrorMessage(response, fallbackMessage = "Request failed.") {
  try {
    const data = await response.json();
    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error;
    }
    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
  } catch (_) {
    // Ignore JSON parse failures and fall back to HTTP status.
  }

  const statusText = response.statusText?.trim();
  if (statusText) {
    return `${fallbackMessage} (${response.status} ${statusText})`;
  }

  return `${fallbackMessage} (HTTP ${response.status})`;
}
