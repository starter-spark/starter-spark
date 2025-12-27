'use client'

import { useSearchParams, usePathname } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, Wrench, Trophy } from 'lucide-react'
import { useCallback, useState } from 'react'

interface WorkshopTabsProps {
  coursesContent: React.ReactNode
  toolsContent: React.ReactNode
  progressContent: React.ReactNode
}

export function WorkshopTabs({
  coursesContent,
  toolsContent,
  progressContent,
}: WorkshopTabsProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const search = searchParams.toString()

  // Use local state for instant tab switching
  const [activeTab, setActiveTab] = useState(
    () => new URLSearchParams(search).get('tab') || 'courses',
  )

  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value)
      const params = new URLSearchParams(search)
      params.set('tab', value)
      if (value !== 'courses') {
        params.delete('difficulty')
      }
      const nextSearch = params.toString()
      if (nextSearch === search) return

      const newUrl = nextSearch ? `${pathname}?${nextSearch}` : pathname
      window.history.replaceState(null, '', newUrl)
    },
    [pathname, search],
  )

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full justify-start border-b border-slate-200 bg-transparent h-auto p-0 rounded-none mb-6 flex-wrap gap-2">
        <TabsTrigger
          value="courses"
          className="cursor-pointer font-mono text-sm data-[state=active]:text-cyan-700 data-[state=active]:border-b-2 data-[state=active]:border-cyan-700 rounded-none px-4 py-3 data-[state=active]:shadow-none flex items-center gap-2 flex-none sm:flex-1 whitespace-normal sm:whitespace-nowrap text-center"
        >
          <BookOpen className="w-4 h-4" />
          Courses
        </TabsTrigger>
        <TabsTrigger
          value="tools"
          className="cursor-pointer font-mono text-sm data-[state=active]:text-cyan-700 data-[state=active]:border-b-2 data-[state=active]:border-cyan-700 rounded-none px-4 py-3 data-[state=active]:shadow-none flex items-center gap-2 flex-none sm:flex-1 whitespace-normal sm:whitespace-nowrap text-center"
        >
          <Wrench className="w-4 h-4" />
          Tools
        </TabsTrigger>
        <TabsTrigger
          value="progress"
          className="cursor-pointer font-mono text-sm data-[state=active]:text-cyan-700 data-[state=active]:border-b-2 data-[state=active]:border-cyan-700 rounded-none px-4 py-3 data-[state=active]:shadow-none flex items-center gap-2 flex-none sm:flex-1 whitespace-normal sm:whitespace-nowrap text-center"
        >
          <Trophy className="w-4 h-4" />
          Progress
        </TabsTrigger>
      </TabsList>

      <TabsContent value="courses" className="mt-0">
        {coursesContent}
      </TabsContent>

      <TabsContent value="tools" className="mt-0">
        {toolsContent}
      </TabsContent>

      <TabsContent value="progress" className="mt-0">
        {progressContent}
      </TabsContent>
    </Tabs>
  )
}
