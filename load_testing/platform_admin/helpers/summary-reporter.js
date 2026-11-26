/**
 * Custom Report Generator for k6 handleSummary()
 * Generates an executive HTML report and structured JSON summary.
 */

export function generateHtmlReport(data) {
  const metrics = data.metrics;
  const httpDuration = metrics.http_req_duration ? metrics.http_req_duration.values : {};
  const httpFailed = metrics.http_req_failed ? metrics.http_req_failed.values : {};
  const totalRequests = metrics.http_reqs ? metrics.http_reqs.values.count : 0;
  const vusMax = metrics.vus_max ? metrics.vus_max.values.max : (metrics.vus ? metrics.vus.values.max : 0);
  const responseGroups = data.requestResponses || {};
  const responseRows = Object.entries(responseGroups).flatMap(([endpoint, responses]) =>
    responses.map((response, index) => ({ endpoint, index: index + 1, ...response }))
  );
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>\"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;',
  })[char]);

  // Extract per-endpoint metrics
  const endpointRows = [];
  for (const metricKey in metrics) {
    if (metricKey.startsWith('http_req_duration{endpoint:')) {
      const match = metricKey.match(/\{endpoint:([^}]+)\}/);
      const name = match ? match[1] : metricKey;
      const values = metrics[metricKey].values;
      endpointRows.push({
        name,
        avg: values.avg ? values.avg.toFixed(2) : 'N/A',
        p90: values['p(90)'] ? values['p(90)'].toFixed(2) : 'N/A',
        p95: values['p(95)'] ? values['p(95)'].toFixed(2) : 'N/A',
        p99: values['p(99)'] ? values['p(99)'].toFixed(2) : 'N/A',
        max: values.max ? values.max.toFixed(2) : 'N/A',
      });
    }
  }

  const rowsHtml = endpointRows
    .map(
      (row) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: 600;">${row.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">${row.avg} ms</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">${row.p90} ms</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #2563eb; font-weight: bold;">${row.p95} ms</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #d97706;">${row.p99} ms</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">${row.max} ms</td>
      </tr>
    `
    )
    .join('');

  const responseHtml = responseRows.map((response) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${escapeHtml(response.endpoint)} #${response.index}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(response.status)} ${escapeHtml(response.statusText)}<br>${escapeHtml(response.durationMs ?? 'N/A')} ms</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; word-break: break-all;">${escapeHtml(response.url)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><pre style="white-space: pre-wrap; max-width: 600px; max-height: 240px; overflow: auto; margin: 0;">${escapeHtml(response.body)}</pre></td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SpotQ Platform Admin Load Test Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .container { max-width: 1100px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); padding: 32px; }
    h1 { margin-top: 0; color: #0f172a; font-size: 24px; display: flex; align-items: center; justify-content: space-between; }
    .badge { font-size: 13px; font-weight: 500; background: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 9999px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0; }
    .card { background: #f1f5f9; padding: 16px; border-radius: 8px; }
    .card-title { font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
    .card-val { font-size: 24px; font-weight: 700; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { text-align: left; padding: 12px 10px; background: #f8fafc; border-bottom: 2px solid #cbd5e1; font-size: 13px; color: #475569; }
    th.num { text-align: right; }
    .footer { margin-top: 32px; font-size: 12px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <h1>
      SpotQ Platform Admin Load Test Summary
      <span class="badge">Production Grade Test</span>
    </h1>
    <p style="color: #64748b; font-size: 14px;">Evaluated system under realistic peak administrative workload and multi-service fan-outs.</p>

    <div class="grid">
      <div class="card">
        <div class="card-title">Total HTTP Requests</div>
        <div class="card-val">${totalRequests.toLocaleString()}</div>
      </div>
      <div class="card">
        <div class="card-title">Peak Concurrency (VUs)</div>
        <div class="card-val">${vusMax}</div>
      </div>
      <div class="card">
        <div class="card-title">p95 Response Time</div>
        <div class="card-val" style="color: #2563eb;">${httpDuration['p(95)'] ? httpDuration['p(95)'].toFixed(2) : 0} ms</div>
      </div>
      <div class="card">
        <div class="card-title">Error Rate</div>
        <div class="card-val" style="color: ${httpFailed.rate > 0.01 ? '#dc2626' : '#16a34a'};">${httpFailed.rate ? (httpFailed.rate * 100).toFixed(2) : 0}%</div>
      </div>
    </div>

    <h2 style="font-size: 18px; margin-top: 32px; color: #334155;">Endpoint Performance Breakdown</h2>
    <table>
      <thead>
        <tr>
          <th>Endpoint Key</th>
          <th class="num">Average</th>
          <th class="num">p(90)</th>
          <th class="num">p(95)</th>
          <th class="num">p(99)</th>
          <th class="num">Max</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colspan="6" style="padding: 16px; text-align: center; color: #94a3b8;">No endpoint tags captured</td></tr>'}
      </tbody>
    </table>

    <h2 style="font-size: 18px; margin-top: 32px; color: #334155;">Request Responses (up to 20 per endpoint)</h2>
    <table>
      <thead><tr><th>Request</th><th>Status / Duration</th><th>URL</th><th>Response Body (up to 1 KB)</th></tr></thead>
      <tbody>${responseHtml || '<tr><td colspan="4" style="padding: 16px; text-align: center; color: #94a3b8;">No request responses recorded</td></tr>'}</tbody>
    </table>

    <div class="footer">
      Generated automatically by k6 on ${new Date().toISOString()} • SpotQ SRE & DevOps Performance Suite
    </div>
  </div>
</body>
</html>`;
}
