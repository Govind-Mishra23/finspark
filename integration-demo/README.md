# InsightX Integration Demo Site

This folder contains a standalone website you can use to demo how any client app can integrate with InsightX quickly.

## Files

- `index.html` - UI for SDK setup and event triggers
- `styles.css` - Visual styling
- `script.js` - SDK initialization and event tracking logic

## How to Run

1. Start your backend server first (must expose `/sdk/insightx.js` and `/api/events`):

```bash
cd ../server
npm install
npm run dev
```

2. Serve this demo website from this folder (do not open raw file directly):

```bash
cd ../integration-demo
python3 -m http.server 5501
```

3. Open in browser:

- http://localhost:5501

## How to Use During Demo

1. Enter:

- Backend Endpoint: `http://localhost:5050`
- Tenant API Key: your tenant key (for example from onboarding/login)
- Tenant Name: your tenant name

2. Click **Initialize SDK**.
3. Click **Grant Consent**.
4. Trigger sample events with the buttons and search form.
5. Open your main dashboard app and refresh analytics pages to show event flow.

## Notes

- This demo uses `requireConsent: true` to reflect governance flow.
- Events include `source: integration-demo-site` metadata for easier filtering later.
- If events fail, verify backend is running on port `5050` and API key is valid.
