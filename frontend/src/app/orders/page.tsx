"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, ChevronDown, ChevronUp } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";

export default function Orders() {
  const { user, orders, cart, placeOrder, loading } = useApp();
  const router = useRouter();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });
  const [isCheckout, setIsCheckout] = useState(cart.length > 0);
  const [isPlacing, setIsPlacing] = useState(false);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="mb-4">Please log in to view orders</h2>
            <Link href="/login">
              <Button>Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter orders for the current user (customer role)
  const userOrders = user.role === "customer"
    ? orders
    : orders.filter((order) => {
      const userId = typeof order.userId === "object" ? order.userId._id : order.userId;
      return userId === user.id;
    });

  const handlePlaceOrder = async () => {
    if (!shippingAddress.street.trim() || !shippingAddress.city.trim()) {
      alert("Please enter a complete shipping address");
      return;
    }
    setIsPlacing(true);
    try {
      await placeOrder(shippingAddress);
      setIsCheckout(false);
      setShippingAddress({ street: "", city: "", state: "", zipCode: "", country: "" });
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Failed to place order");
    } finally {
      setIsPlacing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-500/20 text-green-500 border-green-500/50";
      case "shipped":
        return "bg-blue-500/20 text-blue-500 border-blue-500/50";
      case "processing":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50";
      case "cancelled":
        return "bg-red-500/20 text-red-500 border-red-500/50";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatAddress = (addr: { street?: string; city?: string; state?: string; zipCode?: string; country?: string } | string) => {
    if (typeof addr === "string") return addr;
    return [addr.street, addr.city, addr.state, addr.zipCode, addr.country].filter(Boolean).join(", ");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8">Orders</h1>

      {isCheckout && cart.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <h2>Complete Your Order</h2>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-4">Order Summary</h3>
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.product._id} className="flex justify-between">
                    <span>
                      {item.product.name} x {item.quantity}
                    </span>
                    <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">
                    $
                    {cart
                      .reduce((sum, item) => sum + item.product.price * item.quantity, 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3>Shipping Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Street</Label>
                  <Input
                    placeholder="123 Main St"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    placeholder="New York"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input
                    placeholder="NY"
                    value={shippingAddress.state}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Zip Code</Label>
                  <Input
                    placeholder="10001"
                    value={shippingAddress.zipCode}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    placeholder="US"
                    value={shippingAddress.country}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1" onClick={handlePlaceOrder} disabled={isPlacing}>
                {isPlacing ? "Placing Order..." : "Place Order"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCheckout(false);
                  router.push("/cart");
                }}
              >
                Back to Cart
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      ) : userOrders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">
              Start shopping to create your first order!
            </p>
            <Link href="/products">
              <Button size="lg">Browse Products</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {userOrders.map((order) => {
            const orderId = order._id || order.id || "";
            const orderDate = new Date(order.createdAt);
            const orderTotal = order.totalAmount || order.total || 0;
            const orderItems = order.products || order.items || [];

            return (
              <Card key={orderId}>
                <CardContent className="p-6">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() =>
                      setExpandedOrder(expandedOrder === orderId ? null : orderId)
                    }
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3>Order #{orderId.slice(-8)}</h3>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Date: {orderDate.toLocaleDateString()}</p>
                        <p>Items: {orderItems.length}</p>
                        <p>Total: ${Number(orderTotal).toFixed(2)}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      {expandedOrder === orderId ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </Button>
                  </div>

                  {expandedOrder === orderId && (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-4">
                        <div>
                          <h4 className="mb-2">Shipping Address</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatAddress(order.shippingAddress)}
                          </p>
                        </div>
                        <div>
                          <h4 className="mb-3">Items</h4>
                          <div className="space-y-3">
                            {orderItems.map((item: { productId?: { _id?: string; name?: string; price?: number }; product?: { _id?: string; name?: string; price?: number }; quantity: number; price?: number }, index: number) => {
                              const product = item.productId || item.product;
                              const itemPrice = item.price || product?.price || 0;
                              return (
                                <div
                                  key={product?._id || index}
                                  className="flex justify-between items-center"
                                >
                                  <div>
                                    <p>{product?.name || "Product"}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Quantity: {item.quantity}
                                    </p>
                                  </div>
                                  <p className="font-bold">
                                    ${(Number(itemPrice) * item.quantity).toFixed(2)}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
