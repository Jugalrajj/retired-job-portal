import React, { useState } from "react";
import api from "../../services/api";

const ApplicationForm = ({ jobId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    experience: "",
    education: "",
    coverLetter: "",
  });
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Create FormData object to handle file uploads
    const data = new FormData();
    data.append("fullName", formData.fullName);
    data.append("experience", formData.experience);
    data.append("education", formData.education);
    data.append("coverLetter", formData.coverLetter);
    if (resume) data.append("resume", resume);

    try {
      // Send as multipart/form-data so backend Multer can parse it
      await api.post(`/jobs/apply/${jobId}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Application submitted successfully!");
      onSuccess(jobId);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Error submitting application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 style={{ margin: 0 }}>Apply for Position</h2>
          <button onClick={onClose} style={{ border: "none", background: "none", fontSize: "20px", cursor: "pointer" }}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Full Name</label>
          <input type="text" required style={styles.input} 
            onChange={(e) => setFormData({...formData, fullName: e.target.value})} />

          <label style={styles.label}>Years of Experience</label>
          <input type="text" required style={styles.input} placeholder="e.g. 15 years in Management" 
            onChange={(e) => setFormData({...formData, experience: e.target.value})} />

          <label style={styles.label}>Highest Education</label>
          <input type="text" required style={styles.input} 
            onChange={(e) => setFormData({...formData, education: e.target.value})} />

          <label style={styles.label}>Cover Letter (Short Bio)</label>
          <textarea style={{...styles.input, height: "100px"}} 
            onChange={(e) => setFormData({...formData, coverLetter: e.target.value})} />

          <label style={styles.label}>Upload Resume (PDF only)</label>
          <input type="file" accept=".pdf" required style={styles.input} 
            onChange={(e) => setResume(e.target.files[0])} />

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? "Uploading..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalContent: { backgroundColor: "#fff", padding: "30px", borderRadius: "12px", width: "500px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" },
  label: { display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "600" },
  input: { width: "100%", padding: "10px", marginBottom: "15px", borderRadius: "6px", border: "1px solid #ddd", boxSizing: "border-box" },
  submitBtn: { width: "100%", padding: "12px", backgroundColor: "#3b49df", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }
};

export default ApplicationForm;