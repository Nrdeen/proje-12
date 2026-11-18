import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startServer } from '../../server';
import {
  calculateFeastEstimate,
  computeSeasonalPriceSeries,
  isValidSaudiMobile,
  normalizeSaudiPhoneDigits,
} from '../../src/lib/marketplace-tools';
import { getRoleAwareNavItems } from '../../src/lib/marketplace-helpers';
import { parseUrlToRoute, routeToUrl, createRoute } from '../../src/lib/router';

test('calculateFeastEstimate calculates exact heads, meat, rice, and spare logic', () => {
  // 40 guests * 550g = 22 kg meat; 50 kg sheep * 0.38 = 19 kg edible -> ceil(22/19)=2 + 1 spare = 3
  const wedding40 = calculateFeastEstimate({
    guests: 40,
    occasion: 'wedding',
    portionGrams: 550,
    animalType: 'sheep',
    weightKg: 50,
    headPriceSar: 1950,
    includeSpare: true,
  });
  assert.equal(wedding40.meatKg, 22);
  assert.equal(wedding40.baseHeads, 2);
  assert.equal(wedding40.spareHeads, 1);
  assert.equal(wedding40.totalHeads, 3);
  assert.equal(wedding40.riceKg, 6);
  assert.equal(wedding40.totalCostSar, 5850);
  assert.equal(wedding40.isLargeFeast, false);

  // Guests < 10 never add a spare head even when includeSpare=true
  const small6 = calculateFeastEstimate({
    guests: 6,
    occasion: 'aqiqa',
    portionGrams: 400,
    animalType: 'goat',
    weightKg: 30,
    headPriceSar: 1450,
    includeSpare: true,
  });
  assert.equal(small6.spareHeads, 0);
  assert.equal(small6.baseHeads, 1);
  assert.equal(small6.totalHeads, 1);

  // Large feast (>1500) flags notice
  const large1600 = calculateFeastEstimate({
    guests: 1600,
    occasion: 'wedding',
    portionGrams: 550,
    animalType: 'sheep',
    weightKg: 60,
    headPriceSar: 2100,
    includeSpare: false,
  });
  assert.equal(large1600.isLargeFeast, true);
  assert.equal(large1600.spareHeads, 0);
});

test('Saudi mobile normalization and seasonal series modeling behave accurately', () => {
  assert.equal(normalizeSaudiPhoneDigits('٠٥٠١٢٣٤٥٦٧'), '0501234567');
  assert.equal(isValidSaudiMobile('0501234567'), true);
  assert.equal(isValidSaudiMobile('٠٥٥٩٨٧٦٥٤٣'), true);
  assert.equal(isValidSaudiMobile('0401234567'), false);
  assert.equal(isValidSaudiMobile('050123'), false);

  const series = computeSeasonalPriceSeries(2000);
  assert.equal(series.length, 12);
  assert.equal(series[5].month, 'يونيو');
  assert.ok(series[5].priceSar > series[9].priceSar);
});

test('Router and role-aware nav handle services, pricing, feast, occasions, how, and contact routes', () => {
  const routes = [
    ['/services', 'services'],
    ['/pricing', 'pricing'],
    ['/feast', 'feast'],
    ['/occasions', 'occasions'],
    ['/how', 'how'],
    ['/contact', 'contact'],
  ] as const;

  for (const [pathname, expectedPage] of routes) {
    const parsed = parseUrlToRoute(pathname);
    assert.equal(parsed.page, expectedPage);
    assert.equal(routeToUrl(createRoute({ page: expectedPage })), pathname);
  }

  const nav = getRoleAwareNavItems(null);
  assert.equal(nav.some((item) => item.page === 'services'), true);
  assert.equal(nav.some((item) => item.page === 'pricing'), true);
});

