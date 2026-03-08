"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Product } from "../data/products";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface CartItem {
  product: Product;
  quantity: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: "customer" | "admin" | "vendor";
  vendorName?: string;
}

interface Order {
  _id: string;
  id?: string;
  userId: string | { _id: string; name: string; email: string };
  products: {
    productId: Product;
    quantity: number;
    price: number;
  }[];
  items?: CartItem[];
  totalAmount: number;
  total?: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string | Date;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  } | string;
}

interface AppContextType {
  user: User | null;
  cart: CartItem[];
  orders: Order[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string, role?: "customer" | "vendor", storeName?: string) => Promise<void>;
  placeOrder: (shippingAddress: { street: string; city: string; state: string; zipCode: string; country: string }) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order["status"]) => Promise<void>;
  fetchOrders: () => Promise<void>;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
};

// Helper function to get token from cookie
const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
  if (match) return decodeURIComponent(match[1]);
  return localStorage.getItem("token");
};

// Helper for authenticated fetch
const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = getToken();
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // Load user & cart from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedCart = localStorage.getItem("cart");

    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
    }
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  // Sync cart to localStorage (local backup) AND MongoDB
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Fetch cart from MongoDB when user logs in
  const fetchCart = useCallback(async () => {
    if (!user) return;
    try {
      const res = await authFetch(`${API_BASE}/api/cart`);
      if (res.ok) {
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          const mongoCart: CartItem[] = data.products
            .filter((item: { productId: Product | null }) => item.productId !== null)
            .map((item: { productId: Product; quantity: number }) => ({
              product: item.productId,
              quantity: item.quantity,
            }));
          setCart(mongoCart);
        }
      }
    } catch (error) {
      console.error("Failed to fetch cart from DB:", error);
    }
  }, [user]);

  // On user login, fetch their cart from MongoDB
  useEffect(() => {
    if (user) {
      fetchCart();
    }
  }, [user, fetchCart]);

  // Fetch orders when user logs in
  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let url = `${API_BASE}/api/orders/myorders`;
      if (user.role === "admin" || user.role === "vendor") {
        url = `${API_BASE}/api/orders`;
      }
      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Auto-fetch orders when user changes
  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setOrders([]);
    }
  }, [user, fetchOrders]);

  // ──────────────── Cart operations (sync to MongoDB) ────────────────

  const syncCartToMongo = async (updatedCart: CartItem[]) => {
    if (!user) return;
    try {
      // Clear MongoDB cart first, then re-add all items
      await authFetch(`${API_BASE}/api/cart`, { method: "DELETE" });
      for (const item of updatedCart) {
        await authFetch(`${API_BASE}/api/cart`, {
          method: "POST",
          body: JSON.stringify({
            productId: item.product._id,
            quantity: item.quantity,
          }),
        });
      }
    } catch (error) {
      console.error("Failed to sync cart to DB:", error);
    }
  };

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product._id === product._id);
      let newCart: CartItem[];
      if (existingItem) {
        newCart = prevCart.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newCart = [...prevCart, { product, quantity: 1 }];
      }

      // Sync to MongoDB in background
      if (user) {
        authFetch(`${API_BASE}/api/cart`, {
          method: "POST",
          body: JSON.stringify({ productId: product._id, quantity: 1 }),
        }).catch(console.error);
      }

      return newCart;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product._id !== productId));

    // Sync to MongoDB
    if (user) {
      authFetch(`${API_BASE}/api/cart/${productId}`, { method: "DELETE" }).catch(console.error);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product._id === productId ? { ...item, quantity } : item
      )
    );

    // Sync to MongoDB
    if (user) {
      authFetch(`${API_BASE}/api/cart/${productId}`, {
        method: "PUT",
        body: JSON.stringify({ quantity }),
      }).catch(console.error);
    }
  };

  const clearCart = () => {
    setCart([]);
    // Clear MongoDB cart
    if (user) {
      authFetch(`${API_BASE}/api/cart`, { method: "DELETE" }).catch(console.error);
    }
  };

  // ──────────────── Auth ────────────────

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }
    const loggedInUser: User = {
      id: data._id,
      email: data.email,
      name: data.name,
      role: data.role,
    };
    setUser(loggedInUser);
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    if (data.token) {
      localStorage.setItem("token", data.token);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Logout even if API call fails
    }
    setUser(null);
    setOrders([]);
    setCart([]);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("cart");
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    role: "customer" | "vendor" = "customer",
    storeName?: string
  ) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role, storeName }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Registration failed");
    }
    const newUser: User = {
      id: data._id,
      email: data.email,
      name: data.name,
      role: data.role,
    };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
    if (data.token) {
      localStorage.setItem("token", data.token);
    }
  };

  // ──────────────── Orders + Stripe ────────────────

  const placeOrder = async (shippingAddress: { street: string; city: string; state: string; zipCode: string; country: string }) => {
    if (!user || cart.length === 0) return;

    const orderProducts = cart.map((item) => ({
      productId: item.product._id,
      quantity: item.quantity,
      price: item.product.price,
    }));

    const totalAmount = cart.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    try {
      // Step 1: Create the order in MongoDB
      const res = await authFetch(`${API_BASE}/api/orders`, {
        method: "POST",
        body: JSON.stringify({
          products: orderProducts,
          totalAmount,
          shippingAddress,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to place order");
      }

      const order = await res.json();

      // Step 2: Create Stripe checkout session and redirect to payment
      try {
        const stripeRes = await authFetch(`${API_BASE}/api/payments/create-checkout-session`, {
          method: "POST",
          body: JSON.stringify({ orderId: order._id }),
        });

        if (stripeRes.ok) {
          const stripeData = await stripeRes.json();
          if (stripeData.url) {
            // Clear cart before redirecting
            clearCart();
            // Redirect to Stripe checkout
            window.location.href = stripeData.url;
            return;
          }
        }
      } catch (stripeError) {
        console.error("Stripe checkout failed, order still created:", stripeError);
      }

      // Fallback: if Stripe not configured, just clear cart and refresh orders
      clearCart();
      await fetchOrders();
    } catch (error) {
      console.error("Failed to place order:", error);
      throw error;
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order["status"]) => {
    try {
      const res = await authFetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            (order._id === orderId || order.id === orderId) ? { ...order, status } : order
          )
        );
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        cart,
        orders,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        login,
        logout,
        register,
        placeOrder,
        updateOrderStatus,
        fetchOrders,
        loading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
