const endpointEl = document.getElementById('endpoint');
const apiKeyEl = document.getElementById('apiKey');
const tenantIdEl = document.getElementById('tenantId');
const initBtn = document.getElementById('initBtn');
const grantBtn = document.getElementById('grantBtn');
const sdkStatusEl = document.getElementById('sdkStatus');
const eventButtons = document.querySelectorAll('[data-insightx-event]');
const eventLogEl = document.getElementById('eventLog');
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');

const storeKey = 'insightx_demo_config';
let sdkInitialized = false;

function addLog(eventName, details) {
  const li = document.createElement('li');
  const now = new Date().toLocaleTimeString();
  li.innerHTML = `<span>${eventName}${details ? ` (${details})` : ''}</span><span>${now}</span>`;
  eventLogEl.prepend(li);

  if (eventLogEl.children.length > 18) {
    eventLogEl.removeChild(eventLogEl.lastChild);
  }
}

function saveConfig() {
  localStorage.setItem(
    storeKey,
    JSON.stringify({
      endpoint: endpointEl.value.trim(),
      apiKey: apiKeyEl.value.trim(),
      tenantId: tenantIdEl.value.trim(),
    })
  );
}

function loadConfig() {
  try {
    const raw = localStorage.getItem(storeKey);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    endpointEl.value = parsed.endpoint || endpointEl.value;
    apiKeyEl.value = parsed.apiKey || '';
    tenantIdEl.value = parsed.tenantId || '';
  } catch (_err) {
    // ignore invalid localStorage data
  }
}

function updateStatus(text, isError = false) {
  sdkStatusEl.textContent = text;
  sdkStatusEl.style.color = isError ? '#fca5a5' : '#9cd2e8';
}

function initSdk() {
  if (!window.InsightX) {
    updateStatus('SDK status: insightx.js not loaded. Ensure server is running on port 5050.', true);
    return;
  }

  const apiKey = apiKeyEl.value.trim();
  const endpoint = endpointEl.value.trim();
  const tenantId = tenantIdEl.value.trim();

  if (!apiKey || !endpoint || !tenantId) {
    updateStatus('SDK status: endpoint, API key, and tenant name are required.', true);
    return;
  }

  saveConfig();

  window.InsightX.init({
    apiKey,
    endpoint,
    tenantId,
    requireConsent: true,
    deploymentModel: 'cloud',
  });

  sdkInitialized = true;
  updateStatus(`SDK status: initialized for tenant ${tenantId}. Click Grant Consent to begin tracking.`);
  addLog('SDK_INITIALIZED', tenantId);
}

function track(eventName, metadata = {}) {
  if (!sdkInitialized) {
    updateStatus('SDK status: initialize SDK first.', true);
    return;
  }

  window.InsightX.trackEvent(eventName, {
    source: 'integration-demo-site',
    ...metadata,
  });

  addLog(eventName, metadata.query || metadata.step || null);
}

initBtn.addEventListener('click', initSdk);

grantBtn.addEventListener('click', () => {
  if (!sdkInitialized) {
    updateStatus('SDK status: initialize SDK before granting consent.', true);
    return;
  }

  window.InsightX.grantConsent();
  updateStatus('SDK status: consent granted, tracking is active.');
  addLog('CONSENT_GRANTED');
});

eventButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const eventName = btn.getAttribute('data-insightx-event');
    track(eventName, { step: eventName });
  });
});

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (!query) return;

  track('Search_Used', { query });
  searchInput.value = '';
});

loadConfig();
updateStatus('SDK status: not initialized. Add API key and click Initialize SDK.');
