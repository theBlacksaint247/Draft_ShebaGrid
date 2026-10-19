import type { Metadata } from "next";
import { Suspense } from "react";
import { ComplaintView } from "@/components/complaint/ComplaintView";
import { RoleGate } from "@/components/shell/RoleGate";
import { ROLES } from "@/lib/people";

// Complaints exist only in the browser, so any number can be opened. One is
// prerendered so the page shell is built ahead of time.
export function generateStaticParams() {
  return [{ id: "SG-0001" }];
}

export async function generateMetadata({
  params,
}: PageProps<"/complaints/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: `Complaint ${id}` };
}

/** The complaint lives in the browser store. The page only needs the number. */
async function Loader({ params }: Pick<PageProps<"/complaints/[id]">, "params">) {
  const { id } = await params;
  return (
    <RoleGate allow={ROLES} subject="this complaint">
      <ComplaintView id={id} />
    </RoleGate>
  );
}

export default function ComplaintPage({ params }: PageProps<"/complaints/[id]">) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-10"><div className="skeleton h-12 w-72" /></div>}>
      <Loader params={params} />
    </Suspense>
  );
}
