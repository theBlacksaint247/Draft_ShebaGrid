"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { CityMapLazy } from "@/components/map/CityMapLazy";
import { CameraIcon, CheckIcon } from "@/components/ui/icons";
import { UrgencyMeter } from "@/components/UrgencyMeter";
import { CATEGORY_LABEL, formatDateTime } from "@/lib/format";
import { nearestZone } from "@/lib/geo";
import { HOTSPOT_MIN_REPORTS, complaintsNear } from "@/lib/hotspots";
import { shrinkPhoto } from "@/lib/photo";
import { ZONES, inServiceArea } from "@/lib/places";
import { wardEngineer } from "@/lib/people";
import { dueDate, isClosed, slaHours } from "@/lib/sla";
import { submitComplaint } from "@/lib/store/demo";
import { useComplaints, useNowIso } from "@/lib/store/hooks";
import type { Category, Complaint, LatLng } from "@/lib/types";
import { estimateUrgency } from "@/lib/urgency";

const CATEGORIES: Category[] = ["pothole", "waterlogging", "open-manhole", "other"];

const START_VIEW: LatLng = { lat: 23.79, lng: 90.4 };

const field =
  "w-full rounded-ui border border-ink/40 bg-panel px-3 py-2 text-base placeholder:text-muted/80";

interface Photo {
  url: string;
  name: string;
}

