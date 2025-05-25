// src/mongodbClient.ts
import { MongoClient, Db } from 'mongodb';
import { Transaction, User } from './interfaces';
import { config } from 'dotenv';

config(); // Load environment variables from .env file


const MONGO_URI = process.env.MONGO_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getMongoDB(): Promise<Db> {
  if (db && client) {
    return db;
  }
  
  // Close existing connection if any
  if (client) {
    await client.close();
  }
  
  // Create new connection with explicit options
  client = new MongoClient(MONGO_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    // Force write concern
    writeConcern: {
      w: 'majority',
      j: true, // Journal acknowledgment
      wtimeout: 30000
    }
  });
  
  await client.connect();
  console.log('Terhubung ke MongoDB untuk tools.');
  
  db = client.db(DATABASE_NAME);
  
  // Test connection immediately
  await db.admin().ping();
  console.log('MongoDB connection verified.');
  
  return db;
}

export async function closeMongoDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed.');
  }
}

export function getTransactionsCollection(database: Db) {
  return database.collection<Transaction>('transactions');
}

export function getUsersCollection(database: Db) {
  return database.collection<User>('users');
}