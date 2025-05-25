import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { config } from "dotenv";
import { getMongoDB } from "./mongodbClient";

config();
const apikey = process.env.API_KEY;

// Initialize LLM
const llm = new ChatOpenAI({
  model: "qwen-turbo",
  apiKey: apikey,
  temperature: 0.3, // Lower temperature for more consistent JSON output
  configuration: {
    baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
  }
});

interface TransactionSummary {
  userId: string;
  period: {
    startDate: string;
    endDate: string;
    totalDays: number;
  };
  income: {
    total: number;
    count: number;
    averagePerTransaction: number;
    categories: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
  };
  expenses: {
    total: number;
    count: number;
    averagePerTransaction: number;
    categories: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
  };
  netBalance: number;
  insights: {
    topExpenseCategory: string;
    topIncomeCategory: string;
    averageDailySpending: number;
    averageDailyIncome: number;
    spendingTrend: "increasing" | "decreasing" | "stable";
    recommendations: string[];
  };
  monthlyBreakdown?: Array<{
    month: string;
    income: number;
    expenses: number;
    netBalance: number;
  }>;
  descriptiveSummary: {
    overallFinancialHealth: string;
    spendingPattern: string;
    savingsRate: number;
    financialHabits: string[];
  };
  tips: {
    budgetingTips: string[];
    savingsTips: string[];
    investmentSuggestions: string[];
    immediateActions: string[];
  };
}

export async function generateFinancialSummary(userId: string): Promise<TransactionSummary | null> {
  try {
    // Fetch all transactions for the user
    const db = await getMongoDB();
    const transactions = await db.collection('transactions').find({ userId }).toArray();
    
    if (transactions.length === 0) {
      return null;
    }

    // Prepare data for LLM - handle Decimal128 amounts
    const transactionData = transactions.map(t => ({
      id: t._id.toString(),
      type: t.type,
      category: t.category,
      amount: typeof t.amount === 'object' && t.amount.toString ? parseFloat(t.amount.toString()) : t.amount,
      description: t.description,
      date: t.date
    }));

    // Create system prompt for financial analysis
    const systemPrompt = `You are a professional financial analyst AI. Analyze the provided transaction data and generate a comprehensive financial summary in JSON format.

IMPORTANT: 
- Respond ONLY with valid JSON, no additional text
- Use Indonesian language for text fields
- Calculate percentages accurately
- Provide actionable insights and recommendations
- Group transactions by categories properly
- Calculate trends based on chronological data
- Include descriptive analysis and practical tips

Required JSON structure:
{
  "userId": "string",
  "period": {
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD", 
    "totalDays": number
  },
  "income": {
    "total": number,
    "count": number,
    "averagePerTransaction": number,
    "categories": [{"category": "string", "amount": number, "percentage": number}]
  },
  "expenses": {
    "total": number,
    "count": number, 
    "averagePerTransaction": number,
    "categories": [{"category": "string", "amount": number, "percentage": number}]
  },
  "netBalance": number,
  "insights": {
    "topExpenseCategory": "string",
    "topIncomeCategory": "string", 
    "averageDailySpending": number,
    "averageDailyIncome": number,
    "spendingTrend": "increasing|decreasing|stable",
    "recommendations": ["string"]
  },
  "monthlyBreakdown": [{"month": "YYYY-MM", "income": number, "expenses": number, "netBalance": number}],
  "descriptiveSummary": {
    "overallFinancialHealth": "string - comprehensive assessment",
    "spendingPattern": "string - describe spending behavior",
    "savingsRate": number,
    "financialHabits": ["string - observed habits"]
  },
  "tips": {
    "budgetingTips": ["string - practical budgeting advice"],
    "savingsTips": ["string - money saving suggestions"],
    "investmentSuggestions": ["string - investment recommendations"],
    "immediateActions": ["string - urgent financial actions needed"]
  }
}`;

    const userPrompt = `Analisis data transaksi keuangan berikut dan berikan ringkasan dalam format JSON:

USER ID: ${userId}
TOTAL TRANSAKSI: ${transactions.length}

DATA TRANSAKSI:
${JSON.stringify(transactionData, null, 2)}

Berikan analisis mendalam termasuk:
1. Ringkasan pendapatan dan pengeluaran per kategori
2. Tren pengeluaran (naik/turun/stabil)
3. Rekomendasi pengelolaan keuangan
4. Breakdown bulanan jika data mencakup lebih dari 1 bulan
5. Insight dan pola spending behavior

Pastikan semua perhitungan akurat dan JSON valid.`;

    // Call LLM for analysis
    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt)
    ];

    const response = await llm.invoke(messages);
    
    // Parse JSON response
    let summary: TransactionSummary;
    try {
      const content = response.content as string;
      // Clean up response to ensure valid JSON - remove any markdown formatting
      let cleanContent = content.trim();
      
      // Remove markdown code blocks if present
      cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Remove any leading/trailing whitespace
      cleanContent = cleanContent.trim();
      
      // Parse the clean JSON
      summary = JSON.parse(cleanContent);
      
      // Validate required fields exist
      if (!summary.userId || !summary.period || !summary.expenses || !summary.income) {
        throw new Error("Invalid summary structure received from AI");
      }
      
      return summary;
    } catch (parseError) {
      console.error("❌ Error parsing JSON response:", parseError);
      console.log("Raw AI response:", response.content);
      return null;
    }

  } catch (error: any) {
    console.error("❌ Error in generateFinancialSummary:", error);
    return null;
  }
}

