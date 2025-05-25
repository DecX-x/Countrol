// src/interfaces/User.ts
import { ObjectId } from 'mongodb';
export interface User {
  _id?: ObjectId; // Opsional karena MongoDB akan membuatnya secara otomatis
  userId: string; // ID unik pengguna
  username?: string; // Nama pengguna (opsional)
  email?: string; // Email pengguna (opsional, sebaiknya unik)
  hashedPassword?: string; // Kata sandi yang sudah di-hash (opsional jika menggunakan metode auth lain)
  createdAt: Date;
  updatedAt: Date;
}

