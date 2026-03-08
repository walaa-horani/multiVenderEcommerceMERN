"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { User, Mail, Shield, Key, Save } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
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

export default function Profile() {
  const { user } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="mb-4">Please log in to view your profile</h2>
            <Link href="/login">
              <Button>Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveMsg("");
    try {
      const res = await authFetch(`${API_BASE}/api/users/profile`, {
        method: "PUT",
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveMsg("Profile updated successfully!");
        // Update local storage
        const updatedUser = { ...user, name: data.name, email: data.email };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } else {
        setSaveMsg(data.message || "Failed to update profile");
      }
    } catch (error) {
      setSaveMsg("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMsg("");
    if (newPassword !== confirmPassword) {
      setPasswordMsg("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg("Password must be at least 6 characters");
      return;
    }
    setIsChangingPassword(true);
    try {
      const res = await authFetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMsg("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMsg(data.message || "Failed to change password");
      }
    } catch (error) {
      setPasswordMsg("Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500/20 text-red-500 border-red-500/50";
      case "vendor":
        return "bg-blue-500/20 text-blue-500 border-blue-500/50";
      default:
        return "bg-green-500/20 text-green-500 border-green-500/50";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="mb-8">My Profile</h1>

      <div className="space-y-6">
        {/* Profile Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2>{user.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{user.email}</span>
                </div>
                <Badge className={`mt-2 ${getRoleBadgeClass(user.role)}`}>
                  <Shield className="h-3 w-3 mr-1" />
                  {user.role.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Edit Profile */}
        <Card>
          <CardHeader>
            <h3>Edit Profile</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {saveMsg && (
              <p className={`text-sm ${saveMsg.includes("success") ? "text-green-500" : "text-red-500"}`}>
                {saveMsg}
              </p>
            )}
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <h3>Change Password</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {passwordMsg && (
              <p className={`text-sm ${passwordMsg.includes("success") ? "text-green-500" : "text-red-500"}`}>
                {passwordMsg}
              </p>
            )}
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
              <Key className="h-4 w-4 mr-2" />
              {isChangingPassword ? "Changing..." : "Change Password"}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <h3>Quick Links</h3>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/orders">
              <Button variant="outline" className="w-full justify-start">
                My Orders
              </Button>
            </Link>
            {user.role === "admin" && (
              <Link href="/admin">
                <Button variant="outline" className="w-full justify-start">
                  Admin Dashboard
                </Button>
              </Link>
            )}
            {user.role === "vendor" && (
              <Link href="/vendor">
                <Button variant="outline" className="w-full justify-start">
                  Vendor Dashboard
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
