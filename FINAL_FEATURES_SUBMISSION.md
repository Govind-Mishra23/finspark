# FinSpark (InsightX) - Final Implemented Features Document

## 1. Project Overview

FinSpark (InsightX) is a multi-tenant feature intelligence platform for tracking product interactions, analyzing user funnels, and generating actionable growth recommendations.

The project includes:

- A React dashboard application for analytics, onboarding, governance, and settings.
- A Node.js + Express + MongoDB backend for ingestion, authentication, and analytics APIs.
- A hosted browser SDK for low-friction telemetry integration.
- A standalone integration demo site to simulate third-party client adoption.
- A demo loan-journey app flow for realistic funnel instrumentation.

## 2. Frontend Features (Client Application)

### 2.1 Authentication and Access Flow

- Public landing page with product positioning and integration messaging.
- Tenant sign-up flow with automatic post-registration login.
- Login flow with credential authentication.
- Quick demo authority login shortcut.
- Persistent session state in localStorage.
- Logout support with session cleanup.

### 2.2 Role-Aware Routing and Navigation

- Protected layout for authenticated users.
- Public routes for unauthenticated users (landing, login, signup).
- Role-conditional route access:
  - Tenant-facing: onboarding, integration guide, governance.
  - Authority-facing: loan demo app.
- Sidebar grouped by Analytics, Platform, Demo, and Account sections.

### 2.3 Analytics Dashboard Experience

- KPI cards for total events, active users, top feature, and funnel drop-off.
- Feature usage bar chart visualization.
- Live refresh indicators and manual refresh action.
- Auto-refresh polling for near-real-time updates.
- Last-updated timestamp display.

### 2.4 Funnel Analysis

- Multi-step funnel visualization for the loan journey.
- Step-wise unique user counts.
- Automatic drop-off percentage calculation per stage.
- Comparative bar chart across funnel steps.

### 2.5 Feature Trend Analysis

- Time-series line chart for total daily events.
- Multi-series feature trend chart by event type.
- Dynamic event-key discovery from backend data.

### 2.6 Smart Insights (Rule-Based)

- Card-based insights categorized by severity/type.
- Rule-driven warnings, successes, and informational insights.
- Insight metrics and category tags rendered in UI.

### 2.7 DeepInsight AI Growth Report

- Trigger-based AI report generation from tracked telemetry.
- KPI summary tiles (active users, actions, conversion rate, top feature).
- AI report sections:
  - Critical issues
  - Performance summary
  - Funnel diagnosis
  - Anomalies
  - Tactical recommendations
  - Growth opportunities
- Read-more handling for long narrative content.
- Export-to-text report download for executive sharing.
- Recalculate/regenerate analysis support.

### 2.8 Tenant Onboarding UI

- New tenant/app registration form (name, email, password).
- Display cards for registered applications and API keys.
- Copy API key actions in UI.
- Quick integration snippet preview block.

### 2.9 Integration Guide UI

- Stepwise setup guide for SDK installation and usage.
- Ready-to-copy snippets for:
  - HTML script injection
  - Manual event tracking
  - React integration
  - Direct REST ingestion
- Multi-tenant snippet personalization support in UI.

### 2.10 Governance and Compliance UI

- Controls for:
  - PII masking
  - Consent requirement
  - Global tracking enable/disable
  - Deployment model selection (cloud/on-premise)
- Save/apply governance configuration action.
- Compliance status cards (GDPR, CCPA, ISO 27001) derived from settings.

### 2.11 Account Settings

- Password change workflow (old/new/confirm).
- API key visibility and clipboard copy.
- API key rotation trigger with user confirmation.
- Local auth state API key update after rotation.

### 2.12 Interactive Loan Demo Application

- Multi-step simulated loan application flow:
  - Application details
  - Document upload simulation
  - KYC/consent step
  - Final decision
- Dynamic approval/rejection logic based on income vs loan amount.
- Inline event stream panel showing tracked events in real time.
- Scenario reset for repeated simulations.

## 3. Backend Features (Server Application)

### 3.1 Core Platform and Infrastructure

