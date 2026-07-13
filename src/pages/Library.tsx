import { useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
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
  Loader2,
  FolderOpen,
  AlertCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  handleLibraryDownload,
  useLibraryDelete,
  useLibraryDocuments,
  useLibraryUpload,
} from "@/api/hooks/useDocumentLibrary";
import type { LibraryDocument } from "@/api/ai-features/document-library";

type DisplayFile = {
  id: number;
  name: string;
  type: string;
  size: string;
  date: string;
  icon: string;
  color: string;
  sourceLabel?: string;
};

function fileVisuals(fileType: string) {
  const normalized = fileType.toLowerCase();
  if (normalized === "pdf") {
    return { icon: "PDF", color: "bg-destructive" };
  }
  if (normalized === "zip") {
    return { icon: "ZIP", color: "bg-navy" };
  }
  if (normalized === "txt") {
    return { icon: "TXT", color: "bg-navy" };
  }
  return { icon: "DOC", color: "bg-navy" };
}

function toDisplayFile(doc: LibraryDocument): DisplayFile {
  const visuals = fileVisuals(doc.file_type);
  return {
    id: doc.id,
    name: doc.original_filename,
    type: doc.file_type.toUpperCase(),
    size: doc.size_display,
    date: doc.date_display,
    icon: visuals.icon,
    color: visuals.color,
    sourceLabel: doc.source_label,
  };
}

