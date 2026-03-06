import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Auto-inject Token into headers
api.interceptors.request.use(
  (config) => {
    // 🔥 FIX: Must match the storage used in useAuthStore (sessionStorage)
    const storageData = sessionStorage.getItem("rjp-auth"); 
    
    if (storageData) {
      try {
        const parsedData = JSON.parse(storageData);
        // Zustand persists data inside { state: { user: { token: ... } } }
        const token = parsedData?.state?.user?.token; 
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Error parsing auth storage:", error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add verification helper
export const verifyOtpApi = (data) => api.post("/auth/verify-otp", data);

export default api;