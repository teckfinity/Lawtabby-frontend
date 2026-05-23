import { useNavigate } from "react-router-dom";

interface PDFToolRecommendationsProps {
  currentTool?: string;
}

const PDFToolRecommendations = ({ currentTool }: PDFToolRecommendationsProps) => {
  const navigate = useNavigate();

  const tools = [
    { id: "merge", icon: "📄", label: "Merge", path: "/pdf/merge" },
    { id: "compress", icon: "🗜️", label: "Compress", path: "/pdf/compress" },
    { id: "split", icon: "✂️", label: "Split", path: "/pdf/split" },
    { id: "convert", icon: "📑", label: "To PDF", path: "/pdf/convert-to-other-formats" },
    { id: "sign", icon: "✍️", label: "Sign", path: "/pdf/sign" },
    { id: "protect", icon: "🔒", label: "Protect", path: "/pdf/protect" },
    { id: "edit", icon: "✏️", label: "Edit", path: "/pdf/edit" },
  ];

  // Filter out current tool and show only 6 tools
  const recommendedTools = tools
    .filter(tool => tool.id !== currentTool)
    .slice(0, 6);

  return (
    <div className="mt-8 text-left">
      <h4 className="text-sm font-medium text-muted-foreground mb-3">You might also need</h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {recommendedTools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => navigate(tool.path)}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-all group"
          >
            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
              {tool.icon}
            </div>
            <span className="text-xs font-medium">{tool.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PDFToolRecommendations;
