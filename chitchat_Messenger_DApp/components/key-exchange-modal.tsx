"use client";

import { useEffect, useState } from "react";
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
import {
  Loader2,
  Key,
  Lock,
  AlertTriangle,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Contract } from "ethers";
import { useSymmetricKey } from "@/hooks/useSymmetricKey";
import { hexToUint8Array } from "@/utils/keyFormat";
import { hasPrivateKey } from "@/utils/rsaKeyUtils";
import { Address } from "viem";
import { useEthersWithRainbow } from "@/hooks/useEthersWithRainbow";

interface KeyExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  friendAddress: string;
  friendName: string;
  onKeyExchangeComplete: () => void;
  chitChatContract: Contract;
}

export function KeyExchangeModal({
  isOpen,
  onClose,
  friendAddress,
  friendName,
  onKeyExchangeComplete,
  chitChatContract,
}: KeyExchangeModalProps) {
  const { address } = useEthersWithRainbow();
  const { toast } = useToast();
  const [step, setStep] = useState<
    "initial" | "generating" | "sharing" | "complete" | "export"
  >("initial");
  const [error, setError] = useState<string | null>(null);
  const [friendPublicKey, setFriendPublicKey] = useState<Uint8Array | null>(
    null
  );
  const [keyCopied, setKeyCopied] = useState(false);
  const [symmetricKey, setSymmetricKey] = useState<string | null>(null);
  const {
    getOrCreateSymmetricKey,
    encryptSymmetricKeyForContract,
    isLoading: keyOperationLoading,
  } = useSymmetricKey();

  // Fetch friend's public key when the modal opens
  useEffect(() => {
    if (isOpen && friendAddress) {
      fetchFriendPublicKey();
    }
  }, [isOpen, friendAddress]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("initial");
      setError(null);
      setKeyCopied(false);
    }
  }, [isOpen]);

  // Fetch friend's public key from the contract
  const fetchFriendPublicKey = async () => {
    try {
      console.log("Is Private Key Saved:", hasPrivateKey(address as Address));

      console.log("Friends Address:", friendAddress);
      const publicKeyBytes = await chitChatContract.getUserPublicKey(
        friendAddress
      );

      // Convert from ethers bytes to Uint8Array
      const publicKeyArray = hexToUint8Array(publicKeyBytes);

      // Convert from bytes to Uint8Array
      setFriendPublicKey(publicKeyArray);
    } catch (error) {
      console.error("Error fetching friend's public key:", error);
      setError("Could not retrieve friend's public key");
    }
  };

  // Handle the key exchange process
  const generateAndShareKey = async () => {
    setStep("generating");
    setError(null);

    try {
      // 1. Ensure we have the friend's public key
      if (!friendPublicKey) {
        await fetchFriendPublicKey();
        if (!friendPublicKey) {
          throw new Error("Friend's public key not available");
        }
      }

      console.log("Friend's Public Key:", friendPublicKey);

      // 2. Generate a symmetric key for secure messaging
      const symmetricKeyBase64 = await getOrCreateSymmetricKey(friendAddress);
      console.log("Generated symmetric key (stored for this friend)");
      console.log("Generated symmetric key (OWN):", symmetricKeyBase64);

      // Store the symmetric key for export option
      setSymmetricKey(symmetricKeyBase64);

      setStep("sharing");

      // 3. Encrypt the symmetric key with friend's public key
      const encryptedKeyHex = await encryptSymmetricKeyForContract(
        symmetricKeyBase64,
        friendPublicKey
      );
      console.log("Encrypted key ready for blockchain storage");

      try {
        // 4. Share the encrypted key via the smart contract
        const tx = await chitChatContract.shareSymmetricKey(
          friendAddress,
          encryptedKeyHex
        );
        // Wait for transaction confirmation
        await tx.wait();

        console.log("Key shared successfully:", tx.hash);

        setStep("export");
        toast({
          title: "Key exchange successful",
          description: `You can now securely chat with ${friendName}`,
        });
      } catch (contractError) {
        console.error("Contract interaction error:", contractError);
        throw new Error("Failed to store encrypted key on blockchain");
      }
    } catch (error: any) {
      console.error("Key exchange error:", error);
      setError(error.message || "Failed to exchange encryption keys");
      setStep("initial");
    }
  };

  // Copy symmetric key to clipboard and proceed
  const copyKeyToClipboard = async () => {
    if (symmetricKey) {
      try {
        await navigator.clipboard.writeText(symmetricKey);
        setKeyCopied(true);
        toast({
          title: "Key copied to clipboard",
          description: "Store this key securely for backup purposes",
        });

        // Proceed to complete after copying
        setTimeout(() => {
          completeProcess();
        }, 1000); // Brief delay to show the "Copied!" state
      } catch (err) {
        console.error("Failed to copy key:", err);
        toast({
          variant: "destructive",
          title: "Failed to copy key",
          description: "Please try again",
        });
      }
    }
  };

  // Complete the process and close modal
  const completeProcess = () => {
    onKeyExchangeComplete();
    onClose();
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
                    2. This key will be securely shared with {friendName} using
                    their public key
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
                Creating a unique key for your conversation
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

          {step === "export" && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-2">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                  <Key className="h-6 w-6 text-green-600 dark:text-green-300" />
                </div>
                <p className="text-center font-medium">
                  Key exchange complete!
                </p>
                <p className="text-center text-sm text-muted-foreground mt-1">
                  You can now securely chat with {friendName}
                </p>
              </div>

              <Alert
                variant="destructive"
                className="border-amber-500 bg-amber-50 dark:bg-amber-950 dark:border-amber-700"
              >
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="text-amber-600 dark:text-amber-400">
                  Important Security Warning
                </AlertTitle>
                <AlertDescription className="text-sm">
                  If you lose this symmetric key, you will{" "}
                  <strong>permanently lose access</strong> to all messages in
                  this conversation. They cannot be decrypted without this key,
                  and you will need to establish a new end-to-end encrypted
                  connection.
                </AlertDescription>
              </Alert>

              <div className="bg-muted p-4 rounded-md flex items-start gap-3">
                <Copy className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Export Your Key</p>
                  <p className="text-xs text-muted-foreground">
                    It's recommended to export and safely store your symmetric
                    key as a backup. This key is stored in your browser, but if
                    you clear browser data or switch devices, you'll need this
                    key to access your messages.
                  </p>
                </div>
              </div>
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

          {step === "export" && (
            <>
              <Button variant="outline" onClick={completeProcess}>
                Skip
              </Button>
              <Button
                variant="default"
                onClick={copyKeyToClipboard}
                className="gap-2"
              >
                {keyCopied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Export Key
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
