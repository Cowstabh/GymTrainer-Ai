"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Dumbbell, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isLogin) {
      const res = await signIn("credentials", {
        redirect: false,
        username,
        password,
      });

      if (res?.error) {
        setError("Invalid credentials");
      } else {
        window.location.href = "/dashboard";
      }
    } else {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password, email }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Registration failed");
        } else {
          // Auto login after registration
          await signIn("credentials", {
            redirect: false,
            username,
            password,
          });
          window.location.href = "/onboarding"; // send to onboarding after registration
        }
      } catch (err) {
        setError("An error occurred during registration");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center p-4 relative">
      <Link href="/" className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center text-neutral-400 hover:text-white transition-colors">
        <ChevronLeft className="w-5 h-5 mr-1" />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-center mb-8">
          <div className="bg-orange-500 p-3 rounded-full">
            <Dumbbell className="text-white w-8 h-8" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white text-center mb-2">
          {isLogin ? "Welcome Back" : "Join the Forge"}
        </h2>
        <p className="text-neutral-400 text-center mb-8">
          {isLogin ? "Enter your credentials to access your account" : "Create an account to start your journey"}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-neutral-400 text-sm mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-neutral-400 text-sm mb-2">Email (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-neutral-400 text-sm mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors mt-6 disabled:opacity-50"
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-neutral-400 hover:text-white transition-colors text-sm"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
