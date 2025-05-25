'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import Image from 'next/image';

const products = [
  {
    id: 1,
    name: "Smart Watch Pro",
    price: 299.99,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=400&h=400",
    category: "Electronics"
  },
  {
    id: 2,
    name: "Wireless Earbuds",
    price: 159.99,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=400&h=400",
    category: "Audio"
  },
  {
    id: 3,
    name: "AI Camera",
    price: 499.99,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&h=400",
    category: "Photography"
  },
  {
    id: 4,
    name: "Smart Home Hub",
    price: 199.99,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1558089687-f282ffcbc126?auto=format&fit=crop&w=400&h=400",
    category: "Smart Home"
  },
  {
    id: 5,
    name: "Gaming Headset",
    price: 129.99,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=400&h=400",
    category: "Gaming"
  },
  {
    id: 6,
    name: "Fitness Tracker",
    price: 89.99,
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1575311373937-040b8e3fd6ce?auto=format&fit=crop&w=400&h=400",
    category: "Fitness"
  }
];

export function ProductGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Link href={`/products/${product.id}`}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-white/5 border-white/10">
              <CardContent className="p-0">
                <div className="relative">
                  <div className="relative h-64 w-full">
                    <Image 
                      src={product.image} 
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Badge className="absolute top-4 right-4">{product.category}</Badge>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                  <div className="flex items-center mb-4">
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <span className="ml-2">{product.rating}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold gradient-text">
                      ${product.price}
                    </span>
                    <Button variant="default">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}