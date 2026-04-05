/**
 * InsightX SDK - Client-side copy for Loan Demo integration
 */
const InsightX = {
  _config: {
    apiKey: null,
    endpoint: '',
    tenantId: null,
    batchSize: 5,
    flushInterval: 3000,
    debug: true,
  },
  _queue: [],
  _sessionId: null,
  _timer: null,
  _listeners: [],

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

  onEvent(listener) {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  },

  trackEvent(eventName, metadata = {}) {
    if (!this._config.apiKey) {
      console.warn('[InsightX] SDK not initialized.');
      return;
    }

    const event = {
      eventName,
      userId: metadata.userId || 'demo_user',
      sessionId: this._sessionId,
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
      timestamp: new Date().toISOString(),
    };

    delete event.metadata.userId;
    this._queue.push(event);

    // Notify listeners
    this._listeners.forEach(fn => fn({ eventName, metadata, timestamp: event.timestamp }));

    if (this._config.debug) {
      console.log('[InsightX] Event tracked:', eventName);
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

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      if (this._config.debug) {
        console.log(`[InsightX] Flushed ${events.length} events`);
      }
    } catch (err) {
      console.error('[InsightX] Flush failed:', err.message);
      this._queue.unshift(...events);
    }
  },

  destroy() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    this.flush();
  },
};

export default InsightX;
