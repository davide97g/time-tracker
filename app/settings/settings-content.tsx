"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import type { User as UserType } from "@/lib/types";
import {
  ArrowLeft,
  Calendar,
  Download,
  Mail,
  Shield,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SettingsContentProps {
  user: UserType;
}

export default function SettingsContent({ user }: SettingsContentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleSignOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleExportData = async () => {
    setIsLoading(true);
    try {
      // Fetch all user data
      const { data: clients } = await supabase
        .from("clients")
        .select(
          `
          *,
          projects (
            *,
            activities (
              *,
              time_entries (*)
            )
          )
        `
        )
        .eq("user_id", user.id);

      if (clients) {
        const dataStr = JSON.stringify(clients, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `forest-timer-data-${
          new Date().toISOString().split("T")[0]
        }.json`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Failed to export data");
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (email?: string) => {
    return email
      ?.split("@")[0]
      .split(".")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-forest-100">
      {/* Header */}
      <header className="border-b border-forest-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-forest-600 hover:text-forest-800"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-forest-800">Settings</h1>
                <p className="text-forest-600">
                  Manage your account and preferences
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6">
          {/* Profile Card */}
          <Card className="forest-card">
            <CardHeader>
              <CardTitle className="text-forest-800 flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Profile Information</span>
              </CardTitle>
              <CardDescription className="text-forest-600">
                Your account details and information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={user.avatar_url || "/placeholder.svg"}
                    alt={user.email}
                  />
                  <AvatarFallback className="bg-forest-100 text-forest-800 text-lg">
                    {getInitials(user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-lg font-medium text-forest-800">
                    {user.name || "User"}
                  </h3>
                  <p className="text-forest-600">{user.email}</p>
                  <Badge
                    variant="secondary"
                    className="bg-forest-100 text-forest-700"
                  >
                    Google Account
                  </Badge>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-forest-50/50">
                  <Mail className="h-4 w-4 text-forest-500" />
                  <div>
                    <p className="text-sm font-medium text-forest-800">Email</p>
                    <p className="text-sm text-forest-600">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg bg-forest-50/50">
                  <Calendar className="h-4 w-4 text-forest-500" />
                  <div>
                    <p className="text-sm font-medium text-forest-800">
                      Member Since
                    </p>
                    <p className="text-sm text-forest-600">
                      {new Date().toLocaleDateString([], {
                        year: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card className="forest-card">
            <CardHeader>
              <CardTitle className="text-forest-800 flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Data & Privacy</span>
              </CardTitle>
              <CardDescription className="text-forest-600">
                Manage your data and privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-forest-50/50">
                <div>
                  <h4 className="font-medium text-forest-800">
                    Export Your Data
                  </h4>
                  <p className="text-sm text-forest-600">
                    Download all your time tracking data in JSON format
                  </p>
                </div>
                <Button
                  onClick={handleExportData}
                  disabled={isLoading}
                  variant="outline"
                  className="border-forest-300 text-forest-700 hover:bg-forest-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isLoading ? "Exporting..." : "Export Data"}
                </Button>
              </div>

              <div className="p-4 rounded-lg bg-forest-50/50">
                <h4 className="font-medium text-forest-800 mb-2">
                  Data Storage
                </h4>
                <p className="text-sm text-forest-600">
                  Your data is securely stored and encrypted. We use Supabase
                  for data storage with row-level security to ensure your
                  information is protected and only accessible by you.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card className="forest-card">
            <CardHeader>
              <CardTitle className="text-forest-800">Account Actions</CardTitle>
              <CardDescription className="text-forest-600">
                Manage your account settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 border border-red-200">
                <div>
                  <h4 className="font-medium text-red-800">Sign Out</h4>
                  <p className="text-sm text-red-600">
                    Sign out of your Forest Timer account
                  </p>
                </div>
                <Button
                  onClick={handleSignOut}
                  disabled={isLoading}
                  variant="destructive"
                  className="bg-red-500 hover:bg-red-600"
                >
                  {isLoading ? "Signing Out..." : "Sign Out"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* App Information */}
          <Card className="forest-card">
            <CardHeader>
              <CardTitle className="text-forest-800">
                About Forest Timer
              </CardTitle>
              <CardDescription className="text-forest-600">
                Application information and version
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-3 rounded-lg bg-forest-50/50">
                  <p className="text-sm font-medium text-forest-800">Version</p>
                  <p className="text-sm text-forest-600">1.0.0</p>
                </div>
                <div className="p-3 rounded-lg bg-forest-50/50">
                  <p className="text-sm font-medium text-forest-800">
                    Last Updated
                  </p>
                  <p className="text-sm text-forest-600">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-forest-50/50">
                <p className="text-sm text-forest-600">
                  Forest Timer helps you track your time in harmony with nature.
                  Built with Next.js, Supabase, and shadcn/ui for a beautiful
                  and efficient time tracking experience.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
