import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileEdit, Pencil, Type, Square } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            PDF Editor Pro
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Edit PDFs with advanced text formatting, smooth drawings, and fully customizable shapes
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="shadow-2xl border-2 hover:border-primary/50 transition-all">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Type className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Word-Level Formatting</h3>
                      <p className="text-sm text-muted-foreground">
                        Style individual words with different fonts, sizes, and colors
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Pencil className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Smooth Drawing</h3>
                      <p className="text-sm text-muted-foreground">
                        Draw smooth, professional-looking lines and annotations
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Square className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Resizable Shapes</h3>
                      <p className="text-sm text-muted-foreground">
                        Add and customize shapes with drag-and-drop resizing
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div className="p-8 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl">
                    <FileEdit className="h-24 w-24 text-primary" />
                  </div>
                  <Button
                    size="lg"
                    className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
                    onClick={() => navigate("/edit-pdf")}
                  >
                    <FileEdit className="h-5 w-5 mr-2" />
                    Start Editing PDFs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
