"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Key, Lock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface KeyExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  friendAddress: string;
  friendName: string;
  onKeyExchangeComplete: () => void;
}

export function KeyExchangeModal({
  isOpen,
  onClose,
  friendAddress,
  friendName,
  onKeyExchangeComplete,
}: KeyExchangeModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<
    "initial" | "generating" | "sharing" | "complete"
  >("initial");
  const [error, setError] = useState<string | null>(null);

  // This function would handle the actual key generation and encryption
  // In a real implementation, this would use a library like libsodium or subtle crypto
  const generateAndShareKey = async () => {
    setStep("generating");
    setError(null);

    try {
      // Simulate key generation
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 1. Generate a symmetric key
      // const symmetricKey = await window.crypto.subtle.generateKey(
      //   { name: "AES-GCM", length: 256 },
      //   true,
      //   ["encrypt", "decrypt"]
      // );

      // 2. Get friend's public key (would be stored on-chain or retrieved from their profile)
      // const friendPublicKey = await getFriendPublicKey(friendAddress);

      // 3. Encrypt the symmetric key with friend's public key
      // const encryptedKey = await encryptKeyWithPublicKey(symmetricKey, friendPublicKey);

      setStep("sharing");

      // 4. Share the encrypted key via the smart contract
      // const tx = await contracts.chitChat.shareSymmetricKey(friendAddress, encryptedKey);
      // await tx.wait();

      // Simulate contract interaction
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setStep("complete");
      toast({
        title: "Key exchange successful",
        description: `You can now securely chat with ${friendName}`,
      });

      // Wait a moment before closing the modal
      setTimeout(() => {
        onKeyExchangeComplete();
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error("Key exchange error:", error);
      setError(error.message || "Failed to exchange encryption keys");
      setStep("initial");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Secure Key Exchange</DialogTitle>
          <DialogDescription>
            Exchange encryption keys with {friendName} to enable secure
            end-to-end encrypted messaging.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === "initial" && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md flex items-start gap-3">
                <Lock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">End-to-End Encryption</p>
                  <p className="text-xs text-muted-foreground">
                    Before you can chat with {friendName}, you need to exchange
                    encryption keys. This ensures your messages are secure and
                    can only be read by you and {friendName}.
                  </p>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-md flex items-start gap-3">
                <Key className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">How it works</p>
                  <p className="text-xs text-muted-foreground">
                    1. A unique encryption key will be generated for your
                    conversation
                    <br />
                    2. This key will be securely shared with {friendName}
                    <br />
                    3. All messages will be encrypted before being stored on
                    IPFS
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === "generating" && (
            <div className="flex flex-col items-center justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-center font-medium">
                Generating encryption keys...
              </p>
              <p className="text-center text-sm text-muted-foreground mt-1">
                This will only take a moment
              </p>
            </div>
          )}

          {step === "sharing" && (
            <div className="flex flex-col items-center justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-center font-medium">
                Sharing encryption keys with {friendName}...
              </p>
              <p className="text-center text-sm text-muted-foreground mt-1">
                Securely storing keys on the blockchain
              </p>
            </div>
          )}

          {step === "complete" && (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                <Key className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
              <p className="text-center font-medium">Key exchange complete!</p>
              <p className="text-center text-sm text-muted-foreground mt-1">
                You can now securely chat with {friendName}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === "initial" && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={generateAndShareKey}>
                <Key className="h-4 w-4 mr-2" />
                Exchange Keys
              </Button>
            </>
          )}

          {(step === "generating" || step === "sharing") && (
            <Button disabled>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </Button>
          )}

          {step === "complete" && <Button onClick={onClose}>Close</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
