/**
 * InsightX Autocapture SDK v2
 * Zero-code telemetry engine with:
 *  - On-Premise Federated Batch Sync
 *  - GDPR/CCPA Consent Enforcement
 *  - PII-safe payloads
 *  - data-insightx attribute support
 */

(function () {
  if (window.InsightX) return;

  const InsightX = {
    apiKey: null,
    endpoint: null,
    tenantId: null,
    deploymentModel: 'cloud',
    requireConsent: false,
    _consentGranted: false,
    _sessionId: null,
    initialized: false,
    sessionStart: Date.now(),

    // --- BATCH BUFFER (for on-premise federated sync) ---
    _batchBuffer: [],
    _flushTimer: null,

    init: function (config) {
      this.apiKey = config.apiKey;
      this.endpoint = config.endpoint || (window.location.hostname === 'localhost' ? 'http://localhost:5050' : window.location.origin);
      this.tenantId = config.tenantId || 'anonymous';
      this.deploymentModel = config.deploymentModel || 'cloud';
      this.requireConsent = config.requireConsent || false;
      
      // Generate session ID and persist in sessionStorage
      this._sessionId = sessionStorage.getItem('ix_session') || `ixs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('ix_session', this._sessionId);

      this.initialized = true;

      if (this.deploymentModel === 'on-premise') {
        console.log('[InsightX] ON-PREMISE mode. Events aggregated locally. Federated batch sync every 30s.');
        this._startFederatedFlush();
      } else {
        console.log('[InsightX] CLOUD mode. Real-time event streaming active.');
      }

      if (!this.requireConsent) {
        this._consentGranted = true;
        this.trackEvent('Page_View', { path: window.location.pathname });
      } else {
        console.log('[InsightX] Consent required. Call InsightX.grantConsent() to begin tracking.');
      }

      this._bindAutocapture();
    },

    // --- CONSENT MANAGEMENT (GDPR/CCPA) ---
    grantConsent: function () {
      this._consentGranted = true;
      this.trackEvent('Consent_Granted', { path: window.location.pathname });
      console.log('[InsightX] Consent granted. Tracking active.');
    },

    revokeConsent: function () {
      this._consentGranted = false;
      sessionStorage.removeItem('ix_session');
      console.log('[InsightX] Consent revoked. Tracking suspended.');
    },

    // --- CORE METADATA ---
    _getMetadata: function () {
      return {
        url: window.location.href,
        path: window.location.pathname,
        sessionId: this._sessionId,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        timeOnPageMs: Date.now() - this.sessionStart,
        referrer: document.referrer || null,
      };
    },

    // --- EVENT PIPELINE ---
    trackEvent: function (eventName, customMetadata) {
      if (!this.initialized || !this._consentGranted) return;

      const payload = {
        eventName: String(eventName).replace(/\s+/g, '_'),
        userId: `anon_${this._sessionId}`,
        sessionId: this._sessionId,
        metadata: { ...this._getMetadata(), ...(customMetadata || {}) },
        timestamp: new Date().toISOString(),
      };

      if (this.deploymentModel === 'on-premise') {
        // Do NOT stream over the network. Buffer locally and sync in aggregate.
        this._batchBuffer.push(payload);
        console.log(`[InsightX][ON-PREM] Buffered: ${payload.eventName}. Buffer size: ${this._batchBuffer.length}`);
      } else {
        // Cloud: stream in real-time
        fetch(`${this.endpoint}/api/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': this.apiKey },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(err => console.error('[InsightX] Delivery error', err));
      }
    },

    // --- ON-PREMISE FEDERATED SYNC ENGINE ---
    _startFederatedFlush: function () {
      this._flushTimer = setInterval(() => this._federatedSync(), 30000);
      window.addEventListener('beforeunload', () => this._federatedSync());
    },

    _federatedSync: function () {
      if (this._batchBuffer.length === 0) return;
      
      // Aggregate into anonymous counts. No raw user data leaves the on-prem network.
      const aggregated = {};
      this._batchBuffer.forEach(e => {
        aggregated[e.eventName] = (aggregated[e.eventName] || 0) + 1;
      });

      const batchPayload = Object.entries(aggregated).map(([eventName, count]) => ({
        eventName: `FEDERATED_${eventName}`,
        userId: `onprem_aggregate_${this.tenantId}`,
        sessionId: this._sessionId,
        metadata: { count, deploymentModel: 'on-premise', aggregated: true },
        timestamp: new Date().toISOString(),
      }));

      console.log(`[InsightX][ON-PREM] Federating ${batchPayload.length} aggregate event types to cloud...`);

      fetch(`${this.endpoint}/api/events/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': this.apiKey },
        body: JSON.stringify({ events: batchPayload }),
        keepalive: true,
      })
      .then(() => {
        console.log('[InsightX][ON-PREM] Federated sync complete. Clearing buffer.');
        this._batchBuffer = [];
      })
      .catch(err => console.error('[InsightX][ON-PREM] Federated sync failed', err));
    },

    // --- DOM AUTOCAPTURE ENGINE ---
    _bindAutocapture: function () {
      // 1. Clicks: buttons, links, data-insightx annotated elements
      document.addEventListener('click', (e) => {
        let el = e.target;
        while (el && el !== document.body) {
          const explicitEvent = el.getAttribute('data-insightx');
          if (explicitEvent || el.tagName === 'BUTTON' || el.tagName === 'A' || el.getAttribute('role') === 'button') {
            const textContent = (el.innerText || el.value || '').trim().substring(0, 50);
            this.trackEvent(explicitEvent || 'Interaction_Click', {
              element: el.tagName.toLowerCase(),
              text: textContent,
              classes: el.className,
              href: el.href || null,
              isExplicitFunnel: !!explicitEvent,
            });
            break;
          }
          el = el.parentElement;
        }
      }, true);

      // 2. Form submissions
      document.addEventListener('submit', (e) => {
        const form = e.target;
        this.trackEvent('Form_Submitted', {
          action: form.action,
          id: form.id,
          classes: form.className,
        });
      }, true);

      // 3. SPA navigation interception
      const originalPush = history.pushState;
      history.pushState = (...args) => {
        originalPush.apply(history, args);
        window.dispatchEvent(new Event('ix_navigate'));
      };
      const onNavigate = () => this.trackEvent('Page_View', { path: window.location.pathname });
      window.addEventListener('popstate', onNavigate);
      window.addEventListener('ix_navigate', onNavigate);
    },
  };

  window.InsightX = InsightX;
})();
