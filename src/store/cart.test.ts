import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore, selectCartTotal, selectCartCount } from './cart'

describe('Cart Store', () => {
  // Reset store before each test
  beforeEach(() => {
    useCartStore.setState({ items: [], isOpen: false })
  })

  describe('addItem', () => {
    it('should add a new item to empty cart', () => {
      const item = { slug: 'test-kit', name: 'Test Kit', price: 99 }

      useCartStore.getState().addItem(item)

      const state = useCartStore.getState()
      expect(state.items).toHaveLength(1)
      expect(state.items[0]).toEqual({ ...item, quantity: 1 })
    })

    it('should add item with specified quantity', () => {
      const item = { slug: 'test-kit', name: 'Test Kit', price: 99 }

      useCartStore.getState().addItem(item, 3)

      const state = useCartStore.getState()
      expect(state.items[0].quantity).toBe(3)
    })

    it('should increment quantity when adding existing item', () => {
      const item = { slug: 'test-kit', name: 'Test Kit', price: 99 }

      useCartStore.getState().addItem(item)
      useCartStore.getState().addItem(item)

      const state = useCartStore.getState()
      expect(state.items).toHaveLength(1)
      expect(state.items[0].quantity).toBe(2)
    })

    it('should add quantity to existing item when specified', () => {
      const item = { slug: 'test-kit', name: 'Test Kit', price: 99 }

      useCartStore.getState().addItem(item, 2)
      useCartStore.getState().addItem(item, 3)

      const state = useCartStore.getState()
      expect(state.items[0].quantity).toBe(5)
    })

    it('should open cart when adding item', () => {
      const item = { slug: 'test-kit', name: 'Test Kit', price: 99 }

      expect(useCartStore.getState().isOpen).toBe(false)
      useCartStore.getState().addItem(item)
      expect(useCartStore.getState().isOpen).toBe(true)
    })

    it('should keep multiple different items separate', () => {
      const item1 = { slug: 'kit-1', name: 'Kit 1', price: 99 }
      const item2 = { slug: 'kit-2', name: 'Kit 2', price: 149 }

      useCartStore.getState().addItem(item1)
      useCartStore.getState().addItem(item2)

      const state = useCartStore.getState()
      expect(state.items).toHaveLength(2)
      expect(state.items[0].slug).toBe('kit-1')
      expect(state.items[1].slug).toBe('kit-2')
    })
  })

  describe('removeItem', () => {
    it('should remove item by slug', () => {
      useCartStore.setState({
        items: [
          { slug: 'kit-1', name: 'Kit 1', price: 99, quantity: 1 },
          { slug: 'kit-2', name: 'Kit 2', price: 149, quantity: 2 },
        ],
      })

      useCartStore.getState().removeItem('kit-1')

      const state = useCartStore.getState()
      expect(state.items).toHaveLength(1)
      expect(state.items[0].slug).toBe('kit-2')
    })

    it('should do nothing when removing non-existent item', () => {
      useCartStore.setState({
        items: [{ slug: 'kit-1', name: 'Kit 1', price: 99, quantity: 1 }],
      })

      useCartStore.getState().removeItem('non-existent')

      expect(useCartStore.getState().items).toHaveLength(1)
    })
  })

  describe('updateQuantity', () => {
    it('should update item quantity', () => {
      useCartStore.setState({
        items: [{ slug: 'kit-1', name: 'Kit 1', price: 99, quantity: 1 }],
      })

      useCartStore.getState().updateQuantity('kit-1', 5)

      expect(useCartStore.getState().items[0].quantity).toBe(5)
    })

    it('should remove item when quantity is set to 0', () => {
      useCartStore.setState({
        items: [{ slug: 'kit-1', name: 'Kit 1', price: 99, quantity: 3 }],
      })

      useCartStore.getState().updateQuantity('kit-1', 0)

      expect(useCartStore.getState().items).toHaveLength(0)
    })

    it('should remove item when quantity is negative', () => {
      useCartStore.setState({
        items: [{ slug: 'kit-1', name: 'Kit 1', price: 99, quantity: 3 }],
      })

      useCartStore.getState().updateQuantity('kit-1', -1)

      expect(useCartStore.getState().items).toHaveLength(0)
    })

    it('should only update the specified item', () => {
      useCartStore.setState({
        items: [
          { slug: 'kit-1', name: 'Kit 1', price: 99, quantity: 1 },
          { slug: 'kit-2', name: 'Kit 2', price: 149, quantity: 2 },
        ],
      })

      useCartStore.getState().updateQuantity('kit-1', 10)

      const state = useCartStore.getState()
      expect(state.items[0].quantity).toBe(10)
      expect(state.items[1].quantity).toBe(2)
    })
  })

  describe('clearCart', () => {
    it('should remove all items from cart', () => {
      useCartStore.setState({
        items: [
          { slug: 'kit-1', name: 'Kit 1', price: 99, quantity: 1 },
          { slug: 'kit-2', name: 'Kit 2', price: 149, quantity: 2 },
        ],
      })

      useCartStore.getState().clearCart()

      expect(useCartStore.getState().items).toHaveLength(0)
    })

    it('should work on empty cart', () => {
      useCartStore.getState().clearCart()

      expect(useCartStore.getState().items).toHaveLength(0)
    })
  })

  describe('cart visibility', () => {
    it('should toggle cart open/closed', () => {
      expect(useCartStore.getState().isOpen).toBe(false)

      useCartStore.getState().toggleCart()
      expect(useCartStore.getState().isOpen).toBe(true)

      useCartStore.getState().toggleCart()
      expect(useCartStore.getState().isOpen).toBe(false)
    })

    it('should open cart', () => {
      useCartStore.getState().openCart()
      expect(useCartStore.getState().isOpen).toBe(true)
    })

    it('should close cart', () => {
      useCartStore.setState({ isOpen: true })
      useCartStore.getState().closeCart()
      expect(useCartStore.getState().isOpen).toBe(false)
    })
  })
})

