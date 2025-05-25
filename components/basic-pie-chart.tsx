"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Type definitions
interface Transaction {
  _id: string
  userId: string
  type: "income" | "expense"
  category: string
  amount: number
  date: string | Date
  description: string
  createdAt: string | Date
  updatedAt: string | Date
}

interface BasicPieChartProps {
  transactions: Transaction[]
  title?: string
  className?: string
}

// Predefined colors for categories
const CATEGORY_COLORS = {
  "Food & Beverage": "#ef4444", // red
  "Makanan": "#ef4444",
  "Transportation": "#3b82f6", // blue
  "Transportasi": "#3b82f6",
  "Health": "#8b5cf6", // purple
  "Kesehatan": "#8b5cf6",
  "Entertainment": "#10b981", // green
  "Hiburan": "#10b981",
  "Shopping": "#f59e0b", // yellow
  "Belanja": "#f59e0b",
  "Rent": "#06b6d4", // cyan
  "Kos": "#06b6d4",
  "Utilities": "#84cc16", // lime
  "Listrik": "#84cc16",
  "General": "#6b7280", // gray
  "Lain-lain": "#6b7280",
} as const

// Fallback colors
const FALLBACK_COLORS = [
  "#ef4444", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", 
  "#06b6d4", "#84cc16", "#6b7280", "#ec4899", "#14b8a6"
]

export function BasicPieChart({ transactions, title = "Expense Breakdown", className }: BasicPieChartProps) {
  // Process data untuk chart
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      // Sample data jika tidak ada transaksi
      return [
        { name: "No Data", value: 100, color: "#6b7280", percentage: 100 }
      ]
    }

    // Group transaksi berdasarkan kategori
    const categoryTotals = transactions.reduce((acc, transaction) => {
      const category = transaction.category || "General"
      acc[category] = (acc[category] || 0) + transaction.amount
      return acc
    }, {} as Record<string, number>)

    // Calculate total
    const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0)

    // Convert ke format chart data
    const data = Object.entries(categoryTotals).map(([category, amount], index) => ({
      name: category,
      value: amount,
      color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
      percentage: total > 0 ? (amount / total) * 100 : 0
    }))

    // Sort by value (descending)
    return data.sort((a, b) => b.value - a.value)
  }, [transactions])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const totalAmount = chartData.reduce((sum, item) => sum + item.value, 0)
  // Create SVG pie chart
  const createPieChart = () => {
    if (chartData.length === 0 || (chartData.length === 1 && chartData[0].name === "No Data")) {
      return (
        <div className="w-72 h-72 mx-auto flex items-center justify-center bg-white/5 rounded-full">
          <span className="text-white/60 text-sm">No Data Available</span>
        </div>
      )
    }

    const size = 240
    const radius = 90
    const centerX = size / 2
    const centerY = size / 2

    let cumulativePercentage = 0
    const paths = chartData.map((item, index) => {
      const percentage = item.percentage
      const startAngle = (cumulativePercentage / 100) * 2 * Math.PI - Math.PI / 2
      const endAngle = ((cumulativePercentage + percentage) / 100) * 2 * Math.PI - Math.PI / 2

      const x1 = centerX + radius * Math.cos(startAngle)
      const y1 = centerY + radius * Math.sin(startAngle)
      const x2 = centerX + radius * Math.cos(endAngle)
      const y2 = centerY + radius * Math.sin(endAngle)

      const largeArcFlag = percentage > 50 ? 1 : 0

      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ')

      cumulativePercentage += percentage

      return (
        <path
          key={index}
          d={pathData}
          fill={item.color}
          stroke="#1a1b1e"
          strokeWidth="2"
          className="transition-opacity hover:opacity-80"
        />
      )
    });
    return (
      <div className="w-full flex justify-center items-center py-4">
        <div className="w-72 h-72 flex items-center justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-lg">
            {paths}
            {/* Center circle */}
            <circle
              cx={centerX}
              cy={centerY}
              r={40}
              fill="#1a1b1e"
              stroke="#ffffff20"
              strokeWidth="2"
            />
            {/* Center text */}
            <text
              x={centerX}
              y={centerY - 8}
              textAnchor="middle"
              className="fill-white text-sm font-medium"
            >
              Total
            </text>
            <text
              x={centerX}
              y={centerY + 10}
              textAnchor="middle"
              className="fill-white/80 text-xs"
            >
              {chartData.length} categories
            </text>
          </svg>
        </div>
      </div>
    )
  }

  return (
    <Card className={`bg-white/5 backdrop-blur-sm border-white/10 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>{title}</span>
          <Badge variant="outline" className="bg-white/10 text-white border-white/20">
            {transactions.length} transaksi
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-6">
          {/* Pie Chart */}
          <div className="flex justify-center">
            {createPieChart()}
          </div>

          {/* Legend */}
          {chartData.length > 0 && chartData[0].name !== "No Data" && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-white/80">Breakdown by Category</h3>
              <div className="grid grid-cols-1 gap-2">
                {chartData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-white/90">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">{formatCurrency(item.value)}</div>
                      <div className="text-xs text-white/60">{item.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          {chartData[0].name !== "No Data" && (
            <div className="pt-3 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white/80">Total Pengeluaran</span>
                <span className="text-lg font-bold text-white">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
