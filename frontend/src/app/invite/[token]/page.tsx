"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function InviteAdminPage({ params }: { params: { token: string } }) {
    const router = useRouter();
    const token = params.token;

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await fetch(`${API_BASE}/api/users/register-admin`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    token,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                // Force context to update or redirect to login to fetch user
                // We can just redirect to admin dashboard, which will trigger context fetch
                window.location.href = "/admin";
            } else {
                setError(data.message || "Failed to register admin.");
            }
        } catch (err) {
            console.error("Failed to register admin:", err);
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center space-y-2">
                    <CardTitle className="text-3xl font-extrabold text-[#d80000]">
                        Admin Invitation
                    </CardTitle>
                    <CardDescription>
                        You have been invited to become an administrator. Please set up your account below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm rounded-lg p-3 text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="admin@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}

                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Must match the email the invitation was sent to.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-[#d80000] hover:bg-[#b00000] text-white"
                            disabled={isLoading}
                        >
                            {isLoading ? "Setting up account..." : "Accept Invitation & Register"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
