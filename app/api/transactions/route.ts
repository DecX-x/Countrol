import { NextRequest, NextResponse } from "next/server"
import { getMongoDB } from "@/lib/mongodbClient"
import { Decimal128 } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const type = searchParams.get("type") // 'income', 'expense', or undefined for all

    if (!userId) {
      return NextResponse.json(
        { error: "userId parameter is required" },
        { status: 400 }
      )
    }

    const db = await getMongoDB()
    
    // Build query
    const query: any = { userId }
    
    // Add date range filter if provided
    if (startDate || endDate) {
      query.date = {}
      if (startDate) {
        query.date.$gte = new Date(startDate)
      }
      if (endDate) {
        query.date.$lte = new Date(endDate)
      }
    }
    
    // Add type filter if provided
    if (type && (type === "income" || type === "expense")) {
      query.type = type
    }

    const transactions = await db
      .collection("transactions")
      .find(query)
      .sort({ date: -1, createdAt: -1 })
      .toArray()

    // Transform data to match frontend expectations with proper amount handling
    const transformedTransactions = transactions.map(t => {
      let amount: number;
      
      // Handle different amount types (Decimal128, number, or string)
      if (t.amount instanceof Decimal128) {
        amount = parseFloat(t.amount.toString());
      } else if (typeof t.amount === 'object' && t.amount.toString) {
        amount = parseFloat(t.amount.toString());
      } else if (typeof t.amount === 'string') {
        amount = parseFloat(t.amount);
      } else {
        amount = Number(t.amount) || 0;
      }

      return {
        _id: t._id.toString(),
        userId: t.userId,
        type: t.type,
        category: t.category,
        amount: amount,
        date: t.date.toISOString(),
        description: t.description,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      }
    })

    return NextResponse.json({
      transactions: transformedTransactions,
      count: transformedTransactions.length
    })
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
