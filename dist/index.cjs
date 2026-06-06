'use strict';

var Echo = require('laravel-echo');
var Pusher = require('pusher-js');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var Echo__default = /*#__PURE__*/_interopDefault(Echo);
var Pusher__default = /*#__PURE__*/_interopDefault(Pusher);

// src/core/connect.ts

// src/core/auth.ts
async function createBearerHeaders(tokenProvider) {
  return bearerHeader(normalizeToken(await tokenProvider?.()));
}
function createSyncBearerHeaders(tokenProvider) {
  return bearerHeader(normalizeToken(tokenProvider?.()));
}
function bearerHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
function normalizeToken(token) {
  const value = token?.trim();
  return value ? value : null;
}

// src/core/reverb.ts
function createReverbEchoConfig(options) {
  const key = options.key.trim();
  if (!key) {
    throw new Error("Reverb app key is required.");
  }
  const forceTLS = options.scheme === "https";
  const port = options.port ?? (forceTLS ? 443 : 8080);
  const authHeaders = {
    ...createSyncBearerHeaders(options.tokenProvider),
    ...options.auth?.headers ?? {}
  };
  return {
    broadcaster: "reverb",
    key,
    wsHost: options.host ?? windowSafeHost(),
    wsPort: port,
    wssPort: port,
    forceTLS,
    enabledTransports: options.enabledTransports ?? (forceTLS ? ["wss"] : ["ws", "wss"]),
    authEndpoint: options.authEndpoint ?? "/broadcasting/auth",
    auth: Object.keys(authHeaders).length > 0 ? { headers: authHeaders } : options.auth
  };
}
function windowSafeHost() {
  if (typeof window !== "undefined" && window.location.hostname) {
    return window.location.hostname;
  }
  return "127.0.0.1";
}

// src/core/channel.ts
var defaultChannelConfig = {
  userEchoPrefix: "user",
  userWirePrefix: "private-user"
};
function userChannel(id, config = {}) {
  return buildChannel(config.userEchoPrefix ?? defaultChannelConfig.userEchoPrefix, id);
}
function privateUserChannel(id, config = {}) {
  return buildChannel(config.userWirePrefix ?? defaultChannelConfig.userWirePrefix, id);
}
function scopedChannel(scope, id) {
  const cleanScope = scope.trim();
  if (!cleanScope) {
    throw new Error("Channel scope is required.");
  }
  return buildChannel(cleanScope, id);
}
function privateScopedChannel(scope, id) {
  return `private-${scopedChannel(scope, id)}`;
}
function buildChannel(prefix, id) {
  const value = String(id).trim();
  if (!value) {
    throw new Error("Channel id is required.");
  }
  return `${prefix}.${value}`;
}

// src/modules/notifications/api.ts
function createNotificationsApi(options = {}) {
  const baseUrl = trimTrailingSlash(options.baseUrl ?? "/pixel-realtime");
  return {
    async list(listOptions = {}) {
      const search = new URLSearchParams();
      if (listOptions.limit !== void 0) {
        search.set("limit", String(listOptions.limit));
      }
      const query = search.toString();
      return request(`${baseUrl}/notifications${query ? `?${query}` : ""}`, options);
    },
    async unreadCount() {
      const response = await request(`${baseUrl}/notifications/unread-count`, options);
      return response.count;
    },
    async markAsRead(id) {
      const response = await request(
        `${baseUrl}/notifications/${encodeURIComponent(id)}/read`,
        options,
        { method: "POST" }
      );
      return response.updated;
    },
    async markAllAsRead() {
      const response = await request(
        `${baseUrl}/notifications/read-all`,
        options,
        { method: "POST" }
      );
      return response.updated;
    }
  };
}
async function request(url, options, init = {}) {
  const fetcher = options.fetch ?? globalThis.fetch;
  if (!fetcher) {
    throw new Error("Fetch is not available in this environment.");
  }
  const response = await fetcher(url, {
    ...init,
    headers: await resolveHeaders(options.headers, init.headers, options.tokenProvider)
  });
  if (!response.ok) {
    throw new Error(`Pixel Realtime request failed with status ${response.status}.`);
  }
  const json = await response.json();
  return json.data;
}
async function resolveHeaders(headers, requestHeaders, tokenProvider) {
  const baseHeaders = typeof headers === "function" ? await headers() : headers;
  return {
    Accept: "application/json",
    ...await createBearerHeaders(tokenProvider),
    ...baseHeaders ?? {},
    ...requestHeaders ?? {}
  };
}
function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

