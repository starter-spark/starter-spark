import { z } from 'zod'

/**
 * The CMS registry: the single source of truth for every content type.
 *
 * Developers define the vocabulary here (closed schema); admins create,
 * edit, reorder, draft, and publish entries freely (open content). From one
 * definition we derive write validation, the admin form, TypeScript types,
 * and seed defaults — so a key can never exist in code but not in the admin,
 * and defaults can never fork from the schema.
 */

export type FieldWidget =
  | 'input'
  | 'textarea'
  | 'number'
  | 'checkbox'
  | 'select'
  | 'datetime'

/** ISO timestamp or empty string; the admin edits it as a local datetime. */
const optionalInstant = () =>
  z
    .string()
    .default('')
    .refine((v) => v === '' || !Number.isNaN(Date.parse(v)), {
      message: 'Invalid date',
    })

export interface FieldDef {
  schema: z.ZodType
  label: string
  widget: FieldWidget
  help?: string
  /** For widget 'select' */
  options?: { value: string; label: string }[]
  /**
   * Cross-collection reference: the value is an entry key of another type.
   * Rendered as a select whose options are that collection's live entries;
   * a non-empty value must exist to save, and publishing requires one.
   */
  reference?: { type: string; labelField: string }
}

export interface TypeDef {
  kind: 'singleton' | 'collection'
  label: string
  description: string
  fields: Record<string, FieldDef>
  /** Which fields show as columns in the admin list view (collections) */
  listFields?: string[]
  /** Whether admins can drag-reorder entries (collections) */
  orderable?: boolean
  /**
   * Keyed collections: the admin supplies the key at creation (it is the
   * public URL slug) instead of getting a generated one.
   */
  keyed?: boolean
  /** Documents of this type can carry uploaded file attachments. */
  attachments?: boolean
}