test('API endpoints POST /api/v1/contact and /api/v1/service-requests validate inputs and persist inquiries', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'souq-inquiries-test-'));
  const srv = await startServer({
    serveFrontend: false,
    config: {
      port: 0,
      dataDir: tempDir,
      storageBackend: 'json',
      demoAccounts: false,
    },
  });

  try {
    const originHeader = {
      Origin: srv.config.allowedOrigins[0] || 'http://localhost:3000',
      'Content-Type': 'application/json',
    };

    // Invalid contact payload rejected with 400
    const badContactRes = await fetch(`http://127.0.0.1:${srv.port}/api/v1/contact`, {
      method: 'POST',
      headers: originHeader,
      body: JSON.stringify({ name: 'أ', contact: '05', topic: 'عام', message: 'قصير' }),
    });
    assert.equal(badContactRes.status, 400);

    // Valid contact payload with region and preferredReply persists with 201 and MSG-* referenceId
    const okContactRes = await fetch(`http://127.0.0.1:${srv.port}/api/v1/contact`, {
      method: 'POST',
      headers: originHeader,
      body: JSON.stringify({
        name: 'خالد السبيعي',
        contact: '0501234567',
        topic: 'الباقات المدفوعة والإعلانات المميزة',
        region: 'منطقة الرياض',
        preferredReply: 'phone',
        message: 'أرغب في معرفة خطوات الاشتراك السنوي للمراح وتوثيق الحساب.',
      }),
    });
    assert.equal(okContactRes.status, 201);
    const contactJson = (await okContactRes.json()) as {
      ok: boolean;
      referenceId: string;
      preferredReply: string;
    };
    assert.equal(contactJson.ok, true);
    assert.match(contactJson.referenceId, /^MSG-/);
    assert.equal(contactJson.preferredReply, 'phone');

    // Invalid preferredReply safely falls back to whatsapp
    const fallbackContactRes = await fetch(`http://127.0.0.1:${srv.port}/api/v1/contact`, {
      method: 'POST',
      headers: originHeader,
      body: JSON.stringify({
        name: 'سعد الدوسري',
        contact: '0559876543',
        topic: 'توثيق حساب مربي أو تاجر',
        preferredReply: 'telegram',
        message: 'طلب تفعيل التوثيق وربط الحساب بخدمات التوصيل.',
      }),
    });
    assert.equal(fallbackContactRes.status, 201);
    const fallbackJson = (await fallbackContactRes.json()) as {
      ok: boolean;
      preferredReply: string;
    };
    assert.equal(fallbackJson.preferredReply, 'whatsapp');

    // Invalid Saudi mobile on service-requests rejected
    const badSrvRes = await fetch(`http://127.0.0.1:${srv.port}/api/v1/service-requests`, {
      method: 'POST',
      headers: originHeader,
      body: JSON.stringify({
        serviceType: 'نقل المواشي والأغنام',
        region: 'منطقة الرياض',
        phone: '12345',
        details: 'نقل 15 رأس نعيمي من الرياض إلى القصيم',
      }),
    });
    assert.equal(badSrvRes.status, 400);

    // Valid service request persists with SRV-* referenceId
    const okSrvRes = await fetch(`http://127.0.0.1:${srv.port}/api/v1/service-requests`, {
      method: 'POST',
      headers: originHeader,
      body: JSON.stringify({
        serviceType: 'نقل المواشي والأغنام',
        region: 'منطقة القصيم',
        phone: '0551234567',
        name: 'مراح القصيم',
        details: 'نقل 20 رأس نعيمي بسيارة مكيفة ومغطاة صباح الجمعة.',
      }),
    });
    assert.equal(okSrvRes.status, 201);
    const srvJson = (await okSrvRes.json()) as { ok: boolean; referenceId: string };
    assert.equal(srvJson.ok, true);
    assert.match(srvJson.referenceId, /^SRV-/);

    const saved = JSON.parse(fs.readFileSync(path.join(tempDir, 'inquiries.json'), 'utf8'));
    assert.equal(Array.isArray(saved), true);
    assert.equal(saved.length, 3);
    assert.equal(saved[0].kind, 'contact');
    assert.equal(saved[0].region, 'منطقة الرياض');
    assert.equal(saved[0].preferredReply, 'phone');
    assert.equal(saved[1].kind, 'contact');
    assert.equal(saved[1].preferredReply, 'whatsapp');
    assert.equal(saved[2].kind, 'service_request');
  } finally {
    await srv.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
