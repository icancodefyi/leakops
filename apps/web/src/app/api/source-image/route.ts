import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const IMAGE_ACCEPT = "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8";
const PAGE_ACCEPT = `${IMAGE_ACCEPT},text/html;q=0.7`;

function decodeAttribute(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function resolveInputUrl(raw: string, origin: string) {
  const trimmed = raw.trim();
  if (trimmed.startsWith("/")) return new URL(trimmed, origin);

  const url = new URL(trimmed);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https sources are supported.");
  }
  return url;
}

function blockedHost(url: URL, origin: string) {
  if (url.origin === origin) return false;

  const host = url.hostname.toLowerCase();
  return (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".local") ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  );
}

async function fetchWithTimeout(url: URL, accept: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    return await fetch(url, {
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        accept,
        "user-agent": "LeakOps source-image resolver",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

function extractMetaImage(html: string, baseUrl: URL) {
  const patterns = [
    /<meta\s+[^>]*(?:property|name)=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i,
    /<meta\s+[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']og:image["'][^>]*>/i,
    /<meta\s+[^>]*(?:property|name)=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i,
    /<meta\s+[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']twitter:image["'][^>]*>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return new URL(decodeAttribute(match[1]), baseUrl);
    }
  }

  return null;
}

async function imageResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "image/jpeg";
  const bytes = await response.arrayBuffer();

  return new NextResponse(bytes, {
    headers: {
      "content-type": contentType,
      "cache-control": "no-store",
    },
  });
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");
  if (!rawUrl) {
    return NextResponse.json({ error: "Missing source URL." }, { status: 400 });
  }

  try {
    const targetUrl = resolveInputUrl(rawUrl, request.nextUrl.origin);
    if (blockedHost(targetUrl, request.nextUrl.origin)) {
      return NextResponse.json({ error: "This source host cannot be fetched." }, { status: 400 });
    }

    const firstResponse = await fetchWithTimeout(targetUrl, PAGE_ACCEPT);
    if (!firstResponse.ok) {
      return NextResponse.json({ error: "Source could not be reached." }, { status: firstResponse.status });
    }

    const firstType = firstResponse.headers.get("content-type") || "";
    if (firstType.startsWith("image/")) {
      return imageResponse(firstResponse);
    }

    if (!firstType.includes("text/html")) {
      return NextResponse.json({ error: "No image was found at this source." }, { status: 404 });
    }

    const html = await firstResponse.text();
    const imageUrl = extractMetaImage(html, targetUrl);
    if (!imageUrl) {
      return NextResponse.json({ error: "No share image was found on this page." }, { status: 404 });
    }
    if (blockedHost(imageUrl, request.nextUrl.origin)) {
      return NextResponse.json({ error: "Resolved image host cannot be fetched." }, { status: 400 });
    }

    const image = await fetchWithTimeout(imageUrl, IMAGE_ACCEPT);
    if (!image.ok || !(image.headers.get("content-type") || "").startsWith("image/")) {
      return NextResponse.json({ error: "Resolved source image could not be fetched." }, { status: 404 });
    }

    return imageResponse(image);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch source image.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
