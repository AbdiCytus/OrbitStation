# OrbStation - Future Features & Security Roadmap

This document outlines the security improvements and future feature suggestions for the OrbStation project, as discussed during the development phase.

## 1. Security & Vulnerability Fixes
*   **Stored XSS via Protocol URL (Fixed ✅):** 
    Previously, the URL validation in backend functions (`createBeacon` and `updateBeacon`) only used the native `new URL()` validation, which accepted the `javascript:` protocol. This posed a Stored Cross-Site Scripting (XSS) risk if a malicious user added a beacon with `javascript:alert('Hack!')`. This has been fixed by explicitly checking and enforcing `http:` and `https:` protocols on the server side.
*   **Rate Limiting (Recommended 🚨):**
    Public endpoints like `/api/analytics` or `recordStationVisit` are currently open. It is highly recommended to implement a Rate Limiter (e.g., using Upstash Redis or Vercel KV) to restrict the number of requests per IP address, preventing bot scraping, spam, and DDoS attacks.

## 2. Feature Recommendations (Next-Level 🚀)
*   **Browser Extension (Chrome/Edge):**
    Since OrbStation acts as a "Bookmark Manager" and "Link in Bio" hybrid, a lightweight browser extension would allow users to instantly save their currently active tab as a beacon without needing to manually open the OrbStation web app. This would massively improve user retention and UX.
*   **Open Graph (SEO) Dynamics:**
    For public profiles shared on social media (WhatsApp, Twitter, Discord, etc.), generating dynamic Open Graph cover images (via `app/api/og/route.tsx`) that display the user's name, title badge, and profile statistics (e.g., total visits) would make the application look highly professional and drive organic traffic.
*   **Global Search & Tags:**
    As users accumulate dozens of sectors and hundreds of beacons, introducing a tagging system (e.g., `#design`, `#dev`) and a global "Command Palette" (`Ctrl + K`) will allow users to search and filter their saved links instantly across the entire platform.
*   **Progressive Web App (PWA):**
    By adding a `manifest.json` and a Service Worker, OrbStation can become a Progressive Web App. This enables mobile users (iOS/Android) to install OrbStation directly to their home screen, allowing them to use it as a native app without navigating through the browser.
