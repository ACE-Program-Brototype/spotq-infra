import { recordResponse } from './response-recorder.js';

const MAX_LOG_BODY_LENGTH = 500;

function redact(text) {
  return text
    .replace(/("(?:access|refresh)?_?token"\s*:\s*")[^"]*(")/gi, '$1[REDACTED]$2')
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/-]+=*/gi, '$1[REDACTED]')
    .replace(/((?:password|secret|authorization)\s*[=:]\s*)[^\s,;]+/gi, '$1[REDACTED]');
}

/** Record every sample and print concise diagnostics for failing HTTP responses. */
export function diagnoseResponse(endpoint, response) {
  recordResponse(endpoint, response);

  if (response.status >= 200 && response.status < 400) return;

  const body = redact(String(response.body || '')).slice(0, MAX_LOG_BODY_LENGTH);
  const truncated = String(response.body || '').length > MAX_LOG_BODY_LENGTH ? '… [truncated]' : '';
  const method = response.request?.method || 'HTTP';
  const url = String(response.url || '').replace(/([?&](?:token|access_token|refresh_token|key|password)=)[^&]*/gi, '$1[REDACTED]');

  console.error(
    `[k6 failure] endpoint=${endpoint} method=${method} status=${response.status} ` +
    `duration=${response.timings?.duration ?? 'n/a'}ms url=${url} ` +
    `error=${response.error || 'none'} body=${body}${truncated}`,
  );
}
