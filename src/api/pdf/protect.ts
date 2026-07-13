import { apiClient } from "../config";

interface ProtectPDFOptions {
  file: File;
  password: string;
  allow_printing?: boolean;
  allow_copying?: boolean;
  allow_editing?: boolean;
  allow_comments?: boolean;
  allow_form_filling?: boolean;
  allow_document_assembly?: boolean;
}

export const protectPDF = ({
  file,
  password,
  allow_printing = false,
  allow_copying = true,
  allow_editing = true,
  allow_comments = true,
  allow_form_filling = false,
  allow_document_assembly = false,
}: ProtectPDFOptions) => {
  if (!file) throw new Error("File required.");
  if (!password) throw new Error("Password required.");

  const formData = new FormData();
  formData.append("input_pdf", file, file.name);
  formData.append("pdf_password", password);
  formData.append("allow_printing", String(allow_printing));
  formData.append("allow_copying", String(allow_copying));
  formData.append("allow_editing", String(allow_editing));
  formData.append("allow_comments", String(allow_comments));
  formData.append("allow_form_filling", String(allow_form_filling));
  formData.append("allow_document_assembly", String(allow_document_assembly));

  return apiClient.post("/pdf/protect_pdf/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
