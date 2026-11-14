// Keep bounded response samples for inclusion in the end-of-test report.
const MAX_SAMPLES_PER_ENDPOINT = 20;
const MAX_BODY_LENGTH = 1000;
const responses = {};

function redact(text) {
  return text
    .replace(/("(?:access|refresh)?_?token"\s*:\s*")[^"]*(")/gi, '$1[REDACTED]$2')
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/-]+=*/gi, '$1[REDACTED]')
    .replace(/((?:password|secret|authorization)\s*[=:]\s*)[^\s,;]+/gi, '$1[REDACTED]');
}

export function recordResponse(endpoint, response) {
  if (!responses[endpoint]) responses[endpoint] = [];

  const body = response.body == null ? '' : String(response.body);
  const sample = {
    method: response.request && response.request.method,
    url: String(response.url || '').replace(/([?&](?:token|access_token|refresh_token|key|password)=)[^&]*/gi, '$1[REDACTED]'),
    status: response.status,
    statusText: response.status_text,
    durationMs: response.timings ? response.timings.duration : undefined,
    body: redact(body).slice(0, MAX_BODY_LENGTH) + (body.length > MAX_BODY_LENGTH ? '… [truncated]' : ''),
  };

  // Keep failures first so reports remain useful after a long run of successful requests.
  if (response.status < 200 || response.status >= 400) {
    const successIndex = responses[endpoint].findIndex((item) => item.status >= 200 && item.status < 400);
    if (responses[endpoint].length < MAX_SAMPLES_PER_ENDPOINT) {
      responses[endpoint].push(sample);
    } else if (successIndex >= 0) {
      responses[endpoint][successIndex] = sample;
    }
  } else if (responses[endpoint].length < MAX_SAMPLES_PER_ENDPOINT) {
    responses[endpoint].push(sample);
  }
}

export function getRecordedResponses() {
  return responses;
}