// src/core/wire.ts
function toWireEvent(event) {
  const value = event.trim();
  if (!value) {
    throw new Error("Event name is required.");
  }
  return value.startsWith(".") ? value : `.${value}`;
}

// src/modules/notifications/listener.ts
function listenForNotifications(options) {
  const channel = options.guard ? scopedChannel(options.guard, options.userId) : userChannel(options.userId, options.channels);
  const wireChannel = options.guard ? privateScopedChannel(options.guard, options.userId) : privateUserChannel(options.userId, options.channels);
  const event = toWireEvent(options.event ?? "pixel.realtime.notification");
  const echoChannel = options.echo.private(channel);
  const callback = (payload) => {
    options.onNotification(extractNotification(payload));
  };
  echoChannel.listen(event, callback);
  return {
    channel,
    wireChannel,
    stop() {
      echoChannel.stopListening?.(event, callback);
      options.echo.leave?.(channel);
      options.echo.leaveChannel?.(wireChannel);
    }
  };
}
function extractNotification(payload) {
  if (isNotificationPayload(payload)) {
    return payload.notification;
  }
  return payload;
}
function isNotificationPayload(payload) {
  return typeof payload === "object" && payload !== null && "notification" in payload;
}

// src/modules/custom-channels/listener.ts
function buildCustomChannelName(type, id, prefix) {
  const cleanType = type.trim();
  const cleanId = String(id).trim();
  if (!cleanType) {
    throw new Error("Channel type is required.");
  }
  if (!cleanId) {
    throw new Error("Channel id is required.");
  }
  const cleanPrefix = prefix?.trim().replace(/^\.+|\.+$/g, "") ?? "";
  const base = `${cleanType}.${cleanId}`;
  return cleanPrefix ? `${cleanPrefix}.${base}` : base;
}
function buildPrivateWireName(channel) {
  const value = channel.trim();
  if (!value) {
    throw new Error("Channel name is required.");
  }
  return `private-${value}`;
}
function openCustomChannel(options) {
  const channel = buildCustomChannelName(options.type, options.id, options.prefix);
  const wireChannel = buildPrivateWireName(channel);
  const echoChannel = options.echo.private(channel);
  const subscriptions = [];
  return {
    channel,
    wireChannel,
    listen(event, handler) {
      const wireEvent = toWireEvent(event);
      const callback = (payload) => {
        const envelope = isEnvelope(payload) ? payload : void 0;
        const data = envelope ? envelope.payload : payload;
        handler(data, envelope);
      };
      echoChannel.listen(wireEvent, callback);
      const stop = () => {
        echoChannel.stopListening?.(wireEvent, callback);
      };
      subscriptions.push(stop);
      return {
        channel,
        wireChannel,
        stop
      };
    },
    stop() {
      while (subscriptions.length > 0) {
        const stop = subscriptions.pop();
        stop?.();
      }
      options.echo.leave?.(channel);
      options.echo.leaveChannel?.(wireChannel);
    }
  };
}
function listenForCustomChannel(echo, type, id, event, handler, prefix) {
  return openCustomChannel({ echo, type, id, prefix }).listen(event, handler);
}
function isEnvelope(payload) {
  return typeof payload === "object" && payload !== null && "channel" in payload && "event" in payload && "payload" in payload;
}

