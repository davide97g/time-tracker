"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TimeEntry, User } from "@/lib/types";
import {
  calculateEarnings,
  formatCurrency,
  formatDate,
  formatDuration,
  getEffectiveHourlyRate,
} from "@/lib/utils/time";
import {
  Activity,
  ArrowLeft,
  Clock,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

interface AnalyticsContentProps {
  user: User;
  timeEntries: (TimeEntry & {
    activity: {
      id: string;
      name: string;
      project: {
        id: string;
        name: string;
        color: string;
      };
    };
  })[];
}

export default function AnalyticsContent({
  user,
  timeEntries,
}: AnalyticsContentProps) {
  const [timeRange, setTimeRange] = useState("7d");
  const [viewMode, setViewMode] = useState<"time" | "earnings">("time");

  const filteredEntries = useMemo(() => {
    const now = new Date();
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return timeEntries.filter((entry) => new Date(entry.start_time) >= cutoff);
  }, [timeEntries, timeRange]);

  const totalTime = useMemo(() => {
    return filteredEntries.reduce(
      (total, entry) => total + (entry.duration || 0),
      0
    );
  }, [filteredEntries]);

  const projectStats = useMemo(() => {
    const stats = new Map();

    filteredEntries.forEach((entry) => {
      const project = entry.activity.project;
      const effectiveRate = getEffectiveHourlyRate({
        activity: entry.activity,
        project,
      });

      if (!stats.has(project.id)) {
        stats.set(project.id, {
          name: project.name,
          color: project.color,
          time: 0,
          earnings: 0,
          entries: 0,
        });
      }
      const stat = stats.get(project.id);
      stat.time += entry.duration || 0;
      stat.earnings += calculateEarnings(entry.duration || 0, effectiveRate);
      stat.entries += 1;
    });

    return Array.from(stats.values()).sort((a, b) =>
      viewMode === "time" ? b.time - a.time : b.earnings - a.earnings
    );
  }, [filteredEntries, viewMode]);

  const activityStats = useMemo(() => {
    const stats = new Map();

    filteredEntries.forEach((entry) => {
      const activity = entry.activity;
      const effectiveRate = getEffectiveHourlyRate({
        activity,
        project: activity.project,
      });

      if (!stats.has(activity.id)) {
        stats.set(activity.id, {
          name: activity.name,
          projectName: activity.project.name,
          time: 0,
          earnings: 0,
          entries: 0,
        });
      }
      const stat = stats.get(activity.id);
      stat.time += entry.duration || 0;
      stat.earnings += calculateEarnings(entry.duration || 0, effectiveRate);
      stat.entries += 1;
    });

    return Array.from(stats.values())
      .sort((a, b) =>
        viewMode === "time" ? b.time - a.time : b.earnings - a.earnings
      )
      .slice(0, 10);
  }, [filteredEntries, viewMode]);

  const dailyStats = useMemo(() => {
    const stats = new Map();

    filteredEntries.forEach((entry) => {
      const date = formatDate(entry.start_time);
      const effectiveRate = getEffectiveHourlyRate({
        activity: entry.activity,
        project: entry.activity.project,
      });

      if (!stats.has(date)) {
        stats.set(date, { date, time: 0, earnings: 0, entries: 0 });
      }
      const stat = stats.get(date);
      stat.time += entry.duration || 0;
      stat.earnings += calculateEarnings(entry.duration || 0, effectiveRate);
      stat.entries += 1;
    });

    return Array.from(stats.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [filteredEntries]);

  const averageSessionTime = useMemo(() => {
    if (filteredEntries.length === 0) return 0;
    return Math.floor(totalTime / filteredEntries.length);
  }, [totalTime, filteredEntries]);

  const COLORS = [
    "#22c55e",
    "#16a34a",
    "#15803d",
    "#166534",
    "#059669",
    "#0d9488",
    "#0891b2",
    "#0284c7",
  ];

  const totalEarnings = useMemo(() => {
    return filteredEntries.reduce((total, entry) => {
      const effectiveRate = getEffectiveHourlyRate({
        activity: entry.activity,
        project: entry.activity.project,
      });
      return total + calculateEarnings(entry.duration || 0, effectiveRate);
    }, 0);
  }, [filteredEntries]);

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
                <h1 className="text-2xl font-bold text-forest-800">
                  Analytics
                </h1>
                <p className="text-forest-600">
                  Insights into your time tracking
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Tabs
                value={viewMode}
                onValueChange={(value) =>
                  setViewMode(value as "time" | "earnings")
                }
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="time"
                    className="flex items-center space-x-2"
                  >
                    <Clock className="h-4 w-4" />
                    <span>Hours</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="earnings"
                    className="flex items-center space-x-2"
                  >
                    <DollarSign className="h-4 w-4" />
                    <span>Earnings</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32 border-forest-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="forest-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-forest-700">
                Total Time
              </CardTitle>
              <Clock className="h-4 w-4 text-forest-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-forest-800">
                {formatDuration(totalTime)}
              </div>
              <p className="text-xs text-forest-600">
                {timeRange === "7d"
                  ? "Last 7 days"
                  : timeRange === "30d"
                  ? "Last 30 days"
                  : "Last 90 days"}
              </p>
            </CardContent>
          </Card>

          <Card className="forest-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-forest-700">
                Total Earnings
              </CardTitle>
              <DollarSign className="h-4 w-4 text-forest-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-forest-800">
                {formatCurrency(totalEarnings)}
              </div>
              <p className="text-xs text-forest-600">
                {timeRange === "7d"
                  ? "Last 7 days"
                  : timeRange === "30d"
                  ? "Last 30 days"
                  : "Last 90 days"}
              </p>
            </CardContent>
          </Card>

          <Card className="forest-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-forest-700">
                Sessions
              </CardTitle>
              <Activity className="h-4 w-4 text-forest-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-forest-800">
                {filteredEntries.length}
              </div>
              <p className="text-xs text-forest-600">Time tracking sessions</p>
            </CardContent>
          </Card>

          <Card className="forest-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-forest-700">
                Avg Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-forest-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-forest-800">
                {totalTime > 0
                  ? formatCurrency(totalEarnings / (totalTime / 3600))
                  : formatCurrency(0)}
              </div>
              <p className="text-xs text-forest-600">Average hourly rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Daily Chart */}
          <Card className="forest-card">
            <CardHeader>
              <CardTitle className="text-forest-800">
                Daily {viewMode === "time" ? "Time Tracking" : "Earnings"}
              </CardTitle>
              <CardDescription className="text-forest-600">
                {viewMode === "time"
                  ? "Time spent each day"
                  : "Earnings generated each day"}{" "}
                over the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: {
                    label:
                      viewMode === "time" ? "Time (hours)" : "Earnings ($)",
                    color: "#22c55e",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyStats}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })
                      }
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) =>
                        viewMode === "time"
                          ? `${Math.floor(value / 3600)}h`
                          : `$${value.toFixed(0)}`
                      }
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => [
                        viewMode === "time"
                          ? formatDuration(value)
                          : formatCurrency(value),
                        viewMode === "time" ? "Time" : "Earnings",
                      ]}
                    />
                    <Bar
                      dataKey={viewMode === "time" ? "time" : "earnings"}
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Project Distribution */}
          <Card className="forest-card">
            <CardHeader>
              <CardTitle className="text-forest-800">
                Project {viewMode === "time" ? "Time" : "Earnings"} Distribution
              </CardTitle>
              <CardDescription className="text-forest-600">
                {viewMode === "time"
                  ? "Time allocation"
                  : "Earnings distribution"}{" "}
                across projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: {
                    label: viewMode === "time" ? "Time" : "Earnings",
                    color: "#22c55e",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={projectStats}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey={viewMode === "time" ? "time" : "earnings"}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {projectStats.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color || COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip
                      formatter={(value: number) => [
                        viewMode === "time"
                          ? formatDuration(value)
                          : formatCurrency(value),
                        viewMode === "time" ? "Time" : "Earnings",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Projects */}
          <Card className="forest-card">
            <CardHeader>
              <CardTitle className="text-forest-800">
                Top Projects by {viewMode === "time" ? "Time" : "Earnings"}
              </CardTitle>
              <CardDescription className="text-forest-600">
                Projects with the most{" "}
                {viewMode === "time" ? "time tracked" : "earnings generated"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {projectStats.slice(0, 5).map((project, index) => (
                <div
                  key={project.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-forest-600">
                        #{index + 1}
                      </span>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-forest-800">
                        {project.name}
                      </p>
                      <p className="text-xs text-forest-600">
                        {project.entries} sessions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant="secondary"
                      className="bg-forest-100 text-forest-700"
                    >
                      {viewMode === "time"
                        ? formatDuration(project.time)
                        : formatCurrency(project.earnings)}
                    </Badge>
                    {viewMode === "earnings" && (
                      <p className="text-xs text-forest-500 mt-1">
                        {formatDuration(project.time)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top Activities */}
          <Card className="forest-card">
            <CardHeader>
              <CardTitle className="text-forest-800">
                Top Activities by {viewMode === "time" ? "Time" : "Earnings"}
              </CardTitle>
              <CardDescription className="text-forest-600">
                Most{" "}
                {viewMode === "time"
                  ? "tracked activities"
                  : "profitable activities"}{" "}
                across all projects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activityStats.slice(0, 5).map((activity, index) => (
                <div
                  key={activity.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-forest-600">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-forest-800">
                        {activity.name}
                      </p>
                      <p className="text-xs text-forest-600">
                        {activity.projectName} • {activity.entries} sessions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant="secondary"
                      className="bg-forest-100 text-forest-700"
                    >
                      {viewMode === "time"
                        ? formatDuration(activity.time)
                        : formatCurrency(activity.earnings)}
                    </Badge>
                    {viewMode === "earnings" && (
                      <p className="text-xs text-forest-500 mt-1">
                        {formatDuration(activity.time)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Empty State */}
        {filteredEntries.length === 0 && (
          <Card className="forest-card mt-8">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-forest-400 mb-4" />
              <h3 className="text-lg font-medium text-forest-800 mb-2">
                No data for this period
              </h3>
              <p className="text-forest-600 text-center mb-4">
                Start tracking your time to see analytics and insights.
              </p>
              <Link href="/dashboard">
                <Button className="forest-gradient hover:from-forest-600 hover:to-forest-800 text-white">
                  Start Tracking
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
