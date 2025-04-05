"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Key, RefreshCw, Download, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function SecurityTab() {
  const { toast } = useToast();
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerateKeys = async () => {
    setIsRegenerating(true);
    try {
      // Simulate key regeneration
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: "Keys regenerated",
        description: "Your encryption keys have been regenerated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate keys",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleExportKeys = () => {
    // In a real implementation, this would export the keys in a secure format
    toast({
      title: "Keys exported",
      description: "Your encryption keys have been exported",
    });
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
              <p className="text-sm font-medium">Your encryption keys</p>
              <p className="text-xs text-muted-foreground mb-2">
                These keys are used to encrypt and decrypt your messages. They
                are stored locally and never shared.
              </p>
              <div className="text-xs bg-background p-2 rounded border">
                <p className="font-mono">Public Key: 0x8f4e...2a1b</p>
                <p className="font-mono mt-1">Created: March 15, 2025</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button
              variant="outline"
              onClick={handleRegenerateKeys}
              disabled={isRegenerating}
              className="flex-1"
            >
              {isRegenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate Keys
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleExportKeys}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Keys
            </Button>
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
