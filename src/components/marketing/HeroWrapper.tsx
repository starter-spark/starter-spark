import { getContents } from "@/lib/content"
import { HeroSection } from "./Hero"

const DEFAULT_CONTENT = {
  "home.hero.tagline_top": "Robotics Education from Hawaii",
  "home.hero.headline": "Early Access to Real Tech Skills",
  "home.hero.subheadline": "With components like Arduino and more advanced boards, servos, and code, students get exposure to real tools engineers use every day, all in a way that's beginner-friendly and rewarding.",
  "home.hero.tagline_bottom": "v1.0 • Open Source Hardware • 70% to STEM Charities",
  "home.hero.cta_primary": "Shop Kits",
  "home.hero.cta_secondary": "Explore Free Courses",
}

export async function HeroWrapper() {
  const content = await getContents(
    Object.keys(DEFAULT_CONTENT),
    DEFAULT_CONTENT
  )

  return (
    <HeroSection
      taglineTop={content["home.hero.tagline_top"]}
      headline={content["home.hero.headline"]}
      subheadline={content["home.hero.subheadline"]}
      taglineBottom={content["home.hero.tagline_bottom"]}
      ctaPrimary={content["home.hero.cta_primary"]}
      ctaSecondary={content["home.hero.cta_secondary"]}
    />
  )
}
