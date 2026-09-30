-- Seed the StarterSpark Robot Car kit (ages 8-12; all structural parts are 3D printed)
--
-- Specs, parts and dimensions come from the kit's CAD assembly
-- (StarterSpark-Animation/StarterSpark.blend, 70 parts, car frame in mm).
--
-- ============================================================================
-- Price: $65.99, set by fea on 2026-09-29.
-- ============================================================================
--
-- The product is seeded as 'draft' so it stays out of the shop listing until
-- the price and the items marked CONFIRM below have been checked.
--
-- CONFIRM before launch:
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
  'Build your very own robot car and teach it to think! Screw together the 3D-printed chassis, bolt on the motors and wheels, and wire up a real Arduino Nano, the same tiny computer that engineers use. Then write the code that brings it to life. Your car can spot walls with its ultrasonic "eyes" and steer around them, follow a black line all by itself, show faces on its LED screen, and zoom around with the included IR remote. Our step-by-step guide walks you through every screw and every line of code, so you can go from box to driving robot in one afternoon. Smart kits. Zero stress.',
  6599,
  false,
  'draft',
  '{
    "modelPath": "/assets/3d/car/car.glb",
    "Filament Colors": "Black, Blue Grey",
    "category": "kit",
    "badge": "New",
    "learningOutcomes": [
      "Build a real robot from the wheels up, using screws, nuts and standoffs like an engineer",
      "Make motors drive forward, backward and spin in place",
      "Measure distance with sound, just like a bat, using the ultrasonic sensor",
      "Turn a servo to make your robot look left and right",
      "Teach your car to follow a black line all by itself",
      "Drive your car with the IR remote",
      "Draw smiley faces and arrows on the 8×8 LED screen",
      "Combine it all so your robot can explore and dodge obstacles on its own"
    ],
    "includedItems": [
      { "quantity": 1, "name": "Arduino Nano (ATmega328P)", "description": "The car''s brain. Programs over mini-USB from the Arduino IDE." },
      { "quantity": 1, "name": "Nano expansion shield", "description": "53 × 57 mm breakout with power, servo and sensor headers. No breadboard needed." },
      { "quantity": 1, "name": "TB6612FNG motor driver", "description": "Dual H-bridge that runs both drive motors with speed and direction control." },
      { "quantity": 2, "name": "6 V DC gear motors", "description": "Yellow TT-style gearmotors with mounting brackets and bolts." },
      { "quantity": 2, "name": "65 mm wheels", "description": "Rubber-tread wheels that press straight onto the motor shafts." },
      { "quantity": 1, "name": "Ball caster", "description": "Steel-ball third wheel for smooth turns, with bolts and nuts." },
      { "quantity": 1, "name": "HC-SR04 ultrasonic sensor", "description": "Your robot''s \"eyes\". Measures distance from 2 cm to 4 m and sits in a 3D-printed bracket." },
      { "quantity": 1, "name": "SG90 micro servo", "description": "Pans the ultrasonic sensor left and right to scan for obstacles." },
      { "quantity": 1, "name": "IR line-tracking sensor", "description": "Reflectance sensor board mounted under the chassis to follow a line." },
      { "quantity": 1, "name": "IR receiver module", "description": "Picks up commands from the included IR remote." },
      { "quantity": 1, "name": "IR remote", "description": "Drive the car by hand and switch between modes." },
      { "quantity": 1, "name": "8×8 LED matrix", "description": "64 LEDs for expressions, arrows and status." },
      { "quantity": 2, "name": "3D-printed chassis decks", "description": "Lower and upper decks (136 × 150 mm) with built-in frames that show you where each part goes." },
      { "quantity": 4, "name": "3D-printed motor brackets", "description": "Hold each motor snugly against the lower deck." },
      { "quantity": 1, "name": "4× AA battery holder", "description": "Mounts on the lower deck. AA batteries not included." },
      { "quantity": 1, "name": "Hardware pack", "description": "4 × M3 30 mm hex standoffs, 8 spacers, 30 screws and bolts and 6 nuts." },
      { "quantity": 1, "name": "Mini M3 Allen key", "description": "Fits every socket-cap screw in the kit. A full-size hex key of your own makes the build easier." },
      { "quantity": 1, "name": "Mini screwdriver", "description": "For the small module screws. We recommend using your own full-size screwdriver if you have one." },
      { "quantity": 1, "name": "Digital curriculum", "description": "Step-by-step build guide, wiring diagrams and Arduino lessons." }
    ],
    "technicalSpecs": [
      { "label": "Microcontroller", "value": "Arduino Nano (ATmega328P, 16 MHz)" },
      { "label": "Motor Driver", "value": "TB6612FNG dual H-bridge" },
      { "label": "Drive", "value": "2× 6 V DC gear motors, differential steering + ball caster" },
      { "label": "Wheels", "value": "65 mm diameter, 164 mm track" },
      { "label": "Sensors", "value": "HC-SR04 ultrasonic (servo-panned), IR line tracker, IR receiver + remote" },
      { "label": "Display", "value": "8×8 LED matrix" },
      { "label": "Chassis", "value": "Two 3D-printed decks on 30 mm M3 standoffs" },
      { "label": "Dimensions", "value": "190 × 153 × 109 mm (W × L × H)" },
      { "label": "Parts", "value": "70 components, all fasteners included" },
      { "label": "Power", "value": "4× AA battery holder (batteries not included)" },
      { "label": "Programming", "value": "Arduino IDE over mini-USB" },
      { "label": "Tools", "value": "Mini M3 Allen key and screwdriver included" },
      { "label": "Build Time", "value": "~3 hours" },
      { "label": "Skill Level", "value": "Beginner friendly" },
      { "label": "Ages", "value": "8–12" }
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