// src/modules/presence/listener.ts
function buildPresenceChannelName(type, id, prefix) {
  const cleanType = type.trim();
  const cleanId = String(id).trim();
  if (!cleanType) {
    throw new Error("Channel type is required.");
  }
  if (!cleanId) {
    throw new Error("Channel id is required.");
  }
  const cleanPrefix = prefix?.trim().replace(/^\.+|\.+$/g, "") ?? "";
  const base = `${cleanType}.${cleanId}`;
  return cleanPrefix ? `${cleanPrefix}.${base}` : base;
}
function buildPresenceWireName(channel) {
  const value = channel.trim();
  if (!value) {
    throw new Error("Channel name is required.");
  }
  return `presence-${value}`;
}
function openPresenceChannel(options) {
  const channel = buildPresenceChannelName(options.type, options.id, options.prefix);
  const wireChannel = buildPresenceWireName(channel);
  if (typeof options.echo.join !== "function") {
    throw new Error(
      "The provided Echo instance does not support presence channels (missing join())."
    );
  }
  const echoChannel = options.echo.join(channel);
  const subscriptions = [];
  const handle = {
    channel,
    wireChannel,
    here(handler) {
      echoChannel.here(handler);
      return handle;
    },
    joining(handler) {
      echoChannel.joining(handler);
      return handle;
    },
    leaving(handler) {
      echoChannel.leaving(handler);
      return handle;
    },
    listen(event, handler) {
      const wireEvent = toWireEvent(event);
      const callback = (payload) => {
        const envelope = isEnvelope2(payload) ? payload : void 0;
        const data = envelope ? envelope.payload : payload;
        handler(data, envelope);
      };
      echoChannel.listen(wireEvent, callback);
      const stop = () => {
        echoChannel.stopListening?.(wireEvent, callback);
      };
      subscriptions.push(stop);
      return {
        channel,
        wireChannel,
        stop
      };
    },
    stop() {
      while (subscriptions.length > 0) {
        const stop = subscriptions.pop();
        stop?.();
      }
      options.echo.leave?.(channel);
      options.echo.leaveChannel?.(wireChannel);
    }
  };
  return handle;
}
function listenForPresenceChannel(echo, type, id, event, handler, prefix) {
  return openPresenceChannel({ echo, type, id, prefix }).listen(event, handler);
}
function isEnvelope2(payload) {
  return typeof payload === "object" && payload !== null && "channel" in payload && "event" in payload && "payload" in payload;
}

// src/core/client.ts
function createRealtimeClient(options) {
  const notificationsApi = createNotificationsApi(options.api ?? {});
  return {
    userChannel(userId) {
      return userChannel(resolveUserId(userId, options.userId), options.channels);
    },
    privateUserChannel(userId) {
      return privateUserChannel(resolveUserId(userId, options.userId), options.channels);
    },
    notifications: {
      api: notificationsApi,
      listen(handler, userId, guard) {
        const resolvedUserId = resolveUserId(userId, options.userId);
        return listenForNotifications({
          echo: options.echo,
          userId: resolvedUserId,
          channels: options.channels,
          event: options.notificationEvent,
          guard: guard ?? options.guard,
          onNotification: handler
        });
      }
    },
    channel(type, id) {
      return openCustomChannel({
        echo: options.echo,
        type,
        id,
        prefix: options.customChannelPrefix
      });
    },
    presence(type, id) {
      return openPresenceChannel({
        echo: options.echo,
        type,
        id,
        prefix: options.presenceChannelPrefix
      });
    }
  };
}
function resolveUserId(userId, fallback) {
  const value = userId ?? fallback;
  if (value === void 0 || String(value).trim() === "") {
    throw new Error("User id is required.");
  }
  return value;
}

// src/core/connect.ts
function createRealtime(options) {
  const {
    key,
    host,
    port,
    scheme,
    authEndpoint,
    auth,
    tokenProvider,
    enabledTransports,
    ...clientOptions
  } = options;
  if (typeof window !== "undefined") {
    window.Pusher = Pusher__default.default;
  }
  const echo = new Echo__default.default({
    ...createReverbEchoConfig({ key, host, port, scheme, authEndpoint, auth, tokenProvider, enabledTransports }),
    client: Pusher__default.default
  });
  return createRealtimeClient({ echo, ...clientOptions });
}

