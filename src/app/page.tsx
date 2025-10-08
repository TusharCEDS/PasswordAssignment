"use client";
import Image from "next/image";
import NavBar from "@/components/NavBar";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user } = useUser();
  const router = useRouter();

  const handleGetStarted = () => {
    if (user) router.push("/DashBoard"); // go to dashboard if logged in
    else router.push("/Login"); // otherwise go to login page
  };

  return (
    <section className="min-h-screen bg-white">
      <div>
        <NavBar />
        <div className="flex flex-col items-center justify-center pt-32 gap-6 px-4">
          <h1 className="text-5xl md:text-6xl font-bold font-serif text-gray-900 text-center">
            Welcome to VaultX
          </h1>
          <p className="text-xl md:text-2xl font-normal text-gray-500 text-center max-w-2xl">
            Your secure password manager
          </p>
          <p className="mt-12 text-xl md:text-xl font-normal text-gray-500 text-center max-w-2xl">
            LogIn or SignUp to get started
          </p>
          <button
            onClick={handleGetStarted}
            className="mt-2 px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-medium text-base"
          >
            Get Started
          </button>
        </div>
      </div>
    </section>
  );
}
