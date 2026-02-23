"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("demo@demo.com");

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border p-6 space-y-4">
        <h1 className="text-xl font-semibold">Log in</h1>

        <input
          className="w-full border rounded-md px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="demo@demo.com"
        />

        <button
          className="w-full rounded-md bg-black text-white py-2"
          onClick={() => signIn("credentials", { email, callbackUrl: "/app" })}
        >
          Continue
        </button>

        <p className="text-sm text-gray-500">
          Dev login: <b>demo@demo.com</b>
        </p>
      </div>
    </div>
  );
}
