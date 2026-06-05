<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import axios, { type AxiosError } from "axios";
import { ref, computed, onMounted, watch } from "vue";
import DOMPurify from "dompurify";
import { pb } from "@/lib/pocketbase";
import { useAuthStore } from "@/stores/auth";
import { toast } from "vue-sonner"; // Assuming sonner is used based on package.json

// --- Types ---
interface KeyValueRow {
  id: number;
  enabled: boolean;
  key: string;
  value: string;
}

type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";
type AuthType = "none" | "basic" | "bearer";
type ActiveTab = "params" | "headers" | "auth" | "body";

// --- State ---
const url = ref("https://jsonplaceholder.typicode.com/posts/1");
const method = ref<HttpMethod>("GET");
const activeTab = ref<ActiveTab>("params");

// Collections / PocketBase State
const auth = useAuthStore();
const collections = ref<any[]>([]);
const isCollectionsLoading = ref(false);
const showSaveModal = ref(false);
const requestName = ref("");
const activeRequestId = ref<string | null>(null);
const isSaving = ref(false);
const showSidebar = ref(true);

// Context menu state
const openMenuId = ref<string | null>(null);
const showRenameModal = ref(false);
const renameTarget = ref<{ id: string; name: string } | null>(null);
const renameValue = ref("");

let rowIdCounter = 0;
const createRow = (): KeyValueRow => ({
  id: rowIdCounter++,
  enabled: true,
  key: "",
  value: "",
});

const params = ref<KeyValueRow[]>([createRow()]);
const headers = ref<KeyValueRow[]>([createRow()]);

const authType = ref<AuthType>("none");
const authBasicUser = ref("");
const authBasicPass = ref("");
const authBearerToken = ref("");

const body = ref("");

// Response state
const isLoading = ref(false);
const responseStatus = ref<number | null>(null);
const responseStatusText = ref("");
const responseTime = ref<number | null>(null);
const responseData = ref<unknown>(null);
const responseError = ref<string | null>(null);
const hasResponse = ref(false);

// --- Computed ---
const httpMethods: HttpMethod[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
];

const methodColor = computed(() => {
  const colors: Record<HttpMethod, string> = {
    GET: "#4ade80",
    POST: "#facc15",
    PUT: "#60a5fa",
    PATCH: "#a78bfa",
    DELETE: "#f87171",
    HEAD: "#94a3b8",
    OPTIONS: "#fb923c",
  };
  return colors[method.value];
});

const isSuccessStatus = computed(
  () => responseStatus.value !== null && responseStatus.value < 400,
);
const isErrorStatus = computed(
  () => responseStatus.value !== null && responseStatus.value >= 400,
);

function getMethodColor(m: string) {
  const colors: any = {
    GET: "#4ade80",
    POST: "#facc15",
    PUT: "#60a5fa",
    PATCH: "#a78bfa",
    DELETE: "#f87171",
    HEAD: "#94a3b8",
    OPTIONS: "#fb923c",
  };
  return colors[m] || "#94a3b8";
}

const formattedResponse = computed(() => {
  if (responseData.value === null) return "";
  return JSON.stringify(responseData.value, null, 2);
});

const displayUrl = computed(() => {
  if (requestName.value) return requestName.value;
  let dUrl = url.value.replace(/^https?:\/\//, "");
  if (dUrl.length > 30) {
    dUrl = dUrl.substring(0, 15) + "..." + dUrl.substring(dUrl.length - 15);
  }
  return dUrl || "Untitled Request";
});

const highlightedJson = computed(() => {
  if (!formattedResponse.value) return "";
  const raw = formattedResponse.value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = "json-number";
        if (match.startsWith('"')) {
          cls = match.endsWith(":") ? "json-key" : "json-string";
        } else if (/true|false/.test(match)) {
          cls = "json-boolean";
        } else if (/null/.test(match)) {
          cls = "json-null";
        }
        return `<span class="${cls}">${match}</span>`;
      },
    );
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: ["span"],
    ALLOWED_ATTR: ["class"],
  });
});

