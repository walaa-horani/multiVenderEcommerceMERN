"use client";
import React, { useEffect, useState, useRef } from "react";
import { useApp } from "../contexts/AppContext";
import { useRouter, useSearchParams } from "next/navigation";

export function WebMCPBadge() {
  const { cart, addToCart } = useApp();
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const cartRef = useRef(cart);
  const addToCartRef = useRef(addToCart);
  const routerRef = useRef(router);

  useEffect(() => {
    cartRef.current = cart;
    addToCartRef.current = addToCart;
    routerRef.current = router;
  }, [cart, addToCart, router]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.navigator && "modelContext" in window.navigator) {
      setEnabled(true);
      const modelContext = (window.navigator as any).modelContext;

      // Register Add to Cart
      modelContext.registerTool({
        name: "add_to_cart",
        description: "Adds a product to the cart by fetching its details via ID",
        inputSchema: {
          type: "object",
          properties: {
            productId: { type: "string", description: "The ID of the product to add" }
          },
          required: ["productId"]
        },
        execute: async (args: any) => {
          try {
             const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
             const res = await fetch(`${API_BASE}/api/products/${args.productId}`);
             const product = await res.json();
             if (product && product._id) {
               addToCartRef.current(product);
               return { result: { text: `Successfully added ${product.name} (Price: $${product.price}) to the cart. Your cart has been updated.` } };
             }
             return { result: { text: "Product not found." } };
          } catch(e) { return { result: { text: `Error: ${String(e)}` } }; }
        }
      });

      // Register Search Products
      modelContext.registerTool({
        name: "search_products",
        description: "Searches for products and returns an array of matching products along with their IDs and prices. It also navigates the user's browser to the results.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "The search term" }
          },
          required: ["query"]
        },
        execute: async (args: any) => {
          try {
            const searchQuery = args?.query || "";
            // Navigate the UI
            routerRef.current.push(`/products?search=${encodeURIComponent(searchQuery)}`);
            
            // Also fetch the results to return to the AI
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const res = await fetch(`${API_BASE}/api/products`);
            const allProducts = await res.json();
            
            const filtered = allProducts.filter((p: any) => 
               p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
               p.description.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (filtered.length === 0) {
               return { result: { text: `Navigated to search results for '${searchQuery}'. No products found matching your search.` } };
            }

            const productDataForAi = filtered.map((p: any) => `${p.name} (ID: ${p._id}, Price: $${p.price})`).join("\n");
            
            return { result: { text: `Navigated to search results for '${searchQuery}'. Found the following items:\n${productDataForAi}\n\nYou can use the add_to_cart tool with these IDs.` } };
          } catch (e) {
            return { result: { text: `Navigated to search results, but failed to fetch product data for AI context: ${String(e)}` } };
          }
        }
      });

      // Register Get Cheapest Products
      modelContext.registerTool({
        name: "get_cheapest_products",
        description: "Returns the 5 cheapest products available in the store. You can optionally filter by category.",
        inputSchema: {
          type: "object",
          properties: {
            category: { type: "string", description: "Optional category to filter by (e.g., Electronics, Fashion, Sports)" }
          }
        },
        execute: async (args: any) => {
          try {
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const res = await fetch(`${API_BASE}/api/products`);
            let products = await res.json();

            if (args?.category) {
              products = products.filter((p: any) => p.category.toLowerCase() === args.category.toLowerCase());
            }

            const cheapest = products.sort((a: any, b: any) => a.price - b.price).slice(0, 5);

            if (cheapest.length === 0) {
              return { result: { text: "No products found matching that criteria." } };
            }

            const productDataForAi = cheapest.map((p: any) => `${p.name} (ID: ${p._id}, Price: $${p.price}, Category: ${p.category})`).join("\n");

            return { result: { text: `Found these 5 cheapest items:\n${productDataForAi}\n\nYou can use the add_to_cart tool with these IDs.` } };
          } catch (e) {
            return { result: { text: `Error fetching cheapest products: ${String(e)}` } };
          }
        }
      });

      // Register Check Budget
      modelContext.registerTool({
        name: "check_budget",
        description: "Checks if the current cart total is within the specified budget",
        inputSchema: {
          type: "object",
          properties: {
            budget: { type: "number", description: "The budget limit" }
          }
        },
        execute: async (args: any) => {
          const currentCart = cartRef.current;
          const totalAmount = currentCart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
          const totalStr = `$${totalAmount.toFixed(2)}`;
          
          if (args?.budget !== undefined) {
            if (totalAmount <= args.budget) {
              return { result: { text: `You are within budget! Current total is ${totalStr}, budget is $${args.budget.toFixed(2)}.` } };
            } else {
              return { result: { text: `You are over budget. Current total is ${totalStr}, budget is $${args.budget.toFixed(2)}.` } };
            }
          }
          
          return { result: { text: `The current cart total is ${totalStr}. (No budget limit was provided for comparison).` } };
        }
      });
    }
  }, []); // Run only once

  if (!enabled) return null;

  return (
    <div className="flex items-center ml-4">
      <div className="px-3 py-1 text-xs font-bold rounded-full mr-2" style={{
        background: "linear-gradient(45deg, rgba(255, 0, 128, 0.2), rgba(128, 0, 255, 0.2))",
        border: "1px solid #ff0080",
        boxShadow: "0 0 10px #ff0080, 0 0 20px #8000ff",
        color: "#ffffff",
        textShadow: "0 0 5px #ff0080, 0 0 10px #8000ff"
      }}>
        ⚡ WebMCP Enabled
      </div>
    </div>
  );
}
