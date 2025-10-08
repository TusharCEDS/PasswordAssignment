"use client";
import NavBar from "@/components/NavBar";
import React, { useState } from "react";

export default function Page() {
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include", // important: ensures cookies are sent/received
      });

      const data = await res.json();

      if (data.success) {
        alert("✅ Account created successfully!");
        // Redirect to dashboard directly since token is set
        window.location.href = "/DashBoard";
      } else {
        alert("❌ " + (data.error || "Signup failed"));
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-white">
      <NavBar />
      <div className="flex flex-col items-center justify-center pt-15 pb-5 gap-6 px-4">
        <h1 className="text-4xl md:text-6xl font-bold font-serif text-gray-900 text-center">
          Create Your Account
        </h1>
        <p className="text-xl text-gray-500 text-center max-w-2xl">
          Join VaultX and manage your passwords securely
        </p>

        <form onSubmit={handleSubmit} className="mt-8 w-full max-w-md space-y-4">
          {["name", "phone", "email", "password"].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field}</label>
              <input
                id={field}
                name={field}
                type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                required
                onChange={handleChange}
                className="block w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900"
                placeholder={`Enter your ${field}`}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-medium"
          >
            {loading ? "Creating..." : "Sign Up"}
          </button>

          <p className="text-center text-sm text-gray-500 mt-1">
            Already have an account?{" "}
            <a href="/Login" className="text-gray-900 hover:underline font-medium">
              Log in
            </a>
          </p>
        </form>
      </div>
    </section>
  );
}