describe('Cart Selectors', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], isOpen: false })
  })

  describe('selectCartTotal', () => {
    it('should return 0 for empty cart', () => {
      const state = useCartStore.getState()
      expect(selectCartTotal(state)).toBe(0)
    })

    it('should calculate total for single item', () => {
      useCartStore.setState({
        items: [{ slug: 'kit-1', name: 'Kit 1', price: 99, quantity: 2 }],
      })

      const state = useCartStore.getState()
      expect(selectCartTotal(state)).toBe(198)
    })

    it('should calculate total for multiple items', () => {
      useCartStore.setState({
        items: [
          { slug: 'kit-1', name: 'Kit 1', price: 99, quantity: 2 },
          { slug: 'kit-2', name: 'Kit 2', price: 50, quantity: 3 },
        ],
      })

      const state = useCartStore.getState()
      expect(selectCartTotal(state)).toBe(99 * 2 + 50 * 3) // 198 + 150 = 348
    })
  })

  describe('selectCartCount', () => {
    it('should return 0 for empty cart', () => {
      const state = useCartStore.getState()
      expect(selectCartCount(state)).toBe(0)
    })

    it('should return quantity for single item', () => {
      useCartStore.setState({
        items: [{ slug: 'kit-1', name: 'Kit 1', price: 99, quantity: 3 }],
      })

      const state = useCartStore.getState()
      expect(selectCartCount(state)).toBe(3)
    })

    it('should return total quantity across all items', () => {
      useCartStore.setState({
        items: [
          { slug: 'kit-1', name: 'Kit 1', price: 99, quantity: 2 },
          { slug: 'kit-2', name: 'Kit 2', price: 50, quantity: 5 },
        ],
      })

      const state = useCartStore.getState()
      expect(selectCartCount(state)).toBe(7)
    })
  })
})
