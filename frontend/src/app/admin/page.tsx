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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Package, Users, DollarSign, TrendingUp, ShoppingCart, Trash2, Edit, Plus } from "lucide-react";
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
import { Separator } from "../components/ui/separator";

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

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface VendorData {
  _id: string;
  storeName: string;
  storeDescription?: string;
  userId: { _id: string; name: string; email: string };
  createdAt: string;
}

interface CategoryData {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

export default function AdminDashboard() {
  const { user, orders, updateOrderStatus } = useApp();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
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
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
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
    if (user && user.role === "admin") {
      fetchProducts();
      fetchUsers();
      fetchVendors();
      fetchCategories();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/products`);
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/users`);
      if (res.ok) setUsers(await res.json());
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/vendors`);
      if (res.ok) setVendors(await res.json());
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/categories`);
      if (res.ok) setCategories(await res.json());
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await authFetch(`${API_BASE}/api/users/${userId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        fetchUsers();
        fetchVendors();
      }
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await authFetch(`${API_BASE}/api/users/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchUsers();
        fetchVendors();
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const handleInviteAdmin = async () => {
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      const res = await authFetch(`${API_BASE}/api/users/invite-admin`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Invitation sent successfully!");
        setInviteEmail("");
      } else {
        alert(data.message || "Failed to send invitation.");
      }
    } catch (error) {
      console.error("Failed to invite admin:", error);
      alert("An error occurred while sending the invitation.");
    } finally {
      setIsInviting(false);
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (!confirm("Are you sure you want to delete this vendor and all their products?")) return;
    try {
      const res = await authFetch(`${API_BASE}/api/vendors/${vendorId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchVendors();
        fetchProducts();
        fetchUsers();
      }
    } catch (error) {
      console.error("Failed to delete vendor:", error);
    }
  };

  const handleEditCategoryClick = (cat: CategoryData) => {
    setNewCategoryName(cat.name);
    setNewCategoryDesc(cat.description || "");
    setEditingCategoryId(cat._id);
  };

  const handleSubmitCategory = async () => {
    if (!newCategoryName.trim()) return;
    const url = editingCategoryId
      ? `${API_BASE}/api/categories/${editingCategoryId}`
      : `${API_BASE}/api/categories`;
    const method = editingCategoryId ? "PUT" : "POST";

    try {
      const res = await authFetch(url, {
        method,
        body: JSON.stringify({ name: newCategoryName, description: newCategoryDesc }),
      });
      if (res.ok) {
        fetchCategories();
        setNewCategoryName("");
        setNewCategoryDesc("");
        setEditingCategoryId(null);
      }
    } catch (error) {
      console.error("Failed to save category:", error);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await authFetch(`${API_BASE}/api/categories/${catId}`, {
        method: "DELETE",
      });
      if (res.ok) fetchCategories();
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  };

  const handleEditProductClick = (product: Product) => {
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

  if (!user || user.role !== "admin") {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="mb-4">Access Denied</h2>
            <p className="text-muted-foreground mb-6">
              You need admin privileges to access this page.
            </p>
            <Button onClick={() => router.push("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0);
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const totalUsers = users.length;

  const categoryData = products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));
  const COLORS = ["#d80000", "#ff6b6b", "#ffa94d", "#ffd43b", "#51cf66", "#339af0"];

  const salesByCategory = orders.reduce((acc, order) => {
    const items = order.products || order.items || [];
    items.forEach((item: { productId?: { category?: string }; product?: { category?: string; price?: number }; price?: number; quantity: number }) => {
      const category = item.productId?.category || item.product?.category || "Other";
      const price = item.price || item.product?.price || 0;
      acc[category] = (acc[category] || 0) + Number(price) * item.quantity;
    });
    return acc;
  }, {} as Record<string, number>);

  const salesData = Object.entries(salesByCategory).map(([category, revenue]) => ({
    category,
    revenue: Number(revenue.toFixed(2)),
  }));

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "orders", label: "Orders" },
    { id: "products", label: "Products" },
    { id: "users", label: "Users" },
    { id: "vendors", label: "Vendors" },
    { id: "categories", label: "Categories" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1>Admin Dashboard</h1>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 flex-wrap">
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

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Revenue</span>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold text-primary">${totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-green-500 flex items-center mt-2">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  From {totalOrders} orders
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
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Products</span>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">{totalProducts}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Users</span>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">{totalUsers}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader><h3>Sales by Category</h3></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="category" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} />
                    <Bar dataKey="revenue" fill="#d80000" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><h3>Product Distribution</h3></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${((percent || 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <Card>
          <CardHeader><h3>All Orders ({orders.length})</h3></CardHeader>
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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.slice(0, 50).map((order) => {
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

      {/* Products Tab */}
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
            <CardHeader><h3>All Products ({products.length})</h3></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Vendor</TableHead>
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
                      <TableCell>{product.vendorId?.storeName || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditProductClick(product)}>
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

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <Card>
            <CardHeader><h3>Invite Admin</h3></CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    placeholder="admin@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <Button onClick={handleInviteAdmin} disabled={isInviting}>
                  {isInviting ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h3>All Users ({users.length})</h3></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Select
                          value={u.role}
                          onValueChange={(value) => handleRoleChange(u._id, value)}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">Customer</SelectItem>
                            <SelectItem value="vendor">Vendor</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(u._id)}
                          disabled={u._id === user.id}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vendors Tab */}
      {activeTab === "vendors" && (
        <Card>
          <CardHeader><h3>All Vendors ({vendors.length})</h3></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((v) => (
                  <TableRow key={v._id}>
                    <TableCell className="font-medium">{v.storeName}</TableCell>
                    <TableCell>{v.userId?.name || "-"}</TableCell>
                    <TableCell>{v.userId?.email || "-"}</TableCell>
                    <TableCell>{new Date(v.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteVendor(v._id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Categories Tab */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          <Card>
            <CardHeader><h3>{editingCategoryId ? "Edit Category" : "Add Category"}</h3></CardHeader>
            <CardContent>
              <div className="flex gap-3 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="Category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="Optional description"
                    value={newCategoryDesc}
                    onChange={(e) => setNewCategoryDesc(e.target.value)}
                  />
                </div>
                <Button onClick={handleSubmitCategory}>
                  {editingCategoryId ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  {editingCategoryId ? "Update" : "Add"}
                </Button>
                {editingCategoryId && (
                  <Button variant="outline" onClick={() => {
                    setEditingCategoryId(null);
                    setNewCategoryName("");
                    setNewCategoryDesc("");
                  }}>
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h3>All Categories ({categories.length})</h3></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat._id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="text-muted-foreground">{cat.slug}</TableCell>
                      <TableCell>{cat.description || "-"}</TableCell>
                      <TableCell>
                        {products.filter((p) => p.category === cat.name).length}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditCategoryClick(cat)}>
                            <Edit className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat._id)}>
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
