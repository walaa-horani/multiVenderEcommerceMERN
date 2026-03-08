"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Package, DollarSign, TrendingUp, ShoppingCart, Trash2, Plus, Edit } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { Product } from "../data/products";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
  if (match) return decodeURIComponent(match[1]);
  return localStorage.getItem("token");
};

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

interface Earnings {
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  orderCount: number;
}

export default function VendorDashboard() {
  const { user, orders, updateOrderStatus } = useApp();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [earnings, setEarnings] = useState<Earnings>({ totalEarnings: 0, pendingEarnings: 0, paidEarnings: 0, orderCount: 0 });
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    images: "",
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newImageUrls: string[] = [];

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      alert("Cloudinary credentials are not configured in .env.local");
      setIsUploading(false);
      return;
    }

    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);
        formData.append("upload_preset", uploadPreset);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          newImageUrls.push(data.secure_url);
        }
      }

      if (newImageUrls.length > 0) {
        setNewProduct((prev) => ({
          ...prev,
          images: prev.images ? prev.images + ", " + newImageUrls.join(", ") : newImageUrls.join(", "),
        }));
      }
    } catch (error) {
      console.error("Error uploading images:", error);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = ""; // Reset input
    }
  };
  useEffect(() => {
    if (user && user.role === "vendor") {
      fetchProducts();
      fetchEarnings();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/products/myproducts`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const fetchEarnings = async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/payments/earnings`);
      if (res.ok) setEarnings(await res.json());
    } catch (error) {
      console.error("Failed to fetch earnings:", error);
    }
  };

  const handleEditClick = (product: Product) => {
    setNewProduct({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
      images: product.images ? product.images.join(", ") : "",
    });
    setEditingProductId(product._id);
    setShowAddProduct(true);
  };

  const handleSubmitProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.price || !newProduct.category) return;
    const url = editingProductId
      ? `${API_BASE}/api/products/${editingProductId}`
      : `${API_BASE}/api/products`;
    const method = editingProductId ? "PUT" : "POST";

    try {
      const res = await authFetch(url, {
        method,
        body: JSON.stringify({
          name: newProduct.name,
          description: newProduct.description,
          price: Number(newProduct.price),
          stock: Number(newProduct.stock) || 0,
          category: newProduct.category,
          images: newProduct.images.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        fetchProducts();
        setShowAddProduct(false);
        setEditingProductId(null);
        setNewProduct({ name: "", description: "", price: "", stock: "", category: "", images: "" });
      }
    } catch (error) {
      console.error("Failed to save product:", error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await authFetch(`${API_BASE}/api/products/${productId}`, {
        method: "DELETE",
      });
      if (res.ok) fetchProducts();
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  if (!user || user.role !== "vendor") {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="mb-4">Access Denied</h2>
            <p className="text-muted-foreground mb-6">
              You need vendor privileges to access this page.
            </p>
            <Button onClick={() => router.push("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Monthly sales data from orders
  const monthlySales = orders.reduce((acc, order) => {
    const date = new Date(order.createdAt);
    const month = date.toLocaleString("default", { month: "short" });
    const total = order.totalAmount || order.total || 0;
    acc[month] = (acc[month] || 0) + Number(total);
    return acc;
  }, {} as Record<string, number>);

  const salesChartData = Object.entries(monthlySales).map(([month, sales]) => ({
    month,
    sales: Number(sales.toFixed(2)),
  }));

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "orders", label: "Orders" },
    { id: "products", label: "My Products" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1>Vendor Dashboard</h1>
      </div>

      <div className="flex gap-2 mb-8">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            onClick={() => setActiveTab(tab.id)}
            size="sm"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Earnings</span>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold text-primary">
                  ${earnings.totalEarnings.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold text-yellow-500">
                  ${earnings.pendingEarnings.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Orders</span>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">{earnings.orderCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Products</span>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">{products.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><h3>Sales Trend</h3></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="month" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} />
                  <Bar dataKey="sales" fill="#d80000" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === "orders" && (
        <Card>
          <CardHeader><h3>Vendor Orders ({orders.length})</h3></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const orderId = order._id || order.id || "";
                  const customerName = typeof order.userId === "object" ? order.userId.name : order.userId;
                  const orderItems = order.products || order.items || [];
                  const orderTotal = order.totalAmount || order.total || 0;

                  return (
                    <TableRow key={orderId}>
                      <TableCell className="font-medium">{orderId.slice(-8)}</TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{customerName}</TableCell>
                      <TableCell>{orderItems.length}</TableCell>
                      <TableCell>${Number(orderTotal).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            order.status === "delivered"
                              ? "bg-green-500/20 text-green-500"
                              : order.status === "shipped"
                                ? "bg-blue-500/20 text-blue-500"
                                : order.status === "cancelled"
                                  ? "bg-red-500/20 text-red-500"
                                  : "bg-yellow-500/20 text-yellow-500"
                          }
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) =>
                            updateOrderStatus(orderId, value as "pending" | "processing" | "shipped" | "delivered" | "cancelled")
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === "products" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => {
              setShowAddProduct(!showAddProduct);
              if (showAddProduct) {
                setEditingProductId(null);
                setNewProduct({ name: "", description: "", price: "", stock: "", category: "", images: "" });
              }
            }}>
              <Plus className="h-4 w-4 mr-2" />
              {showAddProduct ? "Cancel" : "Add Product"}
            </Button>
          </div>

          {showAddProduct && (
            <Card>
              <CardHeader><h3>{editingProductId ? "Edit Product" : "Add New Product"}</h3></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      placeholder="Product name"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Input
                      placeholder="e.g. Electronics"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price *</Label>
                    <Input
                      type="number"
                      placeholder="29.99"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock</Label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Product description..."
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Image URLs (comma separated)</Label>
                  <Input
                    placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                    value={newProduct.images}
                    onChange={(e) => setNewProduct({ ...newProduct, images: e.target.value })}
                    className="mb-2"
                  />
                  <div className="flex items-center gap-4">
                    <Label className="cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md transition-colors">
                      {isUploading ? "Uploading..." : "Upload Images"}
                      <Input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                    </Label>
                    <span className="text-xs text-muted-foreground">Or select files to upload directly via Cloudinary</span>
                  </div>
                </div>
                <Button onClick={handleSubmitProduct}>{editingProductId ? "Update Product" : "Create Product"}</Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><h3>My Products ({products.length})</h3></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>${product.price}</TableCell>
                      <TableCell>
                        <Badge className={product.stock < 10 ? "bg-red-500/20 text-red-500" : "bg-green-500/20 text-green-500"}>
                          {product.stock}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(product)}>
                            <Edit className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product._id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
