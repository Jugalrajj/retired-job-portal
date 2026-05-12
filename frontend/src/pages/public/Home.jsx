import React from "react";
import useAuthStore from "../../context/useAuthStore.js";
import useThemeStore from "../../context/useThemeStore.js"; // --- NEW: Imported Theme Store ---
import { motion } from "framer-motion"; // --- NEW: Imported Framer Motion ---

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

// ==========================================
// NEW: FRAMER MOTION SCROLL REVEAL WRAPPER
// ==========================================
const ScrollReveal = ({ children, type = "fade-up", delay = 0, duration = 0.8 }) => {
  // Define animation states based on the 'type' passed
  const variants = {
    hidden: { 
      opacity: 0, 
      y: type === "fade-up" ? 60 : type === "fade-down" ? -60 : 0,
      x: type === "slide-left" ? 80 : type === "slide-right" ? -80 : 0,
      scale: type === "zoom-in" ? 0.90 : 1
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      x: 0,
      scale: 1,
      transition: { 
        duration: duration, 
        delay: delay, 
        ease: [0.17, 0.55, 0.55, 1] // Smooth custom easing
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px 0px -50px 0px" }} // Triggers just before it enters
      variants={variants}
    >
      {children}
    </motion.div>
  );
};
// ==========================================

const Home = () => {
  const { user } = useAuthStore();
  const { theme } = useThemeStore(); // --- NEW: Access current theme ---
  
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

  // --- NEW: Determine background color based on theme ---
  const bgColor = theme === 'dark' ? "#000000" : "#ffffff";

  // 3. If User is SEEKER or PUBLIC -> Render Landing Page
  return (
    <div style={{ backgroundColor: bgColor, minHeight: "100vh", overflowX: "hidden" }}>
        <>
          {/* Hero loads slightly fading down */}
          <ScrollReveal type="fade-down" delay={0.1}>
            <Hero />
          </ScrollReveal>

          {/* Companies smoothly fade up */}
          <ScrollReveal type="fade-up" delay={0.2}>
            <Companies />
          </ScrollReveal>

          {/* Featured Jobs slides in from the right (moving left) */}
          <ScrollReveal type="slide-left" delay={0.1}>
            <FeaturedJobs />
          </ScrollReveal>

          {/* How It Works slides in from the left (moving right) */}
          <ScrollReveal type="slide-right" delay={0.1}>
            <HowItWorks />
          </ScrollReveal>

          {/* Final CTA pops/zooms in */}
          <ScrollReveal type="zoom-in" delay={0.1}>
            <FinalCTA />
          </ScrollReveal>

          {/* Keeping ChatWidget outside of ScrollReveal so it stays fixed natively */}
          <ChatWidget />
        </>
    </div>
  );
};

export default Home;