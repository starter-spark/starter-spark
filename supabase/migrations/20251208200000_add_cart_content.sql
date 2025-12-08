-- Add content keys for the Cart page

INSERT INTO site_content (content_key, content_type, content, default_value, description, category, sort_order) VALUES
-- Page header
('cart.title', 'text', 'Your Cart', 'Your Cart', 'Cart page title', 'cart', 0),
('cart.continueShipping', 'text', 'Continue Shopping', 'Continue Shopping', 'Continue shopping link text', 'cart', 1),

-- Empty state
('cart.empty.title', 'text', 'Your cart is empty', 'Your cart is empty', 'Empty cart title', 'cart', 10),
('cart.empty.description', 'text', 'Looks like you haven''t added any kits yet. Browse our collection to get started on your robotics journey.', 'Looks like you haven''t added any kits yet.', 'Empty cart description', 'cart', 11),
('cart.empty.cta', 'text', 'Browse Kits', 'Browse Kits', 'Empty cart CTA button', 'cart', 12),

-- Order summary
('cart.summary.title', 'text', 'Order Summary', 'Order Summary', 'Order summary section title', 'cart', 20),
('cart.summary.subtotal', 'text', 'Subtotal', 'Subtotal', 'Subtotal label', 'cart', 21),
('cart.summary.savings', 'text', 'Your Savings', 'Your Savings', 'Savings label', 'cart', 22),
('cart.summary.shipping', 'text', 'Shipping', 'Shipping', 'Shipping label', 'cart', 23),
('cart.summary.total', 'text', 'Total', 'Total', 'Total label', 'cart', 24),
('cart.summary.freeShippingHint', 'text', 'Add ${amount} more for free shipping', 'Add more for free shipping', 'Free shipping threshold hint', 'cart', 25),

-- Checkout
('cart.checkout.button', 'text', 'Checkout', 'Checkout', 'Checkout button text', 'cart', 30),
('cart.checkout.processing', 'text', 'Processing...', 'Processing...', 'Checkout processing text', 'cart', 31),

-- Trust signals
('cart.trust.freeShipping', 'text', 'Free shipping on orders $75+', 'Free shipping on orders $75+', 'Free shipping trust signal', 'cart', 40),
('cart.trust.secureCheckout', 'text', 'Secure checkout with Stripe', 'Secure checkout with Stripe', 'Secure checkout trust signal', 'cart', 41),

-- Charity notice
('cart.charity.notice', 'text', '70% of your purchase supports Hawaii STEM education.', '70% of your purchase supports Hawaii STEM education.', 'Charity notice text', 'cart', 50),
('cart.charity.percentage', 'text', '70%', '70%', 'Charity percentage highlight', 'cart', 51)

ON CONFLICT (content_key) DO UPDATE SET
  content = EXCLUDED.content,
  default_value = EXCLUDED.default_value,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;
