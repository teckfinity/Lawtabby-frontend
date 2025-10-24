import { apiClient } from "../config";

export interface SplitPDFParams {
  file: File;
  split_mode?: "range" | "pages" | "size";
  range_mode?: "custom" | "fixed";
  ranges?: string; // e.g. '[{"from":2,"to":4}]'
  merge_ranges?: boolean;
  extract_mode?: "all" | "select";
  pages_to_extract?: string; // e.g. "1,3,5-8"
  merge_extracted?: boolean;
  max_file_size?: string; // optional if split_mode=size
  size_unit?: "KB" | "MB";
}

export const splitPDF = (params: SplitPDFParams) => {
  const {
    file,
    split_mode = "range",
    range_mode = "custom",
    ranges,
    merge_ranges = false,
    extract_mode = "all",
    pages_to_extract,
    merge_extracted = false,
    max_file_size,
    size_unit = "KB",
  } = params;

  if (!file) throw new Error("A PDF file is required.");

  const formData = new FormData();
  formData.append("input_pdf", file, file.name);
  formData.append("split_mode", split_mode);
  formData.append("range_mode", range_mode);
  formData.append("merge_ranges", String(merge_ranges));
  formData.append("extract_mode", extract_mode);
  formData.append("merge_extracted", String(merge_extracted));
  formData.append("size_unit", size_unit);

  if (ranges) formData.append("ranges", ranges);
  if (pages_to_extract) formData.append("pages_to_extract", pages_to_extract);
  if (max_file_size) formData.append("max_file_size", max_file_size);

  return apiClient.post("/pdf/split_pdf/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
