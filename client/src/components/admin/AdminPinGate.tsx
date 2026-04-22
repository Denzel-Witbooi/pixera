import React, { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Client-side friction only — not cryptographic security.
// Set VITE_DEMO_PIN in Vercel env vars to enable. Leave unset to disable the gate.
const DEMO_PIN = import.meta.env.VITE_DEMO_PIN as string | undefined;

const AdminPinGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pin, setPin]       = useState("");
  const [error, setError]   = useState(false);
  const [unlocked, setUnlocked] = useState(!DEMO_PIN);

  if (unlocked) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === DEMO_PIN) {
      setUnlocked(true);
    } else {
      setError(true);
      setPin("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-xs">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="rounded-full bg-primary/10 p-3">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold">Admin Access</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter the PIN to continue</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="password"
            placeholder="PIN"
            value={pin}
            autoFocus
            onChange={(e) => { setPin(e.target.value); setError(false); }}
          />
          {error && (
            <p className="text-xs text-destructive text-center">Incorrect PIN — try again</p>
          )}
          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminPinGate;
