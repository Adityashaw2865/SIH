import axios from "axios";

// Kal jab backend ready ho, sirf .env me VITE_API_URL set kar dena.
// Abhi ke liye fallback localhost pe hai, kisi cheez ko break nahi karega.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Only force JSON content-type for plain object bodies. Leave FormData
  // (file uploads) alone so axios/browser can set "multipart/form-data"
  // with the correct boundary — a hardcoded "application/json" header here
  // was breaking multer's file parsing on the backend (uploads always
  // failed with "No file uploaded").
  if (!(config.data instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
  }
  return config;
});

export default api;