// Function to get raw LLM output only
export async function getRawLLMSummary(userId: string): Promise<string | null> {
  try {
    // Fetch all transactions for the user
    const db = await getMongoDB();
    const transactions = await db.collection('transactions').find({ userId }).toArray();
    
    if (transactions.length === 0) {
      return "Tidak ada transaksi ditemukan untuk user ini.";
    }

    // Prepare data for LLM - handle Decimal128 amounts
    const transactionData = transactions.map(t => ({
      id: t._id.toString(),
      type: t.type,
      category: t.category,
      amount: typeof t.amount === 'object' && t.amount.toString ? parseFloat(t.amount.toString()) : t.amount,
      description: t.description,
      date: t.date
    }));

    // Create system prompt for financial analysis
    const systemPrompt = `You are a professional financial analyst AI. Analyze the provided transaction data and generate a comprehensive financial summary in JSON format.

IMPORTANT: 
- Respond ONLY with valid JSON, no additional text
- Use Indonesian language for text fields
- Calculate percentages accurately
- Provide actionable insights and recommendations
- Group transactions by categories properly
- Calculate trends based on chronological data
- Include descriptive analysis and practical tips

Required JSON structure:
{
  "userId": "string",
  "period": {
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD", 
    "totalDays": number
  },
  "income": {
    "total": number,
    "count": number,
    "averagePerTransaction": number,
    "categories": [{"category": "string", "amount": number, "percentage": number}]
  },
  "expenses": {
    "total": number,
    "count": number, 
    "averagePerTransaction": number,
    "categories": [{"category": "string", "amount": number, "percentage": number}]
  },
  "netBalance": number,
  "insights": {
    "topExpenseCategory": "string",
    "topIncomeCategory": "string", 
    "averageDailySpending": number,
    "averageDailyIncome": number,
    "spendingTrend": "increasing|decreasing|stable",
    "recommendations": ["string"]
  },
  "monthlyBreakdown": [{"month": "YYYY-MM", "income": number, "expenses": number, "netBalance": number}],
  "descriptiveSummary": {
    "overallFinancialHealth": "string - comprehensive assessment",
    "spendingPattern": "string - describe spending behavior",
    "savingsRate": number,
    "financialHabits": ["string - observed habits"]
  },
  "tips": {
    "budgetingTips": ["string - practical budgeting advice"],
    "savingsTips": ["string - money saving suggestions"],
    "investmentSuggestions": ["string - investment recommendations"],
    "immediateActions": ["string - urgent financial actions needed"]
  }
}`;

    const userPrompt = `Analisis data transaksi keuangan berikut dan berikan ringkasan dalam format JSON:

USER ID: ${userId}
TOTAL TRANSAKSI: ${transactions.length}

DATA TRANSAKSI:
${JSON.stringify(transactionData, null, 2)}

Berikan analisis mendalam termasuk:
1. Ringkasan pendapatan dan pengeluaran per kategori
2. Tren pengeluaran (naik/turun/stabil)
3. Rekomendasi pengelolaan keuangan
4. Breakdown bulanan jika data mencakup lebih dari 1 bulan
5. Insight dan pola spending behavior

Pastikan semua perhitungan akurat dan JSON valid.`;

    // Call LLM for analysis
    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt)
    ];

    const response = await llm.invoke(messages);
    
    // Return raw LLM content without any modifications
    return response.content as string;
    
  } catch (error: any) {
    return `Error: ${error.message}`;
  }
}

// Remove the CLI display function and replace with raw output
export async function outputRawSummary(userId: string): Promise<void> {
  const rawOutput = await getRawLLMSummary(userId);
  console.log(rawOutput);
}
