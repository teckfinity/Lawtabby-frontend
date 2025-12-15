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
import { useMemo, useState, useEffect } from "react";
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
import { getJudgesList, getJudgeCompleteProfile } from "@/api/Ai_Features_Microsrc/judge_analytcs"; // Assuming this is the correct import path for the API functions

const JudgeAnalytics = () => {
  const [judges, setJudges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const listRes = await getJudgesList();
        const judgesList = listRes.data.results;
        const detailsPromises = judgesList.map((j: any) => getJudgeCompleteProfile(j.id));
        const details = await Promise.all(detailsPromises);
        const fullJudges = judgesList.map((j: any, i: number) => ({
          ...j,
          details: details[i].data
        }));
        setJudges(fullJudges);
      } catch (error) {
        console.error("Error fetching judges data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const aggregatedCases = useMemo(() => {
    const types: { [key: string]: { granted: number; denied: number; total: number } } = {};
    judges.forEach((j) => {
      Object.entries(j.details.case_types_breakdown || {}).forEach(([type, data]: [string, any]) => {
        if (!types[type]) types[type] = { granted: 0, denied: 0, total: 0 };
        types[type].granted += data.granted || 0;
        types[type].denied += data.denied || 0;
        types[type].total += data.total || 0;
      });
    });
    return Object.entries(types).map(([type, data]) => ({
      type,
      granted: data.total ? Math.round((data.granted / data.total) * 100) : 0,
      denied: data.total ? Math.round((data.denied / data.total) * 100) : 0,
      total: data.total,
    }));
  }, [judges]);

  const stats = useMemo(() => {
    const totalJudges = judges.length;
    const totalCasesTracked = judges.reduce((sum, j) => sum + (j.details.statistics.total_cases || 0), 0);
    const uniqueCourts = new Set(judges.flatMap((j) => j.details.statistics.courts_served || [])).size;
    const avgSuccess = totalJudges
      ? (judges.reduce((sum, j) => sum + (j.details.statistics.grant_rate || 0), 0) / totalJudges).toFixed(1) + "%"
      : "0%";
    return [
      { label: "Judges Analyzed", value: totalJudges.toLocaleString(), icon: Users },
      { label: "Cases Tracked", value: totalCasesTracked.toLocaleString(), icon: Scale },
      { label: "Courts Covered", value: uniqueCourts.toString(), icon: Gavel },
      { label: "Success Rate", value: avgSuccess, icon: TrendingUp },
    ];
  }, [judges]);

  const avgDays = useMemo(() => {
    return judges.length
      ? Math.round(
          judges.reduce((sum, j) => sum + (j.details.statistics.average_decision_days || 0), 0) / judges.length
        )
      : 0;
  }, [judges]);

  const highSuccessType = useMemo(() => {
    if (!aggregatedCases.length) return null;
    return aggregatedCases.reduce((max, c) => (c.granted > max.granted ? c : max), aggregatedCases[0]);
  }, [aggregatedCases]);

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
  const judgeHasTag = (j: any, tag: string) => {
    const court = (j.details.statistics.courts_served?.join(", ") || "").toLowerCase();
    const specialty = Object.keys(j.details.case_types_breakdown || {}).join(", ").toLowerCase();
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
      const d = j.details;
      const name = d.basic_info.full_name || "";
      const court = d.statistics.courts_served?.join(", ") || "";
      const specialty = Object.keys(d.case_types_breakdown || {}).join(", ");
      const matchesQuery = query.trim().length
        ? [name, court, specialty].some((f) => f.toLowerCase().includes(query.toLowerCase()))
        : true;

      const matchesFilters = selectedFilters.length
        ? selectedFilters.some((tag) => judgeHasTag(j, tag))
        : true;

      const matchesDate = dateRange?.from && dateRange?.to
        ? (() => {
            const activityDate = new Date(j.created_at); // Using created_at as proxy for lastActivity
            const from = new Date(dateRange.from!);
            from.setHours(0, 0, 0, 0);
            const to = new Date(dateRange.to!);
            to.setHours(23, 59, 59, 999);
            return activityDate >= from && activityDate <= to;
          })()
        : true;

      return matchesQuery && matchesFilters && matchesDate;
    });
  }, [judges, query, selectedFilters, dateRange]);

  if (loading) {
    return <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">Loading...</div>;
  }

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
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="space-y-2">
                    {allFilters.map((tag) => (
                      <div key={tag} className="flex items-center gap-2">
                        <Checkbox
                          id={tag}
                          checked={selectedFilters.includes(tag)}
                          onCheckedChange={() => toggleFilter(tag)}
                        />
                        <label htmlFor={tag}>{tag}</label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Date Range
                    {dateRange?.from && dateRange?.to && ` (${format(dateRange.from, "PP")} - ${format(dateRange.to, "PP")})`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <DateRangeCalendar
                    date={dateRange}
                    onSelect={setDateRange}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-wrap gap-2">
              {allFilters.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedFilters.includes(tag) ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => toggleFilter(tag)}
                >
                  {tag}
                </Badge>
              ))}
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
                  {filteredJudges.map((j) => {
                    const d = j.details;
                    const name = d.basic_info.full_name;
                    const court = d.statistics.courts_served?.join(", ") || "N/A";
                    const totalCases = d.statistics.total_cases;
                    const grantRate = d.statistics.grant_rate;
                    const avgDecisionTime = `${d.statistics.average_decision_days} days`;
                    const specialty = Object.keys(d.case_types_breakdown || {}).join(", ") || "General";
                    const trend = grantRate > 50 ? "up" : "down";
                    const recentCases = d.recent_cases?.length || 0;
                    return (
                      <div key={j.id} className="border border-border rounded-lg p-6 hover:shadow-legal transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">{name}</h3>
                            <p className="text-sm text-muted-foreground">{court}</p>
                            <Badge variant="outline" className="mt-1">
                              {specialty}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {trend === "up" ? (
                              <TrendingUp className="h-5 w-5 text-legal-success" />
                            ) : (
                              <TrendingDown className="h-5 w-5 text-destructive" />
                            )}
                            <span className="text-sm font-medium">
                              {grantRate}% Grant Rate
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-legal-primary">{totalCases}</p>
                            <p className="text-xs text-muted-foreground">Total Cases</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-legal-warning">{grantRate}%</p>
                            <p className="text-xs text-muted-foreground">Grant Rate</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-legal-info">{avgDecisionTime}</p>
                            <p className="text-xs text-muted-foreground">Avg Decision</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-legal-success">{recentCases}</p>
                            <p className="text-xs text-muted-foreground">Recent Cases</p>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-legal-primary hover:bg-legal-primary/90"
                              onClick={() => window.location.href = `/ai/judge/${j.id}`}
                            >
                              View Full Profile
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.location.href = `/ai/judge/${j.id}/case-history`}
                            >
                              Case History
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.location.href = `/ai/judge/${j.id}/predictions`}
                            >
                              Predictions
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                  {aggregatedCases.map((caseType, index) => (
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
                  {!aggregatedCases.length && <p className="text-center text-muted-foreground">No case type data available</p>}
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
                    {highSuccessType ? `${highSuccessType.type} cases show ${highSuccessType.granted}% average grant rate` : "No data available"}
                  </p>
                </div>
                <div className="p-3 bg-legal-warning/10 rounded-lg border border-legal-warning/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-legal-warning" />
                    <span className="text-sm font-medium">Decision Speed</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Decisions average {avgDays} days
                  </p>
                </div>
                <div className="p-3 bg-legal-info/10 rounded-lg border border-legal-info/20">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="h-4 w-4 text-legal-info" />
                    <span className="text-sm font-medium">Trending Pattern</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Overall success rate at {stats[3].value}
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