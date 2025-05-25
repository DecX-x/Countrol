'use client';

import { motion } from 'framer-motion';
import { HeroSection } from '@/components/hero-section';
import { FeaturesSection } from '@/components/features-section';
import { IncomeExpenseComparison } from '@/components/income-expense-comparison';

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      
      {/* Income vs Expense Comparison Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
          </motion.div>
        </div>
      </section>
    </div>
  );
}