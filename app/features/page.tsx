'use client';

import { motion } from 'framer-motion';
import { Bot, Zap, Shield, Cpu, Clock, Gift } from 'lucide-react';

const features = [
  {
    icon: Bot,
    title: "AI Shopping Assistant",
    description: "Get personalized recommendations and instant help with our advanced AI assistant."
  },
  {
    icon: Zap,
    title: "Lightning Fast Search",
    description: "Find exactly what you're looking for with our powerful search algorithms."
  },
  {
    icon: Shield,
    title: "Secure Shopping",
    description: "Shop with confidence knowing your data is protected with enterprise-grade security."
  },
  {
    icon: Cpu,
    title: "Smart Recommendations",
    description: "Discover products you'll love with our intelligent recommendation system."
  },
  {
    icon: Clock,
    title: "24/7 Support",
    description: "Get help anytime with our round-the-clock customer support team."
  },
  {
    icon: Gift,
    title: "Rewards Program",
    description: "Earn points with every purchase and unlock exclusive rewards."
  }
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold mb-6">
            <span className="gradient-text">Why Choose Vyera.AI?</span>
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Experience the future of online shopping with our cutting-edge features and AI-powered platform.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-effect p-6 rounded-2xl"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
              </div>
              <p className="text-white/80 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}