'use client'

import { useState } from 'react'
import LivingCostSim from '@/components/tips/LivingCostSim'
import SaleCalendar from '@/components/tips/SaleCalendar'
import TimelineEditor from '@/components/tips/TimelineEditor'

const TABS = [
  { id: 'timeline', label: '📅 タイムライン' },
  { id: 'cost', label: '💰 生活費' },
  { id: 'sale', label: '🛒 セール' },
] as const

export default function PlannerPageClient() {
  const [activeTab, setActiveTab] = useState<string>('timeline')

  return (
    <div>
      {/* タブヘッダー */}
      <div className="flex gap-1 mb-4 bg-primary-light/20 rounded-xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-bg-card text-primary shadow-sm'
                : 'text-text-sub hover:text-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      <div className="bg-bg-card/80 rounded-2xl border border-primary-light/30 p-4">
        {activeTab === 'timeline' && <TimelineEditor />}
        {activeTab === 'cost' && <LivingCostSim />}
        {activeTab === 'sale' && <SaleCalendar />}
      </div>
    </div>
  )
}