- Express server setup with JSON payload handling and CORS.
- MongoDB connectivity via Mongoose.
- Environment-driven configuration support.
- Health check endpoint for service monitoring.
- Static SDK hosting endpoint under `/sdk`.

### 3.2 Tenant and Identity Management

- Tenant registration with hashed password storage.
- Duplicate prevention by tenant name or email.
- Tenant login with active-status enforcement.
- Role-style response behavior for admin vs tenant accounts.
- Password update endpoint with old-password validation.
- API key rotation endpoint with key regeneration.
- Governance configuration patch endpoint.

### 3.3 Authentication and Request Security

- API key authentication middleware (`x-api-key`).
- Active-tenant validation before protected access.
- Optional origin allow-list enforcement per tenant (`allowedDomains`).
- Route-level protection for analytics and ingestion endpoints.

### 3.4 Event Ingestion and Processing

- Single-event ingestion endpoint.
- Batch-event ingestion endpoint.
- Request rate limiting for event ingestion.
- Batch payload size guardrails.
- Per-tenant event collection isolation (dynamic collection model).
- Metadata PII redaction support when tenant policy enables masking.

### 3.5 Analytics APIs

- Feature usage aggregation endpoint.
- Funnel analysis endpoint with step ordering and drop-off calculations.
- Daily trend aggregation endpoint (event breakdown + totals).
- Rule-based insights endpoint generating actionable cards.
- KPI summary endpoint for dashboard tiles.
- Event reset endpoint for demo data cleanup.

### 3.6 AI Analytics API

- AI growth report endpoint integrating Gemini model.
- Structured JSON report generation prompt design.
- Raw metrics + AI narrative response payload.
- Graceful behavior when API key is not configured.
- Fallback response for low-data scenarios.

## 4. SDK and Telemetry Features

### 4.1 Hosted Browser SDK (`/sdk/insightx.js`)

- Zero-code autocapture engine for:
  - Button and link clicks
  - Explicit funnel events via `data-insightx`
  - Form submissions
  - SPA navigation/page views
- Session ID lifecycle management via sessionStorage.
- Consent enforcement (`requireConsent`, `grantConsent`, `revokeConsent`).
- Cloud streaming mode for direct event delivery.
- On-premise federated mode:
  - Local buffering
  - Event aggregation
  - Periodic anonymized batch sync
- Enriched metadata capture (path, URL, referrer, screen size, etc.).

### 4.2 Lightweight Client SDK Variants

- Queue-based event tracking with batching.
- Flush timer for periodic delivery.
- Retry behavior by re-queueing on failed delivery.
- Listener hooks for UI event stream visualization.

## 5. Integration Demo Features

### 5.1 Standalone Demo Site

- Separate static demo website to emulate third-party integration.
- Configurable backend endpoint, API key, and tenant name.
- SDK initialization and explicit consent trigger controls.
- Event trigger buttons for key funnel milestones.
- Custom event payload submission example (search event).
- Live local event console.
- Local config persistence via browser localStorage.

### 5.2 Demo Workflow Support

- End-to-end path from demo site events to dashboard analytics.
- Metadata tagging for source identification (`integration-demo-site`).

## 6. Data Model and Isolation Features

- Tenant model with:
  - API key generation
  - Configurable governance settings
  - Active/inactive and admin flags
- Event model with indexed eventName, userId, and timestamp fields.
- Dynamic per-tenant event collection naming (`events_<tenantId>`).
- Compound indexing for analytics query performance.

## 7. Developer and Operational Features

- Dev/start scripts for client and server runtime.
- Server watch-mode development script.
- Seeding scripts for demo accounts and sample telemetry.
- Dedicated integration demo startup instructions.

## 8. Current Implementation Notes (Submission Transparency)

- Tenant list retrieval is used in some client screens, but a corresponding `GET /api/tenants` route is not present in current backend route definitions.
- Governance page currently calls a fixed API base URL (`http://localhost:5050`) rather than a relative environment-driven base URL.

These notes are included for transparent final submission quality and deployment readiness review.
