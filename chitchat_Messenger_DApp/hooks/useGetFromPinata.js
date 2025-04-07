// File: /hooks/useGetFromPinata.js
import { useState } from "react";

export const useGetFromPinata = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileData, setFileData] = useState(null);

  const getFile = async (cid) => {
    if (!cid) return;

    setIsLoading(true);
    setError(null);
    setFileData(null);

    try {
      const response = await fetch(`/api/ipfs-auth/get?cid=${cid}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch file");
      }

      const data = await response.json();
      setFileData(data.data);
      console.log("File data:", data.data);
      return data;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getFile,
    isLoading,
    error,
    fileData,
  };
};
