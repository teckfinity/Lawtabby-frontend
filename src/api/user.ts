import { apiClient, getAuthToken } from "./config";

export const getUserProfile = async () => {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found. Please log in.");

  const response = await apiClient.get("/accounts/profile/", {
    headers: { Authorization: `Token ${token}` },
  });
  return response.data;
};
