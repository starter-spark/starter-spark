'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Menu, X, ShoppingCart, ChevronDown, Lock } from 'lucide-react'
import { useCartStore, selectCartCount } from '@/store/cart'
import {
  documentationNav,
  communityNav,
  type NavItem,
} from '@/config/navigation'
import { cn } from '@/lib/utils'
import { UserMenu } from './UserMenu'

interface HeaderUser {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  avatar_seed: string | null
  role: string | null
}

const hydrationListeners = new Set<() => void>()
let hasHydrated = false

const dropdownTriggerClass =
  'font-mono text-sm text-slate-600 hover:text-cyan-700 bg-transparent hover:bg-slate-100 data-[state=open]:bg-slate-100 px-4 py-2 rounded-md transition-colors inline-flex items-center gap-1 outline-none'
const navLinkClass =
  'font-mono text-sm text-slate-600 hover:text-cyan-700 px-4 py-2 rounded-md hover:bg-slate-100 transition-colors inline-flex items-center'
const cartButtonClass =
  'relative text-slate-600 hover:text-cyan-700 hover:bg-slate-100'
const desktopShopLinkClass =
  'inline-flex items-center justify-center h-9 px-4 py-2 rounded-md bg-cyan-700 hover:bg-cyan-600 text-white font-mono text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 focus-visible:ring-offset-2'
const mobileMenuButtonClass =
  'p-2 text-slate-600 hover:text-cyan-700 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 focus-visible:ring-offset-2'
const mobileShopLinkClass =
  'block w-full text-center py-2.5 px-4 rounded-md bg-cyan-700 hover:bg-cyan-600 text-white font-mono text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 focus-visible:ring-offset-2'
const mobileNavLinkClass =
  'block py-3 font-mono text-sm text-slate-700 hover:text-cyan-700 transition-colors'
const dropdownItemLinkClass =
  'flex items-start gap-3 rounded-md p-3 hover:bg-slate-50 transition-colors group w-full'
const dropdownIconWrapClass =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 group-hover:bg-cyan-100 transition-colors'
const dropdownIconClass =
  'h-4 w-4 text-slate-600 group-hover:text-cyan-700 transition-colors'
const dropdownTitleClass =
  'font-medium text-slate-900 group-hover:text-cyan-700 transition-colors text-sm'
const dropdownDescriptionClass = 'text-xs text-slate-500 mt-0.5 leading-relaxed'
const mobileSectionButtonClass =
  'flex w-full items-center justify-between py-3 font-mono text-sm text-slate-700 hover:text-cyan-700 transition-colors'
const mobileSectionLinkClass =
  'flex items-center gap-3 rounded-md p-2 text-sm text-slate-600 hover:text-cyan-700 hover:bg-slate-50 transition-colors'

function notifyHydration() {
  if (hasHydrated) return
  hasHydrated = true
  for (const listener of hydrationListeners) {
    listener()
  }
}

function subscribeHydration(listener: () => void) {
  hydrationListeners.add(listener)
  return () => {
    hydrationListeners.delete(listener)
  }
}

function useHydrated() {
  const isHydrated = useSyncExternalStore(
    subscribeHydration,
    () => hasHydrated,
    () => false,
  )

  useEffect(() => {
    notifyHydration()
  }, [])

  return isHydrated
}

