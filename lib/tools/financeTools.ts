// src/tools/financeTools.ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { Decimal128, ObjectId } from "mongodb";
import { getMongoDB, getTransactionsCollection } from "../mongodbClient";
import { Transaction, TransactionType } from "../interfaces";

// Helper function to check if string is valid ObjectId
function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id) && id.length === 24;
}

// --- CREATE TRANSACTION TOOL ---
export const createTransactionTool = (userId: string) => tool(
  async ({ type, category, amount, date, description, sourceOrPaymentMethod }) => {
    if (!userId) return "Error: User ID is missing. Cannot create transaction.";
    
    console.log("createTransactionTool received:", { type, category, amount, date, description, sourceOrPaymentMethod });
    
    try {
      // Validate required fields
      if (!type || !category || amount === undefined || !date) {
        return "Error: Missing required fields: type, category, amount, or date.";
      }
      
      if (type !== 'income' && type !== 'expense') {
        return "Error: Invalid transaction type. Must be 'income' or 'expense'.";
      }
      
      if (typeof amount !== 'number' || amount <= 0) {
        return "Error: Amount must be a positive number.";
      }
      
      // Validate date format
      const transactionDate = new Date(date);
      if (isNaN(transactionDate.getTime())) {
        return "Error: Invalid date format. Please use YYYY-MM-DD.";
      }      const db = await getMongoDB();
      console.log("Database connected successfully");
      
      const transactionsCollection = getTransactionsCollection(db);
      console.log("Got transactions collection");      // Format sama persis dengan seed data
      const newTransaction = {
        userId: userId,
        type: type as TransactionType,
        category,
        amount: Decimal128.fromString(amount.toString()),
        date: transactionDate,
        description: description || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log("About to insert transaction:", JSON.stringify(newTransaction, null, 2));
      
      const result = await transactionsCollection.insertOne(newTransaction as any);
      console.log("Insert result:", result);
      console.log("Inserted ID:", result.insertedId);
      console.log("Acknowledged:", result.acknowledged);
      
      return `Transaction created successfully with ID: ${result.insertedId}. Amount: ${amount}, Category: ${category}, Date: ${date}. MongoDB ID: ${result.insertedId}`;
      
    } catch (error: any) {
      console.error("Error in createTransactionTool:", error);
      return `Error creating transaction: ${error.message}`;
    }
  },  {
    name: "create_financial_transaction",
    description: "Use this tool to record a new financial transaction (income or expense) for the user.",
    schema: z.object({
      type: z.enum(["income", "expense"]).describe("Type of transaction"),
      category: z.string().describe("The category of the transaction (e.g., 'Salary', 'Food & Beverage', 'Transportation')"),
      amount: z.number().positive().describe("The monetary value of the transaction as a positive number"),
      date: z.string().describe("The date of the transaction in YYYY-MM-DD format"),
      description: z.string().optional().describe("A brief note about the transaction"),
      sourceOrPaymentMethod: z.string().optional().describe("Source of income or method of payment"),
    }),
  }
);

// --- READ TRANSACTIONS TOOL ---
export const readTransactionsTool = (userId: string) => tool(
  async ({ limit = 50, category, type, startDate, endDate }) => {
    if (!userId) return "Error: User ID is missing. Cannot read transactions.";
    
    console.log("=== READ TRANSACTIONS DEBUG ===");
    console.log("readTransactionsTool received:", { userId, limit, category, type, startDate, endDate });
    
    try {
      const db = await getMongoDB();
      console.log("Database connected successfully for read operation");
      
      const transactionsCollection = getTransactionsCollection(db);

      const query: any = { userId };
      if (category) query.category = category;
      if (type) query.type = type;
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }

      console.log("Query filter being executed:", JSON.stringify(query, null, 2));

      const transactions = await transactionsCollection
        .find(query)
        .sort({ date: -1 })
        .limit(limit)
        .toArray();

      console.log(`=== FOUND ${transactions.length} TRANSACTIONS IN DATABASE ===`);
      console.log("Raw transaction results:", transactions.map(t => ({
        _id: t._id?.toString(),
        userId: t.userId,
        type: t.type,
        category: t.category,
        amount: t.amount?.toString(),
        date: t.date,
        description: t.description,
        createdAt: t.createdAt
      })));
      console.log("=== END DEBUG ===");

      if (transactions.length === 0) {
        return "No transactions found matching your criteria.";
      }const formattedTransactions = transactions.map(t => ({
        transactionId: (t as any)._id?.toString(), // Use MongoDB _id since seed data doesn't have transactionId
        type: (t as any).type,
        category: (t as any).category,
        amount: parseFloat((t as any).amount?.toString?.() ?? "0"),
        date: (t as any).date instanceof Date
          ? (t as any).date.toISOString().split('T')[0]
          : (typeof (t as any).date === "string" ? (t as any).date : ""),
        description: (t as any).description,
        sourceOrPaymentMethod: (t as any).sourceOrPaymentMethod
      }));

      return `Found ${transactions.length} transactions:\n${JSON.stringify(formattedTransactions, null, 2)}`;
      
    } catch (error: any) {
      console.error("Error in readTransactionsTool:", error);
      return `Error reading transactions: ${error.message}`;
    }
  },
  {
    name: "read_financial_transactions",
    description: "Use this tool to read the user's financial transactions.",    schema: z.object({
      limit: z.number().optional().default(50).describe("Number of transactions to return"),
      category: z.string().optional().describe("Filter by category"),
      type: z.enum(["income", "expense"]).optional().describe("Filter by transaction type"),
      startDate: z.string().optional().describe("Filter transactions from this date (YYYY-MM-DD)"),
      endDate: z.string().optional().describe("Filter transactions up to this date (YYYY-MM-DD)"),
    }),
  }
);

