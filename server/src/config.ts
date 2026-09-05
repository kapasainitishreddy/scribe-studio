import dotenv from "dotenv";
dotenv.config();

export const CONFIG = {
  port: parseInt(process.env.PORT || "8080", 10),
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "",
  googleCloudProject: process.env.GOOGLE_CLOUD_PROJECT || "",
  googleCloudLocation: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
  parallelApiKey: process.env.PARALLEL_API_KEY || process.env.VITE_PARALLEL_API_KEY || "",
  allowedOrigins: (process.env.ALLOWED_ORIGINS || "https://kapasainitishreddy.github.io,http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173").split(",")
};