// --- Methods ---
function addRow(list: KeyValueRow[]) {
  list.push(createRow());
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

function removeRow(list: KeyValueRow[], id: number) {
  const idx = list.findIndex((r) => r.id === id);
  if (idx !== -1) list.splice(idx, 1);
  if (list.length === 0) list.push(createRow());
}

async function sendRequest() {
  isLoading.value = true;
  hasResponse.value = false;
  responseData.value = null;
  responseError.value = null;
  responseStatus.value = null;
  responseStatusText.value = "";
  responseTime.value = null;

  try {
    const parsed = new URL(url.value);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
  } catch {
    responseError.value =
      "Invalid URL. Only http:// and https:// are supported.";
    hasResponse.value = true;
    isLoading.value = false;
    return;
  }

  const start = performance.now();

  try {
    // Build headers
    const reqHeaders: Record<string, string> = {};
    headers.value
      .filter((h) => h.enabled && h.key)
      .forEach((h) => (reqHeaders[h.key] = h.value));

    // Build params
    const reqParams: Record<string, string> = {};
    params.value
      .filter((p) => p.enabled && p.key)
      .forEach((p) => (reqParams[p.key] = p.value));

    // Build auth config
    const authConfig: {
      auth?: { username: string; password: string };
      headers?: Record<string, string>;
    } = {};

    if (authType.value === "basic") {
      authConfig.auth = {
        username: authBasicUser.value,
        password: authBasicPass.value,
      };
    } else if (authType.value === "bearer") {
      reqHeaders["Authorization"] = `Bearer ${authBearerToken.value}`;
    }

    // Build body
    let data: unknown = undefined;
    if (["POST", "PUT", "PATCH"].includes(method.value) && body.value.trim()) {
      try {
        data = JSON.parse(body.value);
        reqHeaders["Content-Type"] =
          reqHeaders["Content-Type"] || "application/json";
      } catch {
        responseError.value =
          "Invalid JSON body. Please check your body input.";
        hasResponse.value = true;
        isLoading.value = false;
        return;
      }
    }

    const res = await axios({
      method: method.value.toLowerCase(),
      url: url.value,
      headers: { ...reqHeaders, ...authConfig.headers },
      params: reqParams,
      data,
      auth: authConfig.auth,
      validateStatus: () => true, // don't throw on non-2xx
    });

    responseTime.value = Math.round(performance.now() - start);
    responseStatus.value = res.status;
    responseStatusText.value = res.statusText;
    responseData.value = res.data;
  } catch (err) {
    responseTime.value = Math.round(performance.now() - start);
    const axiosErr = err as AxiosError;
    responseError.value = axiosErr.message || "An unknown error occurred.";
  } finally {
    hasResponse.value = true;
    isLoading.value = false;
  }
}

// --- Collections Methods ---
async function fetchCollections() {
  if (!auth.isLoggedIn) return;
  const userId = auth.user?.id;
  if (!userId || !/^[a-z0-9]{15}$/.test(userId)) return;
  isCollectionsLoading.value = true;
  try {
    const records = await pb.collection("api_requests").getFullList({
      sort: "-created",
      filter: `user = "${userId}"`,
    });
    collections.value = records;
  } catch (err) {
    console.error("Error fetching collections:", err);
  } finally {
    isCollectionsLoading.value = false;
  }
}

async function handleSave() {
  if (!auth.isLoggedIn) {
    toast.error("Please login to save requests");
    return;
  }

  if (activeRequestId.value) {
    // Update existing
    await performSave(activeRequestId.value);
  } else {
    // Open modal for new name
    requestName.value = "";
    showSaveModal.value = true;
  }
}

async function performSave(id: string | null = null) {
  isSaving.value = true;
  try {
    // For updates: if requestName is blank, preserve the existing name from collections
    let name = requestName.value.trim();
    if (!name && id) {
      const existing = collections.value.find((c) => c.id === id);
      name = existing?.name || "Untitled Request";
    } else if (!name) {
      name = "Untitled Request";
    }

    const payload = {
      user: auth.user?.id,
      name,
      method: method.value,
      url: url.value,
      params: params.value.filter((p) => p.key),
      headers: headers.value.filter((h) => h.key),
      authType: authType.value,
      authConfig: {
        basicUser: authBasicUser.value,
        basicPass: "",
        bearerToken: "",
      },
      body: body.value,
    };

    if (id) {
      await pb.collection("api_requests").update(id, payload);
      toast.success("Request updated");
    } else {
      const record = await pb.collection("api_requests").create(payload);
      activeRequestId.value = record.id;
      toast.success("Request saved to collection");
      showSaveModal.value = false;
    }
    await fetchCollections();
  } catch (err) {
    console.error("Save error:", err);
    toast.error("Failed to save request");
  } finally {
    isSaving.value = false;
  }
}

function selectRequest(req: any) {
  activeRequestId.value = req.id;
  requestName.value = req.name; // ← fix bug 1: store name so tab updates
  method.value = req.method;
  url.value = req.url;

  // Load Params
  params.value =
    req.params.length > 0
      ? req.params.map((p: any) => ({ ...p, id: rowIdCounter++ }))
      : [createRow()];

  // Load Headers
  headers.value =
    req.headers.length > 0
      ? req.headers.map((h: any) => ({ ...h, id: rowIdCounter++ }))
      : [createRow()];

  // Load Auth
  authType.value = req.authType;
  if (req.authConfig) {
    authBasicUser.value = req.authConfig.basicUser || "";
    authBasicPass.value = req.authConfig.basicPass || "";
    authBearerToken.value = req.authConfig.bearerToken || "";
  }

  // Load Body
  body.value = req.body || "";

  // Reset response
  hasResponse.value = false;
  responseData.value = null;
}

async function deleteRequest(id: string) {
  openMenuId.value = null;
  try {
    await pb.collection("api_requests").delete(id);
    if (activeRequestId.value === id) {
      activeRequestId.value = null;
      requestName.value = "";
    }
    await fetchCollections();
    toast.success("Request deleted");
  } catch {
    toast.error("Failed to delete request");
  }
}

function openContextMenu(id: string) {
  openMenuId.value = openMenuId.value === id ? null : id;
}

function openRenameModal(req: any) {
  openMenuId.value = null;
  renameTarget.value = { id: req.id, name: req.name };
  renameValue.value = req.name;
  showRenameModal.value = true;
}

async function renameRequest() {
  if (!renameTarget.value || !renameValue.value.trim()) return;
  try {
    await pb
      .collection("api_requests")
      .update(renameTarget.value.id, { name: renameValue.value.trim() });
    // Update requestName in UI if renaming the active request
    if (activeRequestId.value === renameTarget.value.id) {
      requestName.value = renameValue.value.trim();
    }
    await fetchCollections();
    toast.success("Request renamed");
  } catch {
    toast.error("Failed to rename request");
  } finally {
    showRenameModal.value = false;
    renameTarget.value = null;
  }
}

function createNewRequest() {
  activeRequestId.value = null;
  requestName.value = "";
  url.value = "https://jsonplaceholder.typicode.com/posts/1";
  method.value = "GET";
  params.value = [createRow()];
  headers.value = [createRow()];
  authType.value = "none";
  authBasicUser.value = "";
  authBasicPass.value = "";
  authBearerToken.value = "";
  body.value = "";
  hasResponse.value = false;
  responseData.value = null;
  responseStatus.value = null;
  responseError.value = null;
  toast.info("New request started");
}

onMounted(() => {
  if (auth.isLoggedIn) fetchCollections();
});

watch(
  () => auth.isLoggedIn,
  (isLoggedIn) => {
    if (isLoggedIn) fetchCollections();
    else collections.value = [];
  },
);
</script>

<template>
  <div class="api-playground">
    <!-- Header -->
    <div class="pg-header">
      <div class="pg-header-inner">
        <div class="pg-logo">
          <iconify-icon icon="mdi:api" class="logo-icon" />
          <span>API Playground</span>
        </div>
        <div class="pg-header-actions">
          <button class="sidebar-toggle" @click="showSidebar = !showSidebar">
            <iconify-icon
              :icon="showSidebar ? 'mdi:chevron-left' : 'mdi:menu'"
            />
          </button>
        </div>
      </div>
    </div>

    <div class="playground-layout">
      <!-- Sidebar / Collections -->
      <aside v-if="showSidebar" class="pg-sidebar">
        <div class="sidebar-header">
          <div class="header-main">
            <iconify-icon icon="mdi:folder-table-outline" />
            <span>Collections</span>
          </div>
        </div>

        <div v-if="!auth.isLoggedIn" class="sidebar-empty">
          <p>Login to save your requests and form collections.</p>
        </div>

        <div v-else-if="isCollectionsLoading" class="sidebar-loading">
          <iconify-icon icon="mdi:loading" class="spin" />
        </div>

        <div v-else-if="collections.length === 0" class="sidebar-empty">
          <p>No saved requests yet.</p>
        </div>

        <div v-else class="collections-list">
          <div
            v-for="req in collections"
            :key="req.id"
            class="collection-item"
            :class="{ active: activeRequestId === req.id }"
            @click="selectRequest(req)"
          >
            <span
              class="item-method"
              :style="{ color: getMethodColor(req.method) }"
              >{{ req.method }}</span
            >
            <span class="item-name">{{ req.name }}</span>

            <!-- 3-dot menu -->
            <div class="item-menu-wrap" @click.stop>
              <button
                class="item-menu-btn"
                :class="{ active: openMenuId === req.id }"
                @click="openContextMenu(req.id)"
              >
                <iconify-icon icon="mdi:dots-vertical" />
              </button>
              <div v-if="openMenuId === req.id" class="item-dropdown">
                <button
                  class="item-dropdown-action"
                  @click="openRenameModal(req)"
                >
                  <iconify-icon icon="mdi:pencil-outline" /> Rename
                </button>
                <button
                  class="item-dropdown-action danger"
                  @click="deleteRequest(req.id)"
                >
                  <iconify-icon icon="mdi:delete-outline" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div class="playground-content">
        <!-- Request Tabs Bar -->
        <div class="request-tabs-bar">
          <div class="request-tab active">
            <span class="tab-method" :style="{ color: methodColor }">{{
              method
            }}</span>
            <span class="tab-url">{{ displayUrl }}</span>
            <button class="tab-close" @click="createNewRequest">
              <iconify-icon icon="mdi:close" />
            </button>
          </div>
          <button
            class="new-request-tab-btn"
            title="New Request"
            @click="createNewRequest"
          >
            <iconify-icon icon="mdi:plus" />
          </button>
        </div>

        <!-- URL Bar -->
        <div class="url-bar">
          <select
            v-model="method"
            class="method-select"
            :style="{ color: methodColor }"
          >
            <option
              v-for="m in httpMethods"
              :key="m"
              :value="m"
              :style="{ color: methodColor }"
            >
              {{ m }}
            </option>
          </select>
          <input
            v-model="url"
            type="text"
            class="url-input"
            placeholder="https://api.example.com/endpoint"
            @keydown.enter="sendRequest"
          />

          <button
            v-if="auth.isLoggedIn"
            class="save-btn"
            :class="{ active: activeRequestId }"
            v-tooltip="'Save Request'"
            @click="handleSave"
          >
            <iconify-icon v-if="isSaving" icon="mdi:loading" class="spin" />
            <iconify-icon v-else icon="mdi:content-save-outline" />
          </button>

          <button class="send-btn" :disabled="isLoading" @click="sendRequest">
            <iconify-icon v-if="isLoading" icon="mdi:loading" class="spin" />
            <iconify-icon v-else icon="mdi:send" />
            <span>Send</span>
          </button>
        </div>

        <!-- Main Area -->
        <div class="main-area">
          <!-- Request Pane -->
          <div class="request-pane">
            <div class="tab-bar">
              <button
                v-for="tab in [
                  'params',
                  'headers',
                  'auth',
                  'body',
                ] as ActiveTab[]"
                :key="tab"
                class="tab-btn"
                :class="{ active: activeTab === tab }"
                @click="activeTab = tab"
              >
                {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
                <span
                  v-if="tab === 'params' && params.some((p) => p.key)"
                  class="tab-badge"
                  >{{ params.filter((p) => p.key).length }}</span
                >
                <span
                  v-if="tab === 'headers' && headers.some((h) => h.key)"
                  class="tab-badge"
                  >{{ headers.filter((h) => h.key).length }}</span
                >
                <span
                  v-if="tab === 'auth' && authType !== 'none'"
                  class="tab-badge dot"
                />
                <span
                  v-if="tab === 'body' && body.trim()"
                  class="tab-badge dot"
                />
              </button>
            </div>

            <!-- Params Tab -->
            <div v-if="activeTab === 'params'" class="tab-content">
              <div class="kv-table">
                <div class="kv-head">
                  <span class="kv-col-check"></span>
                  <span class="kv-col-key">Key</span>
                  <span class="kv-col-val">Value</span>
                  <span class="kv-col-action"></span>
                </div>
                <div v-for="row in params" :key="row.id" class="kv-row">
                  <input
                    v-model="row.enabled"
                    type="checkbox"
                    class="kv-check"
                  />
                  <input
                    v-model="row.key"
                    type="text"
                    class="kv-input"
                    placeholder="name"
                    @input="
                      row.key && params[params.length - 1].key
                        ? addRow(params)
                        : null
                    "
                  />
                  <input
                    v-model="row.value"
                    type="text"
                    class="kv-input"
                    placeholder="value"
                  />
                  <button class="kv-remove" @click="removeRow(params, row.id)">
                    <iconify-icon icon="mdi:close" />
                  </button>
                </div>
                <button class="kv-add-btn" @click="addRow(params)">
                  <iconify-icon icon="mdi:plus" /> Add Parameter
                </button>
              </div>
            </div>

            <!-- Headers Tab -->
            <div v-if="activeTab === 'headers'" class="tab-content">
              <div class="kv-table">
                <div class="kv-head">
                  <span class="kv-col-check"></span>
                  <span class="kv-col-key">Key</span>
                  <span class="kv-col-val">Value</span>
                  <span class="kv-col-action"></span>
                </div>
                <div v-for="row in headers" :key="row.id" class="kv-row">
                  <input
                    v-model="row.enabled"
                    type="checkbox"
                    class="kv-check"
                  />
                  <input
                    v-model="row.key"
                    type="text"
                    class="kv-input"
                    placeholder="Content-Type"
                  />
                  <input
                    v-model="row.value"
                    type="text"
                    class="kv-input"
                    placeholder="application/json"
                  />
                  <button class="kv-remove" @click="removeRow(headers, row.id)">
                    <iconify-icon icon="mdi:close" />
                  </button>
                </div>
                <button class="kv-add-btn" @click="addRow(headers)">
                  <iconify-icon icon="mdi:plus" /> Add Header
                </button>
              </div>
            </div>

            <!-- Auth Tab -->
            <div v-if="activeTab === 'auth'" class="tab-content">
              <div class="auth-section">
                <label class="auth-label">Auth Type</label>
                <div class="auth-type-group">
                  <button
                    v-for="type in ['none', 'basic', 'bearer'] as AuthType[]"
                    :key="type"
                    class="auth-type-btn"
                    :class="{ active: authType === type }"
                    @click="authType = type"
                  >
                    {{
                      type === "none"
                        ? "None"
                        : type === "basic"
                          ? "Basic Auth"
                          : "Bearer Token"
                    }}
                  </button>
                </div>

                <div v-if="authType === 'basic'" class="auth-fields">
                  <div class="form-field">
                    <label>Username</label>
                    <input
                      v-model="authBasicUser"
                      type="text"
                      class="pg-input"
                      placeholder="username"
                    />
                  </div>
                  <div class="form-field">
                    <label>Password</label>
                    <input
                      v-model="authBasicPass"
                      type="password"
                      class="pg-input"
                      placeholder="••••••••"
                    />
                  </div>
                  <p class="auth-credentials-notice">
                    <iconify-icon icon="mdi:lock-outline" /> Credentials are not
                    saved with the request.
                  </p>
                </div>

                <div v-if="authType === 'bearer'" class="auth-fields">
                  <div class="form-field">
                    <label>Token</label>
                    <input
                      v-model="authBearerToken"
                      type="text"
                      class="pg-input"
                      placeholder="eyJhbGciOi..."
                    />
                  </div>
                  <p class="auth-credentials-notice">
                    <iconify-icon icon="mdi:lock-outline" /> Credentials are not
                    saved with the request.
                  </p>
                </div>

                <div v-if="authType === 'none'" class="auth-empty">
                  <iconify-icon
                    icon="mdi:lock-open-outline"
                    class="auth-empty-icon"
                  />
                  <p>
                    No authentication selected. Select an auth type above to get
                    started.
                  </p>
                </div>
              </div>
            </div>

            <!-- Body Tab -->
            <div v-if="activeTab === 'body'" class="tab-content body-tab">
              <div class="body-header">
                <span class="body-label">JSON</span>
                <button
                  v-if="body.trim()"
                  class="body-format-btn"
                  @click="
                    () => {
                      try {
                        body = JSON.stringify(JSON.parse(body), null, 2);
                      } catch {}
                    }
                  "
                >
                  <iconify-icon icon="mdi:code-braces" /> Format
                </button>
                <button
                  v-if="body.trim()"
                  class="body-clear-btn"
                  @click="body = ''"
                >
                  <iconify-icon icon="mdi:close" /> Clear
                </button>
              </div>
              <textarea
                v-model="body"
                class="body-textarea"
                placeholder='{\n  "key": "value"\n}'
                spellcheck="false"
              />
            </div>
          </div>

          <!-- Response Pane -->
          <div class="response-pane">
            <!-- Not Sent Yet -->
            <div v-if="!hasResponse && !isLoading" class="response-empty">
              <div class="response-empty-inner">
                <iconify-icon
                  icon="mdi:file-document-outline"
                  class="empty-icon"
                />
                <p>Not sent</p>
                <span>Hit Send to get a response</span>
              </div>
            </div>

            <!-- Loading -->
            <div v-if="isLoading" class="response-empty">
              <div class="response-empty-inner">
                <iconify-icon icon="mdi:loading" class="empty-icon spin" />
                <p>Sending request...</p>
              </div>
            </div>

            <!-- Response -->
            <div v-if="hasResponse && !isLoading" class="response-content">
              <!-- Status Bar -->
              <div class="response-meta-bar">
                <div v-if="responseStatus !== null" class="response-status">
                  <span
                    class="status-badge"
                    :class="{ success: isSuccessStatus, error: isErrorStatus }"
                  >
                    {{ responseStatus }} {{ responseStatusText }}
                  </span>
                </div>
                <div v-if="responseTime !== null" class="response-time">
                  <iconify-icon icon="mdi:clock-outline" />
                  {{ responseTime }}ms
                </div>
              </div>

              <!-- Error Display -->
              <div v-if="responseError" class="response-error">
                <iconify-icon icon="mdi:alert-circle-outline" />
                {{ responseError }}
              </div>

              <!-- JSON Viewer -->
              <div
                v-if="responseData !== null && !responseError"
                class="json-viewer"
              >
                <div class="json-toolbar">
                  <span class="json-toolbar-label">Response</span>
                  <button
                    class="json-copy-btn"
                    @click="copyToClipboard(formattedResponse)"
                  >
                    <iconify-icon icon="mdi:content-copy" /> Copy
                  </button>
                </div>
                <pre class="json-pre" v-html="highlightedJson"></pre>
              </div>

              <!-- Non-JSON or empty Response -->
              <div
                v-if="responseData !== null && typeof responseData === 'string'"
                class="json-viewer"
              >
                <pre class="json-pre">{{ responseData }}</pre>
              </div>
            </div>
          </div>
        </div>
        <!-- main-area -->
      </div>
      <!-- playground-content -->
    </div>
    <!-- playground-layout -->

    <!-- Rename Modal -->
    <div
      v-if="showRenameModal"
      class="modal-overlay"
      @click.self="showRenameModal = false"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h3>Rename Request</h3>
          <button @click="showRenameModal = false">
            <iconify-icon icon="mdi:close" />
          </button>
        </div>
        <div class="modal-body">
          <label>New Name</label>
          <input
            v-model="renameValue"
            type="text"
            class="pg-input"
            placeholder="e.g. Get User Profile"
            @keydown.enter="renameRequest"
            autofocus
          />
        </div>
        <div class="modal-footer">
          <button class="modal-cancel" @click="showRenameModal = false">
            Cancel
          </button>
          <button
            class="modal-save"
            :disabled="!renameValue.trim()"
            @click="renameRequest"
          >
            Rename
          </button>
        </div>
      </div>
    </div>

    <!-- Save Modal -->
    <div
      v-if="showSaveModal"
      class="modal-overlay"
      @click.self="showSaveModal = false"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h3>Save Request</h3>
          <button @click="showSaveModal = false">
            <iconify-icon icon="mdi:close" />
          </button>
        </div>
        <div class="modal-body">
          <label>Request Name</label>
          <input
            v-model="requestName"
            type="text"
            class="pg-input"
            placeholder="e.g. Get User Profile"
            @keydown.enter="performSave()"
            autofocus
          />
        </div>
        <div class="modal-footer">
          <button class="modal-cancel" @click="showSaveModal = false">
            Cancel
          </button>
          <button
            class="modal-save"
            :disabled="!requestName.trim() || isSaving"
            @click="performSave()"
          >
            {{ isSaving ? "Saving..." : "Save" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/*
  Brand palette reference:
    --bg-deep:    #001122  (deepest surface, code areas)
    --bg-panel:   #001e3c  (panels, sidebar, headers)
    --bg-raised:  #002a52  (raised surfaces, tab bars)
    --border:     #0a3d6b  (borders / dividers)
    --text-base:  #d0dbe8  (primary text)
    --text-muted: #7a96b0  (secondary / muted text)
    --text-dim:   #3d5a73  (disabled / placeholder)
    --accent:     #e89820  (brand amber — interactive highlight)
    --accent-dim: rgba(232,152,32,0.12)
    --danger:     #e05c5c  (destructive actions)
*/

/* ---------- Layout ---------- */
.api-playground {
  min-height: 100vh;
  background: #001122;
  color: #d0dbe8;
  font-family: "Rubik", system-ui, sans-serif;
  display: flex;
  flex-direction: column;
}

/* ---------- Header ---------- */
.pg-header {
  border-bottom: 1px solid #0a3d6b;
  padding: 0 1.5rem;
  background: #001e3c;
}
.pg-header-inner {
  max-width: 1600px;
  margin: 0 auto;
  height: 52px;
  display: flex;
  align-items: center;
}
.pg-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1.1rem;
  color: #e89820;
}
.logo-icon {
  font-size: 1.4rem;
}

.pg-header-actions {
  margin-left: auto;
}
.sidebar-toggle {
  background: transparent;
  border: 1px solid #0a3d6b;
  border-radius: 6px;
  color: #7a96b0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.sidebar-toggle:hover {
  background: #002a52;
  color: #d0dbe8;
}

/* ---------- 3-Pane Layout ---------- */
.playground-layout {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}
.pg-sidebar {
  width: 260px;
  background: #001e3c;
  border-right: 1px solid #0a3d6b;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.playground-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* ---------- Sidebar Styles ---------- */
.sidebar-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #0a3d6b;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #7a96b0;
}
.header-main {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.new-request-btn {
  background: transparent;
  border: none;
  color: #e89820;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  padding: 2px;
  border-radius: 4px;
  transition: background 0.2s;
}
.new-request-btn:hover {
  background: rgba(232, 152, 32, 0.12);
}

.sidebar-empty,
.sidebar-loading {
  padding: 2rem 1rem;
  text-align: center;
  color: #3d5a73;
  font-size: 0.85rem;
}

.collections-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.collection-item {
  padding: 0.6rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  transition: background 0.2s;
  font-size: 0.82rem;
  color: #d0dbe8;
  position: relative;
}
.collection-item:hover {
  background: #002a52;
}
.collection-item.active {
  background: rgba(232, 152, 32, 0.12);
  color: #e89820;
}
.item-method {
  font-size: 0.65rem;
  font-weight: 700;
  min-width: 32px;
}
.item-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ---------- 3-dot Context Menu ---------- */
.item-menu-wrap {
  position: relative;
  flex-shrink: 0;
}
.item-menu-btn {
  opacity: 0;
  background: transparent;
  border: none;
  color: #7a96b0;
  cursor: pointer;
  padding: 3px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.collection-item:hover .item-menu-btn,
.item-menu-btn.active {
  opacity: 1;
}
.item-menu-btn:hover,
.item-menu-btn.active {
  background: rgba(255, 255, 255, 0.08);
  color: #d0dbe8;
}
.item-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  background: #002a52;
  border: 1px solid #0a3d6b;
  border-radius: 8px;
  min-width: 130px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  z-index: 100;
  overflow: hidden;
  animation: dropdownFade 0.12s ease;
}
@keyframes dropdownFade {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.item-dropdown-action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.55rem 0.85rem;
  background: transparent;
  border: none;
  color: #d0dbe8;
  font-size: 0.82rem;
  cursor: pointer;
  transition: background 0.15s;
  text-align: left;
  white-space: nowrap;
}
.item-dropdown-action:hover {
  background: rgba(255, 255, 255, 0.06);
}
.item-dropdown-action.danger {
  color: #e05c5c;
}
.item-dropdown-action.danger:hover {
  background: rgba(224, 92, 92, 0.1);
}

/* ---------- Request Tabs Bar ---------- */
.request-tabs-bar {
  display: flex;
  align-items: center;
  background: #001122;
  padding: 0.5rem 1.5rem 0;
  gap: 0.5rem;
  border-bottom: 1px solid #0a3d6b;
}
.request-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #001e3c;
  border: 1px solid #0a3d6b;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  font-size: 0.82rem;
  font-family: "Fira Code", "JetBrains Mono", monospace;
  color: #7a96b0;
  position: relative;
}
.request-tab.active {
  background: #001e3c;
  color: #d0dbe8;
  border-color: #0a3d6b;
}
.request-tab.active::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 1px;
  background: #001e3c;
}
.tab-method {
  font-weight: 700;
  font-size: 0.72rem;
}
.tab-url {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tab-close {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #7a96b0;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  margin-left: 0.25rem;
}
.tab-close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #d0dbe8;
}
.new-request-tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #7a96b0;
  cursor: pointer;
  padding: 0.4rem;
  border-radius: 6px;
  font-size: 1.1rem;
  margin-bottom: 2px;
}
.new-request-tab-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #d0dbe8;
}

