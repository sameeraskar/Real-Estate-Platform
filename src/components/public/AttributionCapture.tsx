"use client";

import { useEffect } from "react";

const COOKIE_NAME = "rp_attrib";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

function getCookie(name: string) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export default function AttributionCapture() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const qp = url.searchParams;

    const incoming = {
      utmSource: qp.get("utm_source"),
      utmMedium: qp.get("utm_medium"),
      utmCampaign: qp.get("utm_campaign"),
      utmContent: qp.get("utm_content"),
      utmTerm: qp.get("utm_term"),

      gclid: qp.get("gclid"),
      gbraid: qp.get("gbraid"),
      wbraid: qp.get("wbraid"),
      fbclid: qp.get("fbclid"),

      landingPath: `${window.location.pathname}${window.location.search}`,
      referrer: document.referrer || null,
      // userAgent is better captured server-side on submit
    };

    // load existing cookie (if any) so we don't erase earlier values
    const existingRaw = getCookie(COOKIE_NAME);
    const existing = existingRaw ? safeJson(existingRaw) : {};

    // merge rule:
    // - keep existing values if already set
    // - fill blanks with incoming
    // - always update landingPath/referrer to most recent visit
    const merged: any = { ...incoming, ...existing };

    for (const k of Object.keys(incoming)) {
      const v = (incoming as any)[k];
      if (k === "landingPath" || k === "referrer") continue;
      if (merged[k] == null || merged[k] === "") merged[k] = v;
      // if merged already has value, keep it
    }

    merged.landingPath = incoming.landingPath;
    merged.referrer = incoming.referrer;

    setCookie(COOKIE_NAME, JSON.stringify(merged), MAX_AGE_SECONDS);
  }, []);

  return null;
}

function safeJson(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}