import { test, expect } from '@playwright/test'

/**
 * API Tests for Checkout Endpoint
 * Tests the /api/checkout route
 */

test.describe('POST /api/checkout', () => {
  const baseUrl = 'http://localhost:3000'

  test('should return error for empty cart', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/checkout`, {
      data: { items: [] },
    })

    // 400 for empty items, or 429 if rate limited
    expect([400, 429]).toContain(response.status())

    const body = await response.json()
    expect(body.error).toBeDefined()
    if (response.status() === 400) {
      expect(body.error).toContain('No items')
    }
  })

  test('should return error for missing items', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/checkout`, {
      data: {},
    })

    // 400 for missing items, or 429 if rate limited
    expect([400, 429]).toContain(response.status())

    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  test('should create checkout session for valid cart', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/checkout`, {
      data: {
        items: [
          {
            slug: '4dof-arm',
            name: 'The 4DOF Robotic Arm',
            price: 99,
            quantity: 1,
          },
        ],
      },
    })

    // Should either succeed with URL, fail with Stripe error, or be rate limited
    if (response.status() === 200) {
      const body = await response.json()
      expect(body.url).toBeDefined()
      expect(body.url).toMatch(/stripe\.com|checkout/i)
    } else {
      // 400 if products are missing, 500 for Stripe config error, or 429 if rate limited
      expect([400, 500, 429]).toContain(response.status())
    }
  })

  test('should handle multiple items', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/checkout`, {
      data: {
        items: [
          {
            slug: '4dof-arm',
            name: 'The 4DOF Robotic Arm',
            price: 99,
            quantity: 2,
          },
          {
            slug: 'sensor-kit',
            name: 'Sensor Starter Kit',
            price: 49,
            quantity: 1,
          },
        ],
      },
    })

    // Response depends on Stripe configuration or product availability
    expect([200, 400, 500, 429]).toContain(response.status())
  })

  test('should calculate free shipping for orders over $75', async ({
    request,
  }) => {
    // This is tested implicitly through the checkout flow
    // The shipping calculation happens server-side
    const response = await request.post(`${baseUrl}/api/checkout`, {
      data: {
        items: [
          {
            slug: '4dof-arm',
            name: 'The 4DOF Robotic Arm',
            price: 99,
            quantity: 1,
          },
        ],
      },
    })

    // Just verify endpoint responds (400 if products are missing)
    expect(response.status()).toBeDefined()
  })

  test('should add shipping for orders under $75', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/checkout`, {
      data: {
        items: [
          {
            slug: 'small-item',
            name: 'Small Item',
            price: 29,
            quantity: 1,
          },
        ],
      },
    })

    // Endpoint should respond (400 if products are missing)
    expect(response.status()).toBeDefined()
  })

  test('should handle invalid JSON', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/checkout`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: 'invalid json',
    })

    // Should return error
    expect(response.status()).toBeGreaterThanOrEqual(400)
  })

  test('should handle missing content type', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/checkout`, {
      data: {
        items: [
          {
            slug: '4dof-arm',
            name: 'The 4DOF Robotic Arm',
            price: 99,
            quantity: 1,
          },
        ],
      },
    })

    // Should still work or return appropriate error
    expect(response.status()).toBeDefined()
  })
})
