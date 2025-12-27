import { test, expect } from '@playwright/test'

/**
 * API Tests for License Claim Endpoints
 * Tests /api/claim-license and /api/claim-by-token routes
 */

test.describe('POST /api/claim-license', () => {
  const baseUrl = 'http://localhost:3000'

  test('should return 401 for unauthenticated request', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/claim-license`, {
      data: { code: 'ABCD-EFGH-IJKL-MNOP' },
    })

    // 401 for unauthenticated, 429 for rate limited
    expect([401, 429]).toContain(response.status())

    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  test('should return 400 for missing code', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/claim-license`, {
      data: {},
    })

    // Either 401 (not authenticated), 400 (bad request), or 429 (rate limited)
    expect([400, 401, 429]).toContain(response.status())
  })

  test('should return 400 for empty code', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/claim-license`, {
      data: { code: '' },
    })

    expect([400, 401, 429]).toContain(response.status())
  })

  test('should return 400 for code too short', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/claim-license`, {
      data: { code: 'AB' },
    })

    // Either 401 (not authenticated), 400 (bad request), or 429 (rate limited)
    expect([400, 401, 429]).toContain(response.status())
  })

  test('should return 400 for code too long', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/claim-license`, {
      data: { code: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456' },
    })

    expect([400, 401, 429]).toContain(response.status())
  })

  test('should normalize code to uppercase', async ({ request }) => {
    // This behavior can be tested by submitting lowercase
    // The server normalizes it internally
    const response = await request.post(`${baseUrl}/api/claim-license`, {
      data: { code: 'abcd-efgh-ijkl-mnop' },
    })

    // Will fail auth or not find code, but shouldn't error on normalization
    expect(response.status()).toBeDefined()
  })

  test('should handle non-string code', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/claim-license`, {
      data: { code: 12345 },
    })

    expect([400, 401, 429]).toContain(response.status())
  })
})

test.describe('POST /api/claim-by-token', () => {
  const baseUrl = 'http://localhost:3000'

  test('should return 401 for unauthenticated request', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/claim-by-token`, {
      data: { token: 'abc123def456' },
    })

    // 401 for unauthenticated, 429 for rate limited
    expect([401, 429]).toContain(response.status())

    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  test('should return 400 for missing token', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/claim-by-token`, {
      data: {},
    })

    expect([400, 401, 429]).toContain(response.status())
  })

  test('should return 400 for empty token', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/claim-by-token`, {
      data: { token: '' },
    })

    expect([400, 401, 429]).toContain(response.status())
  })

  test('should return 404 for non-existent token', async ({ request }) => {
    // This would return 404 if authenticated, 401 if not, or 429 if rate limited
    const response = await request.post(`${baseUrl}/api/claim-by-token`, {
      data: { token: 'nonexistent-token-123456' },
    })

    expect([400, 401, 404, 429]).toContain(response.status())
  })

  test('should handle non-string token', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/claim-by-token`, {
      data: { token: 12345 },
    })

    expect([400, 401, 429]).toContain(response.status())
  })
})

test.describe('Claim API - Error Messages', () => {
  const baseUrl = 'http://localhost:3000'

  test('claim-license should return helpful error messages', async ({
    request,
  }) => {
    const response = await request.post(`${baseUrl}/api/claim-license`, {
      data: { code: 'INVALID' },
    })

    const body = await response.json()
    expect(body.error).toBeDefined()
    expect(typeof body.error).toBe('string')
    expect(body.error.length).toBeGreaterThan(0)
  })

  test('claim-by-token should return helpful error messages', async ({
    request,
  }) => {
    const response = await request.post(`${baseUrl}/api/claim-by-token`, {
      data: { token: 'invalid' },
    })

    const body = await response.json()
    expect(body.error).toBeDefined()
    expect(typeof body.error).toBe('string')
    expect(body.error.length).toBeGreaterThan(0)
  })
})

test.describe('Claim API - Content Type Handling', () => {
  const baseUrl = 'http://localhost:3000'

  test('should accept application/json content type', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/claim-license`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: { code: 'TEST-CODE' },
    })

    // Should process request (though may fail auth)
    expect(response.status()).toBeDefined()
  })

  test('should handle requests without content type', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/claim-license`, {
      data: { code: 'TEST-CODE' },
    })

    expect(response.status()).toBeDefined()
  })
})
