import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveSymmetricKey } from "@/utils/keyStorage";
import { base64ToUint8Array } from "@/utils/keyFormat";

interface SymmetricKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  friendAddress: string;
  symmetricKey: string | null;
  onImport: (key: string) => void;
}

export function SymmetricKeyModal({
  isOpen,
  onClose,
  friendAddress,
  symmetricKey,
  onImport,
}: SymmetricKeyModalProps) {
  const { toast } = useToast();
  const [showImportInput, setShowImportInput] = useState(false);
  const [importKey, setImportKey] = useState("");

  // Export the symmetric key as a file
  const handleExport = () => {
    if (!symmetricKey) {
      toast({
        variant: "destructive",
        title: "No key available",
        description: "Could not find the encryption key",
      });
      return;
    }

    // Create a downloadable file with the key
    const blob = new Blob([symmetricKey], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    // Create filename based on friend address (truncated)
    const shortenedAddress = `${friendAddress.substring(
      0,
      6
    )}...${friendAddress.substring(friendAddress.length - 4)}`;
    a.download = `symmetric-key-${shortenedAddress}.txt`;
    a.href = url;
    a.click();

    URL.revokeObjectURL(url);

    toast({
      title: "Key exported successfully",
      description: "Your symmetric key has been downloaded as a file",
    });
  };

  // Copy the symmetric key to clipboard
  const handleCopy = async () => {
    if (symmetricKey) {
      try {
        await navigator.clipboard.writeText(symmetricKey);
        toast({
          title: "Key copied",
          description: "Symmetric key copied to clipboard",
        });
      } catch (err) {
        console.error("Failed to copy key:", err);
        toast({
          variant: "destructive",
          title: "Failed to copy",
          description: "Unable to copy key to clipboard",
        });
      }
    }
  };

  // Import a key from file
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        const trimmedKey = content.trim();
        onImport(trimmedKey);
        toast({
          title: "Key imported",
          description: "Symmetric key successfully imported",
        });
        onClose();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Invalid key",
          description: "The imported key is not valid",
        });
      }
    };
    reader.readAsText(file);
  };

  // Import a pasted key
  const handleImport = () => {
    if (!importKey.trim()) {
      toast({
        variant: "destructive",
        title: "Empty key",
        description: "Please enter a valid symmetric key",
      });
      return;
    }

    try {
      // Simple validation (actual validation would depend on your key format)
      base64ToUint8Array(importKey.trim());

      // If no error, proceed with import
      onImport(importKey.trim());
      toast({
        title: "Key imported",
        description: "Symmetric key successfully imported",
      });
      setShowImportInput(false);
      setImportKey("");
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Invalid key format",
        description: "The key is not in the expected format",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Symmetric Key Management</DialogTitle>
          <DialogDescription>
            View, export, or import the symmetric key for this chat.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Current Key Display */}
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Current Symmetric Key</h3>
            <div className="bg-muted p-3 rounded font-mono text-xs break-all">
              {symmetricKey || "No key available"}
            </div>
          </div>

          {/* Import Interface */}
          {showImportInput ? (
            <div className="space-y-3">
              <Input
                value={importKey}
                onChange={(e) => setImportKey(e.target.value)}
                placeholder="Paste your symmetric key here"
              />
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowImportInput(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleImport}>Confirm Import</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleCopy} className="w-full">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button onClick={handleExport} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowImportInput(true)}
                  className="w-full"
                >
                  Import from Text
                </Button>

                <div className="relative w-full">
                  <input
                    type="file"
                    id="key-file"
                    accept=".txt"
                    className="sr-only"
                    onChange={handleFileUpload}
                  />
                  <label
                    htmlFor="key-file"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer items-center justify-center"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import from File
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
