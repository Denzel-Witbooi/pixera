# Phase 4 — Admin Foundation: Keycloak + Protected Routes
**Date:** 2026-04-20
**Branch:** `phase-4/admin-keycloak-auth`
**GitHub Issue:** [#6](https://github.com/Denzel-Witbooi/pixera/issues/6)
**Status:** In Progress

---

## What this phase is about (plain English)

Up to this point, Pixera has a public-facing gallery where anyone can browse and download albums. But there is no concept of an admin — no one can log in to create albums, upload photos, or manage content through a secured area.

This phase builds the front door to that secured area. When an admin visits `/admin`, they are sent to a login page. After logging in successfully, they land in the Admin Panel. If they are not logged in, they cannot access anything in that section. This phase does not build the full admin interface — that comes in Phases 5 and 6. This phase just sets up the lock and the key.

---

## Why Keycloak? (The decision, in plain English)

This is one of the most common questions you will get in an interview or discussion, so here is the full reasoning.

### The alternatives that were considered

| Option | What it is | Why it was not chosen |
|---|---|---|
| **Supabase Auth** | Auth built into the Supabase database service | We moved away from Supabase entirely in Phase 1. Bringing it back just for auth would be a step backward. |
| **Auth0** | Third-party auth-as-a-service (like Supabase Auth but standalone) | Great for quick prototypes, but it costs money as you scale, and you hand over control of your user data and login flows to a third party. Not suitable for a client-facing product where data ownership matters. |
| **Firebase Auth** | Google's equivalent of Auth0 | Same concerns as Auth0 — vendor lock-in and cost at scale. Also ties the project to the Google ecosystem. |
| **Custom JWT** | Writing your own login system from scratch | Possible, but auth is notoriously easy to get wrong. Rolling your own means you are responsible for hashing passwords, managing tokens, handling refresh, securing against brute force, etc. Not worth the risk. |
| **Keycloak** | Open-source Identity Provider (IdP) you self-host | ✅ Chosen |

### Why Keycloak won

1. **You own everything.** Keycloak runs on your own infrastructure. User data, login flows, and tokens never leave your control. This matters for enterprise clients and any future compliance requirements.

2. **It is the industry standard for enterprise identity.** In many organisations (especially those using Java/.NET stacks), Keycloak is the go-to. Knowing it is a real skill on a CV.

3. **It does more than just passwords.** Keycloak supports Single Sign-On (SSO), social logins (Google, GitHub), two-factor authentication, and fine-grained role management — all without extra code. You get these for free even if you do not need them right now.

4. **It pairs perfectly with .NET.** The .NET API validates Keycloak-issued JWT tokens using standard Microsoft JWT middleware. There is no custom library needed — it just works with the ecosystem.

5. **Local development without Keycloak.** In the `Development` environment, the API skips JWT validation entirely. This means you can build and test admin features on your laptop without running a Keycloak server.

---

## How it is being built (technical summary, simplified)

### The React side (what the browser loads)

The entire `/admin` section is **loaded separately from the public gallery**. This is called "lazy loading" or "code splitting." Think of it like two separate apps living at different URLs — a visitor to the gallery never downloads any admin code. This is important for security (the admin code is not visible in the browser) and for performance (the gallery loads faster).

When someone visits `/admin`:
- If they are not logged in → they are redirected to the Keycloak login page (hosted separately)
- If they log in successfully → Keycloak sends them back to `/admin` with a token
- If they click Sign Out → their session is ended in Keycloak and they are redirected away

### The .NET API side (the back end)

The API needs to verify that requests to protected endpoints (creating albums, uploading, deleting) actually come from a logged-in admin. It does this by checking the JWT token that Keycloak issues.

- **In Development:** Token checking is skipped — you can call admin endpoints freely with no token. This makes local development frictionless.
- **In Staging/Production:** Every request to a write endpoint must include a valid Keycloak token. If it does not, the API returns `401 Unauthorized`.

---

## What "done" looks like for this phase

- Visiting `/admin` without being logged in sends you to the Keycloak login screen
- After logging in, you land back at the Admin Panel
- Clicking Sign Out ends the session and redirects you away from `/admin`
- The admin JavaScript code does not appear in the public gallery's network requests
- The .NET API returns `401` for admin operations when no valid token is provided (in non-Development environments)
- The .NET API accepts all requests in `Development` without a token

---

## Issues encountered & solutions

*This section is updated as the phase progresses.*

| # | What went wrong | Why it happened | How it was fixed |
|---|---|---|---|
| — | — | — | — |

---

## Key files introduced in this phase

| File | What it does |
|---|---|
| `client/src/pages/admin/AdminPanel.tsx` | The root page of the admin section — lazy loaded |
| `client/src/components/admin/KeycloakGuard.tsx` | The component that checks for a valid session and redirects if missing |
| `client/src/lib/keycloak.ts` | The single Keycloak client instance shared across the admin section |
| `server/Pixera.Api/Auth/JwtMiddleware.cs` | The .NET middleware that validates (or bypasses) Keycloak tokens |

---

## Concepts worth knowing for interviews

**What is a JWT?**
A JSON Web Token is a small, signed package of information. When you log in, Keycloak hands your browser a JWT that says "this person is who they say they are, and they have these permissions." Every time the browser calls the API, it includes this token. The API checks the signature to make sure it has not been tampered with.

**What is an Identity Provider (IdP)?**
An Identity Provider is a system that manages who users are and verifies their identity. Keycloak is an IdP. Your app does not store passwords — Keycloak does. Your app just trusts what Keycloak tells it.

**What is code splitting / lazy loading?**
By default, React bundles all your code into one file. Code splitting tells the bundler to create separate files for different sections of the app, loaded only when needed. For Pixera, the admin code is in its own chunk — a gallery visitor never downloads it.

**What is SSO (Single Sign-On)?**
SSO means you log in once and are automatically authenticated across multiple applications. Keycloak supports this — if Pixera were to expand to multiple tools (an analytics dashboard, a file manager, etc.), users would log in once and access all of them without re-entering credentials.
