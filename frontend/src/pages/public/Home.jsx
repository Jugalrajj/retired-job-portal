import React from "react";
import useAuthStore from "../../context/useAuthStore.js";

// --- Seeker / Public Components ---
import Hero from "../../common/Hero.jsx";
import HowItWorks from "./HowItWorks.jsx";
import FeaturedJobs from "./FeaturedJobs.jsx";
import FinalCTA from "./FinalCTA.jsx";
import Companies from "./Companies.jsx"; 

// --- Dashboard Components ---
import EmployerDashboard from "../employer/EmployerDashboard.jsx"; 
import AdminDashboard from "../admin/AdminDashboard.jsx"; 
import ChatWidget from "../../components/ChatWidget.jsx";

const Home = () => {
  const { user } = useAuthStore();
  
  // Get the user role (admin, employer, recruiter, or seeker)
  const role = user?.user?.role;

  // 1. If User is ADMIN -> Render Admin Dashboard
  if (role === "admin") {
    return <AdminDashboard />;
  }

  // 2. If User is EMPLOYER or RECRUITER -> Render Employer Dashboard
  // *** FIX: Added 'recruiter' check here ***
  if (role === "employer" || role === "recruiter") {
    return <EmployerDashboard />;
  }

  // 3. If User is SEEKER or PUBLIC -> Render Landing Page
  return (
    <div style={{ backgroundColor: "#020617", minHeight: "100vh", overflowX: "hidden" }}>
        <>
          <Hero />
          <Companies />
          <FeaturedJobs />
          <HowItWorks />
          {/* <FeaturedPartners /> */}
          <FinalCTA />
          <ChatWidget />
        </>
    </div>
  );
};

export default Home;