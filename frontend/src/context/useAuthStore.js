import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import api, { verifyOtpApi } from "../services/api.js";

const useAuthStore = create(
  persist(
    (set, get) => ({

      user: null,
      isAuthenticated: false,

      // --- LOGIN ACTION ---
      login: async (payload) => {
        try {
          const { data } = await api.post("/auth/login", payload);
          set({ user: data, isAuthenticated: true });
          return data;
        } catch (error) {
          console.error("Login Error:", error.response?.data?.message);
          throw error;
        }
      },

      // --- GOOGLE LOGIN ACTION ---
      googleLogin: async ({ credential, role }) => {
        try {
          // Sending the Google token and the user's role to the backend
          const { data } = await api.post("/auth/google", { token: credential, role });
          set({ user: data, isAuthenticated: true });
          return data;
        } catch (error) {
          console.error("Google Login Error:", error.response?.data?.message);
          throw error;
        }
      },

      // --- REGISTER ACTION ---
      register: async (payload) => {
        try {
          const { data } = await api.post("/auth/register", payload);

          if (data.requiresOtp) {
            return data;
          }

          set({ user: data, isAuthenticated: true });
          return data;
        } catch (error) {
          console.error("Register Error:", error.response?.data?.message);
          throw error;
        }
      },

      // --- VERIFY OTP ACTION ---
      verifyOtp: async (payload) => {
        try {
          const { data } = await verifyOtpApi(payload);
          set({ user: data, isAuthenticated: true });
          return data;
        } catch (error) {
          console.error("Verify Error:", error.response?.data?.message);
          throw error;
        }
      },

      forgotPassword: async (email) => {
        try {
          const { data } = await api.post("/auth/forgot-password", { email });
          return data;
        } catch (error) {
          console.error("Forgot Password Error:", error.response?.data?.message);
          throw error;
        }
      },
      
      resetPassword: async ({ email, otp, password }) => {
        try {
          const { data } = await api.post(`/auth/reset-password`, { email, otp, password });
          return data;
        } catch (error) {
          console.error("Reset Password Error:", error.response?.data?.message);
          throw error;
        }
      },

      // --- UPDATE USER IN STORE ---
      updateUser: (updates) =>
        set((state) => {
          if (!state.user?.user) return state;

          return {
            user: {
              ...state.user,
              user: {
                ...state.user.user,
                ...updates,
              },
            },
          };
        }),

      // --- LOGOUT ACTION ---
      logout: () => {
        set({ user: null, isAuthenticated: false });
        sessionStorage.removeItem("rjp-auth");
        sessionStorage.clear();
      },

      // --- REFRESH USER (Sync Session) ---
      refreshUser: async () => {
        try {
          const current = get().user;
          if (!current?.token) return;

          const { data } = await api.get("/auth/me");

          set((state) => ({
            user: {
              ...state.user,
              user: data.user,
            },
          }));
        } catch (error) {
          console.error("Session sync failed:", error);
          if (error.response?.status === 401) {
            get().logout();
          }
        }
      },

    }),
    {
      name: "rjp-auth",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useAuthStore;