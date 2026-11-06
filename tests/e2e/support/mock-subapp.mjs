// Sub-aplikasi tiruan yang menerapkan Kontrak Integrasi v1 (docs/KONTRAK_INTEGRASI.md).
// Dipakai uji e2e portal agar tidak bergantung pada repo/aplikasi lain.
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';

const PORT = Number(process.env.MOCK_PORT || 3199);
const SECRET = process.env.PORTAL_INTEGRATION_SECRET || '';
// Hanya email ini yang "punya akun" di sub-aplikasi tiruan.
const ACCOUNTS = new Set(['admin@rep.test']);

const send = (res, status, body, type = 'application/json') => {
  res.writeHead(status, { 'Content-Type': type });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
};
const authorized = (req) => SECRET.length >= 32 && req.headers.authorization === `Bearer ${SECRET}`;

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/api/portal/summary') {
    if (!authorized(req)) return send(res, 401, { error: 'Unauthorized' });
    return send(res, 200, {
      contractVersion: 1,
      period: url.searchParams.get('period') || 'TODAY',
      generatedAt: new Date().toISOString(),
      data: {
        dailySalesVolume: 123456,
        dailyTransactionsCount: 7,
        totalMonitoredItems: 42,
        lowStockAlerts: [{ itemName: 'Noken Mini', currentStock: 2, minThreshold: 10, category: 'Suvenir', unit: 'Pcs' }],
        popularItemToday: 'Kopi Papua E2E (5x)',
        settlementStatus: 'OPEN',
        trendSales: '+12,5% vs kemarin',
      },
    });
  }

  if (url.pathname === '/api/portal/sso/ticket' && req.method === 'POST') {
    if (!authorized(req)) return send(res, 401, { error: 'Unauthorized' });
    let raw = '';
    for await (const chunk of req) raw += chunk;
    const { email } = JSON.parse(raw || '{}');
    if (!ACCOUNTS.has(email)) {
      return send(res, 404, { error: 'Email ini belum memiliki akun di aplikasi tiruan.', code: 'NO_ACCOUNT' });
    }
    return send(res, 200, { url: `http://localhost:${PORT}/sso?ticket=${randomBytes(32).toString('hex')}` });
  }

  if (url.pathname === '/sso') return send(res, 200, '<h1>SSO MOCK OK</h1>', 'text/html');
  if (url.pathname === '/' || url.pathname === '/login') return send(res, 200, '<h1>LOGIN MOCK</h1>', 'text/html');
  return send(res, 404, { error: 'not found' });
}).listen(PORT, () => console.log(`mock sub-app on :${PORT}`));
