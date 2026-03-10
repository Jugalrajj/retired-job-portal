import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Download,
  Briefcase,
  GraduationCap,
  Calendar,
  Clock,
  User,
  Layers,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast"; // 🔥 Added Toast for notifications

// --- HELPER: Safe File URL ---
const getFileUrl = (path) => {
  if (!path || path === "undefined" || path === "null") return null;

  if (path.startsWith("http")) {
    // Force HTTPS because Google Docs Viewer will fail on HTTP
    return path.replace(/^http:\/\//i, "https://");
  }

  return `http://localhost:5000/${path.replace(/\\/g, "/")}`;
};

const calculateExperience = (profile) => {
  if (profile?.totalExperienceYears) return profile.totalExperienceYears;

  const expList = profile?.workExperience || [];
  if (expList.length === 0) return 0;

  let totalMonths = 0;
  expList.forEach((exp) => {
    if (exp.startDate) {
      const start = new Date(exp.startDate);
      const end = exp.current
        ? new Date()
        : exp.endDate
          ? new Date(exp.endDate)
          : new Date();
      const months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      totalMonths += Math.max(0, months);
    }
  });

  return Math.floor(totalMonths / 12);
};

const CandidateProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMsgLoading, setIsMsgLoading] = useState(false); // 🔥 State for button loading

  // --- FETCH CANDIDATE DATA ---
  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        const { data } = await api.get(`/seekers/${id}`);
        setProfile(data);
      } catch (err) {
        console.error("Error fetching candidate:", err);
        // Fallback search if direct ID fails
        try {
          const allRes = await api.get("/seekers");
          const found = allRes.data.find((c) => c._id === id);
          if (found) setProfile(found);
          else setError("Candidate profile not found.");
        } catch (fallbackErr) {
          setError("Failed to load profile details.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCandidate();
  }, [id]);

  // --- 🔥 NEW: HANDLE MESSAGE CLICK ---
  const handleMessageCandidate = async () => {
    if (!profile) return;
    setIsMsgLoading(true);

    try {
      // 1. Determine the recipient User ID
      // profile.user might be an object (populated) or string (ID)
      const recipientId =
        typeof profile.user === "object" ? profile.user._id : profile.user;

      if (!recipientId) {
        toast.error("Cannot message this candidate: User ID missing."); // 🌟 Replaced alert
        return;
      }

      // 2. Initiate Chat (Get existing or create new)
      const { data } = await api.post("/chats/init", { recipientId });

      // 3. Navigate to Messages with the conversation data
      navigate("/messages", { state: { conversation: data } });
    } catch (err) {
      console.error("Failed to init chat:", err);
      toast.error("Failed to start conversation. Please try again."); // 🌟 Replaced alert
    } finally {
      setIsMsgLoading(false);
    }
  };

  if (loading)
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-root)",
          color: "var(--text-sub)",
        }}
      >
        Loading Profile...
      </div>
    );

  if (error || !profile)
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-root)",
          flexDirection: "column",
          gap: 15,
        }}
      >
        <div style={{ color: "var(--text-sub)" }}>
          {error || "Profile not found"}
        </div>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "10px 20px",
            background: "var(--primary)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Go Back
        </button>
      </div>
    );

  // --- DERIVED DATA ---
  const photoUrl = getFileUrl(profile.photoUrl || profile.user?.photoUrl);
  const resumeUrl = getFileUrl(profile.resumeUrl || profile.resume);
  const initials = profile.fullName
    ? profile.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "CA";

  console.log("Resume URL123:", resumeUrl);

  return (
    <div className="profile-page-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .profile-page-wrapper {
          min-height: 100vh;
          background-color: var(--bg-root);
          font-family: 'Plus Jakarta Sans', sans-serif;
          padding: 40px 20px;
          color: var(--text-main);
        }

        .container { max-width: 900px; margin: 0 auto; }

        /* --- HEADER & NAV --- */
        .nav-back {
          display: inline-flex; align-items: center; gap: 8px;
          color: var(--text-sub); font-weight: 600; font-size: 14px;
          cursor: pointer; margin-bottom: 20px; transition: 0.2s;
        }
        .nav-back:hover { color: var(--primary); }

        /* --- SINGLE CARD LAYOUT --- */
        .master-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.05);
        }

        /* --- HEADER SECTION --- */
        .profile-header {
          padding: 40px;
          border-bottom: 1px solid var(--border);
          display: flex; gap: 30px; align-items: flex-start;
          background: linear-gradient(to bottom, var(--bg-input), var(--bg-card));
        }
        
        .avatar-lg {
          width: 120px; height: 120px; border-radius: 24px;
          object-fit: cover; background: var(--bg-card);
          border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 36px; font-weight: 800; color: var(--text-sub);
          box-shadow: 0 8px 20px rgba(0,0,0,0.08); flex-shrink: 0;
        }

        .header-info { flex: 1; }
        .name-row { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px; }
        .candidate-name { font-size: 28px; font-weight: 800; color: var(--text-main); margin: 0 0 6px; }
        .candidate-role { font-size: 16px; color: var(--primary); font-weight: 600; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
        
        .header-actions { display: flex; gap: 10px; }
        .btn-action {
          padding: 10px 20px; border-radius: 10px; font-size: 14px; font-weight: 700;
          cursor: pointer; border: 1px solid transparent; display: flex; align-items: center; gap: 8px;
          transition: 0.2s;
        }
        .btn-primary { background: var(--primary); color: #fff; box-shadow: 0 4px 12px var(--primary-dim); }
        .btn-primary:hover { transform: translateY(-2px); }
        .btn-secondary { background: var(--bg-input); color: var(--text-main); border-color: var(--border); }
        .btn-secondary:hover { border-color: var(--primary); color: var(--primary); }

        .meta-grid { 
          display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); 
          gap: 15px; margin-top: 20px; 
        }
        .meta-item { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text-sub); }
        .meta-icon { color: var(--text-sub); opacity: 0.7; }

        /* --- SECTIONS --- */
        .profile-body { padding: 40px; }
        
        .section-block { margin-bottom: 40px; }
        .section-block:last-child { margin-bottom: 0; }
        
        .section-label {
          font-size: 13px; font-weight: 800; text-transform: uppercase;
          color: var(--text-sub); letter-spacing: 1px; margin-bottom: 20px;
          display: flex; align-items: center; gap: 10px;
        }
        .section-label::after {
          content: ''; flex: 1; height: 1px; background: var(--border);
        }

        .text-content { font-size: 15px; line-height: 1.7; color: var(--text-main); white-space: pre-line; }

        /* --- CONTACT GRID --- */
        .contact-grid { 
          display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
          gap: 20px; background: var(--bg-input); padding: 20px; border-radius: 16px;
          border: 1px solid var(--border);
        }
        .contact-box { display: flex; gap: 12px; align-items: center; }
        .contact-icon-sq { 
          width: 40px; height: 40px; background: var(--bg-card); border-radius: 10px;
          display: flex; align-items: center; justify-content: center; color: var(--primary);
          border: 1px solid var(--border);
        }
        .c-label { font-size: 11px; text-transform: uppercase; color: var(--text-sub); font-weight: 700; }
        .c-value { font-size: 14px; font-weight: 600; color: var(--text-main); word-break: break-all; }

        /* --- SKILLS --- */
        .skill-chips { display: flex; flex-wrap: wrap; gap: 10px; }
        .chip {
          padding: 8px 16px; background: var(--bg-input); border-radius: 8px;
          font-size: 13px; font-weight: 600; color: var(--text-main);
          border: 1px solid var(--border);
        }

        /* --- TIMELINE (Experience & Education) --- */
        .timeline-list { display: flex; flex-direction: column; gap: 24px; }
        .tl-card {
          display: flex; gap: 20px;
        }
        .tl-icon-box {
          width: 48px; height: 48px; background: var(--bg-input); border-radius: 12px;
          display: flex; align-items: center; justify-content: center; color: var(--primary);
          flex-shrink: 0; border: 1px solid var(--border);
        }
        .tl-content h4 { font-size: 16px; font-weight: 700; margin: 0 0 4px; color: var(--text-main); }
        .tl-subtitle { font-size: 14px; font-weight: 600; color: var(--primary); margin-bottom: 4px; }
        .tl-date { font-size: 12px; color: var(--text-sub); font-weight: 500; background: var(--bg-input); padding: 2px 8px; border-radius: 6px; display: inline-block; margin-bottom: 8px; }
        .tl-desc { font-size: 14px; color: var(--text-sub); line-height: 1.6; }

        /* --- RESUME VIEWER --- */
        .resume-viewer-container {
          margin-top: 40px; padding-top: 40px; border-top: 1px solid var(--border);
        }
        .resume-frame {
          width: 100%; height: 800px; border: 1px solid var(--border);
          border-radius: 16px; background: var(--bg-input);
          margin-top: 20px;
        }
        .no-resume {
          padding: 60px; text-align: center; background: var(--bg-input);
          border-radius: 16px; border: 1px dashed var(--border); color: var(--text-sub);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .profile-header { flex-direction: column; align-items: center; text-align: center; }
          .name-row { justify-content: center; flex-direction: column; }
          .candidate-role { justify-content: center; }
          .meta-grid { justify-content: center; }
          .header-actions { justify-content: center; width: 100%; }
          .contact-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="container">
        {/* Nav */}
        <div className="nav-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back to Talent Pool
        </div>

        <div className="master-card">
          {/* 1. HEADER SECTION */}
          <div className="profile-header">
            {photoUrl ? (
              <img src={photoUrl} className="avatar-lg" alt="Profile" />
            ) : (
              <div className="avatar-lg">{initials}</div>
            )}

            <div className="header-info">
              <div className="name-row">
                <div>
                  <h1 className="candidate-name">{profile.fullName}</h1>
                  <div className="candidate-role">
                    <Briefcase size={16} /> {profile.headline || "Open to Work"}
                  </div>
                </div>

                <div className="header-actions">
                  {resumeUrl && (
                    <a
                      href={resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-action btn-primary"
                      download
                    >
                      <Download size={18} /> Download
                    </a>
                  )}

                  <button
                    onClick={handleMessageCandidate}
                    className="btn-action btn-secondary"
                    disabled={isMsgLoading}
                  >
                    <Mail size={18} /> {isMsgLoading ? "Loading..." : "Message"}
                  </button>
                </div>
              </div>

              <div className="meta-grid">
                <div className="meta-item">
                  <MapPin size={16} className="meta-icon" /> {profile.location}
                </div>
                <div className="meta-item">
                  <Clock size={16} className="meta-icon" />{" "}
                  {calculateExperience(profile)} Years Exp.
                </div>
                <div className="meta-item">
                  ₹ {profile.expectedCompensation || "Negotiable"}
                </div>
                <div className="meta-item">
                  <Calendar size={16} className="meta-icon" />{" "}
                  {profile.availability || "Immediate"}
                </div>
              </div>
            </div>
          </div>

          {/* 2. BODY CONTENT */}
          <div className="profile-body">
            {/* CONTACT INFO */}
            <div className="section-block">
              <div className="contact-grid">
                <div className="contact-box">
                  <div className="contact-icon-sq">
                    <Mail size={18} />
                  </div>
                  <div>
                    <div className="c-label">Email</div>
                    <div className="c-value">
                      {profile.contactEmail || "Locked"}
                    </div>
                  </div>
                </div>
                <div className="contact-box">
                  <div className="contact-icon-sq">
                    <Phone size={18} />
                  </div>
                  <div>
                    <div className="c-label">Phone</div>
                    <div className="c-value">{profile.phone || "Locked"}</div>
                  </div>
                </div>
                {/* Add more if needed (LinkedIn, Portfolio) */}
              </div>
            </div>

            {/* ABOUT */}
            <div className="section-block">
              <div className="section-label">
                <User size={16} /> About Candidate
              </div>
              <p className="text-content">
                {profile.bio || "No professional summary provided."}
              </p>
            </div>

            {/* SKILLS */}
            <div className="section-block">
              <div className="section-label">
                <Layers size={16} /> Skills & Expertise
              </div>
              <div className="skill-chips">
                {profile.skills?.map((s, i) => (
                  <span key={i} className="chip">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* EXPERIENCE */}
            <div className="section-block">
              <div className="section-label">
                <Briefcase size={16} /> Work History
              </div>
              <div className="timeline-list">
                {profile.workExperience?.length > 0 ? (
                  profile.workExperience.map((exp, i) => (
                    <div key={i} className="tl-card">
                      <div className="tl-icon-box">
                        <Briefcase size={20} />
                      </div>
                      <div className="tl-content">
                        <h4>{exp.title}</h4>
                        <div className="tl-subtitle">{exp.company}</div>
                        <div className="tl-date">
                          {new Date(exp.startDate).toLocaleDateString(
                            undefined,
                            { month: "short", year: "numeric" },
                          )}{" "}
                          -
                          {exp.current
                            ? "Present"
                            : new Date(exp.endDate).toLocaleDateString(
                                undefined,
                                { month: "short", year: "numeric" },
                              )}
                        </div>
                        {exp.description && (
                          <p className="tl-desc">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ fontStyle: "italic", color: "var(--text-sub)" }}>
                    No work experience added.
                  </p>
                )}
              </div>
            </div>

            {/* EDUCATION */}
            <div className="section-block">
              <div className="section-label">
                <GraduationCap size={16} /> Education
              </div>
              <div className="timeline-list">
                {profile.education?.length > 0 ? (
                  profile.education.map((edu, i) => (
                    <div key={i} className="tl-card">
                      <div className="tl-icon-box">
                        <GraduationCap size={20} />
                      </div>
                      <div className="tl-content">
                        <h4>{edu.degree}</h4>
                        <div className="tl-subtitle">{edu.institution}</div>
                        <div className="tl-date">Graduated: {edu.year}</div>
                        {edu.grade && (
                          <p className="tl-desc">Grade: {edu.grade}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ fontStyle: "italic", color: "var(--text-sub)" }}>
                    No education added.
                  </p>
                )}
              </div>
            </div>

            {/* 3. RESUME PREVIEW */}
            <div className="resume-viewer-container">
              <div className="section-label">
                <FileText size={16} /> Resume Preview
              </div>
              {resumeUrl ? (
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 15,
                    }}
                  >
                    <span style={{ fontSize: 13, color: "var(--text-sub)" }}>
                      Viewing Document
                    </span>

                    <a
                      href={resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 13,
                        color: "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        textDecoration: "none",
                        fontWeight: 600,
                      }}
                    >
                      Open in New Tab
                    </a>
                  </div>

                  {/* Resume Preview - Native Browser Viewer */}
                  <iframe
                    src={`${resumeUrl}#toolbar=0`}
                    className="resume-frame"
                    title="Candidate Resume"
                  />
                </div>
              ) : (
                <div className="no-resume">
                  <FileText
                    size={40}
                    style={{ marginBottom: 10, opacity: 0.5 }}
                  />
                  <h3>No Resume Uploaded</h3>
                  <p>The candidate has not uploaded a resume document yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateProfile;
