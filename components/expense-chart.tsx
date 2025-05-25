"use client"

import { useMemo } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Type definitions
export interface Transaction {
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

export interface ExpenseChartProps {
  transactions: Transaction[]
  userId?: string
  title?: string
  dateRange?: {
    start: Date
    end: Date
  }
  showOnlyExpenses?: boolean
  className?: string
}

// Predefined colors for categories
const CATEGORY_COLORS = {
  "Food & Beverage": "#ef4444", // red
  Makanan: "#ef4444",
  Transportation: "#3b82f6", // blue
  Transportasi: "#3b82f6",
  Health: "#8b5cf6", // purple
  Kesehatan: "#8b5cf6",
  Entertainment: "#10b981", // green
  Hiburan: "#10b981",
  Shopping: "#f59e0b", // yellow
  Belanja: "#f59e0b",
  Rent: "#06b6d4", // cyan
  Kos: "#06b6d4",
  Utilities: "#84cc16", // lime
  Listrik: "#84cc16",
  General: "#6b7280", // gray
  "Lain-lain": "#6b7280",
  Salary: "#22c55e",
  Gaji: "#22c55e",
  Investment: "#a855f7",
  Investasi: "#a855f7",
} as const

// Fallback colors for unknown categories
const FALLBACK_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#06b6d4",
  "#84cc16",
  "#6b7280",
  "#22c55e",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#eab308",
]

export function ExpenseChart({
  transactions,
  userId,
  title = "Expense Breakdown",
  dateRange,
  showOnlyExpenses = true,
  className = "",
}: ExpenseChartProps) {
  const chartData = useMemo(() => {
    // Filter transactions
    const filteredTransactions = transactions.filter((transaction) => {
      // Filter by userId if provided
      if (userId && transaction.userId !== userId) return false

      // Filter by type if showOnlyExpenses is true
      if (showOnlyExpenses && transaction.type !== "expense") return false

      // Filter by date range if provided
      if (dateRange) {
        const transactionDate = new Date(transaction.date)
        if (transactionDate < dateRange.start || transactionDate > dateRange.end) return false
      }

      return true
    })

    // Group by category and calculate totals
    const categoryTotals = filteredTransactions.reduce(
      (acc, transaction) => {
        const category = transaction.category
        if (!acc[category]) {
          acc[category] = 0
        }
        acc[category] += transaction.amount
        return acc
      },
      {} as Record<string, number>,
    )

    // Calculate total amount
    const totalAmount = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0)

    // Convert to chart data format
    const data = Object.entries(categoryTotals)
      .map(([category, amount], index) => ({
        category,
        amount,
        percentage: totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0,
        color:
          CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
      }))
      .sort((a, b) => b.amount - a.amount) // Sort by amount descending

    return { data, totalAmount }
  }, [transactions, userId, dateRange, showOnlyExpenses])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat("id-ID").format(amount)
  }

  if (chartData.data.length === 0) {
    // Show sample data for testing if no real data
    const sampleData = [
      { category: "Makanan", amount: 500000, percentage: 40, color: "#ef4444" },
      { category: "Transportasi", amount: 300000, percentage: 24, color: "#3b82f6" },
      { category: "Hiburan", amount: 200000, percentage: 16, color: "#10b981" },
      { category: "Lain-lain", amount: 250000, percentage: 20, color: "#6b7280" },
    ]
    
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <p className="text-sm text-orange-500">Sample data - No transactions found for the selected period</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Sample Pie Chart */}
            <div className="h-80 w-full bg-muted/10 rounded-lg border-2 border-dashed border-muted/20 flex items-center justify-center">
              <div className="w-full h-full p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sampleData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="amount"
                      stroke="#ffffff"
                      strokeWidth={2}
                    >
                      {sampleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sample Legend */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>Category Breakdown (Sample)</span>
                <span>Total: {formatCurrency(1250000)}</span>
              </div>
              <div className="space-y-2">
                {sampleData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-medium">{item.category}</span>
                      <Badge variant="secondary" className="text-xs">
                        {item.percentage}%
                      </Badge>
                    </div>
                    <span className="text-sm font-mono">{formatNumber(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Debug logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('Chart Data:', chartData)
    console.log('Filtered Transactions:', transactions.filter(t => showOnlyExpenses ? t.type === "expense" : true))
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {dateRange && (
          <p className="text-sm text-muted-foreground">
            {dateRange.start.toLocaleDateString("id-ID")} - {dateRange.end.toLocaleDateString("id-ID")}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Pie Chart */}
          <div className="h-80 w-full bg-muted/10 rounded-lg border-2 border-dashed border-muted/20 flex items-center justify-center">
            <div className="w-full h-full p-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="amount"
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {chartData.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend with details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Category Breakdown</span>
              <span>Total: {formatCurrency(chartData.totalAmount)}</span>
            </div>
            <div className="space-y-2">
              {chartData.data.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium">{item.category}</span>
                    <Badge variant="secondary" className="text-xs">
                      {item.percentage}%
                    </Badge>
                  </div>
                  <span className="text-sm font-mono">{formatNumber(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
