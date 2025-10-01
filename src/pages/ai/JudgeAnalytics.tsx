import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as DateRangeCalendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { useMemo, useState } from "react";
import { 
  Gavel, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Scale, 
  BarChart3,
  Users,
  Calendar,
  Filter
} from "lucide-react";

const JudgeAnalytics = () => {
  const judges = [
    {
      id: 1,
      name: "Hon. Sarah Mitchell",
      court: "Superior Court of California",
      totalCases: 1247,
      grantRate: 78,
      avgDecisionTime: "45 days",
      specialty: "Corporate Law",
      trend: "up",
      recentCases: 156,
      lastActivity: new Date().toISOString(),
    },
    {
      id: 2,
      name: "Hon. Robert Chen",
      court: "Federal District Court",
      totalCases: 892,
      grantRate: 62,
      avgDecisionTime: "67 days",
      specialty: "Criminal Defense",
      trend: "down", 
      recentCases: 89,
      lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(), // 45 days ago
    },
    {
      id: 3,
      name: "Hon. Maria Rodriguez",
      court: "Court of Appeals",
      totalCases: 654,
      grantRate: 85,
      avgDecisionTime: "32 days",
      specialty: "Family Law",
      trend: "up",
      recentCases: 67,
      lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(), // 120 days ago
    }
  ];

  const caseTypes = [
    { type: "Civil Rights", granted: 76, denied: 24, total: 234 },
    { type: "Contract Disputes", granted: 82, denied: 18, total: 189 },
    { type: "Employment", granted: 69, denied: 31, total: 156 },
    { type: "Personal Injury", granted: 91, denied: 9, total: 145 },
  ];

  const stats = [
    { label: "Judges Analyzed", value: "2,847", icon: Users },
    { label: "Cases Tracked", value: "156K", icon: Scale },
    { label: "Courts Covered", value: "487", icon: Gavel },
    { label: "Success Rate", value: "94.2%", icon: TrendingUp }
  ];

  const allFilters = [
    "Federal Courts",
    "State Courts",
    "Appellate",
    "District",
    "Civil",
    "Criminal",
  ] as const;

  const [query, setQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const toggleFilter = (tag: string) => {
    setSelectedFilters((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const judgeHasTag = (j: typeof judges[number], tag: string) => {
    const court = j.court.toLowerCase();
    const specialty = j.specialty.toLowerCase();
    switch (tag) {
      case "Federal Courts":
        return court.includes("federal");
      case "State Courts":
        return court.includes("superior") || court.includes("state");
      case "Appellate":
        return court.includes("appeal");
      case "District":
        return court.includes("district");
      case "Civil":
        return (
          specialty.includes("corporate") ||
          specialty.includes("contract") ||
          specialty.includes("family") ||
          specialty.includes("civil")
        );
      case "Criminal":
        return specialty.includes("criminal");
      default:
        return false;
    }
  };

  const filteredJudges = useMemo(() => {
    return judges.filter((j) => {
      const matchesQuery = query.trim().length
        ? [j.name, j.court, j.specialty].some((f) => f.toLowerCase().includes(query.toLowerCase()))
        : true;

      const matchesFilters = selectedFilters.length
        ? selectedFilters.some((tag) => judgeHasTag(j, tag))
        : true;

      const matchesDate = dateRange?.from && dateRange?.to
        ? (() => {
            const d = new Date(j.lastActivity);
            // Normalize time for inclusive range
            const from = new Date(dateRange.from!);
            from.setHours(0, 0, 0, 0);
            const to = new Date(dateRange.to!);
            to.setHours(23, 59, 59, 999);
            return d >= from && d <= to;
          })()
        : true;

      return matchesQuery && matchesFilters && matchesDate;
    });
  }, [judges, query, selectedFilters, dateRange]);

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-legal-warning rounded-lg">
              <Gavel className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Judge Analytics</h1>
              <p className="text-muted-foreground">
                AI-powered insights into judicial behavior, ruling patterns, and case outcomes
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <Card key={index} className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                    <stat.icon className="h-6 w-6 text-legal-warning" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-legal-primary" />
              Find Judge Analytics
            </CardTitle>
            <CardDescription>
              Search for judges by name, court, or specialty area
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search judges, courts, or case types..."
                  className="pl-9"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Date Range
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Federal Courts</Badge>
              <Badge variant="secondary">State Courts</Badge>
              <Badge variant="secondary">Appellate</Badge>
              <Badge variant="secondary">District</Badge>
              <Badge variant="secondary">Civil</Badge>
              <Badge variant="secondary">Criminal</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Judge Profiles */}
          <div className="lg:col-span-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-legal-primary" />
                  Judge Profiles & Analytics
                </CardTitle>
                <CardDescription>
                  Detailed performance analytics and ruling patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {filteredJudges.map((judge) => (
                    <div key={judge.id} className="border border-border rounded-lg p-6 hover:shadow-legal transition-all duration-300">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{judge.name}</h3>
                          <p className="text-sm text-muted-foreground">{judge.court}</p>
                          <Badge variant="outline" className="mt-1">
                            {judge.specialty}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {judge.trend === "up" ? (
                            <TrendingUp className="h-5 w-5 text-legal-success" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-destructive" />
                          )}
                          <span className="text-sm font-medium">
                            {judge.grantRate}% Grant Rate
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-legal-primary">{judge.totalCases}</p>
                          <p className="text-xs text-muted-foreground">Total Cases</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-legal-warning">{judge.grantRate}%</p>
                          <p className="text-xs text-muted-foreground">Grant Rate</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-legal-info">{judge.avgDecisionTime}</p>
                          <p className="text-xs text-muted-foreground">Avg Decision</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-legal-success">{judge.recentCases}</p>
                          <p className="text-xs text-muted-foreground">Recent Cases</p>
                        </div>
                      </div>

                        <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="bg-legal-primary hover:bg-legal-primary/90"
                            onClick={() => window.location.href = `/ai/judge/${judge.id}`}
                          >
                            View Full Profile
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.location.href = `/ai/judge/${judge.id}/case-history`}
                          >
                            Case History
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.location.href = `/ai/judge/${judge.id}/predictions`}
                          >
                            Predictions
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Panel */}
          <div className="space-y-6">
            {/* Case Type Analysis */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-legal-primary" />
                  Case Type Analysis
                </CardTitle>
                <CardDescription>
                  Success rates by case category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {caseTypes.map((caseType, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{caseType.type}</span>
                        <span className="text-sm text-muted-foreground">{caseType.total} cases</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-legal-success h-2 rounded-full" 
                          style={{ width: `${caseType.granted}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{caseType.granted}% Granted</span>
                        <span>{caseType.denied}% Denied</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Insights */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-legal-primary" />
                  Quick Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-legal-success/10 rounded-lg border border-legal-success/20">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-legal-success" />
                    <span className="text-sm font-medium">High Success Rate</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Family law cases show 85% average grant rate
                  </p>
                </div>

                <div className="p-3 bg-legal-warning/10 rounded-lg border border-legal-warning/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-legal-warning" />
                    <span className="text-sm font-medium">Decision Speed</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Appeals court decisions average 32 days
                  </p>
                </div>

                <div className="p-3 bg-legal-info/10 rounded-lg border border-legal-info/20">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="h-4 w-4 text-legal-info" />
                    <span className="text-sm font-medium">Trending Pattern</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Corporate cases show increasing grant rates
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* AI Predictions */}
            <Card className="shadow-card bg-gradient-primary text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  AI Predictions
                </CardTitle>
                <CardDescription className="text-white/80">
                  Outcome likelihood for your case
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold mb-1">73%</div>
                  <p className="text-sm opacity-90">Predicted Success Rate</p>
                </div>
                <Button variant="secondary" className="w-full">
                  Get Detailed Prediction
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JudgeAnalytics;