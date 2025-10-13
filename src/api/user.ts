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

  const formData = new FormData();
  if (data.id) formData.append("id", data.id.toString());
  if (data.name) formData.append("name", data.name);
  if (data.email) formData.append("email", data.email);
  if (data.avatar) formData.append("avatar", data.avatar); // must be a File object

  const response = await apiClient.patch("/accounts/profile/", formData, {
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};


//  Logout user (POST method)
export const logoutUser = async () => {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found. Please log in.");

  const response = await apiClient.post(
    "/accounts/logout/",
    {},
    {
      headers: { Authorization: `Token ${token}` },
    }
  );

  return response.data;
};