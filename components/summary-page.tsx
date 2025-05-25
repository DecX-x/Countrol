"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Target,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  PieChart,
  BarChart3,
} from "lucide-react"

export interface SummaryData {
  userId: string
  period: {
    startDate: string
    endDate: string
    totalDays: number
  }
  income: {
    total: number
    count: number
    averagePerTransaction: number
    categories: Array<{
      category: string
      amount: number
      percentage: number
    }>
  }
  expenses: {
    total: number
    count: number
    averagePerTransaction: number
    categories: Array<{
      category: string
      amount: number
      percentage: number
    }>
  }
  netBalance: number
  insights: {
    topExpenseCategory: string
    topIncomeCategory: string
    averageDailySpending: number
    averageDailyIncome: number
    spendingTrend: string
    recommendations: string[]
  }
  monthlyBreakdown: Array<{
    month: string
    income: number
    expenses: number
    netBalance: number
  }>
  descriptiveSummary: {
    overallFinancialHealth: string
    spendingPattern: string
    savingsRate: number
    financialHabits: string[]
  }
  tips: {
    budgetingTips: string[]
    savingsTips: string[]
    investmentSuggestions: string[]
    immediateActions: string[]
  }
}

interface SummaryPageProps {
  data: SummaryData
}

export function SummaryPage({ data }: SummaryPageProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-green-600"
    if (balance < 0) return "text-red-600"
    return "text-gray-600"
  }

  const getBalanceIcon = (balance: number) => {
    if (balance > 0) return <TrendingUp className="h-5 w-5 text-green-600" />
    if (balance < 0) return <TrendingDown className="h-5 w-5 text-red-600" />
    return <DollarSign className="h-5 w-5 text-gray-600" />
  }

  const getTrendColor = (trend: string) => {
    switch (trend.toLowerCase()) {
      case "increasing":
      case "naik":
        return "text-red-600"
      case "decreasing":
      case "turun":
        return "text-green-600"
      case "stable":
      case "stabil":
        return "text-blue-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Financial Summary</h1>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {formatDate(data.period.startDate)} - {formatDate(data.period.endDate)}
          </span>
          <Badge variant="secondary">{data.period.totalDays} hari</Badge>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(data.income.total)}</div>
            <p className="text-xs text-muted-foreground">
              {data.income.count} transaksi • Avg: {formatCurrency(data.income.averagePerTransaction)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(data.expenses.total)}</div>
            <p className="text-xs text-muted-foreground">
              {data.expenses.count} transaksi • Avg: {formatCurrency(data.expenses.averagePerTransaction)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            {getBalanceIcon(data.netBalance)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getBalanceColor(data.netBalance)}`}>
              {formatCurrency(data.netBalance)}
            </div>
            <p className="text-xs text-muted-foreground">Savings Rate: {data.descriptiveSummary.savingsRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Expense Breakdown */}
      {data.expenses.categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Expense Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.expenses.categories.map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{category.category}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{category.percentage.toFixed(1)}%</Badge>
                      <span className="text-sm font-mono">{formatCurrency(category.amount)}</span>
                    </div>
                  </div>
                  <Progress value={category.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Financial Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Key Metrics</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Top Expense Category:</span>
                  <span className="font-medium">{data.insights.topExpenseCategory || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Daily Spending Avg:</span>
                  <span className="font-medium">{formatCurrency(data.insights.averageDailySpending)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Daily Income Avg:</span>
                  <span className="font-medium">{formatCurrency(data.insights.averageDailyIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Spending Trend:</span>
                  <span className={`font-medium capitalize ${getTrendColor(data.insights.spendingTrend)}`}>
                    {data.insights.spendingTrend}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Recommendations</h4>
              <div className="space-y-2">
                {data.insights.recommendations.map((recommendation, index) => (
                  <Alert key={index}>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription className="text-sm">{recommendation}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Breakdown */}
      {data.monthlyBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Monthly Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.monthlyBreakdown.map((month, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{month.month}</h4>
                    <Badge variant={month.netBalance >= 0 ? "default" : "destructive"}>
                      {formatCurrency(month.netBalance)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span>Income:</span>
                      <span className="text-green-600">{formatCurrency(month.income)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expenses:</span>
                      <span className="text-red-600">{formatCurrency(month.expenses)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Descriptive Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Health Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium mb-2">Overall Financial Health</h4>
              <p className="text-sm text-muted-foreground">{data.descriptiveSummary.overallFinancialHealth}</p>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-2">Spending Pattern</h4>
              <p className="text-sm text-muted-foreground">{data.descriptiveSummary.spendingPattern}</p>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-2">Financial Habits</h4>
              <div className="space-y-1">
                {data.descriptiveSummary.financialHabits.map((habit, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span>{habit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips and Recommendations */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">💡 Tips & Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Budgeting Tips
              </h4>
              <ul className="space-y-1">
                {data.tips.budgetingTips.map((tip, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 mt-1 text-green-600 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Savings Tips
              </h4>
              <ul className="space-y-1">
                {data.tips.savingsTips.map((tip, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 mt-1 text-green-600 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🚀 Action Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Investment Suggestions
              </h4>
              <ul className="space-y-1">
                {data.tips.investmentSuggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 mt-1 text-blue-600 flex-shrink-0" />
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Immediate Actions
              </h4>
              <ul className="space-y-1">
                {data.tips.immediateActions.map((action, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 mt-1 text-amber-600 flex-shrink-0" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
