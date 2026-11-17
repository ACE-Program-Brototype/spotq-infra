/**
 * Helper to build standard HTTP headers for JSON and authenticated requests.
 */
export function buildHeaders(token = null) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

