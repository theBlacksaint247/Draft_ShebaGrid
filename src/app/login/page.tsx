import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginPanel } from "@/components/LoginPanel";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-bold sm:text-5xl">Sign in</h1>
      <Suspense fallback={<div className="skeleton mt-10 h-72" />}>
        <LoginPanel />
      </Suspense>
    </div>
  );
}
