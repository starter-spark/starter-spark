'use client'

import Image from 'next/image'
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
    label: 'Elementary School Outreach',
    caption: 'Students building their first circuits',
    span: 'wide',
  },
  {
    label: 'Workshop',
    caption: 'Hands-on robotics session',
    span: 'normal',
  },
  {
    label: 'Collaboration',
    caption: 'Working through the build together',
    span: 'tall',
  },
  {
    label: 'Programming',
    caption: 'Uploading code to the Arduino',
    span: 'normal',
  },
  {
    label: 'Pair Programming',
    caption: 'Debugging wiring and code',
    span: 'wide',
  },
]

const defaultStats: AboutStat[] = [
  { value: '0', label: 'Workshops Hosted' },
  { value: '0', label: 'Students Reached' },
  { value: '0', label: 'Partner Schools' },
  { value: '2', label: 'Kits Available' },
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
              <Image
                src={`/assets/images/gallery/${idx + 1}.jpg`}
                alt={image.label}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {/* Hover Overlay with Caption */}
              <div className="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <div>
                  <p className="text-white font-medium text-sm">
                    {image.label}
                  </p>
                  <p className="text-white/70 text-xs">{image.caption}</p>
                </div>
              </div>
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