// src/modules/notifications/benchmark.ts
function createBenchmarkRecorder(options = {}) {
  const now = options.now ?? (() => Date.now());
  const expectedCount = options.expectedCount ?? null;
  let samples = [];
  const seenSequences = /* @__PURE__ */ new Map();
  return {
    record(notification) {
      const data = notification.data;
      if (!data) {
        return null;
      }
      const benchmarkId = typeof data.benchmark_id === "string" ? data.benchmark_id : null;
      const sequence = typeof data.sequence === "number" ? data.sequence : null;
      const sentAtMs = typeof data.sent_at_ms === "number" ? data.sent_at_ms : null;
      if (benchmarkId === null || sequence === null || sentAtMs === null) {
        return null;
      }
      const seen = seenSequences.get(benchmarkId) ?? /* @__PURE__ */ new Set();
      if (seen.has(sequence)) {
        return null;
      }
      seen.add(sequence);
      seenSequences.set(benchmarkId, seen);
      const receivedAtMs = now();
      const sample = {
        benchmark_id: benchmarkId,
        sequence,
        sent_at_ms: sentAtMs,
        received_at_ms: receivedAtMs,
        latency_ms: receivedAtMs - sentAtMs
      };
      samples.push(sample);
      return sample;
    },
    samples() {
      return [...samples];
    },
    summary() {
      const latencies = samples.map((sample) => sample.latency_ms);
      const sorted = [...latencies].sort((a, b) => a - b);
      const received = samples.length;
      const byBenchmark = {};
      for (const sample of samples) {
        byBenchmark[sample.benchmark_id] = (byBenchmark[sample.benchmark_id] ?? 0) + 1;
      }
      return {
        received,
        expectedCount,
        lost: expectedCount !== null ? Math.max(expectedCount - received, 0) : null,
        min: sorted[0] ?? 0,
        avg: received > 0 ? latencies.reduce((sum, value) => sum + value, 0) / received : 0,
        p50: percentile(sorted, 50),
        p95: percentile(sorted, 95),
        p99: percentile(sorted, 99),
        max: sorted[sorted.length - 1] ?? 0,
        byBenchmark
      };
    },
    reset() {
      samples = [];
      seenSequences.clear();
    }
  };
}
function percentile(sorted, p) {
  if (sorted.length === 0) {
    return 0;
  }
  const rank = p / 100 * (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  const lowerValue = sorted[lower] ?? 0;
  const upperValue = sorted[upper] ?? lowerValue;
  if (lower === upper) {
    return lowerValue;
  }
  const weight = rank - lower;
  return lowerValue * (1 - weight) + upperValue * weight;
}

exports.buildCustomChannelName = buildCustomChannelName;
exports.buildPresenceChannelName = buildPresenceChannelName;
exports.buildPresenceWireName = buildPresenceWireName;
exports.buildPrivateWireName = buildPrivateWireName;
exports.createBearerHeaders = createBearerHeaders;
exports.createBenchmarkRecorder = createBenchmarkRecorder;
exports.createNotificationsApi = createNotificationsApi;
exports.createRealtime = createRealtime;
exports.createRealtimeClient = createRealtimeClient;
exports.createReverbEchoConfig = createReverbEchoConfig;
exports.createSyncBearerHeaders = createSyncBearerHeaders;
exports.defaultChannelConfig = defaultChannelConfig;
exports.listenForCustomChannel = listenForCustomChannel;
exports.listenForNotifications = listenForNotifications;
exports.listenForPresenceChannel = listenForPresenceChannel;
exports.openCustomChannel = openCustomChannel;
exports.openPresenceChannel = openPresenceChannel;
exports.privateScopedChannel = privateScopedChannel;
exports.privateUserChannel = privateUserChannel;
exports.scopedChannel = scopedChannel;
exports.toWireEvent = toWireEvent;
exports.userChannel = userChannel;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map