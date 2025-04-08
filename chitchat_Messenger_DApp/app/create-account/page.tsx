"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Key, Upload, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useUploadToPinata } from "@/hooks/useUploadToPinata";
import { useEthersWithRainbow } from "@/hooks/useEthersWithRainbow";
import { generateRSAKeyPair, hasPrivateKey } from "@/utils/rsaKeyUtils";
import { Address } from "viem";

export default function CreateAccountPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<Uint8Array | null>(null);
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);

  const { uploadFile, isUploading } = useUploadToPinata();
  const [avatarCID, setAvatarCID] = useState<string | null>(null);

  const { isConnected, contracts, signer, address } = useEthersWithRainbow();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Show preview
        const reader = new FileReader();
        reader.onload = (event) => {
          setAvatarPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);

        const cid =
          "bafkreibdekm75dewxerh7x2hxrlg264qif6yqc6mbzk6rgdgsbldfuetza";

        // // Upload to Pinata
        // const result = await uploadFile(file);
        // console.log("Upload result:", result);
        // const cid = result?.cid;

        setAvatarCID(cid); // Handle different response formats

        toast({
          title: "Success",
          description: "Profile picture uploaded successfully",
        });
      } catch (error) {
        console.error("Upload error:", error);
        toast({
          title: "Error",
          description: "Failed to upload profile picture",
          variant: "destructive",
        });
        // Clear preview on error
        setAvatarPreview(null);
      }
    }
  };

  const handleCreateAccount = async () => {
    if (!username) {
      toast({
        title: "Username required",
        description: "Please enter a username to continue",
        variant: "destructive",
      });
      return;
    }

    if (!agreedToTerms) {
      toast({
        title: "Terms of Service",
        description: "You must agree to the Terms of Service to continue",
        variant: "destructive",
      });
      return;
    }

    if (!avatarCID) {
      toast({
        title: "Profile picture required",
        description: "Please upload a profile picture to continue",
        variant: "destructive",
      });
      return;
    }

    if (!isConnected || !contracts?.chitChat || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to continue",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      // Generate RSA key pair
      const { publicKeyBytes } = await generateRSAKeyPair(address as Address);
      setPublicKey(publicKeyBytes);

      console.log("Public key generated:", publicKeyBytes);
      console.log("Is Private Key Saved:", hasPrivateKey(address as Address));

      if (!publicKeyBytes) {
        toast({
          title: "Error generating keys",
          description: "Failed to generate RSA keys",
          variant: "destructive",
        });
        return;
      }
      // Call the smart contract function
      const tx = await contracts.chitChat.createAccount(
        username,
        avatarCID,
        publicKeyBytes
      );

      // Wait for transaction to be mined
      await tx.wait();

      console.log("Transaction successful:", tx);

      toast({
        title: "Account created!",
        description: "Your ChitChat account has been created successfully",
      });

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Contract error:", error);
      toast({
        title: "Error creating account",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <User className="h-6 w-6" /> Create Your Account
          </CardTitle>
          <CardDescription>
            Set up your ChitChat profile. Your wallet is already connected.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4 mb-4">
            <Avatar className="w-24 h-24">
              {avatarPreview ? (
                <AvatarImage src={avatarPreview} alt="Profile preview" />
              ) : null}
              <AvatarFallback className="text-2xl bg-primary/10">
                {username ? username[0]?.toUpperCase() : "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="avatar"
                className="cursor-pointer text-sm text-primary flex items-center gap-1"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {isUploading ? "Uploading..." : "Upload Profile Picture"}
              </Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={isUploading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Choose a unique username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="bg-muted p-4 rounded-md flex items-start gap-3">
            <Key className="h-5 w-5 text-primary mt-0.5" />
            <div className="w-full">
              <p className="text-sm font-medium">Encryption Keys</p>
              <p className="text-xs text-muted-foreground mb-2">
                RSA encryption keys will be automatically generated when you
                create your account. The private key will be stored securely on
                your device and cannot be regenerated.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) =>
                setAgreedToTerms(checked as boolean)
              }
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the Terms of Service and Privacy Policy
              </Label>
              <p className="text-xs text-muted-foreground">
                By checking this box, you agree to our{" "}
                <a href="#" className="text-primary underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-primary underline">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/connect-wallet")}
          >
            Back
          </Button>
          <Button
            onClick={handleCreateAccount}
            disabled={isCreating || isUploading}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
