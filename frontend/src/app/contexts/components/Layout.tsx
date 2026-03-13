import { Outlet, Link, useLocation } from "react-router";
import { ShoppingCart, User, Package, LayoutDashboard, LogOut, Store } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export const Layout = () => {
  const { user, cart, logout } = useApp();
  const location = useLocation();

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <Store className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">ShopHub</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              <Link
                to="/"
                className={`transition-colors hover:text-primary ${
                  location.pathname === "/" ? "text-primary" : "text-foreground/60"
                }`}
              >
                Home
              </Link>
              <Link
                to="/products"
                className={`transition-colors hover:text-primary ${
                  location.pathname === "/products" ? "text-primary" : "text-foreground/60"
                }`}
              >
                Products
              </Link>
              {user?.role === "admin" && (
                <Link
                  to="/admin"
                  className={`transition-colors hover:text-primary ${
                    location.pathname === "/admin" ? "text-primary" : "text-foreground/60"
                  }`}
                >
                  Admin
                </Link>
              )}
              {user?.role === "vendor" && (
                <Link
                  to="/vendor"
                  className={`transition-colors hover:text-primary ${
                    location.pathname === "/vendor" ? "text-primary" : "text-foreground/60"
                  }`}
                >
                  Vendor
                </Link>
              )}
            </nav>

            <div className="flex items-center space-x-4">
              <Link to="/cart" className="relative">
                <Button variant="ghost" size="icon">
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemsCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary text-primary-foreground">
                      {cartItemsCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              {user ? (
                <>
                  <Link to="/orders">
                    <Button variant="ghost" size="icon">
                      <Package className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/profile">
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={logout}>
                    <LogOut className="h-5 w-5" />
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost">Login</Button>
                  </Link>
                  <Link to="/register">
                    <Button>Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="mb-4">ShopHub</h3>
              <p className="text-sm text-muted-foreground">
                Your one-stop destination for quality products at great prices.
              </p>
            </div>
            <div>
              <h4 className="mb-4">Shop</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/products" className="hover:text-primary">All Products</Link></li>
                <li><Link to="/products?category=Electronics" className="hover:text-primary">Electronics</Link></li>
                <li><Link to="/products?category=Fashion" className="hover:text-primary">Fashion</Link></li>
                <li><Link to="/products?category=Sports" className="hover:text-primary">Sports</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4">Customer Service</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Contact Us</a></li>
                <li><a href="#" className="hover:text-primary">Shipping Info</a></li>
                <li><a href="#" className="hover:text-primary">Returns</a></li>
                <li><a href="#" className="hover:text-primary">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4">Account</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/profile" className="hover:text-primary">My Account</Link></li>
                <li><Link to="/orders" className="hover:text-primary">Order History</Link></li>
                <li><Link to="/cart" className="hover:text-primary">Shopping Cart</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2026 ShopHub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
