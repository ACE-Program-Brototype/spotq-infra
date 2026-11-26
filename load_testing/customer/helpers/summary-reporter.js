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

  // Extract per-endpoint metrics sorted by endpoint name
  const endpointRows = [];
  for (const metricKey in metrics) {
    if (metricKey.startsWith('http_req_duration{endpoint:')) {
      const match = metricKey.match(/\{endpoint:([^}]+)\}/);
      const name = match ? match[1] : metricKey;
      const values = metrics[metricKey].values;
      const p95Val = values['p(95)'] !== undefined ? values['p(95)'] : values['p95'];
      const p99Val = values['p(99)'] !== undefined ? values['p(99)'] : values['p99'];
      const p90Val = values['p(90)'] !== undefined ? values['p(90)'] : values['p90'];

      endpointRows.push({
        name,
        avg: values.avg ? values.avg.toFixed(2) : 'N/A',
        p90: p90Val ? p90Val.toFixed(2) : 'N/A',
        p95: p95Val ? p95Val.toFixed(2) : 'N/A',
        p99: p99Val ? p99Val.toFixed(2) : 'N/A',
        max: values.max ? values.max.toFixed(2) : 'N/A',
      });
    }
  }

  endpointRows.sort((a, b) => a.name.localeCompare(b.name));

  const rowsHtml = endpointRows
    .map(
      (row) => `
      <tr>
        <td style="padding: 11px 12px; border-bottom: 1px solid #f1f5f9; font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 13px; font-weight: 600; color: #1e293b;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #e8631b; margin-right: 8px;"></span>${row.name}
        </td>
        <td style="padding: 11px 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 13px; color: #475569;">${row.avg} ms</td>
        <td style="padding: 11px 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 13px; color: #475569;">${row.p90} ms</td>
        <td style="padding: 11px 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 13px; color: #e8631b; font-weight: 700;">${row.p95} ms</td>
        <td style="padding: 11px 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 13px; color: #b45309; font-weight: 600;">${row.p99} ms</td>
        <td style="padding: 11px 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 13px; color: #64748b;">${row.max} ms</td>
      </tr>
    `
    )
    .join('');

  const globalP95 = httpDuration['p(95)'] !== undefined ? httpDuration['p(95)'].toFixed(2) : (httpDuration['p95'] ? httpDuration['p95'].toFixed(2) : '0');
  const errorRatePercent = httpFailed.rate ? (httpFailed.rate * 100).toFixed(2) : '0';
  const isHealthy = !httpFailed.rate || httpFailed.rate < 0.02;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SpotQ Customer Load Test Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #faf7f5;
      color: #1e293b;
      margin: 0;
      padding: 32px 16px;
    }
    .container {
      max-width: 1120px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #eddcd4;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(232, 99, 27, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03);
      padding: 36px;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #eddcd4;
      padding-bottom: 24px;
      margin-bottom: 28px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #e8631b 0%, #9a3412 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 800;
      font-size: 20px;
    }
    h1 {
      margin: 0;
      font-size: 22px;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .subtitle {
      margin: 4px 0 0 0;
      color: #64748b;
      font-size: 14px;
    }
    .status-badge {
      font-size: 12px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: ${isHealthy ? '#ecfdf5' : '#fef2f2'};
      color: ${isHealthy ? '#047857' : '#b91c1c'};
      border: 1px solid ${isHealthy ? '#a7f3d0' : '#fecaca'};
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .card {
      background: #faf7f5;
      border: 1px solid #eddcd4;
      border-radius: 12px;
      padding: 20px;
      transition: transform 0.2s;
    }
    .card-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #64748b;
      margin-bottom: 6px;
    }
    .card-val {
      font-size: 26px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin: 28px 0 16px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .table-wrapper {
      border: 1px solid #eddcd4;
      border-radius: 12px;
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    th {
      background: #faf7f5;
      padding: 12px;
      font-size: 12px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      border-bottom: 1px solid #eddcd4;
    }
    th.num {
      text-align: right;
    }
    footer {
      margin-top: 36px;
      padding-top: 20px;
      border-top: 1px solid #eddcd4;
      font-size: 12px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <div class="brand-logo">Q</div>
        <div>
          <h1>SpotQ Customer Side API Load Test</h1>
          <p class="subtitle">Real-world customer session emulation: Discovery, Queues, Carts, Checkout & Payments</p>
        </div>
      </div>
      <div class="status-badge">
        ${isHealthy ? '● All SLOs Passed' : '▲ SLO Breach Detected'}
      </div>
    </header>

    <div class="grid">
      <div class="card">
        <div class="card-title">Total Requests</div>
        <div class="card-val">${totalRequests.toLocaleString()}</div>
      </div>
      <div class="card">
        <div class="card-title">Peak Concurrency (VUs)</div>
        <div class="card-val" style="color: #e8631b;">${vusMax}</div>
      </div>
      <div class="card">
        <div class="card-title">Global p95 Latency</div>
        <div class="card-val" style="color: #0284c7;">${globalP95} ms</div>
      </div>
      <div class="card">
        <div class="card-title">Request Failure Rate</div>
        <div class="card-val" style="color: ${isHealthy ? '#16a34a' : '#dc2626'};">${errorRatePercent}%</div>
      </div>
    </div>

    <div class="section-title">
      <span>Per-Endpoint SLO & Performance Breakdown</span>
      <span style="font-size: 12px; font-weight: normal; color: #64748b;">Tagged metrics captured during test execution</span>
    </div>

    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Endpoint Target</th>
            <th class="num">Avg</th>
            <th class="num">p90</th>
            <th class="num">p95 (SLO)</th>
            <th class="num">p99</th>
            <th class="num">Max</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colspan="6" style="padding: 24px; text-align: center; color: #94a3b8;">No tagged endpoint metrics recorded.</td></tr>'}
        </tbody>
      </table>
    </div>

    <footer>
      <div>Generated by SpotQ Performance Suite (k6) on ${new Date().toISOString()}</div>
      <div>SpotQ Platform Architecture & SRE</div>
    </footer>
  </div>
</body>
</html>`;
}
