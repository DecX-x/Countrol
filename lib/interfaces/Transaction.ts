// src/interfaces/Transaction.ts
import { ObjectId, Decimal128 } from 'mongodb';

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export interface Transaction {
  _id?: ObjectId; // Opsional karena MongoDB akan membuatnya secara otomatis
  userId: string; // Mereferensikan field 'userId' dari koleksi 'users'
  type: TransactionType; // Tipe transaksi: "income" atau "expense"
  category: string; // Kategori transaksi
  amount: Decimal128; // Jumlah uang dalam transaksi (dalam Rupiah)
  date: Date; // Tanggal transaksi terjadi
  description?: string; // Deskripsi tambahan mengenai transaksi (opsional)
  sourceOrPaymentMethod?: string; // Sumber pemasukan atau metode pembayaran (opsional)
  createdAt: Date;
  updatedAt: Date;
}