import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Package, ChevronDown, ChevronUp } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";

export const Orders = () => {
  const { user, orders, cart, placeOrder } = useApp();
  const navigate = useNavigate();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState("");
  const [isCheckout, setIsCheckout] = useState(cart.length > 0);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="mb-4">Please log in to view orders</h2>
            <Link to="/login">
              <Button>Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userOrders = orders.filter((order) => order.userId === user.id);

  const handlePlaceOrder = () => {
    if (!shippingAddress.trim()) {
      alert("Please enter a shipping address");
      return;
    }
    placeOrder(shippingAddress);
    setIsCheckout(false);
    setShippingAddress("");
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
                  <div key={item.product.id} className="flex justify-between">
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

            <div className="space-y-2">
              <Label>Shipping Address</Label>
              <Input
                placeholder="Enter your shipping address"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button className="flex-1" onClick={handlePlaceOrder}>
                Place Order
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCheckout(false);
                  navigate("/cart");
                }}
              >
                Back to Cart
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {userOrders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">
              Start shopping to create your first order!
            </p>
            <Link to="/products">
              <Button size="lg">Browse Products</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {userOrders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() =>
                    setExpandedOrder(expandedOrder === order.id ? null : order.id)
                  }
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3>Order #{order.id}</h3>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Date: {order.createdAt.toLocaleDateString()}</p>
                      <p>Items: {order.items.length}</p>
                      <p>Total: ${order.total.toFixed(2)}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    {expandedOrder === order.id ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </Button>
                </div>

                {expandedOrder === order.id && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-4">
                      <div>
                        <h4 className="mb-2">Shipping Address</h4>
                        <p className="text-sm text-muted-foreground">
                          {order.shippingAddress}
                        </p>
                      </div>
                      <div>
                        <h4 className="mb-3">Items</h4>
                        <div className="space-y-3">
                          {order.items.map((item) => (
                            <div
                              key={item.product.id}
                              className="flex justify-between items-center"
                            >
                              <div>
                                <p>{item.product.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Quantity: {item.quantity}
                                </p>
                              </div>
                              <p className="font-bold">
                                ${(item.product.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
