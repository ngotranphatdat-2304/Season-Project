import axios from "axios";

// Use the server API URL when rendering on the server; fall back to relative /api in the browser.
const isServer = typeof window === "undefined";
const serverBaseUrl = process.env.API_URL;
const baseURL =
  isServer && serverBaseUrl !== undefined && serverBaseUrl !== ""
    ? `${serverBaseUrl}/api`
    : "/api";

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