export function ReportForm() {
  const uid = useId();
  const complaints = useComplaints();
  const now = useNowIso();

  const [photo, setPhoto] = useState<Photo | null>(null);
  const [pin, setPin] = useState<LatLng | null>(null);
  const [category, setCategory] = useState<Category | "">("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [locating, setLocating] = useState(false);
  const [receipt, setReceipt] = useState<Complaint | null>(null);

  const points = useMemo(
    () =>
      complaints.map((c) => ({
        id: c.id,
        lat: c.lat,
        lng: c.lng,
        label: `${c.id}: ${c.title}`,
        muted: isClosed(c.status),
      })),
    [complaints],
  );

  const outside = pin ? !inServiceArea(pin) : false;
  const zone = pin && !outside ? nearestZone(pin, ZONES) : null;
  const near = useMemo(() => (pin ? complaintsNear(pin, complaints) : []), [pin, complaints]);
  const nearOpen = near.filter((n) => !isClosed(n.complaint.status));
  const nearFixed = near.filter((n) => isClosed(n.complaint.status) && n.distance <= 30);

  const estimate = category ? estimateUrgency(description, category) : null;
  const dueAt = estimate ? dueDate(now, estimate.urgency) : null;

  const clearError = (key: string) => setErrors((e) => (e[key] ? { ...e, [key]: "" } : e));

  function placePin(point: LatLng) {
    setPin(point);
    clearError("pin");
  }

  async function chooseFile(file: File | undefined) {
    if (!file) return;
    setErrors((e) => ({ ...e, photo: "" }));
    try {
      const url = await shrinkPhoto(file);
      setPhoto({ url, name: file.name });
    } catch {
      setPhoto(null);
      setErrors((e) => ({ ...e, photo: "That file could not be read as a photo. Try a JPG or PNG." }));
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        placePin({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 },
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!pin) next.pin = "Place a pin on the map, or choose an area.";
    else if (outside) next.pin = "This spot is outside Dhaka North and Dhaka South.";
    if (!category) next.category = "Choose what kind of problem this is.";
    if (description.trim().length < 10)
      next.description = "Describe the problem in at least 10 characters. Bangla or English is fine.";
    setErrors(next);
    if (Object.keys(next).length > 0 || !pin || !category || !estimate) return;

    setReceipt(
      submitComplaint({
        ...pin,
        category,
        description: description.trim(),
        urgency: estimate.urgency,
        photo: photo?.url,
      }),
    );
  }

  function reset() {
    setPhoto(null);
    setPin(null);
    setCategory("");
    setDescription("");
    setErrors({});
    setReceipt(null);
  }

  if (receipt) {
    return (
      <div role="status" className="mx-auto max-w-2xl">
        <div className="border-l-[6px] border-brand bg-panel p-6 shadow-lift sm:p-8">
          <p className="flex items-center gap-2 font-semibold text-brand-ink">
            <CheckIcon size={20} /> Received
          </p>
          <h2 className="mt-1 text-3xl font-bold sm:text-4xl">
            Complaint <span className="plate text-3xl">{receipt.id}</span>
          </h2>
          <dl className="mt-5 divide-y divide-line border-y border-line">
            <div className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr]">
              <dt className="font-semibold">Ward</dt>
              <dd>
                Ward {receipt.ward}, {receipt.corporation} ({receipt.area})
              </dd>
            </div>
            <div className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr]">
              <dt className="font-semibold">Goes to</dt>
              <dd>{wardEngineer(receipt.corporation, receipt.ward)}</dd>
            </div>
            <div className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr]">
              <dt className="font-semibold">Urgency</dt>
              <dd className="flex flex-wrap items-center gap-3">
                <UrgencyMeter value={receipt.urgency} />
                <span className="text-muted">Fix within {slaHours(receipt.urgency)} hours</span>
              </dd>
            </div>
            <div className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr]">
              <dt className="font-semibold">Deadline</dt>
              <dd>{formatDateTime(receipt.dueAt)}</dd>
            </div>
            {receipt.repeatAfterRepair && (
              <div className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr]">
                <dt className="font-semibold">Came back</dt>
                <dd>A repair here was marked done before.</dd>
              </div>
            )}
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/complaints/${receipt.id}`}
              className="rounded-ui bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-deep"
            >
              Track {receipt.id}
            </Link>
            <button
              type="button"
              onClick={reset}
              className="rounded-ui border-2 border-ink px-5 py-2 font-semibold hover:bg-ink hover:text-paper"
            >
              Report another problem
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-9">
        <fieldset>
          <legend className="text-2xl font-bold">1. Add a photo</legend>

          <div className="mt-3">
            <label
              htmlFor={`${uid}-photo`}
              className="flex cursor-pointer items-center justify-center gap-3 rounded-ui border-2 border-dashed border-ink/50 bg-panel px-4 py-5 text-center hover:border-brand-ink has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-ink"
            >
              <CameraIcon size={24} />
              <span className="font-semibold">{photo ? "Choose a different photo" : "Take or choose a photo"}</span>
              <input
                id={`${uid}-photo`}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  chooseFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          {errors.photo && <p className="mt-2 font-medium text-signal-ink">{errors.photo}</p>}

          {photo && (
            <div className="mt-4 grid gap-4 sm:grid-cols-[13rem_1fr]">
              <div className="relative overflow-hidden rounded-ui border border-line">
                {/* A preview of the shrunken photo held in memory, so next/image does not apply. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="Your photo of the problem" className="aspect-[4/3] w-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm text-muted">{photo.name}</p>
                {/* Placeholder for the photo check. The real model will be connected here. */}
                <button
                  type="button"
                  className="mt-3 rounded-ui border-2 border-ink px-4 py-2 font-semibold hover:bg-ink hover:text-paper"
                >
                  Check photo
                </button>
              </div>
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend className="text-2xl font-bold">2. Describe the problem</legend>
          <div className="mt-3" role="radiogroup" aria-label="Kind of problem" aria-describedby={errors.category ? `${uid}-cat-error` : undefined}>
            <div className="grid gap-2 sm:grid-cols-2">
              {CATEGORIES.map((value) => (
                <label
                  key={value}
                  className={`flex cursor-pointer gap-3 rounded-ui border-2 px-3 py-2.5 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-ink ${
                    category === value ? "border-brand-ink bg-brand-soft" : "border-line bg-panel hover:border-ink/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={value}
                    checked={category === value}
                    onChange={() => {
                      setCategory(value);
                      clearError("category");
                    }}
                    className="mt-1.5 self-start accent-brand"
                  />
                  <span className="font-semibold">{CATEGORY_LABEL[value]}</span>
                </label>
              ))}
            </div>
          </div>
          {errors.category && (
            <p id={`${uid}-cat-error`} className="mt-2 font-medium text-signal-ink">{errors.category}</p>
          )}

          <label htmlFor={`${uid}-desc`} className="mt-5 block font-semibold">What is wrong?</label>
          <textarea
            id={`${uid}-desc`}
            rows={4}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              clearError("description");
            }}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? `${uid}-desc-error` : `${uid}-urgency`}
            placeholder="For example: a deep hole in the left lane near the bus stop. রাস্তার বাম পাশে বড় গর্ত।"
            className={`${field} mt-1`}
          />
          {errors.description && (
            <p id={`${uid}-desc-error`} className="mt-1 font-medium text-signal-ink">{errors.description}</p>
          )}

          <div id={`${uid}-urgency`} aria-live="polite">
            {estimate && dueAt && (
              <div className="mt-3 rounded-ui border border-line bg-panel p-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="font-semibold">Urgency</span>
                  <UrgencyMeter value={estimate.urgency} />
                  <span className="text-muted">Fix within {slaHours(estimate.urgency)} hours, by {formatDateTime(dueAt)}</span>
                </div>
                {estimate.reasons.length > 0 && (
                  <p className="mt-1 text-sm text-muted">Raised because {estimate.reasons.join(", ")}.</p>
                )}
              </div>
            )}
          </div>
        </fieldset>
      </div>

      <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <fieldset>
          <legend className="text-2xl font-bold">3. Mark the spot</legend>
          <div className="mt-3 h-80 overflow-hidden rounded-ui border border-line">
            <CityMapLazy
              center={START_VIEW}
              zoom={14}
              label="Map for placing the pin"
              className="h-full w-full"
              points={points}
              pin={pin}
              onPick={placePin}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className="rounded-ui border-2 border-ink px-4 py-2 font-semibold hover:bg-ink hover:text-paper disabled:opacity-60"
            >
              {locating ? "Finding you" : "Use my location"}
            </button>
            <div className="min-w-44 flex-1">
              <label htmlFor={`${uid}-area`} className="block text-sm font-semibold">Area</label>
              <select
                id={`${uid}-area`}
                className={`${field} mt-0.5`}
                value=""
                onChange={(e) => {
                  const chosen = ZONES.find((z) => z.id === e.target.value);
                  if (chosen) placePin({ lat: chosen.lat, lng: chosen.lng });
                }}
              >
                <option value="">Select an area</option>
                {ZONES.map((z) => (
                  <option key={z.id} value={z.id}>{z.name} ({z.corporation})</option>
                ))}
              </select>
            </div>
          </div>

          <div aria-live="polite" className="mt-3 space-y-2">
            {pin && zone && !outside && (
              <div className="rounded-ui border border-line bg-panel p-3">
                <p className="font-semibold text-brand-ink">
                  Ward {zone.ward}, {zone.corporation} ({zone.name})
                </p>
              </div>
            )}
            {nearOpen.length > 0 && (
              <div className="rounded-ui border-l-4 border-survey bg-survey-soft p-3">
                <p className="font-semibold">
                  {nearOpen.length} open {nearOpen.length === 1 ? "report" : "reports"} within 50 m already
                </p>
                <p className="text-sm">
                  {nearOpen.slice(0, 3).map((n) => n.complaint.id).join(", ")}
                  {nearOpen.length > 3 ? " and more" : ""}.{" "}
                  {nearOpen.length + 1 >= HOTSPOT_MIN_REPORTS
                    ? "Yours adds to a hotspot."
                    : "One more makes it a hotspot."}
                </p>
              </div>
            )}
            {nearFixed.length > 0 && (
              <div className="rounded-ui border-l-4 border-signal bg-signal-soft p-3">
                <p className="font-semibold">A repair here was marked done before</p>
                <p className="text-sm">This will count as the problem coming back.</p>
              </div>
            )}
            {pin && (
              <p className="text-sm tabular-nums text-muted">
                {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
              </p>
            )}
          </div>
          {(errors.pin || outside) && (
            <p className="font-medium text-signal-ink">
              {outside ? "This spot is outside Dhaka North and Dhaka South." : errors.pin}
            </p>
          )}
        </fieldset>

        <button
          type="submit"
          className="w-full rounded-ui bg-brand px-6 py-3 text-lg font-semibold text-white hover:bg-brand-deep"
        >
          Send complaint
        </button>
      </div>
    </form>
  );
}
