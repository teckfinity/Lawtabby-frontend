import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "next-themes";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import PDFTools from "./pages/PDFTools";
import Library from "./pages/Library";
import DocumentSummarizer from "./pages/ai/DocumentSummarizer";
import JudgeAnalytics from "./pages/ai/JudgeAnalytics";
import JudgeProfile from "./pages/ai/judge/JudgeProfile";
import CaseHistory from "./pages/ai/judge/CaseHistory";
import JudgePredictions from "./pages/ai/judge/JudgePredictions";
import CitationMaps from "./pages/ai/CitationMaps";
import PredictiveAI from "./pages/ai/PredictiveAI";
import DocumentAutomation from "./pages/ai/DocumentAutomation";
import LegalResearch from "./pages/ai/LegalResearch";
import NotFound from "./pages/NotFound";
// Added routes for newly created pages
import CompareJudges from "./pages/ai/judge/CompareJudges";
import AllPredictions from "./pages/ai/AllPredictions";
import CreateCitationMap from "./pages/ai/citation/CreateCitationMap";
// PDF Tool imports
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
import ForgotPassword from "./pages/ForgotPassword";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import SignOut from "./pages/SignOut";
import ContactSupport from "./pages/ContactSupport";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import History from "./pages/History";

// ✅ Google OAuth Provider
import { GoogleOAuthProvider } from "@react-oauth/google";

const queryClient = new QueryClient();

// ✅ Replace this with your actual Google Client ID
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
                {/* Routes outside dashboard layout */}
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/signout" element={<SignOut />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/contact-support" element={<ContactSupport />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />

                {/* Dashboard routes with sidebar */}
                <Route
                  path="/*"
                  element={
                    <div className="min-h-screen flex w-full bg-background">
                      <AppSidebar />
                      <div className="flex-1 flex flex-col">
                        <main className="flex-1 overflow-auto">
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/chat" element={<Chat />} />
                            <Route path="/pdf-tools" element={<PDFTools />} />
                            <Route
                              path="/library/uploaded"
                              element={<Library />}
                            />
                            <Route
                              path="/library/downloaded"
                              element={<Library />}
                            />
                            <Route
                              path="/ai/summarizer"
                              element={<DocumentSummarizer />}
                            />
                            <Route
                              path="/ai/judge-analytics"
                              element={<JudgeAnalytics />}
                            />
                            <Route
                              path="/ai/judge/:judgeId"
                              element={<JudgeProfile />}
                            />
                            <Route
                              path="/ai/judge/:judgeId/case-history"
                              element={<CaseHistory />}
                            />
                            <Route
                              path="/ai/judge/:judgeId/predictions"
                              element={<JudgePredictions />}
                            />
                            <Route
                              path="/ai/judges/compare"
                              element={<CompareJudges />}
                            />
                            <Route
                              path="/ai/citation-maps"
                              element={<CitationMaps />}
                            />
                            <Route
                              path="/ai/citation-maps/create"
                              element={<CreateCitationMap />}
                            />
                            <Route
                              path="/ai/predictive"
                              element={<PredictiveAI />}
                            />
                            <Route
                              path="/ai/predictions/all"
                              element={<AllPredictions />}
                            />
                            <Route
                              path="/ai/automation"
                              element={<DocumentAutomation />}
                            />
                            <Route
                              path="/ai/legal-research"
                              element={<LegalResearch />}
                            />
                            {/* PDF Tool routes */}
                            <Route path="/pdf/merge" element={<MergePDF />} />
                            <Route path="/pdf/split" element={<SplitPDF />} />
                            <Route
                              path="/pdf/compress"
                              element={<CompressPDF />}
                            />
                            <Route path="/pdf/edit" element={<EditPDF />} />
                            <Route path="/pdf/sign" element={<SignPDF />} />
                            <Route path="/pdf/stamp" element={<StampPDF />} />
                            <Route
                              path="/pdf/convert-from"
                              element={<ConvertFromPDF />}
                            />
                            <Route
                              path="/pdf/convert-to"
                              element={<ConvertToPDF />}
                            />
                            <Route path="/pdf/ocr" element={<OCRPDF />} />
                            <Route
                              path="/pdf/download-ocr"
                              element={<DownloadOCRPDF />}
                            />
                            <Route
                              path="/pdf/organize"
                              element={<OrganizePDF />}
                            />
                            <Route
                              path="/pdf/unlock"
                              element={<UnlockPDF />}
                            />
                            <Route
                              path="/pdf/protect"
                              element={<ProtectPDF />}
                            />
                            <Route
                              path="/pdf/download-protected"
                              element={<DownloadProtectedPDF />}
                            />
                            <Route path="/profile" element={<Profile />} />
                            <Route
                              path="/subscription"
                              element={<Subscription />}
                            />
                            <Route path="/history/:id" element={<History />} />
                            {/* Catch-all */}
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </main>
                      </div>
                    </div>
                  }
                />
              </Routes>
            </SidebarProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </QueryClientProvider>
);

export default App;
