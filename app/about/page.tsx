"use client";

import { Card } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">About Us</h1>
        
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
          <p className="text-gray-600 mb-4">
            We are passionate about delivering exceptional products and experiences to our customers. Our journey began with a simple idea: to create something meaningful that would make a difference in people's lives.
          </p>
          <p className="text-gray-600">
            Today, we continue to innovate and grow, always putting our customers first and striving for excellence in everything we do.
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
          <p className="text-gray-600 mb-4">
            Our mission is to provide high-quality products while maintaining the highest standards of customer service and satisfaction. We believe in building lasting relationships with our customers and contributing positively to our community.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div>
              <h3 className="text-xl font-semibold mb-2">Values</h3>
              <ul className="list-disc list-inside text-gray-600">
                <li>Customer First</li>
                <li>Quality Excellence</li>
                <li>Innovation</li>
                <li>Integrity</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Goals</h3>
              <ul className="list-disc list-inside text-gray-600">
                <li>Sustainable Growth</li>
                <li>Community Impact</li>
                <li>Environmental Responsibility</li>
                <li>Customer Satisfaction</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}