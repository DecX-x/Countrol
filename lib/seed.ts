// src/seed.ts
import { MongoClient, Decimal128, ObjectId } from 'mongodb';
import { User } from './interfaces/User'; // Sesuaikan path jika berbeda
import { Transaction, TransactionType } from './interfaces/Transaction'; // Sesuaikan path jika berbeda
import { config } from 'dotenv';
config(); // Memuat variabel lingkungan dari file .env


// --- Konfigurasi ---
const MONGO_URI = process.env.MONGO_URI;
const DATABASE_NAME = process.env.DATABASE_NAME; // Ganti dengan nama database yang sesuai
// --- Akhir Konfigurasi ---

async function seedDatabase() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('Terhubung ke MongoDB!');

    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection<User>('users');
    const transactionsCollection = db.collection<Transaction>('transactions');

    // 0. Bersihkan koleksi (opsional, hati-hati jika sudah ada data penting)
    console.log('Membersihkan koleksi users dan transactions...');
    await usersCollection.deleteMany({});
    await transactionsCollection.deleteMany({});
    console.log('Koleksi berhasil dibersihkan.');

    // 1. Buat Contoh User
    const now = new Date();
    const user1Id = `user_${new ObjectId().toHexString()}`; // Membuat userId unik
    const user2Id = `user_${new ObjectId().toHexString()}`;

    const usersToSeed: User[] = [
      {
        userId: user1Id,
        username: 'Andi Wijaya',
        email: 'andi.wijaya@example.com',
        hashedPassword: 'hashed_password_andi', // Sebaiknya gunakan bcrypt di aplikasi nyata
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: user2Id,
        username: 'Siti Aminah',
        email: 'siti.aminah@example.com',
        hashedPassword: 'hashed_password_siti',
        createdAt: now,
        updatedAt: now,
      },
    ];

    const insertedUsers = await usersCollection.insertMany(usersToSeed);
    console.log(`${insertedUsers.insertedCount} user berhasil ditambahkan.`);
    const andi = await usersCollection.findOne({ userId: user1Id });
    const siti = await usersCollection.findOne({ userId: user2Id });

    if (!andi || !siti) {
        console.error("Gagal mengambil user yang baru saja di-seed.");
        return;
    }

    // 2. Buat Contoh Transaksi untuk masing-masing User
    const transactionsToSeed: Transaction[] = [
      // Transaksi Andi
      {
        userId: andi.userId,
        type: TransactionType.INCOME,
        category: 'Gaji',
        amount: Decimal128.fromString('10000000.00'), // Rp 10.000.000
        date: new Date(2025, 4, 1), // Bulan di JavaScript dimulai dari 0 (0 = Januari, 4 = Mei)
        description: 'Gaji bulanan Mei',
        sourceOrPaymentMethod: 'Transfer Bank ABC',
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: andi.userId,
        type: TransactionType.EXPENSE,
        category: 'Makanan & Minuman',
        amount: Decimal128.fromString('500000.00'), // Rp 500.000
        date: new Date(2025, 4, 5),
        description: 'Belanja mingguan',
        sourceOrPaymentMethod: 'Tunai',
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: andi.userId,
        type: TransactionType.EXPENSE,
        category: 'Transportasi',
        amount: Decimal128.fromString('250000.00'), // Rp 250.000
        date: new Date(2025, 4, 10),
        description: 'Bensin motor',
        sourceOrPaymentMethod: 'Kartu Debit',
        createdAt: now,
        updatedAt: now,
      },
      // Transaksi Siti
      {
        userId: siti.userId,
        type: TransactionType.INCOME,
        category: 'Proyek Freelance',
        amount: Decimal128.fromString('2500000.00'), // Rp 2.500.000
        date: new Date(2025, 4, 15),
        description: 'Pembayaran proyek desain logo',
        sourceOrPaymentMethod: 'Transfer Bank XYZ',
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: siti.userId,
        type: TransactionType.EXPENSE,
        category: 'Tagihan',
        amount: Decimal128.fromString('300000.00'), // Rp 300.000
        date: new Date(2025, 4, 20),
        description: 'Tagihan internet bulanan',
        sourceOrPaymentMethod: 'Auto Debit',
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: siti.userId,
        type: TransactionType.EXPENSE,
        category: 'Hiburan',
        amount: Decimal128.fromString('150000.00'), // Rp 150.000
        date: new Date(2025, 4, 22),
        description: 'Tiket bioskop',
        sourceOrPaymentMethod: 'Dompet Digital ABC',
        createdAt: now,
        updatedAt: now,
      },
    ];

    const insertedTransactions = await transactionsCollection.insertMany(transactionsToSeed);
    console.log(`${insertedTransactions.insertedCount} transaksi berhasil ditambahkan.`);

    console.log('Database seeding selesai!');

  } catch (error) {
    console.error('Gagal melakukan seeding database:', error);
  } finally {
    await client.close();
    console.log('Koneksi ke MongoDB ditutup.');
  }
}

// Jalankan fungsi seed
seedDatabase();