export const cmsRegistry = {
  settings_commerce: {
    kind: 'singleton',
    label: 'Commerce Settings',
    description:
      'Operational commerce values. Code computes with these (checkout math and copy read the same source).',
    fields: {
      freeShippingThresholdCents: {
        schema: z.number().int().min(0).default(7500),
        label: 'Free shipping threshold (cents)',
        widget: 'number',
        help: 'Orders at or above this subtotal ship free. 7500 = $75.00',
      },
      shippingRateCents: {
        schema: z.number().int().min(0).default(999),
        label: 'Shipping rate (cents)',
        widget: 'number',
        help: 'Flat shipping charged below the threshold. 999 = $9.99',
      },
    },
  },
  impact_stat: {
    kind: 'collection',
    label: 'Impact Stats',
    description:
      'Stats shown in the homepage impact strip. Insert as many as you like; the strip renders every visible entry in order.',
    fields: {
      label: {
        schema: z.string().min(1).max(80),
        label: 'Label',
        widget: 'input',
      },
      value: {
        schema: z.string().max(20),
        label: 'Value',
        widget: 'input',
        help: 'Ignored when an auto source is set',
      },
      suffix: {
        schema: z.string().max(10).default(''),
        label: 'Suffix',
        widget: 'input',
        help: 'e.g. "+" or "%"',
      },
      autoSource: {
        schema: z
          .enum(['none', 'licenses_count', 'events_count'])
          .default('none'),
        label: 'Auto-calculated from',
        widget: 'select',
        options: [
          { value: 'none', label: 'Not auto-calculated' },
          { value: 'licenses_count', label: 'Claimed licenses count' },
          { value: 'events_count', label: 'Past events count' },
        ],
      },
      visible: {
        schema: z.boolean().default(true),
        label: 'Visible',
        widget: 'checkbox',
      },
    },
    listFields: ['label', 'value', 'autoSource', 'visible'],
    orderable: true,
  },
  home_hero: {
    kind: 'singleton',
    label: 'Homepage · Hero',
    description: 'The big opening section at the top of the homepage.',
    fields: {
      taglineTop: {
        schema: z.string().min(1).max(200).default('Shipping only to Hawaii'),
        label: 'Top tagline',
        widget: 'input',
      },
      headline: {
        schema: z
          .string()
          .min(1)
          .max(200)
          .default("Start here.\nFigure it out.\nWe'll help."),
        label: 'Headline',
        widget: 'textarea',
        help: 'Line breaks render as separate lines',
      },
      subheadline: {
        schema: z.string().min(1).max(200).default("That's the whole point."),
        label: 'Subheadline',
        widget: 'input',
      },
      taglineBottom: {
        schema: z
          .string()
          .min(1)
          .max(200)
          .default('Open Source Hardware • Affordable • For Hawaii'),
        label: 'Bottom tagline',
        widget: 'input',
      },
      ctaPrimary: {
        schema: z.string().min(1).max(80).default('Shop Kits'),
        label: 'Primary button',
        widget: 'input',
      },
      ctaSecondary: {
        schema: z.string().min(1).max(80).default('Explore Free Courses'),
        label: 'Secondary button',
        widget: 'input',
      },
    },
  },
  home_mission: {
    kind: 'singleton',
    label: 'Homepage · Mission',
    description: 'The "More Than a Kit" story section on the homepage.',
    fields: {
      title: {
        schema: z.string().min(1).max(200).default('More Than a Kit'),
        label: 'Title',
        widget: 'input',
      },
      subtitle: {
        schema: z
          .string()
          .min(1)
          .max(2000)
          .default(
            'We built this because we wanted it to exist. Everything we make is designed for students who are just starting out.',
          ),
        label: 'Subtitle',
        widget: 'textarea',
      },
      story1: {
        schema: z
          .string()
          .min(1)
          .max(2000)
          .default(
            'A lot of testing, clogged up printers and prototypes under our desks, and eventually something that works!',
          ),
        label: 'Story paragraph 1',
        widget: 'textarea',
      },
      story2: {
        schema: z
          .string()
          .min(1)
          .max(2000)
          .default(
            'Every kit we ship has been tested by real students. Not just us. We bring the kits to schools and run workshops to figure out what breaks and what works. The stuff that makes it into the kit is what actually survived that process.',
          ),
        label: 'Story paragraph 2',
        widget: 'textarea',
      },
      commitmentTitle: {
        schema: z.string().min(1).max(200).default('Open Source'),
        label: 'Commitment title',
        widget: 'input',
      },
      commitmentText: {
        schema: z
          .string()
          .min(1)
          .max(2000)
          .default(
            "Hardware schematics, 3D print files, and curriculum are all open source. You can download everything for free on each kit's shop page. You don't need to buy the kit to use what we built, but it'll save you a lot of time :)",
          ),
        label: 'Commitment text',
        widget: 'textarea',
      },
      commitmentSubtext: {
        schema: z
          .string()
          .min(1)
          .max(200)
          .default('If you want to build it yourself, go for it.'),
        label: 'Commitment subtext',
        widget: 'input',
      },
    },
  },
  home_differentiators: {
    kind: 'singleton',
    label: 'Homepage · Why StarterSpark',
    description:
      'Heading for the "why us" section. The cards themselves are the Differentiator Cards collection.',
    fields: {
      title: {
        schema: z.string().min(1).max(200).default('Why StarterSpark?'),
        label: 'Title',
        widget: 'input',
      },
      description: {
        schema: z
          .string()
          .min(1)
          .max(2000)
          .default('We built the kit we wished existed when we were kids.'),
        label: 'Description',
        widget: 'textarea',
      },
    },
  },
  differentiator_card: {
    kind: 'collection',
    label: 'Differentiator Cards',
    description:
      'The "why us" cards on the homepage. Insert as many as you like; the grid renders every visible card in order.',
    fields: {
      title: {
        schema: z.string().min(1).max(200),
        label: 'Title',
        widget: 'input',
      },
      description: {
        schema: z.string().min(1).max(2000),
        label: 'Description',
        widget: 'textarea',
      },
      icon: {
        schema: z
          .enum([
            'package',
            'graduation-cap',
            'users',
            'map-pin',
            'wrench',
            'heart',
            'zap',
            'shield',
          ])
          .default('package'),
        label: 'Icon',
        widget: 'select',
        options: [
          { value: 'package', label: 'Package' },
          { value: 'graduation-cap', label: 'Graduation cap' },
          { value: 'users', label: 'People' },
          { value: 'map-pin', label: 'Map pin' },
          { value: 'wrench', label: 'Wrench' },
          { value: 'heart', label: 'Heart' },
          { value: 'zap', label: 'Lightning' },
          { value: 'shield', label: 'Shield' },
        ],
      },
      visible: {
        schema: z.boolean().default(true),
        label: 'Visible',
        widget: 'checkbox',
      },
    },
    listFields: ['title', 'icon', 'visible'],
    orderable: true,
  },
  team_member: {
    kind: 'collection',
    label: 'Team Members',
    description:
      'Profiles shown on the About page, in order. Hide someone with the visible toggle instead of deleting them.',
    fields: {
      name: {
        schema: z.string().min(1).max(120),
        label: 'Name',
        widget: 'input',
      },
      role: {
        schema: z.string().min(1).max(120),
        label: 'Role',
        widget: 'input',
      },
      bio: {
        schema: z.string().max(2000).default(''),
        label: 'Bio',
        widget: 'textarea',
      },
      imageUrl: {
        schema: z.string().max(500).default(''),
        label: 'Photo URL',
        widget: 'input',
        help: 'Link to a hosted photo; empty shows the initials avatar',
      },
      githubUrl: {
        schema: z.string().max(300).default(''),
        label: 'GitHub URL',
        widget: 'input',
      },
      linkedinUrl: {
        schema: z.string().max(300).default(''),
        label: 'LinkedIn URL',
        widget: 'input',
      },
      twitterUrl: {
        schema: z.string().max(300).default(''),
        label: 'Twitter/X URL',
        widget: 'input',
      },
      visible: {
        schema: z.boolean().default(true),
        label: 'Visible',
        widget: 'checkbox',
      },
    },
    listFields: ['name', 'role', 'visible'],
    orderable: true,
  },
  banner: {
    kind: 'collection',
    label: 'Banners',
    description:
      'Site-wide announcement bars. Scheduling, page targeting, and dismissal are all per-banner.',
    fields: {
      title: {
        schema: z.string().min(1).max(200),
        label: 'Title',
        widget: 'input',
        help: 'Internal label; not shown on the site',
      },
      message: {
        schema: z.string().min(1).max(500),
        label: 'Message',
        widget: 'input',
      },
      colorScheme: {
        schema: z
          .enum([
            'info',
            'warning',
            'success',
            'error',
            'sale',
            'promo',
            'announcement',
            'gift',
          ])
          .default('info'),
        label: 'Style',
        widget: 'select',
        options: [
          { value: 'info', label: 'Info (cyan)' },
          { value: 'warning', label: 'Warning (amber)' },
          { value: 'success', label: 'Success (green)' },
          { value: 'error', label: 'Error (red)' },
          { value: 'sale', label: 'Sale (rose)' },
          { value: 'promo', label: 'Promo (violet)' },
          { value: 'announcement', label: 'Announcement (slate)' },
          { value: 'gift', label: 'Gift (emerald)' },
        ],
      },
      linkText: {
        schema: z.string().max(100).default(''),
        label: 'Link text',
        widget: 'input',
      },
      linkUrl: {
        schema: z.string().max(500).default(''),
        label: 'Link URL',
        widget: 'input',
      },
      dismissible: {
        schema: z.boolean().default(true),
        label: 'Dismissible',
        widget: 'checkbox',
      },
      dismissHours: {
        schema: z.number().int().min(0).default(0),
        label: 'Reappear after (hours)',
        widget: 'number',
        help: '0 = a dismissed banner stays dismissed forever',
      },
      pages: {
        schema: z.string().min(1).default('*'),
        label: 'Pages',
        widget: 'input',
        help: '"*" for every page, or comma-separated paths like /shop, /cart',
      },
      startsAt: {
        schema: optionalInstant(),
        label: 'Starts at',
        widget: 'datetime',
        help: 'Empty = immediately',
      },
      endsAt: {
        schema: optionalInstant(),
        label: 'Ends at',
        widget: 'datetime',
        help: 'Empty = never',
      },
      visible: {
        schema: z.boolean().default(true),
        label: 'Visible',
        widget: 'checkbox',
      },
    },
    listFields: ['title', 'colorScheme', 'visible'],
    orderable: true,
  },
  home_learning: {
    kind: 'singleton',
    label: 'Homepage · How It Works',
    description: 'The two-block learning walkthrough on the homepage.',
    fields: {
      title: {
        schema: z.string().min(1).max(200).default('How It Works'),
        label: 'Title',
        widget: 'input',
      },
      description: {
        schema: z
          .string()
          .min(1)
          .max(2000)
          .default(
            'The platform walks you through the whole thing, from when you open the box all the way to running your first program.',
          ),
        label: 'Description',
        widget: 'textarea',
      },
      block1Title: {
        schema: z
          .string()
          .min(1)
          .max(200)
          .default('Step-by-Step Digital Guides'),
        label: 'Block 1 title',
        widget: 'input',
      },
      block1Description1: {
        schema: z
          .string()
          .min(1)
          .max(2000)
          .default(
            'Each lesson builds on the last, taking you from basic assembly through advanced programming. Our interactive diagrams show exactly where each wire connects, and you can hover over components to learn what they do.',
          ),
        label: 'Block 1 paragraph 1',
        widget: 'textarea',
      },
      block1Description2: {
        schema: z
          .string()
          .min(1)
          .max(2000)
          .default(
            'The built-in code editor lets you write, test, and upload your programs directly from the browser. Real-time syntax highlighting and error checking help you learn proper coding practices from day one.',
          ),
        label: 'Block 1 paragraph 2',
        widget: 'textarea',
      },
      block1Cta: {
        schema: z.string().min(1).max(80).default('Start Learning'),
        label: 'Block 1 button',
        widget: 'input',
      },
      block2Title: {
        schema: z
          .string()
          .min(1)
          .max(200)
          .default('Expert Support When You Need It'),
        label: 'Block 2 title',
        widget: 'input',
      },
      block2Description1: {
        schema: z
          .string()
          .min(1)
          .max(2000)
          .default(
            'Stuck on a step? Our community forum, The Lab, connects you with fellow builders and our support team. Most questions get answered within hours, not days.',
          ),
        label: 'Block 2 paragraph 1',
        widget: 'textarea',
      },
      block2Description2: {
        schema: z
          .string()
          .min(1)
          .max(2000)
          .default(
            'Staff members check in on discussions regularly and reply to questions. Most people hear back the same day.',
          ),
        label: 'Block 2 paragraph 2',
        widget: 'textarea',
      },
      block2Cta: {
        schema: z.string().min(1).max(80).default('Visit The Lab'),
        label: 'Block 2 button',
        widget: 'input',
      },
    },
  },
  home_community: {
    kind: 'singleton',
    label: 'Homepage · Community',
    description:
      'The homepage section previewing upcoming workshops and The Lab.',
    fields: {
      title: {
        schema: z.string().min(1).max(200).default('Workshops & The Lab'),
        label: 'Title',
        widget: 'input',
      },
      description: {
        schema: z
          .string()
          .min(1)
          .max(2000)
          .default(
            "We run in-person workshops across Hawaii, and we have an online forum called The Lab where people ask questions and share what they're working on.",
          ),
        label: 'Description',
        widget: 'textarea',
      },
      workshopsTitle: {
        schema: z.string().min(1).max(200).default('Upcoming Workshops'),
        label: 'Workshops title',
        widget: 'input',
      },
      workshopsViewAll: {
        schema: z.string().min(1).max(80).default('View All'),
        label: 'Workshops "view all" link',
        widget: 'input',
      },
      workshopsEmptyTitle: {
        schema: z.string().min(1).max(200).default('No Upcoming Events'),
        label: 'Workshops empty title',
        widget: 'input',
      },
      workshopsEmptyDescription: {
        schema: z
          .string()
          .min(1)
          .max(2000)
          .default(
            'Check back soon for new workshops and events in your area.',
          ),
        label: 'Workshops empty description',
        widget: 'textarea',
      },
      workshopsEmptyCta: {
        schema: z.string().min(1).max(80).default('View Past Events'),
        label: 'Workshops empty button',
        widget: 'input',
      },
      workshopsCta: {
        schema: z.string().min(1).max(80).default('Register for a Workshop'),
        label: 'Workshops button',
        widget: 'input',
      },
      workshopsCtaEmpty: {
        schema: z.string().min(1).max(80).default('View All Events'),
        label: 'Workshops button (no events)',
        widget: 'input',
      },
      labTitle: {
        schema: z.string().min(1).max(200).default('The Lab'),
        label: 'Lab title',
        widget: 'input',
      },
      labJoinNow: {
        schema: z.string().min(1).max(80).default('Join Now'),
        label: 'Lab "join now" link',
        widget: 'input',
      },
      labMembersLabel: {
        schema: z.string().min(1).max(80).default('Members'),
        label: 'Lab members label',
        widget: 'input',
      },
      labDiscussionsLabel: {
        schema: z.string().min(1).max(80).default('Discussions'),
        label: 'Lab discussions label',
        widget: 'input',
      },
      labEmptyTitle: {
        schema: z.string().min(1).max(200).default('Be the First to Ask'),
        label: 'Lab empty title',
        widget: 'input',
      },
      labEmptyDescription: {
        schema: z
          .string()
          .min(1)
          .max(2000)
          .default(
            'Start a discussion and help build our community of makers.',
          ),
        label: 'Lab empty description',
        widget: 'textarea',
      },
      labEmptyCta: {
        schema: z.string().min(1).max(80).default('Ask a Question'),
        label: 'Lab empty button',
        widget: 'input',
      },
      labCta: {
        schema: z.string().min(1).max(80).default('Join The Lab'),
        label: 'Lab button',
        widget: 'input',
      },
    },
  },
  shop_page: {
    kind: 'singleton',
    label: 'Shop page',
    description: 'Header copy and empty state for the shop listing.',
    fields: {
      headerTitle: {
        schema: z.string().min(1).max(200).default('Shop'),
        label: 'Header title',
        widget: 'input',
      },
      headerDescription: {
        schema: z
          .string()
          .min(1)
          .max(2000)
          .default(
            'Hardware kits you actually build yourself. No prior experience needed.',
          ),
        label: 'Header description',
        widget: 'textarea',
      },
      empty: {
        schema: z
          .string()
          .min(1)
          .max(500)
          .default('No products available at this time.'),
        label: 'Empty state',
        widget: 'input',
      },
    },
  },
  community_page: {
    kind: 'singleton',
    label: 'Community page',
    description: 'Header copy and empty state for The Lab.',
    fields: {
      headerTitle: {
        schema: z.string().min(1).max(200).default('The Lab'),
        label: 'Header title',
        widget: 'input',
      },
      headerDescription: {
        schema: z
          .string()
          .min(1)
          .max(2000)
          .default(
            "Ask questions, share what you're building, and get help when you're stuck.",
          ),
        label: 'Header description',
        widget: 'textarea',
      },
      empty: {
        schema: z
          .string()
          .min(1)
          .max(500)
          .default('No discussions yet. Be the first to ask a question!'),
        label: 'Empty state',
        widget: 'input',
      },
    },
  },
  events_page: {
    kind: 'singleton',
    label: 'Events page',
    description: 'Header copy and empty state for the events listing.',
    fields: {
      headerTitle: {
        schema: z.string().min(1).max(200).default('Events'),
        label: 'Header title',
        widget: 'input',
      },
      headerDescription: {
        schema: z
          .string()
          .min(1)
          .max(2000)
          .default(
            'We run hands-on workshops and competitions across Hawaii if you want to come out and build something with other people.',
          ),
        label: 'Header description',
        widget: 'textarea',
      },
      empty: {
        schema: z
          .string()
          .min(1)
          .max(500)
          .default(
            'No upcoming events. Check back soon for new workshops and events!',
          ),
        label: 'Empty state',
        widget: 'input',
      },
    },
  },
  cart_page: {
    kind: 'singleton',
    label: 'Cart page',
    description: 'All cart copy: headings, summary labels, and trust lines.',
    fields: {
      title: {
        schema: z.string().min(1).max(200).default('Your Cart'),
        label: 'Title',
        widget: 'input',
      },
      continueShopping: {
        schema: z.string().min(1).max(80).default('Continue Shopping'),
        label: '"Continue shopping" link',
        widget: 'input',
      },
      emptyTitle: {
        schema: z.string().min(1).max(200).default('Your cart is empty'),
        label: 'Empty cart title',
        widget: 'input',
      },
      emptyDescription: {
        schema: z
          .string()
          .min(1)
          .max(2000)
          .default(
            "Looks like you haven't added anything yet. Check out the kits and see what's inside.",
          ),
        label: 'Empty cart description',
        widget: 'textarea',
      },
      emptyCta: {
        schema: z.string().min(1).max(80).default('Browse Kits'),
        label: 'Empty cart button',
        widget: 'input',
      },
      summaryTitle: {
        schema: z.string().min(1).max(200).default('Order Summary'),
        label: 'Summary title',
        widget: 'input',
      },
      subtotalLabel: {
        schema: z.string().min(1).max(80).default('Subtotal'),
        label: 'Subtotal label',
        widget: 'input',
      },
      savingsLabel: {
        schema: z.string().min(1).max(80).default('Your Savings'),
        label: 'Savings label',
        widget: 'input',
      },
      shippingLabel: {
        schema: z.string().min(1).max(80).default('Shipping'),
        label: 'Shipping label',
        widget: 'input',
      },
      totalLabel: {
        schema: z.string().min(1).max(80).default('Total'),
        label: 'Total label',
        widget: 'input',
      },
      freeShippingHint: {
        schema: z
          .string()
          .min(1)
          .max(200)
          .default('Add {amount} more for free shipping'),
        label: 'Free shipping hint',
        widget: 'input',
        help: '{amount} is replaced with the remaining dollar amount, e.g. $12.50',
      },
      checkoutButton: {
        schema: z.string().min(1).max(80).default('Checkout'),
        label: 'Checkout button',
        widget: 'input',
      },
      processingText: {
        schema: z.string().min(1).max(80).default('Processing...'),
        label: 'Checkout processing text',
        widget: 'input',
      },
      trustFreeShipping: {
        schema: z
          .string()
          .min(1)
          .max(200)
          .default('Free shipping on orders $75+'),
        label: 'Trust line: shipping',
        widget: 'input',
      },
      trustSecureCheckout: {
        schema: z
          .string()
          .min(1)
          .max(200)
          .default('Secure checkout with Stripe'),
        label: 'Trust line: checkout',
        widget: 'input',
      },
    },
  },
  workshop_page: {
    kind: 'singleton',
    label: 'Workshop page',
    description: 'All copy on the signed-in workshop hub.',
    fields: {
      headerTitle: {
        schema: z.string().min(1).max(200).default('Workshop'),
        label: 'Header title',
        widget: 'input',
      },
      headerDescription: {
        schema: z
          .string()
          .min(1)
          .max(2000)
          .default(
            'Your personal robotics workspace. Track progress, access tools, and manage your kits.',
          ),
        label: 'Header description',
        widget: 'textarea',
      },
      headerDescriptionSignedOut: {
        schema: z
          .string()
          .min(1)
          .max(2000)
          .default('Sign in to access your kits and learning materials.'),
        label: 'Header description (signed out)',
        widget: 'textarea',
      },
      noKits: {
        schema: z
          .string()
          .min(1)
          .max(500)
          .default(
            "You don't have any kits yet. Purchase a kit to get started!",
          ),
        label: 'No kits message',
        widget: 'input',
      },
      signInTitle: {
        schema: z.string().min(1).max(200).default('Sign In Required'),
        label: 'Sign-in title',
        widget: 'input',
      },
      signInDescription: {
        schema: z
          .string()
          .min(1)
          .max(2000)
          .default(
            'Sign in to view your kits, track your learning progress, and claim new kit codes.',
          ),
        label: 'Sign-in description',
        widget: 'textarea',
      },
      signInButton: {
        schema: z.string().min(1).max(80).default('Sign In'),
        label: 'Sign-in button',
        widget: 'input',
      },
      signInShopButton: {
        schema: z.string().min(1).max(80).default('Shop Kits'),
        label: 'Sign-in shop button',
        widget: 'input',
      },
      kitsTitle: {
        schema: z.string().min(1).max(200).default('My Kits'),
        label: 'Kits title',
        widget: 'input',
      },
      kitsEmptySubtitle: {
        schema: z
          .string()
          .min(1)
          .max(500)
          .default('Purchase a kit or enter a code to get started.'),
        label: 'Kits empty subtitle',
        widget: 'input',
      },
      kitsEmptyCta: {
        schema: z.string().min(1).max(80).default('Browse Kits'),
        label: 'Kits empty button',
        widget: 'input',
      },
      claimTitle: {
        schema: z.string().min(1).max(200).default('Claim a Kit'),
        label: 'Claim title',
        widget: 'input',
      },
      claimDescription: {
        schema: z
          .string()
          .min(1)
          .max(2000)
          .default('Have a kit code? Enter it below to activate your kit.'),
        label: 'Claim description',
        widget: 'textarea',
      },
      pendingTitle: {
        schema: z.string().min(1).max(200).default('Pending Licenses'),
        label: 'Pending licenses title',
        widget: 'input',
      },
      pendingDescription: {
        schema: z
          .string()
          .min(1)
          .max(2000)
          .default(
            "These licenses were purchased with your email. Claim to add to your account or reject if you didn't make this purchase.",
          ),
        label: 'Pending licenses description',
        widget: 'textarea',
      },
      coursesEmpty: {
        schema: z
          .string()
          .min(1)
          .max(500)
          .default('No courses available yet. Check back soon!'),
        label: 'Courses empty state',
        widget: 'input',
      },
    },
  },
  footer: {
    kind: 'singleton',
    label: 'Footer',
    description: 'Sitewide footer copy.',
    fields: {
      tagline: {
        schema: z
          .string()
          .min(1)
          .max(500)
          .default('Robotics kits for people who are just starting out.'),
        label: 'Brand tagline',
        widget: 'input',
      },
      copyright: {
        schema: z
          .string()
          .min(1)
          .max(200)
          .default('© 2025-2026 StarterSpark Robotics. All rights reserved.'),
        label: 'Copyright line',
        widget: 'input',
      },
      newsletterTitle: {
        schema: z.string().min(1).max(200).default('Stay Updated'),
        label: 'Newsletter title',
        widget: 'input',
      },
      newsletterDescription: {
        schema: z
          .string()
          .min(1)
          .max(500)
          .default('Get notified about new kits and workshops.'),
        label: 'Newsletter description',
        widget: 'input',
      },
    },
  },
  page: {
    kind: 'collection',
    label: 'Pages',
    description:
      'Standalone markdown pages. The entry key is the URL slug: privacy and terms render at /privacy and /terms, everything else at /p/{slug}.',
    keyed: true,
    fields: {
      title: {
        schema: z.string().min(1).max(200),
        label: 'Title',
        widget: 'input',
      },
      body: {
        schema: z.string().min(1).max(50000),
        label: 'Body',
        widget: 'textarea',
        help: 'Markdown. Headings (##) become the table of contents.',
      },
      seoTitle: {
        schema: z.string().max(200).default(''),
        label: 'SEO title',
        widget: 'input',
        help: 'Optional; the page title is used when empty',
      },
      seoDescription: {
        schema: z.string().max(500).default(''),
        label: 'SEO description',
        widget: 'textarea',
      },
      showLastUpdated: {
        schema: z.boolean().default(true),
        label: 'Show "last updated" date',
        widget: 'checkbox',
      },
    },
    listFields: ['title'],
  },
  doc_category: {
    kind: 'collection',
    label: 'Docs · Categories',
    description:
      'Documentation sections. The entry key is the URL slug: each category lists its articles at /docs/{slug}.',
    keyed: true,
    fields: {
      name: {
        schema: z.string().min(1).max(120),
        label: 'Name',
        widget: 'input',
      },
      description: {
        schema: z.string().max(500).default(''),
        label: 'Description',
        widget: 'textarea',
      },
      icon: {
        schema: z
          .enum(['Rocket', 'Cpu', 'Zap', 'Wrench', 'Book', 'BookOpen'])
          .default('BookOpen'),
        label: 'Icon',
        widget: 'select',
        options: [
          { value: 'Rocket', label: 'Rocket' },
          { value: 'Cpu', label: 'Chip' },
          { value: 'Zap', label: 'Lightning' },
          { value: 'Wrench', label: 'Wrench' },
          { value: 'Book', label: 'Book' },
          { value: 'BookOpen', label: 'Open book' },
        ],
      },
    },
    listFields: ['name', 'icon'],
    orderable: true,
  },
  doc_page: {
    kind: 'collection',
    label: 'Docs · Articles',
    description:
      'Documentation articles. The entry key is the URL slug: articles render at /docs/{category}/{slug}.',
    keyed: true,
    attachments: true,
    fields: {
      title: {
        schema: z.string().min(1).max(200),
        label: 'Title',
        widget: 'input',
      },
      category: {
        schema: z.string().default(''),
        label: 'Category',
        widget: 'select',
        reference: { type: 'doc_category', labelField: 'name' },
        help: 'A draft can be uncategorized; publishing requires a category',
      },
      excerpt: {
        schema: z.string().max(500).default(''),
        label: 'Excerpt',
        widget: 'textarea',
        help: 'Short summary shown in category lists and search results',
      },
      body: {
        schema: z.string().max(100000).default(''),
        label: 'Body',
        widget: 'textarea',
        help: 'Markdown. Empty shows a "being written" placeholder.',
      },
    },
    listFields: ['title', 'category'],
    orderable: true,
  },
  about_page: {
    kind: 'singleton',
    label: 'About page',
    description: 'Hero copy and the story section of the About page.',
    fields: {
      heroHeadline: {
        schema: z
          .string()
          .min(1)
          .max(200)
          .default("Robotics education shouldn't have a $200 entry fee."),
        label: 'Hero headline',
        widget: 'input',
      },
      heroDescription: {
        schema: z
          .string()
          .min(1)
          .max(2000)
          .default(
            "We're a student-run team based in Honolulu making hardware kits you actually build yourself, no experience required, no high markups. If you can follow a wiring diagram, you can start here.",
          ),
        label: 'Hero description',
        widget: 'textarea',
      },
      story: {
        schema: z
          .string()
          .min(1)
          .max(20000)
          .default(
            "## How it started\n\nOur first robotics experience was in 5th grade. It was fine, nothing life-changing, and we moved on. Fast-forward to high school: FRC teams with expensive drivetrains, tight-knit communities, REV Robotics kits, CNC-milled aluminum. We loved it. But we kept picturing our ten-year-old selves back then — wiring LEGO motors to plastic bricks, piecing together block code. The hardware that made high school robotics fun and advanced? Way too expensive for our old school. We never got to fry a real servo at ten, so we built something that starts at zero, because we remember what zero feels like.\n\n## How we build\n\nEvery kit ships with open-source hardware and guided curriculum we wrote ourselves. You assemble it, wire it, and write the code, we don't do it for you, because that's not how you actually learn anything. To keep costs down, we 3D print the structural parts ourselves. It allows us to rapidly prototype while still being firm enough for real use. It's lighter than machined aluminum, and affordable enough that we don't have to pass a markup on to you. The electronics in each kit are also selected for what they can teach you. We try our best to make each kit distinct enough where you'll learn something new in each one.",
          ),
        label: 'Story',
        widget: 'textarea',
        help: 'Markdown. Rendered as the "Our Story" section.',
      },
    },
  },
} as const satisfies Record<string, TypeDef>

export type CmsType = keyof typeof cmsRegistry

type FieldSchemas<T extends CmsType> = {
  [K in keyof (typeof cmsRegistry)[T]['fields']]: (typeof cmsRegistry)[T]['fields'][K] extends {
    schema: infer S extends z.ZodType
  }
    ? S
    : never
}

/** Zod object for a type, derived from its field definitions. */
export function typeSchema<T extends CmsType>(type: T): z.ZodObject {
  const def = cmsRegistry[type] as TypeDef
  const shape: Record<string, z.ZodType> = {}
  for (const [name, field] of Object.entries(def.fields)) {
    shape[name] = field.schema
  }
  return z.object(shape)
}

export type CmsData<T extends CmsType> = z.infer<z.ZodObject<FieldSchemas<T>>>

export function isCmsType(value: string): value is CmsType {
  return value in cmsRegistry
}

const typeDefs = new Map<string, TypeDef>(Object.entries(cmsRegistry))

/** A type's definition without the const-literal narrowing. */
export function typeDefOf(type: CmsType): TypeDef {
  return typeDefs.get(type) as TypeDef
}

export const cmsTypeNames = Object.keys(cmsRegistry) as CmsType[]
