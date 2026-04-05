/**
 * InsightX SDK - Lightweight Feature Usage Tracking
 * Usage:
 *   InsightX.init({ apiKey: 'your_key', endpoint: 'http://localhost:5000', tenantId: 'demo_bank' });
 *   InsightX.trackEvent('Loan_Apply_Clicked', { userId: 'user123' });
 */
(function (global) {
  const InsightX = {
    _config: {
      apiKey: null,
      endpoint: '',
      tenantId: null,
      batchSize: 10,
      flushInterval: 5000,
      debug: false,
    },
    _queue: [],
    _sessionId: null,
    _timer: null,

    init(options) {
      Object.assign(this._config, options);
      this._sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      if (this._config.flushInterval > 0) {
        this._timer = setInterval(() => this.flush(), this._config.flushInterval);
      }

      if (this._config.debug) {
        console.log('[InsightX] Initialized', this._config);
      }

      return this;
    },

    trackEvent(eventName, metadata = {}) {
      if (!this._config.apiKey) {
        console.warn('[InsightX] SDK not initialized. Call InsightX.init() first.');
        return;
      }

      const event = {
        eventName,
        userId: metadata.userId || 'anonymous',
        sessionId: this._sessionId,
        metadata: {
          ...metadata,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
          url: typeof window !== 'undefined' ? window.location.href : '',
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      // Remove userId from metadata to avoid duplication
      delete event.metadata.userId;

      this._queue.push(event);

      if (this._config.debug) {
        console.log('[InsightX] Event tracked:', eventName, event);
      }

      if (this._queue.length >= this._config.batchSize) {
        this.flush();
      }

      return this;
    },

    async flush() {
      if (this._queue.length === 0) return;

      const events = [...this._queue];
      this._queue = [];

      try {
        const response = await fetch(`${this._config.endpoint}/api/events/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this._config.apiKey,
          },
          body: JSON.stringify({ events }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        if (this._config.debug) {
          console.log(`[InsightX] Flushed ${events.length} events`);
        }
      } catch (err) {
        console.error('[InsightX] Flush failed:', err.message);
        // Re-queue failed events
        this._queue.unshift(...events);
      }
    },

    destroy() {
      if (this._timer) {
        clearInterval(this._timer);
        this._timer = null;
      }
      this.flush();
      this._config.apiKey = null;
    },
  };

  // Export for different module systems
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = InsightX;
  } else {
    global.InsightX = InsightX;
  }
})(typeof window !== 'undefined' ? window : global);
