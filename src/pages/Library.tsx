import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { 
  FileText, 
  Upload, 
  Download, 
  Search, 
  Filter, 
  MoreHorizontal,
  Grid3X3,
  List,
  Calendar,
  File,
  X,
  Printer
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Library = () => {
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [showFilters, setShowFilters] = useState(false);

  const uploadedFiles = [
    {
      id: 1,
      name: "Court plead",
      type: "DOC",
      size: "2.4 MB",
      date: "2024-01-15",
      icon: "DOC",
      color: "bg-navy"
    },
    {
      id: 2,
      name: "Court plead",
      type: "PDF",
      size: "1.8 MB", 
      date: "2024-01-14",
      icon: "PDF",
      color: "bg-destructive"
    },
    {
      id: 3,
      name: "Court plead",
      type: "DOC",
      size: "3.1 MB",
      date: "2024-01-13",
      icon: "DOC", 
      color: "bg-navy"
    },
    {
      id: 4,
      name: "Court plead",
      type: "PDF",
      size: "2.9 MB",
      date: "2024-01-12",
      icon: "PDF",
      color: "bg-destructive"
    },
    {
      id: 5,
      name: "Court plead",
      type: "DOC",
      size: "1.5 MB",
      date: "2024-01-11",
      icon: "DOC",
      color: "bg-navy"
    },
    {
      id: 6,
      name: "Court plead", 
      type: "DOC",
      size: "2.2 MB",
      date: "2024-01-10",
      icon: "DOC",
      color: "bg-navy"
    }
  ];

  const downloadedFiles = [
    {
      id: 1,
      name: "Legal Analysis Report",
      type: "PDF",
      size: "4.2 MB",
      date: "2024-01-16",
      icon: "PDF",
      color: "bg-destructive"
    },
    {
      id: 2,
      name: "Contract Summary",
      type: "DOC", 
      size: "1.9 MB",
      date: "2024-01-15",
      icon: "DOC",
      color: "bg-navy"
    }
  ];

  // Filter logic
  const filterFiles = (files: any[]) => {
    return files.filter((file) => {
      // Search filter
      const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           file.type.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Type filter
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(file.type);
      
      // Date range filter
      let matchesDate = true;
      if (dateRange.from || dateRange.to) {
        const fileDate = new Date(file.date);
        if (dateRange.from && dateRange.to) {
          matchesDate = fileDate >= dateRange.from && fileDate <= dateRange.to;
        } else if (dateRange.from) {
          matchesDate = fileDate >= dateRange.from;
        } else if (dateRange.to) {
          matchesDate = fileDate <= dateRange.to;
        }
      }
      
      return matchesSearch && matchesType && matchesDate;
    });
  };

  const filteredUploadedFiles = useMemo(() => filterFiles(uploadedFiles), [searchQuery, selectedTypes, dateRange]);
  const filteredDownloadedFiles = useMemo(() => filterFiles(downloadedFiles), [searchQuery, selectedTypes, dateRange]);

  const toggleFileType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTypes([]);
    setDateRange({});
  };

  const hasActiveFilters = searchQuery || selectedTypes.length > 0 || dateRange.from || dateRange.to;

  const FileCard = ({ file }: { file: any }) => (
    <Card className="shadow-card hover:shadow-legal transition-all duration-300 group cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <div className="w-16 h-20 bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                <File className="h-8 w-8 text-muted-foreground" />
                <div className={`absolute bottom-0 left-0 right-0 h-6 ${file.color} flex items-center justify-center`}>
                  <span className="text-white text-xs font-bold">{file.icon}</span>
                </div>
              </div>
            </div>
            <h3 className="font-medium text-center text-sm">{file.name}</h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Open</DropdownMenuItem>
              <DropdownMenuItem>Download</DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </DropdownMenuItem>
              <DropdownMenuItem>Share</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Size: {file.size}</p>
          <p>Modified: {file.date}</p>
        </div>
      </CardContent>
    </Card>
  );

  const FileRow = ({ file }: { file: any }) => (
    <div className="flex items-center justify-between p-4 border-b border-border hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-10 h-12 bg-muted rounded flex items-center justify-center relative overflow-hidden">
            <File className="h-5 w-5 text-muted-foreground" />
            <div className={`absolute bottom-0 left-0 right-0 h-4 ${file.color} flex items-center justify-center`}>
              <span className="text-white text-xs font-bold">{file.icon}</span>
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-medium text-sm">{file.name}</h3>
          <p className="text-xs text-muted-foreground">{file.size} • {file.date}</p>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Open</DropdownMenuItem>
          <DropdownMenuItem>Download</DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </DropdownMenuItem>
          <DropdownMenuItem>Share</DropdownMenuItem>
          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Document Library</h1>
            <p className="text-muted-foreground">Access your uploaded file history</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {selectedTypes.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{selectedTypes.length}</Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 bg-card z-50" align="start">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">File Type</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="filter-pdf"
                          checked={selectedTypes.includes("PDF")}
                          onCheckedChange={() => toggleFileType("PDF")}
                        />
                        <Label htmlFor="filter-pdf" className="cursor-pointer">PDF Documents</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="filter-doc"
                          checked={selectedTypes.includes("DOC")}
                          onCheckedChange={() => toggleFileType("DOC")}
                        />
                        <Label htmlFor="filter-doc" className="cursor-pointer">Word Documents</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Date Range
                  {(dateRange.from || dateRange.to) && (
                    <Badge variant="secondary" className="ml-2">Active</Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card z-50" align="start">
                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Select Date Range</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {dateRange.from && dateRange.to
                        ? `${format(dateRange.from, "MMM dd, yyyy")} - ${format(dateRange.to, "MMM dd, yyyy")}`
                        : dateRange.from
                        ? `From ${format(dateRange.from, "MMM dd, yyyy")}`
                        : dateRange.to
                        ? `Until ${format(dateRange.to, "MMM dd, yyyy")}`
                        : "No date range selected"}
                    </p>
                  </div>
                  <CalendarComponent
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                    className="rounded-md border"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setDateRange({})}
                  >
                    Clear Date Range
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>
          
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchQuery}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setSearchQuery("")}
                  />
                </Badge>
              )}
              {selectedTypes.map((type) => (
                <Badge key={type} variant="secondary" className="gap-1">
                  Type: {type}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleFileType(type)}
                  />
                </Badge>
              ))}
              {(dateRange.from || dateRange.to) && (
                <Badge variant="secondary" className="gap-1">
                  Date: {dateRange.from && format(dateRange.from, "MMM dd")}
                  {dateRange.from && dateRange.to && " - "}
                  {dateRange.to && format(dateRange.to, "MMM dd")}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setDateRange({})}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="uploaded" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="uploaded" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Uploaded
              <Badge variant="secondary" className="ml-1">{filteredUploadedFiles.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="downloaded" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Downloaded
              <Badge variant="secondary" className="ml-1">{filteredDownloadedFiles.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="uploaded" className="mt-6">
            {filteredUploadedFiles.length === 0 ? (
              <Card className="shadow-card">
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No files found</h3>
                  <p className="text-muted-foreground">
                    {hasActiveFilters
                      ? "Try adjusting your filters to see more results"
                      : "Upload your first document to get started"}
                  </p>
                </CardContent>
              </Card>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {filteredUploadedFiles.map((file) => (
                  <FileCard key={file.id} file={file} />
                ))}
              </div>
            ) : (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Uploaded Files ({filteredUploadedFiles.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {filteredUploadedFiles.map((file) => (
                    <FileRow key={file.id} file={file} />
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="downloaded" className="mt-6">
            {filteredDownloadedFiles.length === 0 ? (
              <Card className="shadow-card">
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No files found</h3>
                  <p className="text-muted-foreground">
                    {hasActiveFilters
                      ? "Try adjusting your filters to see more results"
                      : "No downloaded files yet"}
                  </p>
                </CardContent>
              </Card>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {filteredDownloadedFiles.map((file) => (
                  <FileCard key={file.id} file={file} />
                ))}
              </div>
            ) : (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Downloaded Files ({filteredDownloadedFiles.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {filteredDownloadedFiles.map((file) => (
                    <FileRow key={file.id} file={file} />
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Upload Area */}
        <Card className="mt-8 border-2 border-dashed border-border hover:border-legal-primary transition-colors">
          <CardContent className="p-12 text-center">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Upload New Documents</h3>
            <p className="text-muted-foreground mb-6">
              Drag and drop your legal documents here, or click to browse
            </p>
            <Button className="bg-legal-primary hover:bg-legal-primary/90">
              Choose Files
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Supported formats: PDF, DOC, DOCX, TXT (Max 10MB per file)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Library;