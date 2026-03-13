import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { User, Mail, Shield, Package, Edit } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";

export const Profile = () => {
  const { user, orders, logout } = useApp();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="mb-4">Please log in to view your profile</h2>
            <Link to="/login">
              <Button>Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userOrders = orders.filter((order) => order.userId === user.id);
  const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0);

  const handleSave = () => {
    // In a real app, this would update the user via an API
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="mb-8">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h3>Personal Information</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditing ? "Cancel" : "Edit"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      user.role === "admin"
                        ? "bg-purple-500/20 text-purple-500"
                        : user.role === "vendor"
                        ? "bg-blue-500/20 text-blue-500"
                        : "bg-green-500/20 text-green-500"
                    }
                  >
                    {user.role.toUpperCase()}
                  </Badge>
                  {user.vendorName && (
                    <span className="text-sm text-muted-foreground">
                      Vendor: {user.vendorName}
                    </span>
                  )}
                </div>
              </div>
              {isEditing && (
                <Button onClick={handleSave} className="w-full">
                  Save Changes
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3>Account Actions</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Email Preferences
              </Button>
              <Separator />
              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Statistics */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3>Statistics</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Orders</span>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">{userOrders.length}</div>
              </div>
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Spent</span>
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold text-primary">
                  ${totalSpent.toFixed(2)}
                </div>
              </div>
              <Separator />
              <div>
                <div className="text-sm text-muted-foreground mb-2">
                  Member Since
                </div>
                <div className="font-medium">March 2026</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3>Quick Links</h3>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/orders">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="h-4 w-4 mr-2" />
                  My Orders
                </Button>
              </Link>
              {user.role === "admin" && (
                <Link to="/admin">
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin Dashboard
                  </Button>
                </Link>
              )}
              {user.role === "vendor" && (
                <Link to="/vendor">
                  <Button variant="outline" className="w-full justify-start">
                    <Package className="h-4 w-4 mr-2" />
                    Vendor Dashboard
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
