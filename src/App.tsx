import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "next-themes";
import { AppSidebar } from "@/components/AppSidebar";
import { GoogleOAuthProvider } from "@react-oauth/google";

// ---------- Pages ----------
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import PDFTools from "./pages/PDFTools";
import Library from "./pages/Library";
import DocumentSummarizer from "./pages/ai/DocumentSummarizer";
import JudgeAnalytics from "./pages/ai/JudgeAnalytics";
import JudgeProfile from "./pages/ai/judge/JudgeProfile";
import CaseHistory from "./pages/ai/judge/CaseHistory";
import JudgePredictions from "./pages/ai/judge/JudgePredictions";
import CompareJudges from "./pages/ai/judge/CompareJudges";
import CitationMaps from "./pages/ai/CitationMaps";
import CreateCitationMap from "./pages/ai/citation/CreateCitationMap";
import PredictiveAI from "./pages/ai/PredictiveAI";
import AllPredictions from "./pages/ai/AllPredictions";
import DocumentAutomation from "./pages/ai/DocumentAutomation";
import LegalResearch from "./pages/ai/LegalResearch";
import MergePDF from "./pages/pdf/MergePDF";
import SplitPDF from "./pages/pdf/SplitPDF";
import CompressPDF from "./pages/pdf/CompressPDF";
import EditPDF from "./pages/pdf/EditPDF";
import SignPDF from "./pages/pdf/SignPDF";
import StampPDF from "./pages/pdf/StampPDF";
import ConvertFromPDF from "./pages/pdf/ConvertFromPDF";
import ConvertToPDF from "./pages/pdf/ConvertToPDF";
import OCRPDF from "./pages/pdf/OCRPDF";
import OrganizePDF from "./pages/pdf/OrganizePDF";
import UnlockPDF from "./pages/pdf/UnlockPDF";
import ProtectPDF from "./pages/pdf/ProtectPDF";
import DownloadProtectedPDF from "./pages/pdf/DownloadProtectedPDF";
import DownloadOCRPDF from "./pages/pdf/DownloadOCRPDF";
import Profile from "./pages/Profile";
import Subscription from "./pages/Subscription";
import History from "./pages/History";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import SignOut from "./pages/SignOut";
import ContactSupport from "./pages/ContactSupport";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";

// ---------- Protected Route ----------
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = !!localStorage.getItem("authToken");
  return isAuthenticated ? children : <Navigate to="/signin" replace />;
};

// ---------- Shared Layout for Protected Pages ----------
const ProtectedLayout = ({ children }: { children: JSX.Element }) => (
  <div className="min-h-screen flex w-full bg-background">
    <AppSidebar />
    <div className="flex-1 flex flex-col">
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  </div>
);

// ---------- Public Layout → Hamesha Dark Theme ----------
const PublicLayout = () => (
  <div className="dark min-h-screen w-full bg-background text-foreground">
    <Outlet />
  </div>
);

// ---------- App Setup ----------
const queryClient = new QueryClient();

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <SidebarProvider>
              <Routes>
                {/* Redirect root to SignIn */}
                <Route path="/" element={<Navigate to="/signin" replace />} />

                {/* Public Routes → Always Dark Theme */}
              <Route element={<PublicLayout />}>
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/signout" element={<SignOut />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/contact-support" element={<ContactSupport />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              </Route>

                {/* Protected Routes → System Theme (or future toggle) */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <Dashboard />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <Chat />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pdf-tools"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <PDFTools />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/library/uploaded"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <Library />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/library/downloaded"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <Library />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai/summarizer"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <DocumentSummarizer />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai/judge-analytics"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <JudgeAnalytics />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai/judge/:judgeId"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <JudgeProfile />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai/judge/:judgeId/case-history"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <CaseHistory />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai/judge/:judgeId/predictions"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <JudgePredictions />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai/judges/compare"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <CompareJudges />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai/citation-maps"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <CitationMaps />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai/citation-maps/create"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <CreateCitationMap />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai/predictive"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <PredictiveAI />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai/predictions/all"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <AllPredictions />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai/automation"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <DocumentAutomation />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai/legal-research"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <LegalResearch />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pdf/merge"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <MergePDF />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pdf/split"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <SplitPDF />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pdf/compress"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <CompressPDF />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pdf/edit"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <EditPDF />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pdf/sign"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <SignPDF />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pdf/stamp"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <StampPDF />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pdf/convert-from"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <ConvertFromPDF />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pdf/convert-to"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <ConvertToPDF />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pdf/ocr"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <OCRPDF />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pdf/download-ocr"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <DownloadOCRPDF />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pdf/organize"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <OrganizePDF />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pdf/unlock"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <UnlockPDF />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pdf/protect"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <ProtectPDF />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pdf/download-protected"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <DownloadProtectedPDF />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <Profile />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/subscription"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <Subscription />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history/:id"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <History />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SidebarProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </QueryClientProvider>
);

export default App;
