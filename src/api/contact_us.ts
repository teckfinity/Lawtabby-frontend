import { apiClient } from "./config";

interface ContactUsPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const ContactUs = (data: ContactUsPayload) => {
  const { name, email, subject, message } = data;

  if (!name || !email || !subject || !message) {
    throw new Error("All fields (name, email, subject, message) are required.");
  }

  return apiClient.post("/accounts/contact/", data, {
    headers: { "Content-Type": "application/json" },
  });
};
