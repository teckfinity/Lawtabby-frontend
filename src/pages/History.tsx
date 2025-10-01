import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  Clock,
  Download,
  Eye,
  Trash2,
  Printer
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const History = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const historyItems = [
    {
      title: "Legal practice analysis",
      description: "Comprehensive analysis of civil litigation case precedents",
      date: "2024-01-15",
      time: "2:30 PM",
      type: "Analysis",
      status: "Completed",
      pages: 45
    },
    {
      title: "Legal breakdown summary",
      description: "Contract review and compliance assessment",
      date: "2024-01-14",
      time: "11:15 AM",
      type: "Summary",
      status: "Completed",
      pages: 28
    },
    {
      title: "Case law research",
      description: "Constitutional law precedent review",
      date: "2024-01-13",
      time: "4:45 PM",
      type: "Research",
      status: "Completed",
      pages: 67
    },
    {
      title: "Document review",
      description: "Due diligence document analysis",
      date: "2024-01-12",
      time: "9:20 AM",
      type: "Review",
      status: "Completed",
      pages: 34
    }
  ];

  const currentIndex = parseInt(id || "0");
  const currentItem = historyItems[currentIndex] || historyItems[0];

  const handleViewFullReport = () => {
    toast({
      title: "Opening Full Report",
      description: "Loading complete analysis report...",
    });
    // Simulate opening a full report view
    setTimeout(() => {
      toast({
        title: "Report Ready",
        description: "Full analysis report is now displayed",
      });
    }, 1500);
  };

  const handleDownloadPDF = () => {
    toast({
      title: "Preparing Download",
      description: "Generating PDF file...",
    });
    
    // Simulate PDF download
    setTimeout(() => {
      // Create a mock download
      const element = document.createElement("a");
      const file = new Blob(
        [`Analysis Report: ${currentItem.title}\n\nDate: ${currentItem.date}\nTime: ${currentItem.time}\n\nThis is a simulated PDF download.`],
        { type: "text/plain" }
      );
      element.href = URL.createObjectURL(file);
      element.download = `${currentItem.title.replace(/\s+/g, "_")}_Report.pdf`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      toast({
        title: "Download Complete",
        description: "PDF report has been downloaded successfully",
      });
    }, 1500);
  };

  const handlePrint = () => {
    toast({
      title: "Opening Print Dialog",
      description: "Preparing document for printing...",
    });
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleDelete = () => {
    setIsDeleting(true);
    
    setTimeout(() => {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      
      toast({
        title: "History Deleted",
        description: "The analysis has been removed from your history",
      });
      
      // Navigate to dashboard after deletion
      navigate("/");
    }, 1000);
  };

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="mb-6 gap-2"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {currentItem.title}
              </h1>
              <p className="text-muted-foreground text-lg">
                {currentItem.description}
              </p>
            </div>
            <Badge variant="secondary" className="text-sm">
              {currentItem.status}
            </Badge>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {currentItem.date}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {currentItem.time}
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {currentItem.pages} pages
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Document Summary</CardTitle>
                <CardDescription>Key findings and insights from the analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Executive Summary</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    This comprehensive {currentItem.type.toLowerCase()} provides detailed insights into the legal 
                    documentation reviewed. The analysis covers key precedents, relevant case law, and compliance 
                    considerations essential for informed decision-making.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Key Findings</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>Analysis completed with high confidence level</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>Multiple relevant precedents identified</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>Compliance requirements highlighted</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>Risk assessment included in findings</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Recommendations</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Based on the analysis, we recommend reviewing the highlighted sections for potential 
                    compliance issues and consulting with subject matter experts for specialized interpretation 
                    of complex legal provisions.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>Manage this analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button className="gap-2" onClick={handleViewFullReport}>
                    <Eye className="h-4 w-4" />
                    View Full Report
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={handleDownloadPDF}>
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={handlePrint}>
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-2 text-destructive hover:text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Related Items */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Document Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Type</p>
                  <p className="text-sm">{currentItem.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                  <Badge variant="secondary">{currentItem.status}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Pages Analyzed</p>
                  <p className="text-sm">{currentItem.pages} pages</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Created</p>
                  <p className="text-sm">{currentItem.date} at {currentItem.time}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Related History</CardTitle>
                <CardDescription>Other recent analyses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {historyItems
                    .filter((_, index) => index !== currentIndex)
                    .slice(0, 3)
                    .map((item, index) => (
                      <button
                        key={index}
                        onClick={() => navigate(`/history/${historyItems.indexOf(item)}`)}
                        className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.date}</p>
                      </button>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &quot;{currentItem.title}&quot; from your history. 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default History;