const Library = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeTab = location.pathname.endsWith("/downloaded") ? "downloaded" : "uploaded";

  const [viewModeByTab, setViewModeByTab] = useState<{ uploaded: "grid" | "list"; downloaded: "grid" | "list" }>({
    uploaded: "grid",
    downloaded: "grid",
  });
  const viewMode = viewModeByTab[activeTab];
  const setViewMode = (mode: "grid" | "list") => {
    setViewModeByTab((prev) => ({ ...prev, [activeTab]: mode }));
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [showFilters, setShowFilters] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const filterParams = useMemo(
    () => ({
      q: searchQuery || undefined,
      date_from: dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
      date_to: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    }),
    [searchQuery, dateRange]
  );

  const uploadedQuery = useLibraryDocuments({ category: "uploaded", ...filterParams });
  const downloadedQuery = useLibraryDocuments({ category: "generated", ...filterParams });

  const uploadMutation = useLibraryUpload();
  const deleteMutation = useLibraryDelete();

  const applyTypeFilter = (files: DisplayFile[]) => {
    if (selectedTypes.length === 0) return files;
    return files.filter((file) => {
      if (selectedTypes.includes("PDF") && file.type === "PDF") return true;
      if (selectedTypes.includes("DOC") && (file.type === "DOC" || file.type === "DOCX")) return true;
      if (selectedTypes.includes("TXT") && file.type === "TXT") return true;
      if (selectedTypes.includes("ZIP") && file.type === "ZIP") return true;
      return false;
    });
  };

  const uploadedFiles = applyTypeFilter((uploadedQuery.data?.results || []).map(toDisplayFile));
  const downloadedFiles = applyTypeFilter((downloadedQuery.data?.results || []).map(toDisplayFile));

  const usage = uploadedQuery.data?.usage;
  const uploadAtLimit =
    usage?.uploaded.limit != null && usage.uploaded.used >= usage.uploaded.limit;

  const uploadedCount = uploadedQuery.data?.usage?.uploaded.used ?? uploadedQuery.data?.count ?? 0;
  const downloadedCount =
    downloadedQuery.data?.usage?.generated.used ?? downloadedQuery.data?.count ?? 0;

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

  const hasActiveFilters =
    searchQuery || selectedTypes.length > 0 || dateRange.from || dateRange.to;

  const handleTabChange = (value: string) => {
    navigate(value === "downloaded" ? "/library/downloaded" : "/library/uploaded");
  };

  const uploadFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => uploadMutation.mutate(file));
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length > 0) {
      uploadFiles(event.dataTransfer.files);
    }
  };

  const onDownload = (file: DisplayFile) => {
    handleLibraryDownload(file.id, file.name);
  };

  const onDelete = (file: DisplayFile) => {
    deleteMutation.mutate(file.id);
  };

  const FileCard = ({ file }: { file: DisplayFile }) => (
    <Card className="shadow-card hover:shadow-legal transition-all duration-300 group relative">
      <CardContent className="p-5 pt-6">
        <div className="absolute top-2 right-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDownload(file)}>Download</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={() => onDelete(file)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col items-center text-center w-full px-1">
          <div className="w-16 h-20 bg-muted rounded-lg flex items-center justify-center relative overflow-hidden mb-3">
            <File className="h-8 w-8 text-muted-foreground" />
            <div className={`absolute bottom-0 left-0 right-0 h-6 ${file.color} flex items-center justify-center`}>
              <span className="text-white text-xs font-bold">{file.icon}</span>
            </div>
          </div>
          <h3 className="font-medium text-sm line-clamp-2 w-full break-all px-1">{file.name}</h3>
          {file.sourceLabel && (
            <Badge variant="outline" className="mt-2 text-[10px]">
              {file.sourceLabel}
            </Badge>
          )}
          <div className="text-xs text-muted-foreground mt-3 space-y-0.5 w-full">
            <p>Size: {file.size}</p>
            <p>Added: {file.date}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const FileRow = ({ file }: { file: DisplayFile }) => (
    <div className="flex items-center justify-between p-4 border-b border-border hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4 min-w-0">
        <div className="relative shrink-0">
          <div className="w-10 h-12 bg-muted rounded flex items-center justify-center relative overflow-hidden">
            <File className="h-5 w-5 text-muted-foreground" />
            <div className={`absolute bottom-0 left-0 right-0 h-4 ${file.color} flex items-center justify-center`}>
              <span className="text-white text-xs font-bold">{file.icon}</span>
            </div>
          </div>
        </div>
        <div className="min-w-0">
          <h3 className="font-medium text-sm truncate">{file.name}</h3>
          <p className="text-xs text-muted-foreground">
            {file.size} • {file.date}
            {file.sourceLabel ? ` • ${file.sourceLabel}` : ""}
          </p>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onDownload(file)}>Download</DropdownMenuItem>
          <DropdownMenuItem className="text-red-600" onClick={() => onDelete(file)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const renderFileList = (files: DisplayFile[], emptyMessage: string, tab: "uploaded" | "downloaded") => {
    const loading = tab === "uploaded" ? uploadedQuery.isLoading : downloadedQuery.isLoading;
    const error = tab === "uploaded" ? uploadedQuery.isError : downloadedQuery.isError;

    if (loading) {
      return (
        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading documents…</p>
          </CardContent>
        </Card>
      );
    }

    if (error) {
      return (
        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <p className="text-destructive">Could not load your library. Please refresh.</p>
          </CardContent>
        </Card>
      );
    }

    if (files.length === 0) {
      const emptyBody = (
        <div className="p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No files found</h3>
          <p className="text-muted-foreground">
            {hasActiveFilters ? "Try adjusting your filters to see more results" : emptyMessage}
          </p>
        </div>
      );

      if (viewMode === "list") {
        return (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {tab === "uploaded" ? <Upload className="h-5 w-5" /> : <Download className="h-5 w-5" />}
                {tab === "uploaded" ? "Uploaded" : "Downloaded"} (0)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">{emptyBody}</CardContent>
          </Card>
        );
      }

      return (
        <Card className="shadow-card">
          <CardContent>{emptyBody}</CardContent>
        </Card>
      );
    }

    if (viewMode === "grid") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {files.map((file) => (
            <FileCard key={file.id} file={file} />
          ))}
        </div>
      );
    }

    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {tab === "uploaded" ? <Upload className="h-5 w-5" /> : <Download className="h-5 w-5" />}
            {tab === "uploaded" ? "Uploaded" : "Downloaded"} ({files.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {files.map((file) => (
            <FileRow key={file.id} file={file} />
          ))}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Document Library</h1>
            <p className="text-muted-foreground">
              Upload once, reuse across tools. PDF outputs and summaries appear under Downloaded.
            </p>
          </div>
          <div className="flex items-center gap-2" role="group" aria-label="View mode">
            <Button
              type="button"
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              aria-pressed={viewMode === "grid"}
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
              <span className="sr-only">Grid view</span>
            </Button>
            <Button
              type="button"
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              aria-pressed={viewMode === "list"}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
              <span className="sr-only">List view</span>
            </Button>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-4 flex-wrap">
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
                      {["PDF", "DOC", "TXT", "ZIP"].map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`filter-${type}`}
                            checked={selectedTypes.includes(type)}
                            onCheckedChange={() => toggleFileType(type)}
                          />
                          <Label htmlFor={`filter-${type}`} className="cursor-pointer">
                            {type === "DOC"
                              ? "Word Documents"
                              : type === "ZIP"
                              ? "ZIP Archives"
                              : `${type} Files`}
                          </Label>
                        </div>
                      ))}
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
                  <CalendarComponent
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                    className="rounded-md border"
                  />
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setDateRange({})}>
                    Clear Date Range
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
                <X className="h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full max-w-lg grid-cols-2 h-11 p-1 bg-muted/60">
            <TabsTrigger
              value="uploaded"
              className="flex items-center justify-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
            >
              <Upload className="h-4 w-4 shrink-0" />
              <span>Uploaded</span>
              <Badge variant="secondary" className="ml-0.5 h-5 min-w-[1.25rem] justify-center px-1.5">
                {uploadedCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="downloaded"
              className="flex items-center justify-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span>Downloaded</span>
              <Badge variant="secondary" className="ml-0.5 h-5 min-w-[1.25rem] justify-center px-1.5">
                {downloadedCount}
              </Badge>
            </TabsTrigger>
          </TabsList>

        </Tabs>

        <div key={`${activeTab}-${viewMode}`} className="mt-6">
          {activeTab === "uploaded"
            ? renderFileList(
                uploadedFiles,
                "Upload your first document below to reuse it across LexOrbit.",
                "uploaded"
              )
            : renderFileList(
                downloadedFiles,
                "Generated files from PDF tools and Document Summarizer will appear here.",
                "downloaded"
              )}
        </div>

        {activeTab === "uploaded" && (
        <Card
          className={`mt-8 border-2 border-dashed transition-colors ${
            uploadAtLimit
              ? "border-muted bg-muted/30"
              : isDragging
              ? "border-legal-primary bg-legal-primary/5"
              : "border-border hover:border-legal-primary"
          }`}
          onDragOver={(e) => {
            if (uploadAtLimit) return;
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            if (uploadAtLimit) return;
            handleDrop(e);
          }}
        >
          <CardContent className="p-12 text-center">
            {uploadAtLimit ? (
              <>
                <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Upload limit reached</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Your plan allows {usage?.uploaded.limit} saved upload
                  {usage?.uploaded.limit === 1 ? "" : "s"}. Delete a file to upload a new one, or upgrade
                  your plan for more storage.
                </p>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  You can still use <strong>Pick from Library</strong> in Chat, Summarizer, Predictive AI, and PDF tools — no extra upload needed.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button asChild variant="outline">
                    <Link to="/ai/summarizer">
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Pick from Library
                    </Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link to="/subscription">Upgrade plan</Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Upload New Documents</h3>
                <p className="text-muted-foreground mb-6">
                  Drag and drop your legal documents here, or click to browse
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                  multiple
                  onChange={(e) => e.target.files && uploadFiles(e.target.files)}
                />
                <Button
                  className="bg-legal-primary hover:bg-legal-primary/90"
                  disabled={uploadMutation.isPending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    "Choose Files"
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  Supported formats: PDF, DOC, DOCX, TXT (Max 10MB per file)
                </p>
              </>
            )}
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
};

export default Library;