function NavDropdownItem({
  item,
  onSelect,
}: {
  item: NavItem
  onSelect?: () => void
}) {
  const Icon = item.icon

  return (
    <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
      <Link
        href={item.href}
        onClick={onSelect}
        className={dropdownItemLinkClass}
      >
        {Icon && (
          <div className={dropdownIconWrapClass}>
            <Icon className={dropdownIconClass} />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span className={dropdownTitleClass}>{item.title}</span>
            {item.requiresAuth && <Lock className="h-3 w-3 text-slate-400" />}
          </div>
          {item.description && (
            <p className={dropdownDescriptionClass}>{item.description}</p>
          )}
        </div>
      </Link>
    </DropdownMenuItem>
  )
}

// Mobile accordion section
function MobileNavSection({
  title,
  items,
  isOpen,
  onToggle,
  onNavigate,
}: {
  title: string
  items: NavItem[]
  isOpen: boolean
  onToggle: () => void
  onNavigate: () => void
}) {
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className={mobileSectionButtonClass}
        aria-expanded={isOpen}
      >
        {title}
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-96 pb-3' : 'max-h-0',
        )}
      >
        <div className="space-y-1 pl-2">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href + item.title}
                href={item.href}
                onClick={onNavigate}
                className={mobileSectionLinkClass}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{item.title}</span>
                {item.requiresAuth && (
                  <Lock className="h-3 w-3 text-slate-400" />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface HeaderProps {
  user?: HeaderUser | null
}

export function Header({ user }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openSection, setOpenSection] = useState<string | null>(null)
  const isHydrated = useHydrated()
  const cartCount = useCartStore(selectCartCount)
  const openCart = useCartStore((state) => state.openCart)

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
    setOpenSection(null)
  }

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section)
  }

  return (
    <header
      data-hydrated={isHydrated ? 'true' : 'false'}
      className="sticky top-0 z-50 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-20">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 focus-visible:ring-offset-2"
          >
            <span className="font-mono text-xl font-bold text-slate-900 tracking-tighter">
              STARTER<span className="text-cyan-700">SPARK</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {/* Documentation Dropdown */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger className={dropdownTriggerClass}>
                {documentationNav.title}
                <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[320px] bg-white border border-slate-200 shadow-lg p-1"
              >
                {documentationNav.items.map((item) => (
                  <NavDropdownItem key={item.href + item.title} item={item} />
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Community Dropdown */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger className={dropdownTriggerClass}>
                {communityNav.title}
                <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[280px] bg-white border border-slate-200 shadow-lg p-1"
              >
                {communityNav.items.map((item) => (
                  <NavDropdownItem key={item.href + item.title} item={item} />
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Workshop Link (no dropdown) */}
            <Link
              href="/workshop"
              className={navLinkClass}
            >
              Workshop
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className={cartButtonClass}
              aria-label={`Shopping cart${cartCount > 0 ? `, ${cartCount} item${cartCount === 1 ? '' : 's'}` : ''}`}
              onClick={openCart}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-700 text-white text-xs font-mono rounded-full flex items-center justify-center"
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Button>
            <Link
              href="/shop"
              className={desktopShopLinkClass}
            >
              Shop Kits
            </Link>
            <UserMenu user={user ?? null} />
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <UserMenu user={user ?? null} />
            <Button
              variant="ghost"
              size="icon"
              className={cartButtonClass}
              aria-label={`Shopping cart${cartCount > 0 ? `, ${cartCount} item${cartCount === 1 ? '' : 's'}` : ''}`}
              onClick={openCart}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-700 text-white text-xs font-mono rounded-full flex items-center justify-center"
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Button>
            <button
              type="button"
              className={mobileMenuButtonClass}
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen)
              }}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden bg-white border-b border-slate-200"
        >
          <nav aria-label="Mobile navigation" className="px-6 py-4">
            {/* Accordion sections */}
            <MobileNavSection
              title={documentationNav.title}
              items={documentationNav.items}
              isOpen={openSection === 'documentation'}
              onToggle={() => {
                toggleSection('documentation')
              }}
              onNavigate={closeMobileMenu}
            />
            <MobileNavSection
              title={communityNav.title}
              items={communityNav.items}
              isOpen={openSection === 'community'}
              onToggle={() => {
                toggleSection('community')
              }}
              onNavigate={closeMobileMenu}
            />

            {/* Direct links */}
            <div className="pt-3 space-y-2">
              <Link
                href="/workshop"
                className={mobileNavLinkClass}
                onClick={closeMobileMenu}
              >
                Workshop
              </Link>
              <Link
                href="/shop"
                className={mobileShopLinkClass}
                onClick={closeMobileMenu}
              >
                Shop Kits
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
