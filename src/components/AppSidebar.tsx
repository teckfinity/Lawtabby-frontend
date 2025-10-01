import { 
  Home, 
  FileText, 
  Library, 
  History, 
  LogIn, 
  UserPlus,
  LogOut,
  ChevronUp,
  ChevronDown,
  Upload,
  Download,
  MessageSquare,
  Brain,
  Gavel,
  Network,
  TrendingUp,
  FileCheck,
  Search,
  HelpCircle,
  Settings,
  PanelLeftClose,
  PanelLeft
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const mainNavItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "AI Chat", url: "/chat", icon: MessageSquare },
  { title: "PDF Management Tools", url: "/pdf-tools", icon: FileText },
];

const libraryItems = [
  { title: "Uploaded", url: "/library/uploaded", icon: Upload },
  { title: "Downloaded", url: "/library/downloaded", icon: Download },
];

const aiFeatures = [
  { title: "Document Summarizer", url: "/ai/summarizer", icon: Brain },
  { title: "Legal Research", url: "/ai/legal-research", icon: Search },
  { title: "Judge Analytics", url: "/ai/judge-analytics", icon: Gavel },
  { title: "Citation Maps", url: "/ai/citation-maps", icon: Network },
  { title: "Predictive AI", url: "/ai/predictive", icon: TrendingUp },
  { title: "Document Automation", url: "/ai/automation", icon: FileCheck },
];

