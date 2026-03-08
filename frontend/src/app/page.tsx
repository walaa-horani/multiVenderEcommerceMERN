"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, Clock, CreditCard } from "lucide-react";
import { Product } from "./data/products";
import { ProductCard } from "./components/ProductCard";
import { Button } from "./components/ui/button";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/products");
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };
    fetchProducts();
  }, []);

  const featuredProducts = products.filter((p) => p.featured).slice(0, 4);

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero Section */}
      <section className="relative w-full h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#121212]/80 to-[#0a0a0a] z-10" />

        {/* Abstract Background Elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] z-0" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-900/20 rounded-full blur-[128px] z-0" />

        <div className="container relative z-20 mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Elevate Your <br />
            <span className="text-primary">Lifestyle</span>
          </h1>
          <p className="mt-4 text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-10">
            Discover premium products from top vendors worldwide. Experience the future of online shopping today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/products">
              <Button size="lg" className="h-14 px-8 text-lg font-semibold bg-primary hover:bg-red-700 text-white rounded-full w-full sm:w-auto transition-transform hover:scale-105 duration-300 shadow-[0_0_20px_rgba(216,0,0,0.4)]">
                Shop Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold rounded-full w-full sm:w-auto border-gray-600 text-white hover:bg-white/5 hover:text-white transition-all duration-300 bg-transparent">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Highlights / Features Section */}
      <section className="py-20 border-t border-white/5 bg-[#121212]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/50 transition-colors duration-300">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Truck className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">Free Shipping</h3>
              <p className="text-gray-400">On all orders over $100</p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/50 transition-colors duration-300">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">Secure Payments</h3>
              <p className="text-gray-400">100% protected transactions</p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/50 transition-colors duration-300">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Clock className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">24/7 Support</h3>
              <p className="text-gray-400">Always here to help you</p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/50 transition-colors duration-300">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CreditCard className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">Easy Returns</h3>
              <p className="text-gray-400">30-day return policy</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-24 bg-[#0a0a0a]">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
                Featured <span className="text-primary">Products</span>
              </h2>
              <p className="text-gray-400 max-w-2xl text-lg">
                Handpicked premium items just for you. Quality guaranteed.
              </p>
            </div>
            <Link href="/products" className="hidden sm:flex items-center text-primary font-medium hover:text-red-400 transition-colors">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          <div className="mt-10 flex justify-center sm:hidden">
            <Link href="/products">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                View All Products <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 relative overflow-hidden bg-[#121212] border-t border-white/5">
        <div className="absolute inset-0 bg-primary/5 z-0" />
        <div className="container relative z-10 mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white text-center">
            Join Our Newsletter
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-10 text-lg">
            Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
          </p>
          <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 rounded-full bg-[#1a1a1a] border border-white/10 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
            <Button size="lg" className="rounded-full bg-primary hover:bg-red-700 text-white px-8 h-auto py-4 font-semibold shadow-[0_0_15px_rgba(216,0,0,0.3)]">
              Subscribe
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
