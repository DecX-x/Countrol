"use client"

import { SummaryPage, type SummaryData } from "@/components/summary-page"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Share2, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"

export default function SummaryPageRoute() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get userId from URL params or use default
  const userId = searchParams.get("userId") || "user_6831885af26f9a4e3ab53166"

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          `/api/summary?userId=${encodeURIComponent(userId)}`
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          )
        }

        const data = await response.json()
        setSummaryData(data)
      } catch (err) {
        console.error("Error fetching summary:", err)
        setError(
          err instanceof Error ? err.message : "Failed to fetch summary"
        )
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [userId])

  const handleGoBack = () => {
    router.back()
  }

  const handleDownloadSummary = () => {
    console.log("Downloading summary...")
    alert("Summary akan di-download sebagai PDF! (Implementasi sesuai kebutuhan)")
  }

  const handleShareSummary = () => {
    console.log("Sharing summary...")
    alert("Summary akan di-share! (Implementasi sesuai kebutuhan)")
  }

  const handleRetry = () => {
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-lg">Generating financial summary...</p>
          <p className="text-sm text-muted-foreground">
            This may take a few moments
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-xl font-semibold">Error Loading Summary</h2>
          <p className="text-muted-foreground">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={handleGoBack}>
              Go Back
            </Button>
            <Button onClick={handleRetry}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  if (!summaryData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">No Data Available</h2>
          <p className="text-muted-foreground">
            No summary data could be generated
          </p>
          <Button onClick={handleGoBack}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with navigation */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handleGoBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Expenses
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadSummary}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={handleShareSummary}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Content */}
      <SummaryPage data={summaryData} />
    </div>
  )
}
