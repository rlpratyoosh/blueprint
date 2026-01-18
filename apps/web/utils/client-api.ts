import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url.includes("/auth/session")) {
        return Promise.reject(error);
      }
      originalRequest._retry = true;

      try {
        // console.log("🔄 401 Detected. Attempting Silent Refresh...");
        await api.post("/auth/session");
        // console.log("✅ Refresh Success. Retrying original request...");
        return api(originalRequest);
      } catch (refreshError) {
        console.error("❌ Session Dead. Redirecting to login...");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);
