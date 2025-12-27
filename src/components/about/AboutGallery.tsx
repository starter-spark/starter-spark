'use client'

import { motion } from 'motion/react'

export interface AboutStat {
  value: string
  label: string
}

interface AboutGalleryProps {
  stats?: AboutStat[]
}

interface GalleryImage {
  label: string
  caption: string
  span?: 'wide' | 'tall' | 'normal'
}

const galleryImages: GalleryImage[] = [
  {
    label: 'FTC Competition',
    caption: 'Hawaii State Championship 2024',
    span: 'wide',
  },
  {
    label: 'Workshop',
    caption: 'Punahou School, December 2024',
    span: 'normal',
  },
  {
    label: 'Student Building',
    caption: 'First successful arm build',
    span: 'tall',
  },
  {
    label: 'Team Presentation',
    caption: 'STEM Night at Iolani',
    span: 'normal',
  },
  {
    label: 'Outreach Event',
    caption: 'Hawaii State Library Workshop',
    span: 'wide',
  },
]

const defaultStats: AboutStat[] = [
  { value: '0', label: 'Workshops Hosted' },
  { value: '0', label: 'Students Reached' },
  { value: '0', label: 'Partner Schools' },
  { value: '67%', label: 'Donated to STEM' },
]

export function AboutGallery({ stats = defaultStats }: AboutGalleryProps) {
  return (
    <section className="py-24 px-6 lg:px-20 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-mono text-3xl lg:text-4xl text-slate-900 mb-4">
            In the Community
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            From competitions to workshops, we&apos;re building Hawaii&apos;s
            next generation of engineers.
          </p>
        </motion.div>

        {/* Masonry-style Gallery */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px]">
          {galleryImages.map((image, idx) => (
            <motion.div
              key={image.label}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className={`
                relative group overflow-hidden rounded border border-slate-200 bg-slate-50
                ${image.span === 'wide' ? 'col-span-2' : ''}
                ${image.span === 'tall' ? 'row-span-2' : ''}
              `}
            >
              {/* Placeholder Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 mb-3 rounded-full bg-slate-200 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-slate-500 font-mono text-xs text-center">
                  {image.label}
                </p>
              </div>

              {/* Hover Overlay with Caption */}
              <div className="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <div>
                  <p className="text-white font-medium text-sm">
                    {image.label}
                  </p>
                  <p className="text-white/70 text-xs">{image.caption}</p>
                </div>
              </div>

              {/* Uncomment when we have actual images */}
              {/* <Image
                src={`/assets/images/gallery/${idx + 1}.jpg`}
                alt={image.label}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              /> */}
            </motion.div>
          ))}
        </div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 p-8 bg-slate-50 rounded border border-slate-200"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl lg:text-4xl font-mono text-cyan-700 mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
