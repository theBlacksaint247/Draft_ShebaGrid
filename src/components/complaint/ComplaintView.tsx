"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CityMapLazy } from "@/components/map/CityMapLazy";
import { RiskRing } from "@/components/marks";
import { StatusChip } from "@/components/StatusChip";
import { Timeline } from "@/components/Timeline";
import { Deadline } from "@/components/ui/Deadline";
import { UrgencyMeter } from "@/components/UrgencyMeter";
import { CATEGORY_LABEL, formatDateTime } from "@/lib/format";
import { complaintsNear } from "@/lib/hotspots";
import { PERSONAS } from "@/lib/people";
import { actionFor } from "@/lib/queue";
import { isClosed, slaHours } from "@/lib/sla";
import { moveTicket } from "@/lib/store/demo";
import { useComplaints, useFresh, useHotspots, useSession } from "@/lib/store/hooks";

function Missing({ id, back }: { id: string; back: { href: string; label: string } }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <div className="border-l-[6px] border-survey bg-panel p-6 shadow-lift sm:p-8">
        <h1 className="text-3xl font-bold">No complaint {id}</h1>
        <p className="mt-3 text-lg text-muted">It is not in this browser.</p>
        <Link
          href={back.href}
          className="mt-6 inline-block rounded-ui bg-brand px-6 py-3 text-lg font-semibold text-white hover:bg-brand-deep"
        >
          {back.label}
        </Link>
      </div>
    </div>
  );
}

