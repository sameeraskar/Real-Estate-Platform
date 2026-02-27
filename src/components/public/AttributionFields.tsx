"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type Attribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  gclid?: string;
  fbclid?: string;
  landingPath?: string;
  referrer?: string;
};

const COOKIE = "lp_attrib";
const MAX_AGE_DAYS = 30;

function safeStr(v: string | null): string | undefined {
  if (!v) return undefined;
  const s = String(v).trim();
  if (!s || s.toLowerCase() === "null" || s.toLowerCase() === "undefined") return undefined;
  return s.slice(0, 300);
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : undefined;
}

function writeCookie(name: string, value: string, days: number) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

export default function AttributionFields() {
  const sp = useSearchParams();
  const pathname = usePathname();

  const landingPath = useMemo(() => {
    const qs = sp?.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [pathname, sp]);

  const [attrib, setAttrib] = useState<Attribution>({});

  useEffect(() => {
    const fromUrl: Attribution = {
      utmSource: safeStr(sp.get("utm_source")),
      utmMedium: safeStr(sp.get("utm_medium")),
      utmCampaign: safeStr(sp.get("utm_campaign")),
      utmContent: safeStr(sp.get("utm_content")),
      utmTerm: safeStr(sp.get("utm_term")),
      gclid: safeStr(sp.get("gclid")),
      fbclid: safeStr(sp.get("fbclid")),
      landingPath,
      referrer: safeStr(typeof document !== "undefined" ? document.referrer : null),
    };

    let fromCookie: Attribution = {};
    try {
      const raw = readCookie(COOKIE);
      if (raw) fromCookie = JSON.parse(raw);
    } catch {
      fromCookie = {};
    }

    // cookie fills gaps; URL overwrites when present
    const merged: Attribution = {
      ...fromCookie,
      ...Object.fromEntries(Object.entries(fromUrl).filter(([, v]) => v !== undefined && v !== "")),
    };

    setAttrib(merged);

    try {
      writeCookie(COOKIE, JSON.stringify(merged), MAX_AGE_DAYS);
    } catch {
      // ignore
    }
  }, [sp, landingPath]);

  return (
    <>
      <input type="hidden" name="utmSource" value={attrib.utmSource ?? ""} />
      <input type="hidden" name="utmMedium" value={attrib.utmMedium ?? ""} />
      <input type="hidden" name="utmCampaign" value={attrib.utmCampaign ?? ""} />
      <input type="hidden" name="utmContent" value={attrib.utmContent ?? ""} />
      <input type="hidden" name="utmTerm" value={attrib.utmTerm ?? ""} />
      <input type="hidden" name="gclid" value={attrib.gclid ?? ""} />
      <input type="hidden" name="fbclid" value={attrib.fbclid ?? ""} />
      <input type="hidden" name="landingPath" value={attrib.landingPath ?? ""} />
      <input type="hidden" name="referrer" value={attrib.referrer ?? ""} />
    </>
  );
}