"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// Minimal B&W login page
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/week");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-[320px] space-y-6 px-4"
      >
        {/* Logo / Title */}
        <div className="text-center">
          <h1 className="text-2xl font-light tracking-[0.2em] uppercase">
            Psychocybernet
          </h1>
        </div>

        {/* Email field */}
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full border-b border-border bg-transparent px-0 py-3 text-sm
                       placeholder:text-text-muted focus:border-active focus:outline-none
                       transition-colors"
          />
        </div>

        {/* Password field */}
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full border-b border-border bg-transparent px-0 py-3 text-sm
                       placeholder:text-text-muted focus:border-active focus:outline-none
                       transition-colors"
          />
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm text-text-muted">{error}</p>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full border border-active py-3 text-sm font-medium uppercase
                     tracking-widest transition-colors hover:bg-active hover:text-bg
                     disabled:opacity-40"
        >
          {loading ? "..." : "Enter"}
        </button>
      </form>
    </div>
  );
}
