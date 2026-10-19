import type { Metadata } from "next";
import { ReportForm } from "@/components/ReportForm";
import { RoleGate } from "@/components/shell/RoleGate";
import { RESIDENTS } from "@/lib/people";

export const metadata: Metadata = {
  title: "Report a problem",
};

export default function ReportPage() {
  return (
    <RoleGate allow={RESIDENTS} subject="the report form">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-4xl font-bold sm:text-5xl">Report a problem</h1>
        <div className="mt-8">
          <ReportForm />
        </div>
      </div>
    </RoleGate>
  );
}
