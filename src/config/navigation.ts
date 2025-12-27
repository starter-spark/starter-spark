import {
  BookOpen,
  Cpu,
  Code,
  HelpCircle,
  Calendar,
  Users,
  Info,
  Mail,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  title: string
  href: string
  description?: string
  icon?: LucideIcon
  requiresAuth?: boolean
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

// Dropdown groups

export const documentationNav: NavGroup = {
  title: 'Documentation',
  items: [
    {
      title: 'Getting Started',
      href: '/learn',
      description: 'Start your robotics journey',
      icon: BookOpen,
    },
    {
      title: 'Hardware Guides',
      href: '/docs#hardware',
      description: 'Assembly and wiring guides',
      icon: Cpu,
    },
    {
      title: 'Software Guides',
      href: '/docs#software',
      description: 'Arduino programming tutorials',
      icon: Code,
    },
    {
      title: 'Troubleshooting',
      href: '/support',
      description: 'Common issues and solutions',
      icon: HelpCircle,
    },
  ],
}

export const communityNav: NavGroup = {
  title: 'Community',
  items: [
    {
      title: 'Events',
      href: '/events',
      description: 'Workshops and meetups',
      icon: Calendar,
    },
    {
      title: 'The Lab',
      href: '/community',
      description: 'Ask questions and share projects',
      icon: Users,
    },
    {
      title: 'About Us',
      href: '/about',
      description: 'Our mission and team',
      icon: Info,
    },
    {
      title: 'Contact',
      href: '/contact',
      description: 'Get in touch with our team',
      icon: Mail,
    },
  ],
}

// Simple items

export const mainNav = [{ title: 'Shop', href: '/shop' }] as const

export const footerNav = {
  main: [
    { title: 'Shop', href: '/shop' },
    { title: 'Learn', href: '/learn' },
    { title: 'Docs', href: '/docs' },
    { title: 'Community', href: '/community' },
    { title: 'Events', href: '/events' },
    { title: 'About', href: '/about' },
    { title: 'Contact', href: '/contact' },
    { title: 'Support', href: '/support' },
  ],
  legal: [
    { title: 'Privacy', href: '/privacy' },
    { title: 'Terms', href: '/terms' },
    { title: 'Contact', href: '/contact' },
  ],
} as const

export type MainNavItem = (typeof mainNav)[number]
export type FooterNavItem = (typeof footerNav.main)[number]
