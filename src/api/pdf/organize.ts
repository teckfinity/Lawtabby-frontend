import { apiClient } from "../config";

export const organizePDF = (
  file: File,
  userOrder: number[],
  deletePages?: number[]
) => {
  if (!file) throw new Error("File required.");
  if (!userOrder.length) throw new Error("User order required.");

  const formData = new FormData();
  formData.append("input_pdf", file, file.name);
  formData.append("user_order", JSON.stringify(userOrder));

  // FIX: Send empty string if no pages to delete
  if (deletePages && deletePages.length > 0) {
    formData.append("delete_pages", JSON.stringify(deletePages));
  } else {
    formData.append("delete_pages", "");
  }

  return apiClient.post("/pdf/organize_pdf/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
