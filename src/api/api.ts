import axios from "axios";

// Exported API_BASE_URL so it can be imported in other files
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

console.log("API Base URL:", API_BASE_URL);

// -------------------- TOKEN HANDLER --------------------
export const getAuthToken = () => localStorage.getItem("authToken");

export const setAuthToken = (token: string) => {
  localStorage.setItem("authToken", token);
};

export const clearAuthToken = () => {
  localStorage.removeItem("authToken");
};

// Axios instance with interceptor
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ________________________ auth apis ________________________

// Register API
export const registerUser = async (data: { email: string; password: string }) => {
  return apiClient.post("/accounts/register/", data);
};

// Login API
export const loginUser = async (data: { email: string; password: string }) => {
  const response = await apiClient.post("/accounts/login/", data);

  // Store token after login
  if (response.data && response.data.token) {
    setAuthToken(response.data.token);
  }

  return response;
};

// Logout API (optional)
export const logoutUser = async () => {
  clearAuthToken();
};

// Password Reset API
export const passwordReset = async (data: { email: string }) => {
  return apiClient.post("/accounts/password_reset/", data);
};

// Change Password API
export const changePassword = async (data: { old_password: string; new_password: string }) => {
  return apiClient.post("/accounts/change_password/", data);
};

// ________________________ pdf apis ________________________

// Merge PDFs API
export const mergePDFs = async (files: File[]) => {
  if (!files || files.length < 2) {
    throw new Error("At least two PDF files are required to merge.");
  }

  const formData = new FormData();
  files.forEach((file) => {
    // attach original filename to avoid EOF issues
    formData.append("pdf_files", file, file.name);
  });

  return apiClient.post("/pdf/merge_pdf/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    responseType: "json",
  });
};

// Split PDF API
export const splitPDF = async (file: File, startPage: number, endPage: number) => {
  if (!file) {
    throw new Error("A PDF file is required to split.");
  }

  const formData = new FormData();
  formData.append("input_pdf", file, file.name); 
  // formData.append("start_page", startPage.toString());
  // formData.append("end_page", endPage.toString());

  return apiClient.post("/pdf/split_pdf/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    responseType: "json",  // or "blob" if you want to download the split PDF directly
  });
};

// Protect PDF API
export const protectPDF = async (file: File, password: string) => {
  if (!file) {
    throw new Error("A PDF file is required to protect.");
  }
  if (!password) {
    throw new Error("Password is required to protect PDF.");
  }

  const formData = new FormData();
  formData.append("input_pdf", file, file.name);
  formData.append("pdf_password", password);

  return apiClient.post("/pdf/protect_pdf/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    responseType: "json", 
  });
};


// Unlock PDF API
export const unlockPDF = async (file: File, password: string) => {
  if (!file) {
    throw new Error("A PDF file is required to unlock.");
  }
  if (!password) {
    throw new Error("Password is required to unlock PDF.");
  }

  const formData = new FormData();
  formData.append("input_pdf", file, file.name);
  formData.append("password", password);

  return apiClient.post("/pdf/unlock_pdf/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    responseType: "json",
  });
};





// ---------------------- User Profile API ----------------------
export const getUserProfile = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found. Please log in.");
    }

    const response = await apiClient.get("/accounts/profile/", {
      headers: {
        Authorization: `Token ${token}`, // explicitly sending auth header
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};
