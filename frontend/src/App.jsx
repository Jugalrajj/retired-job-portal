import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Layout Components
import Navbar from "./common/Navbar";
import Footer from "./common/Footer";

// Theme Components
import GlobalThemeManager from "./components/GlobalThemeManager";
import ThemeToggle from "./components/ThemeToggle";

// Page Components
import Home from "./pages/public/Home";
import AuthPage from "./pages/auth/AuthPage";
import PostJob from "./pages/employer/PostJob";
import AdminDashboard from "./pages/admin/AdminDashboard"; 
import ProtectedRoute from "./routes/ProtectedRoute";
import RequireAuth from "./routes/RequireAuth"; 

// Static Pages
import AboutUs from "./pages/public/AboutUs";
import ContactUs from "./pages/public/ContactUs";
import Categories from "./pages/public/Categories";

// Context
import { SocketContextProvider } from "./context/SocketContext"; 
import useAuthStore from "./context/useAuthStore"; 

// Profile/Details Pages
import CompanyProfile from "./pages/public/CompanyProfile";
import SeekerDetailsForm from "./pages/seeker/SeekerDetailsForm";
import AllCompanies from "./components/AllCompanies";

// Seeker Specific Pages
import MyApplications from "./pages/seeker/MyApplications";
import SavedJobs from "./pages/seeker/SavedJobs";

// Employer Pages
import MyJobs from "./pages/employer/MyJobs";
import EmployerApplications from "./pages/employer/EmployerApplications";
import TalentPool from "./pages/employer/TalentPool";
import TeamMembers from "./pages/employer/TeamMembers";
import BillingPlans from "./pages/employer/BillingPlans";
import CandidateProfile from "./pages/seeker/CandidateProfile";

// Common Pages
import Settings from "./pages/public/Settings";
import Messages from "./pages/employer/Messages"; 
import JobDetails from "./pages/employer/JobDetails";
import SeekerJobDetails from "./pages/seeker/SeekerJobDetails";
import JobPreferences from "./pages/seeker/JobPreferences";
import HelpSupport from "./pages/public/HelpSupport";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import ApplicantDetails from "./pages/employer/ApplicantDetails";
import CategoryJobs from "./pages/public/CategoryJobs";
import PrivacyPolicy from "./pages/public/PrivacyPolicy";
import TermsOfService from "./pages/public/TermsOfService";
import BillingHistory from "./pages/employer/BillingHistory";
import EmployerDetailsForm from "./pages/employer/EmployerDetailsForm";
import SeeJobs from "./pages/seeker/SeeJobs";
import NotFound from "./pages/NotFound";

// --- 🔥 NEW COMPONENT: Restrict Employers/Recruiters from Seeker Pages ---
const SeekerOrGuest = () => {
  const { user } = useAuthStore();
  const currentUser = user?.user;
  const isEmployerOrRecruiter = currentUser?.role === "employer" || currentUser?.role === "recruiter";

  // If logged in as Employer/Recruiter, redirect them to their Dashboard (Home)
  if (isEmployerOrRecruiter) {
    return <Navigate to="/" replace />;
  }
  
  // Otherwise (Guest or Seeker), allow access
  return <Outlet />;
};

function App() {
  return (
    <SocketContextProvider>
      <GlobalThemeManager />
      
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
        <ThemeToggle />
      </div>

      <Navbar />
      <Toaster position="top-right" reverseOrder={false} />
      
      <div style={{ minHeight: "80vh" }}>
        <Routes>
          {/* ================= TRUE PUBLIC ROUTES ================= */}
          {/* Accessible by EVERYONE (including Recruiters) */}
          <Route path="/" element={<Home />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          
          {/* 🔥 FIX: HelpSupport is now Public because it handles 'guest' logic internally */}
          <Route path="/support" element={<HelpSupport />} />
          
          {/* Auth Routes */}
          {/* If already logged in, AuthPage usually handles redirect, or we can leave it public */}
          <Route path="/auth/:role" element={<AuthPage />} />


          {/* ================= SEEKER / GUEST ONLY ROUTES ================= */}
          {/* 🔥 FIX: Wrapped these in SeekerOrGuest to block Recruiters */}
          <Route element={<SeekerOrGuest />}>
            <Route path="/find-jobs" element={<SeeJobs />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/category/:categoryName" element={<CategoryJobs />} />
            <Route path="/all-companies" element={<AllCompanies />} />
            <Route path="/company/:id" element={<CompanyProfile />} />
          </Route>


          {/* ================= COMMON PROTECTED ROUTES ============= ==== */}
          <Route element={<ProtectedRoute><Settings /></ProtectedRoute>} path="/settings" />
          <Route element={<ProtectedRoute><Messages /></ProtectedRoute>} path="/messages" />
          {/* Note: HelpSupport moved to Public Routes above */}


          {/* ================= SEEKER PROTECTED ROUTES ================= */}
          <Route element={<RequireAuth allowedRoles={['jobseeker', 'seeker']} />}>
            <Route path="/seeker-details" element={<SeekerDetailsForm />} />
            <Route path="/applications" element={<MyApplications />} />
            <Route path="/saved-jobs" element={<SavedJobs />} />
            <Route path="/job/:id" element={<SeekerJobDetails />} />
            <Route path="/preferences" element={<JobPreferences />} />
          </Route>


          {/* ================= EMPLOYER & RECRUITER ROUTES ================= */}
          <Route element={<RequireAuth allowedRoles={['employer', 'recruiter']} />}>
            <Route path="/employer-details" element={<EmployerDetailsForm />} />
            <Route path="/post-job" element={<PostJob />} />
            <Route path="/my-jobs" element={<MyJobs />} />
            <Route path="/employer-applications" element={<EmployerApplications />} />
            <Route path="/applications/:id" element={<ApplicantDetails />} />
            <Route path="/talent-pool" element={<TalentPool />} />
            <Route path="/candidate/:id" element={<CandidateProfile />} />
            <Route path="/team" element={<TeamMembers />} />
            <Route path="/billing" element={<BillingPlans />} />
             <Route path="/billing-history" element={<BillingHistory />} />
            <Route path="/jobs/:id" element={<JobDetails />} />
          </Route>


          {/* ================= ADMIN ROUTES ================= */}
          <Route element={<RequireAuth allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>


          {/* ================= FALLBACK ================= */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      
      <Footer />
    </SocketContextProvider>
  );
}

export default App;