/* ---------- URL Bar ---------- */
.url-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #001e3c;
  border-bottom: 1px solid #0a3d6b;
}

.method-select {
  background: #001122;
  border: 1px solid #0a3d6b;
  border-radius: 6px;
  padding: 0.55rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  outline: none;
  min-width: 110px;
  transition: border-color 0.2s;
  color: #e89820;
}
.method-select:focus {
  border-color: #e89820;
}

.url-input {
  flex: 1;
  background: #001122;
  border: 1px solid #0a3d6b;
  border-radius: 6px;
  padding: 0.55rem 1rem;
  color: #d0dbe8;
  font-size: 0.9rem;
  font-family: "Fira Code", "JetBrains Mono", monospace;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.url-input:focus {
  border-color: #e89820;
  box-shadow: 0 0 0 3px rgba(232, 152, 32, 0.1);
}
.url-input::placeholder {
  color: #3d5a73;
}

/* ---------- Save Button ---------- */
.save-btn {
  background: #001122;
  border: 1px solid #0a3d6b;
  border-radius: 6px;
  color: #7a96b0;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.save-btn:hover {
  border-color: #e89820;
  color: #e89820;
}
.save-btn.active {
  color: #e89820;
  border-color: rgba(232, 152, 32, 0.5);
}

.send-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.25rem;
  background: #e89820;
  color: #001e3c;
  border: none;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition:
    background 0.2s,
    transform 0.1s;
  white-space: nowrap;
}
.send-btn:hover:not(:disabled) {
  background: #f0ab40;
  transform: translateY(-1px);
}
.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ---------- Main Area ---------- */
.main-area {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  overflow: hidden;
  min-height: 0;
}
@media (max-width: 768px) {
  .main-area {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
}

/* ---------- Request Pane ---------- */
.request-pane {
  border-right: 1px solid #0a3d6b;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tab-bar {
  display: flex;
  border-bottom: 1px solid #0a3d6b;
  background: #001e3c;
  padding: 0 0.5rem;
  gap: 0.125rem;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.7rem 0.9rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #7a96b0;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    color 0.2s,
    border-color 0.2s;
  margin-bottom: -1px;
}
.tab-btn:hover {
  color: #d0dbe8;
}
.tab-btn.active {
  color: #e89820;
  border-bottom-color: #e89820;
}

.tab-badge {
  background: #e89820;
  color: #001e3c;
  font-size: 0.65rem;
  font-weight: 700;
  border-radius: 10px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tab-badge.dot {
  width: 7px;
  height: 7px;
  min-width: unset;
  padding: 0;
  border-radius: 50%;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

/* ---------- Key-Value Table ---------- */
.kv-table {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.kv-head {
  display: grid;
  grid-template-columns: 28px 1fr 1fr 28px;
  gap: 0.5rem;
  padding: 0 0.25rem 0.4rem;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #3d5a73;
}

.kv-row {
  display: grid;
  grid-template-columns: 28px 1fr 1fr 28px;
  gap: 0.5rem;
  align-items: center;
}

.kv-check {
  width: 15px;
  height: 15px;
  accent-color: #e89820;
  cursor: pointer;
  justify-self: center;
}

.kv-input {
  background: #001122;
  border: 1px solid #0a3d6b;
  border-radius: 6px;
  padding: 0.45rem 0.6rem;
  color: #d0dbe8;
  font-size: 0.82rem;
  font-family: "Fira Code", monospace;
  outline: none;
  width: 100%;
  transition: border-color 0.2s;
}
.kv-input:focus {
  border-color: #e89820;
}
.kv-input::placeholder {
  color: #3d5a73;
}

.kv-remove {
  background: transparent;
  border: none;
  color: #3d5a73;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  justify-self: center;
}
.kv-remove:hover {
  color: #e05c5c;
}

.kv-add-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: transparent;
  border: 1px dashed #0a3d6b;
  border-radius: 6px;
  color: #7a96b0;
  padding: 0.45rem 0.75rem;
  font-size: 0.82rem;
  cursor: pointer;
  margin-top: 0.35rem;
  transition:
    border-color 0.2s,
    color 0.2s;
  width: 100%;
}
.kv-add-btn:hover {
  border-color: #e89820;
  color: #e89820;
}

/* ---------- Auth Tab ---------- */
.auth-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.auth-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #3d5a73;
}
.auth-type-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.auth-type-btn {
  padding: 0.45rem 1rem;
  border-radius: 6px;
  border: 1px solid #0a3d6b;
  background: #001122;
  color: #7a96b0;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s;
}
.auth-type-btn.active {
  background: rgba(232, 152, 32, 0.12);
  border-color: #e89820;
  color: #e89820;
}

.auth-fields {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.form-field label {
  font-size: 0.78rem;
  color: #7a96b0;
  font-weight: 500;
}
.pg-input {
  background: #001122;
  border: 1px solid #0a3d6b;
  border-radius: 6px;
  padding: 0.55rem 0.75rem;
  color: #d0dbe8;
  font-size: 0.85rem;
  font-family: "Fira Code", monospace;
  outline: none;
  transition: border-color 0.2s;
  width: 100%;
  box-sizing: border-box;
}
.pg-input:focus {
  border-color: #e89820;
}
.pg-input::placeholder {
  color: #3d5a73;
}

.auth-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 0.5rem;
  text-align: center;
  color: #3d5a73;
}
.auth-empty-icon {
  font-size: 2rem;
}
.auth-empty p {
  margin: 0;
  font-size: 0.85rem;
  color: #7a96b0;
}

.auth-credentials-notice {
  margin: 0.5rem 0 0;
  font-size: 0.78rem;
  color: #7a96b0;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

/* ---------- Body Tab ---------- */
.body-tab {
  display: flex;
  flex-direction: column;
  padding: 0 !important;
}
.body-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border-bottom: 1px solid #0a3d6b;
  background: #001e3c;
}
.body-label {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #3d5a73;
  flex: 1;
}
.body-format-btn,
.body-clear-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: transparent;
  border: 1px solid #0a3d6b;
  border-radius: 5px;
  padding: 0.25rem 0.6rem;
  color: #7a96b0;
  font-size: 0.75rem;
  cursor: pointer;
  transition:
    border-color 0.2s,
    color 0.2s;
}
.body-format-btn:hover {
  border-color: #e89820;
  color: #e89820;
}
.body-clear-btn:hover {
  border-color: #e05c5c;
  color: #e05c5c;
}

.body-textarea {
  flex: 1;
  background: #001122;
  border: none;
  color: #d0dbe8;
  font-family: "Fira Code", "JetBrains Mono", monospace;
  font-size: 0.85rem;
  line-height: 1.6;
  padding: 1rem;
  resize: none;
  outline: none;
  min-height: 300px;
  width: 100%;
  box-sizing: border-box;
}
.body-textarea::placeholder {
  color: #3d5a73;
}

/* ---------- Response Pane ---------- */
.response-pane {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #001122;
}

.response-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.response-empty-inner {
  text-align: center;
  color: #3d5a73;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}
.empty-icon {
  font-size: 3rem;
  color: #0a3d6b;
}
.response-empty-inner p {
  font-size: 1rem;
  font-weight: 600;
  color: #7a96b0;
  margin: 0;
}
.response-empty-inner span {
  font-size: 0.8rem;
}

.response-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.response-meta-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.6rem 1rem;
  border-bottom: 1px solid #0a3d6b;
  background: #001e3c;
  flex-shrink: 0;
}

.status-badge {
  padding: 0.25rem 0.6rem;
  border-radius: 5px;
  font-size: 0.82rem;
  font-weight: 700;
  font-family: "Fira Code", monospace;
}
.status-badge.success {
  background: rgba(26, 124, 69, 0.15);
  color: #3dd68c;
  border: 1px solid rgba(26, 124, 69, 0.4);
}
.status-badge.error {
  background: rgba(224, 92, 92, 0.12);
  color: #e05c5c;
  border: 1px solid rgba(224, 92, 92, 0.3);
}

.response-time {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: #7a96b0;
  font-size: 0.78rem;
}

.response-error {
  margin: 1rem;
  padding: 1rem;
  background: rgba(224, 92, 92, 0.1);
  border: 1px solid rgba(224, 92, 92, 0.3);
  border-radius: 8px;
  color: #e05c5c;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* ---------- Modal ---------- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}
.modal-content {
  background: #001e3c;
  border: 1px solid #0a3d6b;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
  color: #d0dbe8;
}
.modal-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #0a3d6b;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #d0dbe8;
}
.modal-header button {
  background: transparent;
  border: none;
  color: #7a96b0;
  cursor: pointer;
  font-size: 1.2rem;
}
.modal-body {
  padding: 1.25rem;
}
.modal-body label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  color: #7a96b0;
}
.modal-footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid #0a3d6b;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
.modal-cancel {
  background: transparent;
  border: 1px solid #0a3d6b;
  color: #d0dbe8;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: border-color 0.2s;
}
.modal-cancel:hover {
  border-color: #7a96b0;
}
.modal-save {
  background: #e89820;
  border: none;
  color: #001e3c;
  padding: 0.5rem 1.25rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: background 0.2s;
}
.modal-save:hover:not(:disabled) {
  background: #f0ab40;
}
.modal-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ---------- JSON Viewer ---------- */
.json-viewer {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.json-toolbar {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background: #001e3c;
  border-bottom: 1px solid #0a3d6b;
  flex-shrink: 0;
}
.json-toolbar-label {
  flex: 1;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #3d5a73;
}
.json-copy-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: transparent;
  border: 1px solid #0a3d6b;
  border-radius: 5px;
  padding: 0.25rem 0.6rem;
  color: #7a96b0;
  font-size: 0.75rem;
  cursor: pointer;
  transition:
    border-color 0.2s,
    color 0.2s;
}
.json-copy-btn:hover {
  border-color: #e89820;
  color: #e89820;
}

