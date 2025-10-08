"use client";
import NavBar from "@/components/NavBar";
import React, { useState } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";

export default function Page() {
  const { login } = useUser();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Verifying...");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("userEmail", data.email); // assuming backend sends user's email
        setMessage("✅ Login successful!");
        login(data.user); // Save to context + localStorage
        router.push("/DashBoard"); // Redirect to DashBoard
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      setMessage("⚠️ Something went wrong. Try again.");
    }
  };

  return (
    <section className="min-h-screen bg-white">
      <NavBar />
      <div className="flex flex-col items-center justify-center pt-15 pb-5 gap-6 px-4">
        <h1 className="text-4xl md:text-6xl font-bold font-serif text-gray-900 text-center">
          Log In Into Your Account
        </h1>
        <p className="text-xl md:text-2xl font-normal text-gray-500 text-center max-w-2xl">
          Join VaultX and manage your passwords securely
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 w-full max-w-md space-y-4"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-4 py-3 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Log In
          </button>

          {message && (
            <p className="text-center text-sm text-gray-600 mt-2">{message}</p>
          )}
        </form>
      </div>
    </section>
  );
}
