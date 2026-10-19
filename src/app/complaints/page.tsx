import type { Metadata } from "next";
import Link from "next/link";
import { MyComplaints } from "@/components/MyComplaints";
import { RoleGate } from "@/components/shell/RoleGate";
import { RESIDENTS } from "@/lib/people";

export const metadata: Metadata = {
  title: "My complaints",
};

export default function ComplaintsPage() {
  return (
    <RoleGate allow={RESIDENTS} subject="your complaints">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-4xl font-bold sm:text-5xl">My complaints</h1>
          <Link
            href="/report"
            className="rounded-ui bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-deep"
          >
            Report a problem
          </Link>
        </div>
        <div className="mt-8">
          <MyComplaints />
        </div>
      </div>
    </RoleGate>
  );
}
