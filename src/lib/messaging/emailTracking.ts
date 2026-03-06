export function buildTrackedEmailHtml(opts: {
  baseUrl: string;
  trackingId: string;
  subject?: string | null;
  text: string;
}) {
  const { baseUrl, trackingId, subject, text } = opts;

  const escapeHtml = (s: string) =>
    s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  // Convert URLs in plain text into tracked links
  const urlRegex = /(https?:\/\/[^\s<]+)/g;

  const bodyWithLinks = escapeHtml(text).replace(urlRegex, (url) => {
    const tracked = `${baseUrl}/api/engagement/click?tid=${encodeURIComponent(
      trackingId
    )}&u=${encodeURIComponent(url)}`;
    return `<a href="${tracked}" target="_blank" rel="noopener noreferrer">${escapeHtml(
      url
    )}</a>`;
  });

  const pixelUrl = `${baseUrl}/api/engagement/open?tid=${encodeURIComponent(trackingId)}`;

  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(subject || "Message")}</title>
  </head>
  <body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height: 1.5;">
    <div style="max-width: 640px; margin: 0 auto; padding: 16px;">
      <div style="white-space: pre-wrap;">${bodyWithLinks}</div>

      <!-- Open tracking pixel -->
      <img src="${pixelUrl}" width="1" height="1" style="display:none;" alt="" />
    </div>
  </body>
</html>
`.trim();
}