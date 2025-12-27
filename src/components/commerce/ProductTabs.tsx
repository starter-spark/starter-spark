'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

const tabTriggerClassName =
  'cursor-pointer font-mono text-sm data-[state=active]:text-cyan-700 data-[state=active]:border-b-2 data-[state=active]:border-cyan-700 rounded-none px-6 py-3 data-[state=active]:shadow-none flex-none sm:flex-1 whitespace-normal sm:whitespace-nowrap text-center'

const tabItems = [
  { value: 'overview', label: 'Overview' },
  { value: 'included', label: "What's Included" },
  { value: 'specs', label: 'Technical Specs' },
]

interface ProductTabsProps {
  description: string
  learningOutcomes: string[]
  includedItems: {
    quantity: number
    name: string
    description: string
  }[]
  specs: {
    label: string
    value: string
  }[]
  datasheetUrl?: string
}

export function ProductTabs({
  description,
  learningOutcomes,
  includedItems,
  specs,
  datasheetUrl,
}: ProductTabsProps) {
  const quickStats = [
    { label: 'Build Time', value: '~3 hours' },
    { label: 'Skill Level', value: 'Beginner' },
    { label: 'Age Range', value: '10+' },
  ]

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList
        aria-label="Product details"
        className="w-full justify-start border-b border-slate-200 bg-transparent h-auto p-0 rounded-none flex-wrap gap-2"
      >
        {tabItems.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={tabTriggerClassName}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview" className="pt-8">
        <div className="max-w-3xl">
          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-slate-600 leading-relaxed">
              {description}
            </p>
          </div>

          {/* Learning Outcomes */}
          <div className="mt-8">
            <p className="font-mono text-lg font-semibold text-slate-900 mb-4">
              What You&apos;ll Learn
            </p>
            <ul className="space-y-3">
              {learningOutcomes.map((outcome, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-cyan-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-cyan-700 font-mono text-xs">
                      {idx + 1}
                    </span>
                  </div>
                  <span className="text-slate-700">{outcome}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Stats */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            {quickStats.map((stat) => (
              <div
                key={stat.label}
                className="p-4 bg-slate-50 rounded border border-slate-200 text-center"
              >
                <p className="text-sm text-slate-700 mb-1">{stat.label}</p>
                <p className="font-mono text-slate-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>

      {/* What's Included Tab */}
      <TabsContent value="included" className="pt-8">
        <div className="max-w-4xl">
          {/* Knolling Photo Placeholder */}
          <div className="relative aspect-[2/1] mb-8 bg-slate-50 rounded border border-slate-200 overflow-hidden">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-20 h-20 mb-4 rounded-full bg-slate-200 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-slate-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-slate-700 font-mono text-sm">Knolling Photo</p>
              <p className="text-slate-700 text-xs mt-1">
                All components laid flat
              </p>
            </div>
          </div>

          {/* Inventory Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-mono text-slate-700 w-20">
                  Qty
                </TableHead>
                <TableHead className="font-mono text-slate-700">
                  Component
                </TableHead>
                <TableHead className="font-mono text-slate-700">
                  Description
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {includedItems.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono text-slate-900">
                    {item.quantity}×
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    {item.name}
                  </TableCell>
                  <TableCell className="text-slate-700">
                    {item.description}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      {/* Technical Specs Tab */}
      <TabsContent value="specs" className="pt-8">
        <div className="max-w-2xl">
          <div className="bg-white rounded border border-slate-200 overflow-hidden">
            {specs.map((spec, idx) => (
              <div
                key={spec.label}
                className={`flex justify-between p-4 ${
                  idx === specs.length - 1 ? '' : 'border-b border-slate-100'
                }`}
              >
                <span className="text-slate-700">{spec.label}</span>
                <span className="font-mono text-slate-900">{spec.value}</span>
              </div>
            ))}
          </div>

          {/* Download Datasheet */}
          {datasheetUrl && (
            <Button
              variant="outline"
              className="mt-6 border-slate-200 text-slate-700 hover:text-cyan-700 hover:border-cyan-700 font-mono w-full sm:w-auto whitespace-normal break-words text-center leading-snug h-auto py-3 flex-wrap"
              asChild
            >
              <a
                href={datasheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <FileDown className="w-4 h-4 mr-2" aria-hidden="true" />
                Download Datasheet (PDF)
              </a>
            </Button>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}
