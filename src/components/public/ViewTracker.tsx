"use client";

import { useEffect } from "react";

export default function ViewTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    fetch(`/api/public/listings/${listingId}/view`, {
      method: "POST",
      cache: "no-store",
    }).catch(() => {});
  }, [listingId]);

  return null;
}
