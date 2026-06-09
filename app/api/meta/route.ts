import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/meta?url=https://...
 * Scrape OG metadata (title, description, image, favicon) dari sebuah URL.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return Response.json({ error: "URL parameter is required" }, { status: 400 });
  }

  // Validasi URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Invalid protocol");
    }
  } catch {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; OrbitStation/1.0; +https://orbitstation.app)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      // Bukan HTML, kembalikan info dasar dari URL saja
      return Response.json({
        title: parsedUrl.hostname,
        description: null,
        imageUrl: null,
        faviconUrl: getFaviconUrl(parsedUrl),
        url: parsedUrl.toString(),
      });
    }

    const html = await response.text();
    const meta = parseMetaTags(html, parsedUrl);

    return Response.json(meta);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return Response.json({ error: "Request timed out" }, { status: 408 });
    }

    // Fallback: kembalikan info minimal dari URL saja
    return Response.json({
      title: parsedUrl.hostname,
      description: null,
      imageUrl: null,
      faviconUrl: getFaviconUrl(parsedUrl),
      url: parsedUrl.toString(),
    });
  }
}

// ============================================================
// HELPERS
// ============================================================

interface MetaResult {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  faviconUrl: string | null;
  url: string;
}

function parseMetaTags(html: string, baseUrl: URL): MetaResult {
  // Helper: extract content dari meta tag
  function getMeta(property: string): string | null {
    // og: / twitter: / name= meta tags
    const patterns = [
      new RegExp(
        `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
        "i"
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
        "i"
      ),
      new RegExp(
        `<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`,
        "i"
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`,
        "i"
      ),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return decodeHTMLEntities(match[1].trim());
    }
    return null;
  }

  // Title — prioritas: og:title > twitter:title > <title>
  let title =
    getMeta("og:title") ??
    getMeta("twitter:title") ??
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ??
    null;
  if (title) title = decodeHTMLEntities(title);

  // Description — prioritas: og:description > twitter:description > description
  const description =
    getMeta("og:description") ??
    getMeta("twitter:description") ??
    getMeta("description") ??
    null;

  // Image — prioritas: og:image > twitter:image
  let imageUrl = getMeta("og:image") ?? getMeta("twitter:image") ?? null;
  if (imageUrl) imageUrl = resolveUrl(imageUrl, baseUrl);

  // Favicon
  let faviconUrl: string | null = null;
  const faviconMatch =
    html.match(
      /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i
    ) ??
    html.match(
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i
    );
  if (faviconMatch?.[1]) {
    faviconUrl = resolveUrl(faviconMatch[1], baseUrl);
  } else {
    faviconUrl = getFaviconUrl(baseUrl);
  }

  return {
    title: title ?? baseUrl.hostname,
    description,
    imageUrl,
    faviconUrl,
    url: baseUrl.toString(),
  };
}

function getFaviconUrl(url: URL): string {
  return `${url.protocol}//${url.hostname}/favicon.ico`;
}

function resolveUrl(url: string, base: URL): string {
  try {
    return new URL(url, base).toString();
  } catch {
    return url;
  }
}

function decodeHTMLEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}
