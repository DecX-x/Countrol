"use client"

import { BasicPieChart } from '@/components/basic-pie-chart'
import { Button } from "@/components/ui/button"
import { FileText, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

// Type definition
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

export default function MyExpenses() {
	const router = useRouter()
	const userId = "user_6831885af26f9a4e3ab53166"
	const [transactions, setTransactions] = useState<Transaction[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Example date range for current month
	const now = new Date()
	const dateRange = {
		start: new Date(now.getFullYear(), now.getMonth(), 1),
		end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
	}

	useEffect(() => {
		const fetchTransactions = async () => {
			try {
				setLoading(true)
				setError(null)

				// Fetch ALL expense transactions for this user (no date filter)
				const params = new URLSearchParams({
					userId,
					type: "expense" // Only fetch expenses for the chart
				})

				console.log('Fetching ALL expense transactions for userId:', userId)
				const response = await fetch(`/api/transactions?${params}`, {
					cache: 'no-store',
					headers: {
						'Cache-Control': 'no-cache',
					}
				})
				
				if (!response.ok) {
					const errorData = await response.json()
					throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
				}
				
				const data = await response.json()
				console.log('Fetched expense transactions:', {
					total: data.transactions.length,
					transactions: data.transactions
				})
				setTransactions(data.transactions)
			} catch (err) {
				console.error("Error fetching transactions:", err)
				setError(err instanceof Error ? err.message : "Failed to fetch transactions")
			} finally {
				setLoading(false)
			}
		}

		fetchTransactions()
	}, [userId])

	const handleCreateSummary = () => {
		// Navigate to summary page with userId
		router.push(`/tracker/summary?userId=${encodeURIComponent(userId)}`)
	}

	const handleRetry = () => {
		window.location.reload()
	}

	if (loading) {
		return (
			<div className="container mx-auto p-6 max-w-2xl mt-20">
				<div className="flex items-center justify-center min-h-[400px]">
					<div className="text-center space-y-4">
						<Loader2 className="h-8 w-8 animate-spin mx-auto" />
						<p className="text-lg">Loading transactions...</p>
					</div>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="container mx-auto p-6 max-w-2xl mt-20">
				<div className="flex items-center justify-center min-h-[400px]">
					<div className="text-center space-y-4">
						<h2 className="text-xl font-semibold">Error Loading Data</h2>
						<p className="text-muted-foreground">{error}</p>
						<Button onClick={handleRetry}>Try Again</Button>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="container mx-auto p-6 max-w-2xl mt-20">
			<div className="space-y-6">
				{/* Header */}
				<div className="text-center space-y-2">
					<h1 className="text-2xl font-bold">My Expenses</h1>
					<p className="text-muted-foreground text-sm">
						Ringkasan semua pengeluaran Anda
					</p>
					{transactions.length > 0 && (
						<p className="text-sm text-muted-foreground">
							{transactions.length} transaksi ditemukan
						</p>
					)}
				</div>

				{/* Expense Chart */}
				{transactions.length > 0 ? (
					<BasicPieChart
						transactions={transactions}
						title="Expense Breakdown"
					/>
				) : (
					<div className="text-center py-12 space-y-4">
						<p className="text-lg">Tidak ada transaksi ditemukan</p>
						<p className="text-muted-foreground">
							Belum ada transaksi untuk periode ini
						</p>
					</div>
				)}

				{/* Create Summary Button */}
				<div className="flex justify-center pt-4">
					<Button
						onClick={handleCreateSummary}
						className="w-full h-12 text-base font-medium"
						size="lg"
						disabled={transactions.length === 0}
					>
						<FileText className="mr-2 h-5 w-5" />
						Create Summary
					</Button>
				</div>
			</div>
		</div>
	)
}
