"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

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

interface ComparisonData {
  totalIncome: number
  totalExpense: number
  balance: number
  status: "surplus" | "deficit" | "balanced"
}

export function IncomeExpenseComparison() {
  const [data, setData] = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const userId = "user_6831885af26f9a4e3ab53166"

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch ALL transactions for this user (no date filter to get all data)
        const params = new URLSearchParams({
          userId,
        })

        console.log('Fetching ALL transactions for userId:', userId)
        const response = await fetch(`/api/transactions?${params}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        const transactions: Transaction[] = result.transactions

        console.log('Fetched transactions:', {
          total: transactions.length,
          transactions: transactions,
          income: transactions.filter(t => t.type === "income"),
          expense: transactions.filter(t => t.type === "expense")
        })

        // Calculate totals from ALL transactions
        const totalIncome = transactions
          .filter(t => t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0)

        const totalExpense = transactions
          .filter(t => t.type === "expense")
          .reduce((sum, t) => sum + t.amount, 0)

        const balance = totalIncome - totalExpense
        
        console.log('Calculated totals from ALL data:', {
          totalIncome,
          totalExpense,
          balance,
          transactionCount: transactions.length
        })
        
        let status: "surplus" | "deficit" | "balanced"
        if (balance > 0) status = "surplus"
        else if (balance < 0) status = "deficit"
        else status = "balanced"

        setData({
          totalIncome,
          totalExpense,
          balance,
          status
        })
      } catch (err) {
        console.error("Error fetching comparison data:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId])
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Keuangan Total</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-center h-20">
            <p className="text-xs text-white/60">Loading...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Keuangan Total</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-center h-20">
            <p className="text-xs text-white/60">Error loading data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusIcon = () => {
    switch (data.status) {
      case "surplus":
        return <TrendingUp className="w-5 h-5 text-green-500" />
      case "deficit":
        return <TrendingDown className="w-5 h-5 text-red-500" />
      default:
        return <Minus className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusColor = () => {
    switch (data.status) {
      case "surplus":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "deficit":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      default:
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    }
  }
  const getStatusText = () => {
    switch (data.status) {
      case "surplus":
        return "Surplus"
      case "deficit":
        return "Defisit"
      default:
        return "Seimbang"
    }
  };
  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
      <CardHeader className="pb-1.5 sm:pb-3">
        <CardTitle className="flex items-center justify-between text-sm sm:text-lg">
          <span className="text-xs sm:text-base">Keuangan Total</span>
          <Badge variant="outline" className={`text-xs ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="ml-1 hidden sm:inline">{getStatusText()}</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-1.5 sm:space-y-3">
        <div className="space-y-1.5 sm:space-y-2">
          {/* Income vs Expense Bars */}
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-medium text-green-400">Pemasukan</span>
              <span className="text-[10px] sm:text-xs font-mono">{formatCurrency(data.totalIncome)}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-0.5 sm:h-1.5">
              <div 
                className="bg-green-500 h-0.5 sm:h-1.5 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.max(data.totalIncome, data.totalExpense) > 0 
                    ? (data.totalIncome / Math.max(data.totalIncome, data.totalExpense)) * 100 
                    : 0}%` 
                }}
              />
            </div>
          </div>

          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-medium text-red-400">Pengeluaran</span>
              <span className="text-[10px] sm:text-xs font-mono">{formatCurrency(data.totalExpense)}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-0.5 sm:h-1.5">
              <div 
                className="bg-red-500 h-0.5 sm:h-1.5 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.max(data.totalIncome, data.totalExpense) > 0 
                    ? (data.totalExpense / Math.max(data.totalIncome, data.totalExpense)) * 100 
                    : 0}%` 
                }}
              />
            </div>
          </div>

          {/* Balance */}
          <div className="pt-1 sm:pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-medium text-white/80">Saldo</span>
              <span className={`text-[10px] sm:text-xs font-mono font-bold ${
                data.balance > 0 ? "text-green-400" : 
                data.balance < 0 ? "text-red-400" : "text-yellow-400"
              }`}>
                {data.balance >= 0 ? "+" : ""}{formatCurrency(data.balance)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
