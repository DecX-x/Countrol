'use client';

import { motion } from "framer-motion";
import { Cpu, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: Cpu,
    title: "AI-Powered Recommendations",
    description: "Get personalized product suggestions based on your preferences and browsing history."
  },
  {
    icon: Shield,
    title: "Secure Shopping",
    description: "Shop with confidence knowing your data is protected with enterprise-grade security."
  },
  {
    icon: Zap,
    title: "Lightning Fast Search",
    description: "Find exactly what you're looking for with our advanced search algorithms."
  }
];

export function FeaturesSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Why Choose Vyera.AI?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Experience the future of online shopping with our cutting-edge features.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="relative p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-center w-12 h-12 mb-4 bg-primary/10 rounded-full">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}