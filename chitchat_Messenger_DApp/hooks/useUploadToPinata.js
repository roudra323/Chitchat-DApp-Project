// File: /hooks/useUploadToPinata.js
import { useState } from "react";

export const useUploadToPinata = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);

  const uploadFile = async (file) => {
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ipfs-auth/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload file");
      }

      const data = await response.json();
      setUploadResult(data);
      return data;
    } catch (error) {
      setUploadError(error.message);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadFile,
    isUploading,
    uploadError,
    uploadResult,
  };
};
