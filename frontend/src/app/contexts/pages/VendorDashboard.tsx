import { useState } from "react";
import { useNavigate } from "react-router";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Package, DollarSign, TrendingUp, ShoppingCart, AlertCircle } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { products } from "../data/products";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Progress } from "../components/ui/progress";

export const VendorDashboard = () => {
  const { user, orders } = useApp();
  const navigate = useNavigate();

  if (!user || user.role !== "vendor") {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="mb-4">Access Denied</h2>
            <p className="text-muted-foreground mb-6">
              You need vendor privileges to access this page.
            </p>
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter products and orders for this vendor
  const vendorName = user.vendorName || "TechVendor";
  const vendorProducts = products.filter((p) => p.vendor === vendorName);
  const vendorOrders = orders.filter((order) =>
    order.items.some((item) => item.product.vendor === vendorName)
  );

  // Calculate statistics
  const totalRevenue = vendorOrders.reduce((sum, order) => {
    const vendorTotal = order.items
      .filter((item) => item.product.vendor === vendorName)
      .reduce((itemSum, item) => itemSum + item.product.price * item.quantity, 0);
    return sum + vendorTotal;
  }, 0);

  const totalOrders = vendorOrders.length;
  const totalProducts = vendorProducts.length;
  const lowStockProducts = vendorProducts.filter((p) => p.stock < 20);

  // Sales trend data (mock data for demonstration)
  const salesTrend = [
    { month: "Jan", sales: 4000 },
    { month: "Feb", sales: 3000 },
    { month: "Mar", sales: 5000 },
    { month: "Apr", sales: 4500 },
    { month: "May", sales: 6000 },
    { month: "Jun", sales: 5500 },
  ];

  // Product performance
  const productPerformance = vendorProducts.map((product) => {
    const productOrders = vendorOrders.filter((order) =>
      order.items.some((item) => item.product.id === product.id)
    );
    const revenue = productOrders.reduce((sum, order) => {
      const productItems = order.items.filter((item) => item.product.id === product.id);
      return (
        sum +
        productItems.reduce(
          (itemSum, item) => itemSum + item.product.price * item.quantity,
          0
        )
      );
    }, 0);
    return {
      ...product,
      revenue,
    };
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1>Vendor Dashboard</h1>
          <p className="text-muted-foreground">{vendorName}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Revenue</span>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold text-primary">
              ${totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-green-500 flex items-center mt-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Orders</span>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-green-500 flex items-center mt-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              +8.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Products</span>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-2">Active listings</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Low Stock Alerts</span>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
            <div className="text-2xl font-bold">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground mt-2">Products below 20 units</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sales Trend Chart */}
        <Card>
          <CardHeader>
            <h3>Sales Trend</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="month" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                  }}
                />
                <Line type="monotone" dataKey="sales" stroke="#d80000" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products Chart */}
        <Card>
          <CardHeader>
            <h3>Top Products by Revenue</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={productPerformance
                  .sort((a, b) => b.revenue - a.revenue)
                  .slice(0, 5)}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                  }}
                />
                <Bar dataKey="revenue" fill="#d80000" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Management */}
      <Card className="mb-8">
        <CardHeader>
          <h3>Inventory Status</h3>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendorProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>${product.price}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span>{product.stock} units</span>
                      </div>
                      <Progress
                        value={(product.stock / 100) * 100}
                        className="h-2"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.stock === 0 ? (
                      <Badge variant="destructive">Out of Stock</Badge>
                    ) : product.stock < 20 ? (
                      <Badge className="bg-yellow-500/20 text-yellow-500">
                        Low Stock
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500/20 text-green-500">
                        In Stock
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <h3>Recent Orders</h3>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendorOrders.slice(0, 10).map((order) => {
                const vendorItems = order.items.filter(
                  (item) => item.product.vendor === vendorName
                );
                const vendorRevenue = vendorItems.reduce(
                  (sum, item) => sum + item.product.price * item.quantity,
                  0
                );

                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.createdAt.toLocaleDateString()}</TableCell>
                    <TableCell>
                      {vendorItems.map((item) => item.product.name).join(", ")}
                    </TableCell>
                    <TableCell>${vendorRevenue.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          order.status === "delivered"
                            ? "bg-green-500/20 text-green-500"
                            : order.status === "shipped"
                            ? "bg-blue-500/20 text-blue-500"
                            : "bg-yellow-500/20 text-yellow-500"
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
