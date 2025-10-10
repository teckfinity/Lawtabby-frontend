import { apiClient, setAuthToken, clearAuthToken } from "./config";

export const registerUser = (data: { email: string; password: string }) =>
  apiClient.post("/accounts/register/", data);

export const loginUser = async (data: { email: string; password: string }) => {
  const response = await apiClient.post("/accounts/login/", data);
  if (response.data?.token) setAuthToken(response.data.token);
  return response;
};

export const logoutUser = () => clearAuthToken();

export const passwordReset = (data: { email: string }) =>
  apiClient.post("/accounts/password_reset/", data);

export const changePassword = (data: { old_password: string; new_password: string }) =>
  apiClient.post("/accounts/change_password/", data);
