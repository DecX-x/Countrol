import { NextRequest, NextResponse } from "next/server"
import { generateFinancialSummary } from "@/lib/summarizer"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "userId parameter is required" },
        { status: 400 }
      )
    }

    const summary = await generateFinancialSummary(userId)

    if (!summary) {
      return NextResponse.json(
        { error: "No transactions found for this user or failed to generate summary" },
        { status: 404 }
      )
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error("Error generating summary:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      )
    }

    const summary = await generateFinancialSummary(userId)

    if (!summary) {
      return NextResponse.json(
        { error: "No transactions found for this user or failed to generate summary" },
        { status: 404 }
      )
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error("Error generating summary:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
