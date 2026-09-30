-- Seed the StarterSpark Robot Car kit
--
-- Specs, parts and dimensions come from the kit's CAD assembly
-- (StarterSpark-Animation/StarterSpark.blend, 70 parts, car frame in mm).
--
-- ============================================================================
-- PLACEHOLDER PRICE: price_cents = 6900 ($69.00) is a recommendation, not a
-- decision. Change it (here or in /admin) before setting status to 'active'.
-- ============================================================================
--
-- The product is seeded as 'draft' so it stays out of the shop listing until
-- the price and the items marked CONFIRM below have been checked.
--
-- CONFIRM before launch:
--   * Battery: the CAD models a holder (64.5 x 70.8 x 20.5 mm) but not the cell
--     type, so the copy says "battery holder" and cells are listed as not included.
--   * IR remote: the CAD has an IR receiver but no remote. The remote is not listed.
--   * Line sensor channel count: the CAD models it as a single 97 x 27 mm board.

INSERT INTO products (
  slug,
  name,
  description,
  price_cents,
  is_featured,
  status,
  specs
) VALUES (
  'robot-car',
  'The Robot Car',
  'Build a two-deck robot car that sees, follows lines and takes orders. Bolt together the acrylic chassis, wire up an Arduino Nano, a TB6612 motor driver and a pan-and-scan ultrasonic sensor, then write the code that makes it dodge walls, trace a black line and answer an IR remote. Every part is pre-cut, every screw has its place, and our step-by-step digital curriculum walks you from first bolt to first autonomous lap. Smart kits. Zero stress.',
  6900,
  false,
  'draft',
  '{
    "modelPath": "/assets/3d/car/car.glb",
    "category": "kit",
    "badge": "New",
    "learningOutcomes": [
      "Assemble a two-deck acrylic chassis with standoffs, brackets and threaded fasteners",
      "Drive two DC gear motors forward, back and through turns with a TB6612 H-bridge and PWM",
      "Measure distance with an HC-SR04 ultrasonic sensor and sweep it with an SG90 servo",
      "Follow a black line using an IR reflectance sensor array under the chassis",
      "Decode IR remote signals to steer the car by hand",
      "Draw faces and status icons on an 8×8 LED matrix",
      "Combine sensors into autonomous modes: obstacle avoidance and line following"
    ],
    "includedItems": [
      { "quantity": 1, "name": "Arduino Nano (ATmega328P)", "description": "The car''s brain. Programs over mini-USB from the Arduino IDE." },
      { "quantity": 1, "name": "Nano expansion shield", "description": "53 × 57 mm breakout with power, servo and sensor headers. No breadboard needed." },
      { "quantity": 1, "name": "TB6612FNG motor driver", "description": "Dual H-bridge that runs both drive motors with speed and direction control." },
      { "quantity": 2, "name": "6 V DC gear motors", "description": "Yellow TT-style gearmotors with mounting brackets and bolts." },
      { "quantity": 2, "name": "65 mm wheels", "description": "Rubber-tread wheels that press straight onto the motor shafts." },
      { "quantity": 1, "name": "Ball caster", "description": "Steel-ball third wheel for smooth turns, with bolts and nuts." },
      { "quantity": 1, "name": "HC-SR04 ultrasonic sensor", "description": "Distance sensing from 2 cm to 4 m, in a clear acrylic bracket." },
      { "quantity": 1, "name": "SG90 micro servo", "description": "Pans the ultrasonic sensor left and right to scan for obstacles." },
      { "quantity": 1, "name": "IR line-tracking sensor", "description": "Reflectance sensor board mounted under the chassis to follow a line." },
      { "quantity": 1, "name": "IR receiver module", "description": "Picks up commands from a standard IR remote." },
      { "quantity": 1, "name": "8×8 LED matrix", "description": "64 LEDs for expressions, arrows and status." },
      { "quantity": 2, "name": "Acrylic chassis plates", "description": "Pre-cut 136 × 150 mm lower and upper decks with raised frames that locate each module." },
      { "quantity": 4, "name": "Motor brackets", "description": "Acrylic uprights that clamp each motor to the lower deck." },
      { "quantity": 1, "name": "Battery holder", "description": "Mounts on the lower deck. Batteries not included." },
      { "quantity": 1, "name": "Hardware pack", "description": "4 × M3 30 mm hex standoffs, 8 spacers, 30 screws and bolts and 6 nuts." },
      { "quantity": 1, "name": "Digital curriculum", "description": "Step-by-step build guide, wiring diagrams and Arduino lessons." }
    ],
    "technicalSpecs": [
      { "label": "Microcontroller", "value": "Arduino Nano (ATmega328P, 16 MHz)" },
      { "label": "Motor Driver", "value": "TB6612FNG dual H-bridge" },
      { "label": "Drive", "value": "2× 6 V DC gear motors, differential steering + ball caster" },
      { "label": "Wheels", "value": "65 mm diameter, 164 mm track" },
      { "label": "Sensors", "value": "HC-SR04 ultrasonic (servo-panned), IR line tracker, IR receiver" },
      { "label": "Display", "value": "8×8 LED matrix" },
      { "label": "Chassis", "value": "Two 3 mm acrylic decks on 30 mm M3 standoffs" },
      { "label": "Dimensions", "value": "190 × 153 × 109 mm (W × L × H)" },
      { "label": "Parts", "value": "70 components, all fasteners included" },
      { "label": "Power", "value": "Onboard battery holder (batteries not included)" },
      { "label": "Programming", "value": "Arduino IDE over mini-USB" },
      { "label": "Build Time", "value": "~3 hours" },
      { "label": "Skill Level", "value": "Beginner friendly" }
    ]
  }'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Product photos (rendered from the CAD, served from /public)
INSERT INTO product_media (product_id, type, url, filename, alt_text, is_primary, sort_order)
SELECT p.id, 'image', m.url, m.filename, m.alt_text, m.is_primary, m.sort_order
FROM products p
CROSS JOIN (VALUES
  ('/assets/images/products/robot-car/hero.jpg',  'hero.jpg',  'The StarterSpark Robot Car, three-quarter front view', true,  0),
  ('/assets/images/products/robot-car/top.jpg',   'top.jpg',   'Top view of the upper deck: Arduino Nano shield, motor driver, LED matrix and IR receiver', false, 1),
  ('/assets/images/products/robot-car/side.jpg',  'side.jpg',  'Side view showing both decks, the gear motor and 65 mm wheel', false, 2),
  ('/assets/images/products/robot-car/front.jpg', 'front.jpg', 'Front view with the servo-mounted ultrasonic sensor', false, 3),
  ('/assets/images/products/robot-car/rear.jpg',  'rear.jpg',  'Rear three-quarter view', false, 4)
) AS m(url, filename, alt_text, is_primary, sort_order)
WHERE p.slug = 'robot-car'
  AND NOT EXISTS (
    SELECT 1 FROM product_media pm
    WHERE pm.product_id = p.id AND pm.url = m.url
  );
