"use client";
import React from "react";
import { useUser } from "@/context/UserContext";

export default function NavBar() {
  const { user, logout } = useUser();

  return (
    <nav className="w-full border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="text-2xl font-bold font-serif tracking-tight">
            <span className="text-gray-900">VaultX</span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-8">
            <a href="/" className="text-gray-500 hover:text-gray-900 transition-colors duration-200">
              Home
            </a>

            {user ? (
              <>
                <span className="text-gray-800 font-medium">Hi, {user.name}</span>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <a href="/Login" className="text-gray-500 hover:text-gray-900 transition-colors duration-200">
                  LogIn
                </a>
                <a
                  href="/SignUp"
                  className="px-5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-medium"
                >
                  SignUp
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
