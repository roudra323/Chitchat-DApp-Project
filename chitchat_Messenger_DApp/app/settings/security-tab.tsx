"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Key, Download, Shield, AlertTriangle, Upload } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

// Import the utility functions
import { saveRSAPrivateKey } from "@/utils/keyStorage";
import { uint8ArrayToBase64, base64ToUint8Array } from "@/utils/keyFormat";
import { Address } from "viem";

export function SecurityTab({
  publicKey,
  privateKey,
  account,
}: {
  publicKey: string | null;
  privateKey: Uint8Array | null;
  account: Address; // Using viem's Address type
}) {
  const { toast } = useToast();

  // Function to validate if data is a valid Uint8Array
  const isValidKeyFormat = (data: any): boolean => {
    return data instanceof Uint8Array && data.length > 0;
  };

  const handleImportKeys = () => {
    // Create a hidden file input
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json"; // Accept only JSON files

    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            // Parse the file content
            const fileContent = JSON.parse(event.target?.result as string);

            // Validate the file structure
            if (
              !fileContent.privateKey ||
              typeof fileContent.privateKey !== "string"
            ) {
              throw new Error("Invalid key file format");
            }

            // Convert base64 to Uint8Array using our utility function
            const keyBytes = base64ToUint8Array(fileContent.privateKey);

            // Validate that we have a proper Uint8Array
            if (!isValidKeyFormat(keyBytes)) {
              throw new Error("Invalid private key format");
            }

            // Create a proper ArrayBuffer from the Uint8Array
            // This fixes the type issue by ensuring we have a real ArrayBuffer
            const arrayBuffer = keyBytes.buffer.slice(0) as ArrayBuffer;

            // Save the imported key using the utility function
            saveRSAPrivateKey(account, arrayBuffer);

            toast({
              title: "Keys imported",
              description:
                "Your encryption keys have been imported successfully",
            });

            // Refresh the page or update state to show the imported key
            window.location.reload();
          } catch (error) {
            console.error("Import error:", error);
            toast({
              title: "Import failed",
              description:
                "Failed to import encryption keys. Please check the file format.",
              variant: "destructive",
            });
          }
        };
        reader.readAsText(file);
      }
    };

    fileInput.click();
  };

  const handleExportKeys = () => {
    if (!privateKey || !isValidKeyFormat(privateKey)) {
      toast({
        title: "Export failed",
        description: "No valid private key available to export",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use the utility function to convert the private key to base64 for export
      const base64Key = uint8ArrayToBase64(privateKey);

      // Create a JSON object with the key
      const keyExport = {
        privateKey: base64Key,
        exportedAt: new Date().toISOString(),
        keyType: "RSA",
      };

      // Convert to JSON string
      const jsonString = JSON.stringify(keyExport, null, 2);

      // Create a blob and download link
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      // Create download link
      const a = document.createElement("a");
      a.href = url;
      a.download = `rsa-private-key-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);

      toast({
        title: "Keys exported",
        description: "Your encryption keys have been exported successfully",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "Failed to export encryption keys",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Encryption Keys</CardTitle>
          <CardDescription>
            Manage your encryption keys for secure messaging
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-md flex items-start gap-3">
            <Key className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium">Your RSA encryption keys</p>
              <p className="text-xs text-muted-foreground mb-2">
                Your RSA key pair was generated when you created your account.
                The public key is stored on the blockchain, while your private
                key is stored locally on this device. If you lose your private
                key, you won't be able to decrypt messages.
              </p>
              <div className="text-xs bg-background p-2 rounded border">
                <p className="font-mono">
                  Public Key:{" "}
                  {publicKey
                    ? `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}`
                    : "Not available"}
                </p>
                <p className="font-mono mt-1">
                  Private Key:{" "}
                  {privateKey
                    ? `${privateKey.toString().slice(0, 6)}...${privateKey
                        .toString()
                        .slice(-6)}`
                    : "Not available"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button
              variant="outline"
              onClick={handleExportKeys}
              className="flex-1"
              disabled={!privateKey}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Private Key
            </Button>
            <Button
              variant="outline"
              onClick={handleImportKeys}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Private Key
            </Button>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
            <p className="text-xs text-yellow-800 dark:text-yellow-400 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Important:</strong> Your private key cannot be
                regenerated. If you lose it, you won't be able to decrypt any
                messages. Please export and back up your private key in a secure
                location.
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>
            Configure additional security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-lock">Auto-lock after inactivity</Label>
              <p className="text-xs text-muted-foreground">
                Automatically lock the app after 10 minutes of inactivity
              </p>
            </div>
            <Switch id="auto-lock" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="biometric">Biometric authentication</Label>
              <p className="text-xs text-muted-foreground">
                Use fingerprint or face recognition to unlock the app
              </p>
            </div>
            <Switch id="biometric" />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="device-sync">Device synchronization</Label>
              <p className="text-xs text-muted-foreground">
                Sync your encryption keys across your devices
              </p>
            </div>
            <Switch id="device-sync" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="key-backup">Automatic key backup</Label>
              <p className="text-xs text-muted-foreground">
                Securely back up your keys to your connected wallet
              </p>
            </div>
            <Switch id="key-backup" defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Advanced Security</CardTitle>
          <CardDescription>Configure advanced security options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-md flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium">Encryption Algorithm</p>
              <p className="text-xs text-muted-foreground mb-2">
                ChitChat uses AES-256-GCM for symmetric encryption and ECDH for
                key exchange.
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                View Technical Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
