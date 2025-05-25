// src/interfaces.ts
import { ObjectId, Decimal128 } from 'mongodb';

export interface User {
  _id?: ObjectId;
  userId: string;
  username?: string;
  email?: string;
  hashedPassword?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export interface TransactionInput { // Untuk input dari user/agent
  type: TransactionType;
  category: string;
  amount: number; // Agent lebih mudah menangani number, konversi ke Decimal128 saat simpan
  date: string; // Agent lebih mudah menangani string (YYYY-MM-DD), konversi ke Date saat simpan
  description?: string;
  sourceOrPaymentMethod?: string;
}

export interface Transaction extends Omit<TransactionInput, 'amount' | 'date'> {
  _id?: ObjectId;
  transactionId: string; // ID unik untuk transaksi, bisa UUID
  userId: string;
  amount: Decimal128; // Disimpan sebagai Decimal128
  date: Date; // Disimpan sebagai Date
  createdAt: Date;
  updatedAt: Date;
}

// Untuk state di LangGraph
export interface AgentState {
  messages: Array<import("@langchain/core/messages").BaseMessage>;
  userId: string | null; // userId akan disimpan di sini
  // Anda bisa tambahkan field lain yang relevan untuk state agent
}