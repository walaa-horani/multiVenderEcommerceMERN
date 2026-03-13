import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product } from "../data/products";

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
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: Date;
  shippingAddress: string;
  vendorId?: string;
}

interface AppContextType {
  user: User | null;
  cart: CartItem[];
  orders: Order[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  login: (email: string, password: string, role?: "customer" | "admin" | "vendor") => void;
  logout: () => void;
  register: (email: string, password: string, name: string, role?: "customer" | "admin" | "vendor") => void;
  placeOrder: (shippingAddress: string) => void;
  updateOrderStatus: (orderId: string, status: Order["status"]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Load data from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedCart = localStorage.getItem("cart");
    const savedOrders = localStorage.getItem("orders");

    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedOrders) {
      const parsedOrders = JSON.parse(savedOrders);
      // Convert date strings back to Date objects
      setOrders(parsedOrders.map((order: any) => ({
        ...order,
        createdAt: new Date(order.createdAt),
      })));
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Save orders to localStorage
  useEffect(() => {
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders]);

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const login = (email: string, password: string, role: "customer" | "admin" | "vendor" = "customer") => {
    // Mock login - in real app, this would call an API
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name: email.split("@")[0],
      role,
      vendorName: role === "vendor" ? "TechVendor" : undefined,
    };
    setUser(mockUser);
    localStorage.setItem("user", JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const register = (email: string, password: string, name: string, role: "customer" | "admin" | "vendor" = "customer") => {
    // Mock registration - in real app, this would call an API
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
      role,
      vendorName: role === "vendor" ? name : undefined,
    };
    setUser(mockUser);
    localStorage.setItem("user", JSON.stringify(mockUser));
  };

  const placeOrder = (shippingAddress: string) => {
    if (!user || cart.length === 0) return;

    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      items: [...cart],
      total: cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
      status: "pending",
      createdAt: new Date(),
      shippingAddress,
    };

    setOrders((prevOrders) => [newOrder, ...prevOrders]);
    clearCart();
  };

  const updateOrderStatus = (orderId: string, status: Order["status"]) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, status } : order
      )
    );
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
