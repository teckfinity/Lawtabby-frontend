import axios from "axios";

// Exported API_BASE_URL so it can be imported in other files
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

console.log("API Base URL:", API_BASE_URL);

// ________________________ auth apis _______________

// Register API
export const registerUser = async (data: {
  email: string;
  password: string;
}) => {
  return axios.post(`${API_BASE_URL}/accounts/register/`, data);
};

// Login API
export const loginUser = async (data: { email: string; password: string }) => {
  return axios.post(`${API_BASE_URL}/accounts/login/`, data);
};