const historyItems = [
  "Legal practice analysis",
  "Legal breakdown summary", 
  "Court case review",
  "Contract analysis",
  "Legal research notes"
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [libraryOpen, setLibraryOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Check if user is authenticated on mount
    const authStatus = localStorage.getItem('isAuthenticated');
    setIsAuthenticated(authStatus === 'true');
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    navigate('/signin');
  };

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const getNavClass = (path: string) => 
    isActive(path) 
      ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" 
      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

  return (
    <Sidebar className={`${isCollapsed ? "w-14" : "w-72"} border-r border-sidebar-border`} collapsible="icon">
      <div className={`flex items-center border-b border-sidebar-border h-16 ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
        {!isCollapsed && (
          <div className="text-sidebar-foreground">
            <h1 className="text-lg font-semibold">LegalAI Pro</h1>
            <p className="text-xs text-sidebar-foreground/70">AI-Powered Legal Platform</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors flex-shrink-0"
          aria-label="Toggle Sidebar"
        >
          {isCollapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      <SidebarContent className={isCollapsed ? "px-1" : "px-2"}>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className={isCollapsed ? "space-y-1" : ""}>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className={isCollapsed ? "w-full flex justify-center" : ""}>
                      <NavLink 
                        to={item.url} 
                        className={`${getNavClass(item.url)} flex items-center ${isCollapsed ? 'justify-center w-full h-10 px-0' : 'px-3'}`}
                      >
                        <item.icon className={`h-4 w-4 ${isCollapsed ? '' : 'mr-2'}`} />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI Features */}
        <SidebarGroup>
          {!isCollapsed && (
            <div 
              className="flex items-center justify-between cursor-pointer py-2 px-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
              onClick={() => setAiOpen(!aiOpen)}
            >
              <SidebarGroupLabel className="text-xs font-medium">
                AI FEATURES
              </SidebarGroupLabel>
              {aiOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </div>
          )}
          {(aiOpen || isCollapsed) && (
            <SidebarGroupContent>
              <SidebarMenu className={isCollapsed ? "space-y-1" : ""}>
                {aiFeatures.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className={isCollapsed ? "w-full flex justify-center" : ""}>
                      <NavLink 
                        to={item.url} 
                        className={`${getNavClass(item.url)} flex items-center ${isCollapsed ? 'justify-center w-full h-10 px-0' : 'px-3'}`}
                      >
                        <item.icon className={`h-4 w-4 ${isCollapsed ? '' : 'mr-2'}`} />
                        {!isCollapsed && <span className="text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>

        {/* Library */}
        <SidebarGroup>
          {!isCollapsed && (
            <div 
              className="flex items-center justify-between cursor-pointer py-2 px-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
              onClick={() => setLibraryOpen(!libraryOpen)}
            >
              <SidebarGroupLabel className="text-xs font-medium flex items-center gap-2">
                <Library className="h-3 w-3" />
                LIBRARY
              </SidebarGroupLabel>
              {libraryOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </div>
          )}
          {(libraryOpen || isCollapsed) && (
            <SidebarGroupContent>
              <SidebarMenu className={isCollapsed ? "space-y-1" : ""}>
                {libraryItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className={isCollapsed ? "w-full flex justify-center" : ""}>
                      <NavLink 
                        to={item.url} 
                        className={`${getNavClass(item.url)} flex items-center ${isCollapsed ? 'justify-center w-full h-10 px-0' : 'px-3'}`}
                      >
                        <item.icon className={`h-4 w-4 ${isCollapsed ? '' : 'mr-2'}`} />
                        {!isCollapsed && <span className="text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>

        {/* History */}
        {!isCollapsed && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2 text-xs font-medium text-sidebar-foreground/70">
              <History className="h-3 w-3" />
              HISTORY
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {historyItems.map((item, index) => (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuButton asChild>
                      <NavLink to={`/history/${index}`} className="text-sidebar-foreground/80 hover:text-sidebar-foreground text-sm truncate">
                        <div className="w-2 h-2 rounded-full bg-sidebar-foreground/40 mr-2 flex-shrink-0" />
                        <span className="truncate">{item}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Bottom Section */}
      <div className={`mt-auto border-t border-sidebar-border ${isCollapsed ? 'p-2 flex flex-col items-center gap-2' : 'p-4'}`}>
        {!isCollapsed && (
          <div className="bg-sidebar-accent rounded-lg p-3 mb-4">
            <h3 className="text-sm font-semibold text-sidebar-accent-foreground mb-1">Try Pro</h3>
            <p className="text-xs text-sidebar-accent-foreground/70 mb-2">
              Upgrade to upload more files and download PDF edits.
            </p>
            <Button 
              size="sm" 
              className="w-full bg-sidebar-primary hover:bg-sidebar-primary/90"
              onClick={() => navigate('/subscription')}
            >
              Upgrade Plan
            </Button>
          </div>
        )}
        
        {!isAuthenticated ? (
          <div className={`flex flex-col gap-2 ${isCollapsed ? 'w-full items-center' : ''}`}>
            {isCollapsed ? (
              <>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-10 w-10 text-sidebar-foreground hover:bg-sidebar-accent"
                  onClick={() => navigate('/signin')}
                >
                  <LogIn className="h-4 w-4" />
                </Button>
                <Button 
                  variant="default" 
                  size="icon"
                  className="h-10 w-10 bg-sidebar-primary hover:bg-sidebar-primary/90"
                  onClick={() => navigate('/signup')}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  className="justify-start text-sidebar-foreground hover:bg-sidebar-accent w-full"
                  onClick={() => navigate('/signin')}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  <span>Sign In</span>
                </Button>
                <Button 
                  variant="default" 
                  className="justify-start bg-sidebar-primary hover:bg-sidebar-primary/90 w-full"
                  onClick={() => navigate('/signup')}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  <span>Sign Up</span>
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className={`flex flex-col gap-2 ${isCollapsed ? 'w-full items-center' : ''}`}>
            {isCollapsed ? (
              <Button 
                variant="ghost" 
                size="icon"
                className="h-10 w-10 text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                className="justify-start text-sidebar-foreground hover:bg-sidebar-accent w-full"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span>Sign Out</span>
              </Button>
            )}
          </div>
        )}

        {!isCollapsed && isAuthenticated && (
          <NavLink to="/profile" className="flex items-center gap-2 mt-4 p-2 text-xs text-sidebar-foreground/60 hover:bg-sidebar-accent rounded-md transition-colors">
            <div className="w-6 h-6 bg-sidebar-primary rounded-full flex items-center justify-center text-sidebar-primary-foreground font-medium">
              A
            </div>
            <div className="flex-1 truncate">
              <p className="truncate">angelahenry054...</p>
            </div>
            <Settings className="h-3 w-3" />
          </NavLink>
        )}
        
        {isCollapsed && isAuthenticated && (
          <NavLink 
            to="/profile" 
            className="flex items-center justify-center w-10 h-10 hover:bg-sidebar-accent rounded-md transition-colors"
          >
            <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center text-sidebar-primary-foreground font-medium text-xs">
              A
            </div>
          </NavLink>
        )}
      </div>

    </Sidebar>
  );
}