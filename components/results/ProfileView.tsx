"use client";

import { useEffect, useRef, useState } from "react";
import { ConfidenceBadge, type ConfidenceLevel } from "@/components/results/ConfidenceBadge";
import type { CVData } from "@/types/cv";

export type ProfileViewProps = {
  data?: CVData;
};

type ContactItem = {
  key: "email" | "phone" | "location" | "linkedin";
  label: string;
  fieldLabel: string;
  href?: string;
  external?: boolean;
  confidenceLevel?: ConfidenceLevel;
};

/**
 * Redesigned results view (dashboard/portfolio), see context.md.
 * Executive header: name, contact, and brief introduction.
 */
export function ProfileView({ data }: ProfileViewProps) {
  if (!data) return null;

  const contactItems = buildContactItems(data.contact, data.confidence);
  const tagline = buildTagline(data);
  const displayName = data.name?.trim();

  return (
    <header className="w-full rounded-lg border border-border bg-surface p-6 shadow-card sm:p-8 print:break-inside-avoid">
      {displayName && (
        <div className="flex items-center gap-4">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-lg font-bold text-primary sm:h-16 sm:w-16 sm:text-xl"
            aria-hidden="true"
          >
            {getInitials(displayName)}
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {displayName}
          </h1>
        </div>
      )}

      {contactItems.length > 0 && (
        <div
          className={`flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground ${displayName ? "mt-4" : ""}`}
        >
          {contactItems.map((item) => {
            const labelWrapClass = getContactLabelClassName(item.key);

            return (
            <span
              key={item.key}
              className={`inline-flex items-center gap-1.5 ${
                needsWrapTreatment(item.key) ? "max-w-full min-w-0" : ""
              }`}
            >
              <ContactIcon type={item.key} />
              {item.href ? (
                <a
                  href={item.href}
                  className={`text-foreground transition-colors hover:text-primary${labelWrapClass ? ` ${labelWrapClass}` : ""}`}
                  {...(item.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {item.label}
                </a>
              ) : (
                <span className={labelWrapClass}>{item.label}</span>
              )}
              <ConfidenceBadge
                level={item.confidenceLevel}
                fieldLabel={item.fieldLabel}
              />
            </span>
            );
          })}
        </div>
      )}

      {tagline && <TaglineBlock text={tagline} />}
    </header>
  );
}

function TaglineBlock({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const taglineRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const element = taglineRef.current;
    if (!element) return;

    const checkOverflow = () => {
      if (isExpanded) return;
      setIsOverflowing(element.scrollHeight > element.clientHeight + 1);
    };

    checkOverflow();

    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [text, isExpanded]);

  return (
    <>
      <p
        ref={taglineRef}
        data-capture-clamp
        className={`mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground print:line-clamp-none ${
          isExpanded ? "" : "line-clamp-3"
        }`}
      >
        {text}
      </p>
      {isOverflowing && (
        <button
          type="button"
          data-capture-hide
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          className="mt-1 self-start text-xs font-medium text-primary transition-colors hover:text-primary-hover print:hidden"
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}
    </>
  );
}

function ContactIcon({ type }: { type: ContactItem["key"] }) {
  const className = "h-4 w-4 shrink-0 text-muted-foreground";

  switch (type) {
    case "email":
      return <MailIcon className={className} />;
    case "phone":
      return <PhoneIcon className={className} />;
    case "location":
      return <MapPinIcon className={className} />;
    case "linkedin":
      return <LinkedInIcon className={className} />;
  }
}

function buildContactItems(
  contact: CVData["contact"],
  confidence: CVData["confidence"]
): ContactItem[] {
  const items: ContactItem[] = [];

  if (contact.email?.trim()) {
    const email = contact.email.trim();
    items.push({
      key: "email",
      label: email,
      fieldLabel: "Email",
      href: `mailto:${email}`,
      confidenceLevel: confidence["contact.email"],
    });
  }
  if (contact.phone?.trim()) {
    const phone = contact.phone.trim();
    items.push({
      key: "phone",
      label: phone,
      fieldLabel: "Phone",
      href: `tel:${phone}`,
      confidenceLevel: confidence["contact.phone"],
    });
  }
  if (contact.location?.trim()) {
    items.push({
      key: "location",
      label: contact.location.trim(),
      fieldLabel: "Location",
      confidenceLevel: confidence["contact.location"],
    });
  }
  if (contact.linkedin?.trim()) {
    const url = normalizeUrl(contact.linkedin.trim());
    items.push({
      key: "linkedin",
      label: "LinkedIn",
      fieldLabel: "LinkedIn",
      href: url,
      external: true,
      confidenceLevel: confidence["contact.linkedin"],
    });
  }

  return items;
}

export function buildTagline(data: CVData): string | null {
  const summary = data.summary?.trim();
  if (summary) return summary;

  const skills = data.skills
    .map((skill) => skill.trim())
    .filter((skill) => skill.length > 0)
    .slice(0, 4);

  const recentTitle =
    getMostRecentExperienceLabel(data.experience) ??
    getMostRecentProjectTitle(data.projects);

  if (skills.length >= 3) {
    return skills.join(" · ");
  }

  if (skills.length > 0 && recentTitle) {
    return [...skills, recentTitle].join(" · ");
  }

  if (skills.length > 0) {
    return skills.join(" · ");
  }

  return recentTitle;
}

function getMostRecentExperienceLabel(
  experience: CVData["experience"]
): string | null {
  const entry = getMostRecentByDate(
    experience,
    (item) => item.endDate,
    (item) => item.startDate
  );
  if (!entry) return null;

  const { role, company } = entry;
  if (role && company) return `${role} at ${company}`;
  return role ?? company;
}

function getMostRecentProjectTitle(
  projects: CVData["projects"]
): string | null {
  const entry = getMostRecentByDate(
    projects,
    (item) => item.endDate,
    (item) => item.startDate
  );
  return entry?.title?.trim() || null;
}

function getMostRecentByDate<T>(
  entries: T[],
  getEndDate: (entry: T) => string | null,
  getStartDate: (entry: T) => string | null
): T | null {
  if (entries.length === 0) return null;

  let bestIndex = 0;
  let bestScore = getRecencyScore(getEndDate(entries[0]), getStartDate(entries[0]));

  for (let i = 1; i < entries.length; i++) {
    const score = getRecencyScore(getEndDate(entries[i]), getStartDate(entries[i]));
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return entries[bestIndex];
}

function getRecencyScore(
  endDate: string | null,
  startDate: string | null
): number {
  if (endDate?.trim().toLowerCase() === "presente") {
    return Number.MAX_SAFE_INTEGER;
  }

  const endYear = extractLatestYear(endDate);
  const startYear = extractLatestYear(startDate);
  return endYear ?? startYear ?? -1;
}

function extractLatestYear(...dates: (string | null)[]): number | null {
  const years = dates
    .flatMap((d) => (d ? [...d.matchAll(/\d{4}/g)] : []))
    .map((m) => Number(m[0]));
  return years.length > 0 ? Math.max(...years) : null;
}

function normalizeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function getContactLabelClassName(key: ContactItem["key"]): string | undefined {
  if (key === "email") return "min-w-0 break-all";
  if (key === "location") return "min-w-0 break-words";
  return undefined;
}

function needsWrapTreatment(key: ContactItem["key"]): boolean {
  return key === "email" || key === "location";
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