export function ComplaintView({ id }: { id: string }) {
  const { role } = useSession();
  const complaints = useComplaints();
  const hotspots = useHotspots();
  const fresh = useFresh();

  const complaint = complaints.find((c) => c.id === id);
  const back =
    role === "resident"
      ? { href: "/complaints", label: "Back to My complaints" }
      : { href: "/dashboard", label: "Back to the dashboard" };

  const near = useMemo(
    () => (complaint ? complaintsNear(complaint, complaints, 120).filter((n) => n.complaint.id !== id) : []),
    [complaint, complaints, id],
  );

  if (!complaint) return <Missing id={id} back={back} />;

  if (role === "resident" && !complaint.mine) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <div className="border-l-[6px] border-survey bg-panel p-6 shadow-lift sm:p-8">
          <h1 className="text-3xl font-bold">This is not your complaint</h1>
          <p className="mt-3 text-lg text-muted">Residents can open only the complaints they filed.</p>
          <Link
            href="/complaints"
            className="mt-6 inline-block rounded-ui bg-brand px-6 py-3 text-lg font-semibold text-white hover:bg-brand-deep"
          >
            Back to My complaints
          </Link>
        </div>
      </div>
    );
  }

  const closed = isClosed(complaint.status);
  const resolvedAt = complaint.history.find((e) => e.status === "resolved")?.at;
  const finishedLate = resolvedAt ? Date.parse(resolvedAt) > Date.parse(complaint.dueAt) : false;
  const hotspot = hotspots.find((h) => h.complaintIds.includes(complaint.id));
  const photoMatches = complaint.aiLabel?.category === complaint.category;
  const action = actionFor(role, complaint.status);
  const persona = role ? PERSONAS[role] : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link href={back.href} className="font-medium text-brand-ink underline underline-offset-4">
        {back.label}
      </Link>

      <header className={`mt-5 flex flex-wrap items-start justify-between gap-4 ${fresh.includes(id) ? "row-new" : ""}`}>
        <div className="min-w-0">
          <p>
            <span className="plate">{complaint.id}</span>
          </p>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">{complaint.title}</h1>
          <p className="mt-2 text-lg text-muted">
            {CATEGORY_LABEL[complaint.category]} in {complaint.area}, Ward {complaint.ward},{" "}
            {complaint.corporation}. Reported {formatDateTime(complaint.reportedAt)}.
          </p>
        </div>
        <StatusChip status={complaint.status} />
      </header>

      {action && persona && role && (
        <section
          aria-labelledby="next-step"
          className="mt-6 flex flex-wrap items-center justify-between gap-4 border-l-[6px] border-signal bg-panel p-4 shadow-lift sm:px-6"
        >
          <h2 id="next-step" className="text-xl font-bold">Next step</h2>
          <button
            type="button"
            onClick={() => moveTicket(complaint.id, { role, name: persona.name })}
            className="rounded-ui bg-signal px-6 py-2.5 text-lg font-semibold text-road hover:brightness-110"
          >
            {action}
          </button>
        </section>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-8">
          <section aria-labelledby="what">
            <h2 id="what" className="text-2xl font-bold">What was reported</h2>
            <p
              lang={/[ঀ-৿]/.test(complaint.description) ? "bn" : undefined}
              className="mt-2 max-w-prose text-lg"
            >
              {complaint.description}
            </p>
            {complaint.photo && (
              <figure className="mt-4 max-w-md">
                {/* The resident's own photo, stored in the browser as a data URL. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={complaint.photo}
                  alt={`Photo of the problem, sent with ${complaint.id}`}
                  className="w-full rounded-ui border border-line"
                />
              </figure>
            )}
          </section>

          <section aria-labelledby="checks">
            <h2 id="checks" className="text-2xl font-bold">Checks</h2>
            <dl className="mt-3 divide-y divide-line border-y border-line">
              {complaint.aiLabel && (
                <div className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr]">
                  <dt className="font-semibold">Photo check</dt>
                  <dd>
                    {CATEGORY_LABEL[complaint.aiLabel.category]},{" "}
                    {Math.round(complaint.aiLabel.confidence * 100)}% sure.{" "}
                    {!photoMatches && (
                      <span className="text-muted">Differs from the category chosen.</span>
                    )}
                  </dd>
                </div>
              )}
              <div className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr]">
                <dt className="font-semibold">Urgency</dt>
                <dd className="flex flex-wrap items-center gap-3">
                  <UrgencyMeter value={complaint.urgency} />
                  <span className="text-muted">Fix within {slaHours(complaint.urgency)} hours</span>
                </dd>
              </div>
              <div className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr]">
                <dt className="font-semibold">Hotspot</dt>
                <dd>
                  {hotspot ? (
                    <span className="flex items-start gap-2.5">
                      <span className="mt-1">
                        <RiskRing level={hotspot.level} />
                      </span>
                      <span>
                        Part of the hotspot in {hotspot.area}, with {hotspot.count} reports within 50 m.{" "}
                        {role !== "resident" && (
                          <Link
                            href={`/hotspots#${hotspot.key}`}
                            className="font-semibold text-brand-ink underline underline-offset-4"
                          >
                            View on the map
                          </Link>
                        )}
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted">Not part of a hotspot.</span>
                  )}
                </dd>
              </div>
              {complaint.repeatAfterRepair && (
                <div className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr]">
                  <dt className="font-semibold">Came back</dt>
                  <dd>Reported again after an earlier repair was marked done.</dd>
                </div>
              )}
            </dl>
          </section>
        </div>

        <div className="space-y-8">
          <section aria-labelledby="deadline">
            <h2 id="deadline" className="text-2xl font-bold">Deadline</h2>
            <p className="mt-2 text-lg">
              Due {formatDateTime(complaint.dueAt)}.{" "}
              {closed ? (
                <span className={`font-semibold ${finishedLate ? "text-signal-ink" : "text-brand-ink"}`}>
                  {finishedLate ? "Fixed after the deadline." : "Fixed within the deadline."}
                </span>
              ) : (
                <Deadline complaint={complaint} className="font-semibold" />
              )}
            </p>
            <p className="mt-1 text-muted">
              {complaint.assignee ? `Handled by ${complaint.assignee}.` : "Waiting for an engineer to be assigned."}
            </p>
          </section>

          <section aria-labelledby="progress">
            <h2 id="progress" className="text-2xl font-bold">Progress</h2>
            <div className="mt-4">
              <Timeline history={complaint.history} />
            </div>
          </section>

          <section aria-labelledby="where">
            <h2 id="where" className="text-2xl font-bold">Location</h2>
            <div className="mt-3 h-56 overflow-hidden rounded-ui border border-line">
              <CityMapLazy
                center={{ lat: complaint.lat, lng: complaint.lng }}
                zoom={17}
                label={`Map showing where ${complaint.id} was reported`}
                className="h-full w-full"
                pin={{ lat: complaint.lat, lng: complaint.lng }}
                points={near.map((n) => ({
                  id: n.complaint.id,
                  lat: n.complaint.lat,
                  lng: n.complaint.lng,
                  label: `${n.complaint.id}: ${n.complaint.title}`,
                }))}
              />
            </div>
            {near.length > 0 && (
              <p className="mt-2 text-sm text-muted">
                {near.length} other {near.length === 1 ? "report" : "reports"} within 120 m.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
