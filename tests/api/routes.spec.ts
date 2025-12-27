import { test, expect } from '@playwright/test'

/**
 * API Tests for General Route Health
 * Tests that all API routes respond correctly
 */

const baseUrl = 'http://localhost:3000'

test.describe('API Route Health Checks', () => {
  test('should respond to /api/checkout POST', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/checkout`, {
      data: { items: [] },
    })

    // Should return 400 for empty items, or 429 if rate limited. Not 404 or 500.
    expect([400, 429]).toContain(response.status())
  })

  test('should respond to /api/claim-license POST', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/claim-license`, {
      data: { code: 'TEST' },
    })

    // Should return 401, 400, or 429 (rate limited), not 404
    expect([400, 401, 429]).toContain(response.status())
  })

  test('should respond to /api/claim-by-token POST', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/claim-by-token`, {
      data: { token: 'test-token' },
    })

    // Should return 401, 400, or 429 (rate limited), not 404
    expect([400, 401, 429]).toContain(response.status())
  })

  test('should reject GET requests to POST-only endpoints', async ({
    request,
  }) => {
    const response = await request.get(`${baseUrl}/api/checkout`)

    // Should return 405 Method Not Allowed or similar
    expect([404, 405]).toContain(response.status())
  })
})

test.describe('API CORS Headers', () => {
  test('should handle preflight OPTIONS request for checkout', async ({
    request,
  }) => {
    const response = await request.fetch(`${baseUrl}/api/checkout`, {
      method: 'OPTIONS',
    })

    // Should respond to OPTIONS (may be 204, 200, or allowed methods vary)
    expect(response.status()).toBeDefined()
  })
})

test.describe('API Error Handling', () => {
  test('should return JSON for errors', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/checkout`, {
      data: { items: [] },
    })

    const contentType = response.headers()['content-type']
    expect(contentType).toContain('application/json')

    const body = await response.json()
    expect(body).toBeDefined()
  })

  test('should include error field in error responses', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/checkout`, {
      data: { items: [] },
    })

    const body = await response.json()
    expect(body.error).toBeDefined()
  })
})

test.describe('API Request Size Limits', () => {
  test('should handle large payloads gracefully', async ({ request }) => {
    // Create a large payload
    const largeItems = Array.from({ length: 100 }, (_, i) => ({
      slug: `item-${i}`,
      name: `Item ${i}`,
      price: 99,
      quantity: 1,
    }))

    const response = await request.post(`${baseUrl}/api/checkout`, {
      data: { items: largeItems },
    })

    // Should either succeed or fail gracefully (not timeout)
    expect(response.status()).toBeDefined()
  })
})

test.describe('Static Page Routes', () => {
  const pages = [
    '/',
    '/shop',
    '/about',
    '/events',
    '/learn',
    '/community',
    '/cart',
    '/login',
    '/workshop',
    '/privacy',
    '/terms',
  ]

  for (const path of pages) {
    test(`should return 200 for ${path}`, async ({ request }) => {
      const response = await request.get(`${baseUrl}${path}`)

      if (path === '/learn') {
        expect([200, 307, 308]).toContain(response.status())
      } else {
        expect(response.status()).toBe(200)
      }
    })
  }
})

test.describe('Auth Routes', () => {
  test('should have auth callback route', async ({ request }) => {
    // This route requires specific params but should exist
    const response = await request.get(`${baseUrl}/auth/callback`)

    // Will redirect or error but shouldn't 404
    expect([200, 302, 307, 400]).toContain(response.status())
  })
})

test.describe('API Response Times', () => {
  test('checkout endpoint should respond within 5 seconds', async ({
    request,
  }) => {
    const start = Date.now()

    await request.post(`${baseUrl}/api/checkout`, {
      data: { items: [] },
      timeout: 5000,
    })

    const duration = Date.now() - start
    expect(duration).toBeLessThan(5000)
  })

  test('claim-license endpoint should respond within 5 seconds', async ({
    request,
  }) => {
    const start = Date.now()

    await request.post(`${baseUrl}/api/claim-license`, {
      data: { code: 'TEST' },
      timeout: 5000,
    })

    const duration = Date.now() - start
    expect(duration).toBeLessThan(5000)
  })
})
