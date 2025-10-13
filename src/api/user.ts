import { apiClient, getAuthToken } from "./config";

export const getUserProfile = async () => {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found. Please log in.");

  const response = await apiClient.get("/accounts/profile/", {
    headers: { Authorization: `Token ${token}` },
  });
  return response.data;
};



// update profile:
interface UpdateProfileData {
  id?: number;        // Add ID to payload
  name?: string;      // Username field in backend
  avatar?: string;    // Profile picture as Base64 or URL
  email?: string;     // Optional if needed
}

export const updateUserProfile = async (data: UpdateProfileData) => {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found. Please log in.");

    const response = await apiClient.patch("/accounts/profile/", data, {
      headers: { Authorization: `Token ${token}` },
    });
  return response.data;
};