.json-pre {
  flex: 1;
  overflow: auto;
  padding: 1rem;
  margin: 0;
  font-family: "Fira Code", "JetBrains Mono", monospace;
  font-size: 0.82rem;
  line-height: 1.7;
  white-space: pre;
  color: #d0dbe8;
  background: #001122;
}

/* JSON syntax colors — navy-dark theme */
:deep(.json-key) {
  color: #7eb8f7;
}
:deep(.json-string) {
  color: #a8d4ff;
}
:deep(.json-number) {
  color: #e89820;
}
:deep(.json-boolean) {
  color: #ff8c69;
}
:deep(.json-null) {
  color: #7a96b0;
}

/* ---------- Spin Animation ---------- */
.spin {
  animation: spin 1s linear infinite;
  display: inline-block;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* ---------- Scrollbars ---------- */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #0a3d6b;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #3d5a73;
}

/* ---------- Phase 21 dark-mode overrides (THEME-12) ----------
 *
 * D-15 INVESTIGATION OUTCOME (executor-confirmed): no third-party syntax
 * highlighter is imported (no Prism / Highlight.js / Shiki / hljs / Monaco /
 * CodeMirror); the highlightedJson computed is a CUSTOM inline regex →
 * <span class="json-*"> wrapper sanitized with DOMPurify.
 *
 * AUDIT OUTCOME: ApiPlaygroundApp.vue is INTENTIONALLY dark-by-design in
 * both themes — the entire chrome uses the navy + amber Postman-style
 * palette (#001122 / #001e3c / #002a52 / #0a3d6b / #e89820), matching the
 * .json-pre viewer which the plan also exempts ("intentionally dark in
 * both themes"). The file contains:
 *   - 0 light-mode chrome surfaces (no #fff / #ffffff / #fafafa / etc.
 *     used as backgrounds)
 *   - 0 light Tailwind utilities (bg-white / text-gray-* / border-gray-*)
 *   - 0 third-party highlighter imports
 * The only "white" hex literals are rgba(255,255,255,0.05–0.08)
 * semi-transparent button-hover ADDITIVE highlights on dark surfaces —
 * those are correct in both themes.
 *
 * The overrides below are audit-driven contrast/legibility improvements
 * under explicit dark mode (NOT a light-mode pairing, which has no
 * surface to apply to). They sharpen the existing palette when the user
 * has explicitly opted into dark mode via the NavBar toggle.
 */

