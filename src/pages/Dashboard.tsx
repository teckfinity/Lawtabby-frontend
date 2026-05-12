import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  FileText, 
  Gavel, 
  Network, 
  TrendingUp, 
  FileCheck, 
  Upload, 
  MessageSquare,
  BarChart3,
  Clock,
  Star,
  Zap
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const quickActions = [
    {
      title: "Legal Research",
      description: "AI-powered research with verified U.S. citations",
      icon: Brain,
      href: "/ai/legal-research",
      color: "bg-primary",
      badge: "New"
    },
    {
      title: "Document Summarizer",
      description: "Convert long legal cases into concise summaries",
      icon: Brain,
      href: "/ai/summarizer",
      color: "bg-primary",
      badge: "AI Powered"
    },
    {
      title: "PDF Tools",
      description: "Merge, split, compress, and edit PDFs",
      icon: FileText,
      href: "/pdf-tools",
      color: "bg-navy",
      badge: "Essential"
    },
    {
      title: "Judge Analytics",
      description: "Insights into judge behavior and ruling patterns",
      icon: Gavel,
      href: "/ai/judge-analytics",
      color: "bg-navy-light",
      badge: "Popular"
    }
  ];

  const recentActivity = [
    { action: "Document analyzed", file: "Contract_Analysis.pdf", time: "2 hours ago" },
    { action: "PDF merged", file: "Court_Documents.pdf", time: "5 hours ago" },
    { action: "Case summarized", file: "Legal_Brief_2024.pdf", time: "1 day ago" },
  ];

  const stats = [
    { label: "Documents Processed", value: "247", icon: FileText },
    { label: "Hours Saved", value: "89", icon: Clock },
    { label: "Cases Analyzed", value: "156", icon: BarChart3 },
    { label: "Success Rate", value: "98%", icon: TrendingUp },
  ];

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-heading text-foreground mb-2">
            Welcome to LexOrbit
          </h1>
          <p className="text-muted-foreground text-lg font-body">
            Your AI-powered legal assistant for document analysis, case research, and legal automation
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                  <stat.icon className="h-8 w-8 text-legal-primary" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Card key={index} className="shadow-card hover:shadow-legal transition-all duration-300 group cursor-pointer">
                <Link to={action.href}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-lg ${action.color} text-white`}>
                        <action.icon className="h-5 w-5" />
                      </div>
                      <Badge variant="secondary" className="text-xs">{action.badge}</Badge>
                    </div>
                    <CardTitle className="text-lg group-hover:text-legal-primary transition-colors">
                      {action.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {action.description}
                    </CardDescription>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-legal-primary" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your latest document processing activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-legal-primary rounded-full" />
                        <div>
                          <p className="font-medium text-foreground">{activity.action}</p>
                          <p className="text-sm text-muted-foreground">{activity.file}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  View All Activity
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Featured Tools */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-legal-warning" />
                Featured Tools
              </CardTitle>
              <CardDescription>Most used AI features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gradient-primary rounded-lg text-white">
                <Zap className="h-5 w-5" />
                <div>
                  <p className="font-medium">Citation Maps</p>
                  <p className="text-xs opacity-90">Visual case relationships</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <TrendingUp className="h-5 w-5 text-legal-success" />
                <div>
                  <p className="font-medium text-foreground">Predictive AI</p>
                  <p className="text-xs text-muted-foreground">Case outcome predictions</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <FileCheck className="h-5 w-5 text-legal-info" />
                <div>
                  <p className="font-medium text-foreground">Document Automation</p>
                  <p className="text-xs text-muted-foreground">Auto-generate legal docs</p>
                </div>
              </div>
              <Button 
                className="w-full bg-legal-primary hover:bg-legal-primary/90"
                onClick={() => navigate('/ai/summarizer')}
              >
                Explore All AI Tools
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;