// --- UPDATE TRANSACTION TOOL ---
export const updateTransactionTool = (userId: string) => tool(
  async ({ transactionId, updates }) => {
    if (!userId) return "Error: User ID is missing. Cannot update transaction.";
    if (!transactionId) return "Error: transactionId is required to update a transaction.";
    if (!updates || Object.keys(updates).length === 0) return "Error: updates object is empty. Nothing to update.";

    console.log("updateTransactionTool received:", { transactionId, updates });
    
    try {
      const db = await getMongoDB();
      const transactionsCollection = getTransactionsCollection(db);

      const updateFields: any = {};
      if (updates.type) updateFields.type = updates.type;
      if (updates.category) updateFields.category = updates.category;
      if (updates.amount !== undefined) updateFields.amount = Decimal128.fromString(updates.amount.toString());
      if (updates.date) {
        const transactionDate = new Date(updates.date);
        if (isNaN(transactionDate.getTime())) return "Error: Invalid date format in updates. Please use YYYY-MM-DD.";
        updateFields.date = transactionDate;
      }
      if (updates.description !== undefined) updateFields.description = updates.description;
      if (updates.sourceOrPaymentMethod !== undefined) updateFields.sourceOrPaymentMethod = updates.sourceOrPaymentMethod;

      if (Object.keys(updateFields).length === 0) {
        return "Error: No valid fields provided for update after processing.";
      }
      updateFields.updatedAt = new Date();      const result = await transactionsCollection.updateOne(
        { 
          _id: new ObjectId(transactionId), 
          userId 
        },
        { $set: updateFields }
      );

      if (result.matchedCount === 0) {
        return `Error: No transaction found with ID ${transactionId} for this user.`;
      }
      if (result.modifiedCount === 0 && result.matchedCount === 1) {
        return `Transaction ${transactionId} found but no changes were made (values might be the same).`;
      }
      return `Transaction ${transactionId} updated successfully.`;
      
    } catch (error: any) {
      console.error("Error in updateTransactionTool:", error);
      return `Error updating transaction: ${error.message}`;
    }
  },
  {
    name: "update_financial_transaction",
    description: "Use this tool to update an existing financial transaction for the user.",
    schema: z.object({
      transactionId: z.string().describe("The ID of the transaction to update"),
      updates: z.object({
        type: z.enum(["income", "expense"]).optional().describe("New transaction type"),
        category: z.string().optional().describe("New category"),
        amount: z.number().positive().optional().describe("New amount"),
        date: z.string().optional().describe("New date (YYYY-MM-DD)"),
        description: z.string().optional().describe("New description"),
        sourceOrPaymentMethod: z.string().optional().describe("New source or payment method"),
      }).describe("Object with fields to update"),
    }),
  }
);

// --- DELETE TRANSACTION TOOL ---
export const deleteTransactionTool = (userId: string) => tool(
  async ({ transactionId }) => {
    if (!userId) return "Error: User ID is missing. Cannot delete transaction.";
    if (!transactionId) return "Error: transactionId is required to delete a transaction.";

    console.log("deleteTransactionTool received:", { transactionId });
    
    try {
      const db = await getMongoDB();
      const transactionsCollection = getTransactionsCollection(db);      const result = await transactionsCollection.deleteOne({
        _id: new ObjectId(transactionId), 
        userId
      });

      if (result.deletedCount === 0) {
        return `Error: No transaction found with ID ${transactionId} for this user, or transaction has already been deleted.`;
      }

      return `Transaction ${transactionId} deleted successfully.`;
      
    } catch (error: any) {
      console.error("Error in deleteTransactionTool:", error);
      return `Error deleting transaction: ${error.message}`;
    }
  },
  {
    name: "delete_financial_transaction",
    description: "Use this tool to delete a financial transaction for the user.",
    schema: z.object({
      transactionId: z.string().describe("The ID of the transaction to delete"),
    }),
  }
);