.my-app-dark .api-playground {
  /* Confirm the navy baseline under explicit dark mode and pin it to the
     Phase 20 mix target so any global dark-aware blending stays consistent
     with the rest of the site shell. */
  background: #001122;
  color: #d0dbe8;
}

.my-app-dark .body-label,
.my-app-dark .kv-head,
.my-app-dark .auth-label,
.my-app-dark .json-toolbar-label {
  /* Section label muted text — bump from #3d5a73 (1.7:1 on #001e3c) to
     a slightly brighter slate for better label legibility on dark headers. */
  color: #5a7a9b;
}

.my-app-dark .response-empty-inner,
.my-app-dark .auth-empty {
  /* Empty-state callouts — same brightness bump so the prompts read
     clearly against the deeper #001122 background. */
  color: #5a7a9b;
}

.my-app-dark .url-input::placeholder,
.my-app-dark .pg-input::placeholder,
.my-app-dark .kv-input::placeholder,
.my-app-dark .body-textarea::placeholder {
  /* Input placeholders — bump from #3d5a73 so empty inputs still hint
     their expected content without disappearing into the dark surface. */
  color: #5a7a9b;
}

.my-app-dark ::-webkit-scrollbar-thumb {
  /* Slightly more visible scrollbar under explicit dark mode. */
  background: #0f4a80;
}
.my-app-dark ::-webkit-scrollbar-thumb:hover {
  background: #5a7a9b;
}
</style>
