import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Merge, 
  Split, 
  Archive, 
  Edit3, 
  FileSignature, 
  Stamp, 
  FileType, 
  FileImage, 
  ScanText, 
  FolderOpen, 
  Lock, 
  Shield 
} from "lucide-react";

const PDFTools = () => {
  const navigate = useNavigate();
  
  const pdfTools = [
    {
      title: "Merge PDF",
      description: "Combine PDFs in the order you want.",
      icon: Merge,
      color: "text-gold-dark",
      bgColor: "bg-gold/15",
      action: "Merge Files",
      path: "/pdf/merge"
    },
    {
      title: "Split PDF", 
      description: "Separate one page or a whole set for easy conversion into independent PDF files.",
      icon: Split,
      color: "text-gold-dark",
      bgColor: "bg-gold/15",
      action: "Split Files",
      path: "/pdf/split"
    },
    {
      title: "Compress PDF",
      description: "Reduce file size while optimizing for maximal PDF quality.",
      icon: Archive,
      color: "text-success",
      bgColor: "bg-success/15",
      action: "Compress Files",
      path: "/pdf/compress"
    },
    {
      title: "Edit PDF",
      description: "Add text, images, shapes, highlights or freehand annotations to a PDF document. Edit the size, font, and color of the added content.",
      icon: Edit3,
      color: "text-navy",
      bgColor: "bg-navy/10",
      action: "Edit PDF",
      path: "/pdf/edit"
    },
    {
      title: "Sign PDF",
      description: "Sign or request electronic signatures from others.",
      icon: FileSignature,
      color: "text-primary",
      bgColor: "bg-primary/15",
      action: "Sign Document",
      path: "/pdf/sign"
    },
    {
      title: "Stamp PDF",
      description: "Stamp/watermark by adding an image or text over your PDF in seconds. Choose the typography, transparency and position.",
      icon: Stamp,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      action: "Add Stamp",
      path: "/pdf/stamp"
    },
    {
      title: "PDF to other Formats",
      description: "Easily convert your PDF files into DOC, PPT, EXCEL, JPEG, PPTX and DOCX documents.",
      icon: FileType,
      color: "text-legal-info",
      bgColor: "bg-legal-info/12",
      action: "Convert PDF",
      path: "/pdf/convert-from"
    },
    {
      title: "Other formats to PDF",
      description: "Turn your DOC, PPT, EXCEL, JPEG, PPTX and DOCX documents into PDF file.",
      icon: FileImage,
      color: "text-gold",
      bgColor: "bg-gold-light/20",
      action: "Convert to PDF",
      path: "/pdf/convert-to"
    },
    {
      title: "OCR",
      description: "Easily convert scanned PDF and images into searchable and selectable documents.",
      icon: ScanText,
      color: "text-sage",
      bgColor: "bg-success/12",
      action: "Extract Text",
      path: "/pdf/ocr"
    },
    {
      title: "Organize PDF",
      description: "Sort pages of your PDF file however you like. Delete PDF pages or add PDF pages to your document at your convenience.",
      icon: FolderOpen,
      color: "text-navy-light",
      bgColor: "bg-navy/12",
      action: "Organize Pages",
      path: "/pdf/organize"
    },
    {
      title: "Unlock PDF",
      description: "Remove PDF password security, giving you the freedom to use your PDFs as you want.",
      icon: Lock,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      action: "Unlock PDF",
      path: "/pdf/unlock"
    },
    {
      title: "Protect PDF",
      description: "Protect PDF files with a password. Encrypt PDF documents to prevent unauthorized access.",
      icon: Shield,
      color: "text-primary",
      bgColor: "bg-primary/12",
      action: "Protect PDF",
      path: "/pdf/protect"
    }
  ];

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-heading text-foreground mb-4">
            All the PDF tools you require conveniently located in one spot
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            User-friendly PDF tools with ease. Merge, split, compress, convert, 
            sign, unlock, and watermark PDFs in just a few clicks.
          </p>
        </div>

        {/* PDF Tools Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {pdfTools.map((tool, index) => (
    <Card 
      key={index} 
      className="shadow-card hover:shadow-legal transition-all duration-300 group cursor-pointer h-full flex flex-col"
    >
      <CardHeader className="text-center pb-4">
        <div className={`w-16 h-16 ${tool.bgColor} rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
          <tool.icon className={`h-8 w-8 ${tool.color}`} />
        </div>
        <CardTitle className="text-lg font-semibold group-hover:text-legal-primary transition-colors">
          {tool.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center pt-0 flex flex-col justify-between flex-grow">
        <CardDescription className="text-sm text-muted-foreground mb-6">
          {tool.description}
        </CardDescription>
        <Button 
          className="w-full mt-auto"
          size="sm"
          onClick={() => navigate(tool.path)}
        >
          {tool.action}
        </Button>
      </CardContent>
    </Card>
  ))}
</div>


        {/* Additional Information */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-primary text-white shadow-legal">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Professional PDF Management</h2>
              <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
                Our advanced PDF tools are designed specifically for legal professionals, 
                ensuring security, compliance, and efficiency in all your document workflows.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button 
                  variant="hero-outline" 
                  size="lg"
                  onClick={() => navigate("/subscription")}
                >
                  View Pricing
                </Button>
                 <Button 
                  variant="hero-outline" 
                  size="lg" 
                  className="gap-2"
                  onClick={() => navigate('/contact-support')}
                >
                  {/* <Zap className="w-4 h-4" /> */}
                  Contact Sales
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PDFTools;