import axios from "axios";

const getBaseUrl = () => {
  if (typeof window !== "undefined") return "/api";

  if (process.env.INTERNAL_API_URL) return process.env.INTERNAL_API_URL;
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;

  return "http://localhost:8000";
};

export const serverApi = axios.create({
  baseURL: getBaseUrl(),
  headers: { "Content-Type": "application/json" },
});
