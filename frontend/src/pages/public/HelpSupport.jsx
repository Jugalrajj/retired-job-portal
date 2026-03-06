import React, { useState } from "react";
import useAuthStore from "../../context/useAuthStore";
import {
  Search,
  HelpCircle,
  User,
  Briefcase,
  Settings,
  ChevronDown,
  ChevronUp,
  Mail,
  MessageCircle,
  FileText,
  Shield,
  Zap,
} from "lucide-react";

const HelpSupport = () => {
  const { user } = useAuthStore();

  // --- AUTH & ROLE HANDLING ---
  const isLoggedIn = !!user?.user;
  const role = isLoggedIn ? user.user.role : "guest"; // 'seeker', 'employer', or 'guest'

  // --- STATE ---
  // Default to 'employer' tab only if logged in as employer, otherwise default to 'seeker'
  const [activeTab, setActiveTab] = useState(
    role === "employer" ? "employer" : "seeker",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  // --- DYNAMIC THEME CONFIG (Based on Active Tab) ---
  const isEmployerTab = activeTab === "employer";

  // Note: We are now using CSS variables for colors, so this JS object is less critical for styling
  // but kept for any logic that might need it.
  const theme = {
    btn: "var(--primary)",
    light: "var(--primary-dim)",
    border: "var(--border)",
    icon: "var(--primary)",
  };

  // --- CONTENT DATA ---
  const faqData = {
    seeker: [
      {
        question: "Is this portal free for retired professionals?",
        answer:
          "Yes! Creating a profile, searching for jobs, and applying to opportunities is completely free for all retired professionals and senior job seekers.",
      },
      {
        question: "How do I upload or update my resume?",
        answer:
          "Go to your 'My Profile' page. Scroll down to the 'Documents' section where you can upload a PDF version of your resume (Max 5MB).",
      },
      {
        question: "Can I find part-time or advisory roles?",
        answer:
          "Absolutely. Our platform specializes in flexible, part-time, and advisory roles suited for experienced veterans.",
      },
      {
        question: "How do I apply for jobs?",
        answer:
          "Click on any job card to view details. If you are logged in, you will see an 'Apply Now' button. Fill in the short form and submit.",
      },
    ],
    employer: [
      {
        question: "How much does it cost to post a job?",
        answer:
          "We offer a 'Starter' plan (1 Free Job). For more, you can upgrade to 'Growth' or 'Enterprise' plans via the Billing page.",
      },
      {
        question: "How do I verify my company profile?",
        answer:
          "After registration, our admin team reviews your details. Verification usually takes 24-48 hours. Ensure your business email is valid.",
      },
      {
        question: "Can I invite team members?",
        answer:
          "Yes. Go to 'Team Members' in your dashboard. You can invite colleagues and assign specific permissions like 'Post Jobs'.",
      },
      {
        question: "How do I access candidate resumes?",
        answer:
          "Navigate to 'Applications'. Click on a candidate's card to view their full profile and download their attached resume.",
      },
    ],
    account: [
      {
        question: "I forgot my password. How do I reset it?",
        answer:
          "Go to the Login page and click 'Forgot Password'. We will send a secure reset link to your registered email.",
      },
      {
        question: "How do I change my email preferences?",
        answer:
          "Navigate to 'Settings' > 'Notifications'. You can toggle alerts for new jobs and application updates.",
      },
      {
        question: "Is my personal data secure?",
        answer:
          "Yes. We use enterprise-grade encryption for all personal data and never share your contact details with unauthorized third parties.",
      },
    ],
  };

  // --- TABS DEFINITION ---
  const allTabs = [
    {
      id: "seeker",
      label: "Seeker Guide",
      icon: <User size={24} />,
      desc: "Profile, Applications & Alerts",
    },
    {
      id: "employer",
      label: "Employer Guide",
      icon: <Briefcase size={24} />,
      desc: "Posting Jobs, Billing & Teams",
    },
    {
      id: "account",
      label: "Account & Security",
      icon: <Settings size={24} />,
      desc: "Login, Password & Privacy",
    },
  ];

  // --- FILTER VISIBLE TABS ---
  const visibleTabs = allTabs.filter((tab) => {
    if (role === "guest") return true;
    if (tab.id === "account") return true;
    return tab.id === role;
  });

  // Filter Logic
  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const currentFaqs = faqData[activeTab].filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="dark-help-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        
        /* --- PAGE WRAPPER --- */
        .dark-help-wrapper {
          min-height: 100vh;
          background-color: var(--bg-root); /* 🔥 Theme Var */
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
          color: var(--text-main); /* 🔥 Theme Var */
          transition: background-color 0.3s ease;
        }

        /* --- BACKGROUND FX --- */
        .bg-blob {
          position: absolute; border-radius: 50%; filter: blur(120px);
          opacity: 0.15; z-index: 0; pointer-events: none;
        }
        .b1 { top: -10%; left: -10%; width: 600px; height: 600px; background: #4f46e5; }
        .b2 { bottom: -10%; right: -5%; width: 500px; height: 500px; background: var(--primary); }

        /* --- CONTAINER --- */
        .content-container {
          width: 100%; max-width: 1280px;
          margin: 0 auto;
          position: relative;
          z-index: 5;
          display: flex; flex-direction: column;
        }

        /* --- HERO SECTION --- */
        .help-hero {
          padding: 80px 20px 100px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .hero-content { position: relative; z-index: 10; max-width: 700px; margin: 0 auto; }
        
        .help-hero h1 { 
          font-family: 'Playfair Display', serif; font-size: 3rem; 
          color: var(--text-main); margin: 0 0 16px; font-weight: 700;
        }
        .help-hero span {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        
        .help-hero p { color: var(--text-sub); font-size: 1.1rem; margin: 0 0 40px; }

        /* Search Bar */
        .search-bar-container {
          background: var(--bg-card); /* 🔥 Theme Var */
          border-radius: 50px; 
          padding: 10px 24px; border: 1px solid var(--border);
          display: flex; align-items: center; gap: 12px;
          box-shadow: 0 15px 30px -5px rgba(0,0,0,0.1);
          transition: 0.3s; max-width: 500px; margin: 0 auto;
        }
        .search-bar-container:focus-within {
          border-color: var(--primary);
          background: var(--bg-input);
          box-shadow: 0 0 0 2px var(--primary-dim);
        }
        .search-bar-container input {
          border: none; outline: none; width: 100%; font-size: 16px; 
          color: var(--text-main); padding: 8px 0; background: transparent;
        }
        .search-icon { color: var(--text-sub); }

        /* --- CONTENT AREA --- */
        .content-width {
          max-width: 900px; margin: -50px auto 0; padding: 0 20px 60px;
          position: relative; z-index: 20;
        }

        /* --- CATEGORY CARDS --- */
        .category-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px; margin-bottom: 50px;
        }
        .cat-card {
          background: var(--bg-card); /* 🔥 Theme Var */
          border: 1px solid var(--border); border-radius: 20px;
          padding: 30px 24px; text-align: center; cursor: pointer; transition: all 0.3s;
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); display: flex;
          flex-direction: column; align-items: center;
        }
        .cat-card:hover { transform: translateY(-5px); border-color: var(--primary); }
        
        .cat-card.active { border-color: var(--primary); background: var(--primary-dim); } 
        
        .cat-icon {
          width: 56px; height: 56px; border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px; transition: 0.3s;
          background: var(--bg-input); color: var(--text-sub);
        }
        
        .cat-card.active .cat-icon {
          background: var(--primary); color: #000;
        }
        
        .cat-card h3 { font-size: 1.1rem; font-weight: 700; margin: 0 0 6px; color: var(--text-main); }
        .cat-card p { font-size: 0.9rem; color: var(--text-sub); margin: 0; }

        /* --- FAQ SECTION --- */
        .faq-section { margin-bottom: 60px; }
        .section-header { margin-bottom: 24px; }
        .section-header h2 { text-align: center; font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 700; color: var(--text-main); margin: 0 0 8px; }
        .section-header p { text-align: center; color: var(--text-sub); font-size: 1rem; margin: 0; }

        .faq-list { display: flex; flex-direction: column; gap: 16px; }
        
        .faq-item {
          background: var(--bg-card); border: 1px solid var(--border); 
          border-radius: 16px; overflow: hidden; transition: all 0.3s ease;
        }
        .faq-item.open { border-color: var(--primary); background: var(--bg-input); }

        .faq-question {
          width: 100%; padding: 24px; display: flex; justify-content: space-between; align-items: center;
          background: none; border: none; font-size: 1.05rem; font-weight: 600; color: var(--text-main);
          cursor: pointer; text-align: left;
        }
        
        .faq-answer {
          max-height: 0; overflow: hidden; transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .faq-item.open .faq-answer { max-height: 300px; }
        .answer-inner { 
          padding: 0 24px 24px; color: var(--text-sub); 
          line-height: 1.7; font-size: 0.95rem; border-top: 1px solid var(--border);
          padding-top: 16px;
        }

        .no-results { text-align: center; padding: 40px; color: var(--text-sub); background: var(--bg-card); border-radius: 16px; border: 1px dashed var(--border); }
        .no-results p { margin-top: 10px; }

        /* --- CONTACT BANNER --- */
        .contact-banner {
          background: var(--bg-input); /* Adaptive Banner */
          border: 1px solid var(--border); border-radius: 20px; padding: 40px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 30px; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);
        }
        .banner-text h2 { margin: 0 0 8px; font-size: 1.5rem; font-weight: 700; color: var(--text-main); }
        .banner-text p { margin: 0; color: var(--text-sub); font-size: 1rem; }

        .banner-actions { display: flex; gap: 16px; }
        .btn-contact {
          padding: 12px 24px; border-radius: 50px; font-weight: 600;
          display: flex; align-items: center; gap: 8px; border: none; cursor: pointer;
          transition: 0.2s; font-size: 0.95rem;
        }
        .btn-contact.email { background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border); }
        .btn-contact.email:hover { background: var(--border); }
        
        .btn-contact.chat { background: var(--primary); color: #000; }
        .btn-contact.chat:hover { opacity: 0.9; transform: translateY(-1px); }

        /* --- FOOTER LINKS --- */
        .quick-links { display: flex; justify-content: center; gap: 30px; margin-top: 50px; color: var(--text-sub); font-size: 0.9rem; }
        .link-item { display: flex; align-items: center; gap: 6px; cursor: pointer; transition: 0.2s; font-weight: 500; }
        .link-item:hover { color: var(--primary); }

        /* --- RESPONSIVE --- */
        @media (max-width: 900px) {
          .help-hero { padding: 60px 20px 80px; }
          .help-hero h1 { font-size: 2.2rem; }
          
          .content-width { padding: 0 20px 40px; margin-top: -40px; }
          
          .contact-banner { flex-direction: column; text-align: center; padding: 30px 20px; }
          .banner-actions { width: 100%; justify-content: center; flex-direction: column; }
          .btn-contact { width: 100%; justify-content: center; }
          
          .quick-links { flex-direction: column; gap: 16px; align-items: center; }
        }
      `}</style>

      {/* Background Blobs */}
      <div className="bg-blob b1"></div>
      <div className="bg-blob b2"></div>

      <div className="content-container">
        {/* HERO SECTION */}
        <div className="help-hero">
          <div className="hero-content">
            <h1>
              Hello, {isLoggedIn ? user?.user?.name.split(" ")[0] : "Guest"} 👋
            </h1>
            <p>
              Welcome to the{" "}
              {activeTab === "employer" ? "Employer" : "Professional"} Support
              Hub.
            </p>

            <div className="search-bar-container">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder={`Search for ${activeTab === "employer" ? "billing, recruiting..." : "jobs, resume..."}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="content-width">
          {/* CATEGORY TABS */}
          <div className="category-grid">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                className={`cat-card ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setOpenFaq(null);
                }}
              >
                <div className="cat-icon">{tab.icon}</div>
                <h3>{tab.label}</h3>
                <p>{tab.desc}</p>
              </button>
            ))}
          </div>

          {/* FAQ SECTION */}
          <div className="faq-section">
            <div className="section-header">
              <h2>
                {activeTab === "account"
                  ? "Account Settings"
                  : activeTab === "employer"
                    ? "Recruitment FAQs"
                    : "Job Search FAQs"}
              </h2>
              <p>Common questions regarding {activeTab} operations.</p>
            </div>

            <div className="faq-list">
              {currentFaqs.length > 0 ? (
                currentFaqs.map((faq, index) => (
                  <div
                    key={index}
                    className={`faq-item ${openFaq === index ? "open" : ""}`}
                  >
                    <button
                      className="faq-question"
                      onClick={() => toggleFaq(index)}
                    >
                      <span>{faq.question}</span>
                      {openFaq === index ? (
                        <ChevronUp size={20} color="var(--primary)" />
                      ) : (
                        <ChevronDown size={20} color="var(--text-sub)" />
                      )}
                    </button>
                    <div className="faq-answer">
                      <div className="answer-inner">{faq.answer}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-results">
                  <HelpCircle
                    size={40}
                    style={{ opacity: 0.5, marginBottom: 10 }}
                  />
                  <p>No results found for "{searchQuery}".</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;
