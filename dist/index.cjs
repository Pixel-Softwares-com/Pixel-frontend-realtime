'use strict';

var Pusher = require('pusher-js');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var Pusher__default = /*#__PURE__*/_interopDefault(Pusher);

// node_modules/laravel-echo/dist/echo.js
var a = class {
  constructor() {
    this.notificationCreatedEvent = ".Illuminate\\Notifications\\Events\\BroadcastNotificationCreated";
  }
  /**
   * Listen for a whisper event on the channel instance.
   */
  listenForWhisper(e, t) {
    return this.listen(".client-" + e, t);
  }
  /**
   * Listen for an event on the channel instance.
   */
  notification(e) {
    return this.listen(this.notificationCreatedEvent, e);
  }
  /**
   * Stop listening for notification events on the channel instance.
   */
  stopListeningForNotification(e) {
    return this.stopListening(this.notificationCreatedEvent, e);
  }
  /**
   * Stop listening for a whisper event on the channel instance.
   */
  stopListeningForWhisper(e, t) {
    return this.stopListening(".client-" + e, t);
  }
};
var p = class {
  /**
   * Create a new class instance.
   */
  constructor(e) {
    this.namespace = e;
  }
  /**
   * Format the given event name.
   */
  format(e) {
    return [".", "\\"].includes(e.charAt(0)) ? e.substring(1) : (this.namespace && (e = this.namespace + "." + e), e.replace(/\./g, "\\"));
  }
  /**
   * Set the event namespace.
   */
  setNamespace(e) {
    this.namespace = e;
  }
};
function k(s) {
  try {
    return Reflect.construct(String, [], s), true;
  } catch {
    return false;
  }
}
var u = class extends a {
  /**
   * Create a new class instance.
   */
  constructor(e, t, n) {
    super(), this.name = t, this.pusher = e, this.options = n, this.eventFormatter = new p(this.options.namespace), this.subscribe();
  }
  /**
   * Subscribe to a Pusher channel.
   */
  subscribe() {
    this.subscription = this.pusher.subscribe(this.name);
  }
  /**
   * Unsubscribe from a Pusher channel.
   */
  unsubscribe() {
    this.pusher.unsubscribe(this.name);
  }
  /**
   * Listen for an event on the channel instance.
   */
  listen(e, t) {
    return this.on(this.eventFormatter.format(e), t), this;
  }
  /**
   * Listen for all events on the channel instance.
   */
  listenToAll(e) {
    return this.subscription.bind_global((t, n) => {
      if (t.startsWith("pusher:"))
        return;
      let i = String(this.options.namespace ?? "").replace(
        /\./g,
        "\\"
      ), h = t.startsWith(i) ? t.substring(i.length + 1) : "." + t;
      e(h, n);
    }), this;
  }
  /**
   * Stop listening for an event on the channel instance.
   */
  stopListening(e, t) {
    return t ? this.subscription.unbind(
      this.eventFormatter.format(e),
      t
    ) : this.subscription.unbind(this.eventFormatter.format(e)), this;
  }
  /**
   * Stop listening for all events on the channel instance.
   */
  stopListeningToAll(e) {
    return e ? this.subscription.unbind_global(e) : this.subscription.unbind_global(), this;
  }
  /**
   * Register a callback to be called anytime a subscription succeeds.
   */
  subscribed(e) {
    return this.on("pusher:subscription_succeeded", () => {
      e();
    }), this;
  }
  /**
   * Register a callback to be called anytime a subscription error occurs.
   */
  error(e) {
    return this.on("pusher:subscription_error", (t) => {
      e(t);
    }), this;
  }
  /**
   * Bind a channel to an event.
   */
  on(e, t) {
    return this.subscription.bind(e, t), this;
  }
};
var d = class extends u {
  /**
   * Send a whisper event to other clients in the channel.
   */
  whisper(e, t) {
    return this.pusher.channels.channels[this.name].trigger(
      `client-${e}`,
      t
    ), this;
  }
};
var g = class extends u {
  /**
   * Send a whisper event to other clients in the channel.
   */
  whisper(e, t) {
    return this.pusher.channels.channels[this.name].trigger(
      `client-${e}`,
      t
    ), this;
  }
};
var w = class extends d {
  /**
   * Register a callback to be called anytime the member list changes.
   */
  here(e) {
    return this.on("pusher:subscription_succeeded", (t) => {
      e(Object.keys(t.members).map((n) => t.members[n]));
    }), this;
  }
  /**
   * Listen for someone joining the channel.
   */
  joining(e) {
    return this.on("pusher:member_added", (t) => {
      e(t.info);
    }), this;
  }
  /**
   * Send a whisper event to other clients in the channel.
   */
  whisper(e, t) {
    return this.pusher.channels.channels[this.name].trigger(
      `client-${e}`,
      t
    ), this;
  }
  /**
   * Listen for someone leaving the channel.
   */
  leaving(e) {
    return this.on("pusher:member_removed", (t) => {
      e(t.info);
    }), this;
  }
};
var f = class extends a {
  /**
   * Create a new class instance.
   */
  constructor(e, t, n) {
    super(), this.events = {}, this.listeners = {}, this.name = t, this.socket = e, this.options = n, this.eventFormatter = new p(this.options.namespace), this.subscribe();
  }
  /**
   * Subscribe to a Socket.io channel.
   */
  subscribe() {
    this.socket.emit("subscribe", {
      channel: this.name,
      auth: this.options.auth || {}
    });
  }
  /**
   * Unsubscribe from channel and ubind event callbacks.
   */
  unsubscribe() {
    this.unbind(), this.socket.emit("unsubscribe", {
      channel: this.name,
      auth: this.options.auth || {}
    });
  }
  /**
   * Listen for an event on the channel instance.
   */
  listen(e, t) {
    return this.on(this.eventFormatter.format(e), t), this;
  }
  /**
   * Stop listening for an event on the channel instance.
   */
  stopListening(e, t) {
    return this.unbindEvent(this.eventFormatter.format(e), t), this;
  }
  /**
   * Register a callback to be called anytime a subscription succeeds.
   */
  subscribed(e) {
    return this.on("connect", (t) => {
      e(t);
    }), this;
  }
  /**
   * Register a callback to be called anytime an error occurs.
   */
  error(e) {
    return this;
  }
  /**
   * Bind the channel's socket to an event and store the callback.
   */
  on(e, t) {
    return this.listeners[e] = this.listeners[e] || [], this.events[e] || (this.events[e] = (n, i) => {
      this.name === n && this.listeners[e] && this.listeners[e].forEach((h) => h(i));
    }, this.socket.on(e, this.events[e])), this.listeners[e].push(t), this;
  }
  /**
   * Unbind the channel's socket from all stored event callbacks.
   */
  unbind() {
    Object.keys(this.events).forEach((e) => {
      this.unbindEvent(e);
    });
  }
  /**
   * Unbind the listeners for the given event.
   */
  unbindEvent(e, t) {
    this.listeners[e] = this.listeners[e] || [], t && (this.listeners[e] = this.listeners[e].filter(
      (n) => n !== t
    )), (!t || this.listeners[e].length === 0) && (this.events[e] && (this.socket.removeListener(e, this.events[e]), delete this.events[e]), delete this.listeners[e]);
  }
};
var b = class extends f {
  /**
   * Send a whisper event to other clients in the channel.
   */
  whisper(e, t) {
    return this.socket.emit("client event", {
      channel: this.name,
      event: `client-${e}`,
      data: t
    }), this;
  }
};
var C = class extends b {
  /**
   * Register a callback to be called anytime the member list changes.
   */
  here(e) {
    return this.on("presence:subscribed", (t) => {
      e(t.map((n) => n.user_info));
    }), this;
  }
  /**
   * Listen for someone joining the channel.
   */
  joining(e) {
    return this.on(
      "presence:joining",
      (t) => e(t.user_info)
    ), this;
  }
  /**
   * Send a whisper event to other clients in the channel.
   */
  whisper(e, t) {
    return this.socket.emit("client event", {
      channel: this.name,
      event: `client-${e}`,
      data: t
    }), this;
  }
  /**
   * Listen for someone leaving the channel.
   */
  leaving(e) {
    return this.on(
      "presence:leaving",
      (t) => e(t.user_info)
    ), this;
  }
};
var c = class extends a {
  /**
   * Subscribe to a channel.
   */
  subscribe() {
  }
  /**
   * Unsubscribe from a channel.
   */
  unsubscribe() {
  }
  /**
   * Listen for an event on the channel instance.
   */
  listen(e, t) {
    return this;
  }
  /**
   * Listen for all events on the channel instance.
   */
  listenToAll(e) {
    return this;
  }
  /**
   * Stop listening for an event on the channel instance.
   */
  stopListening(e, t) {
    return this;
  }
  /**
   * Register a callback to be called anytime a subscription succeeds.
   */
  subscribed(e) {
    return this;
  }
  /**
   * Register a callback to be called anytime an error occurs.
   */
  error(e) {
    return this;
  }
  /**
   * Bind a channel to an event.
   */
  on(e, t) {
    return this;
  }
};
var v = class extends c {
  /**
   * Send a whisper event to other clients in the channel.
   */
  whisper(e, t) {
    return this;
  }
};
var _ = class extends c {
  /**
   * Send a whisper event to other clients in the channel.
   */
  whisper(e, t) {
    return this;
  }
};
var y = class extends v {
  /**
   * Register a callback to be called anytime the member list changes.
   */
  here(e) {
    return this;
  }
  /**
   * Listen for someone joining the channel.
   */
  joining(e) {
    return this;
  }
  /**
   * Send a whisper event to other clients in the channel.
   */
  whisper(e, t) {
    return this;
  }
  /**
   * Listen for someone leaving the channel.
   */
  leaving(e) {
    return this;
  }
};
var _r = class _r {
  /**
   * Create a new class instance.
   */
  constructor(e) {
    this.setOptions(e), this.connect();
  }
  /**
   * Merge the custom options with the defaults.
   */
  setOptions(e) {
    this.options = {
      ..._r._defaultOptions,
      ...e,
      broadcaster: e.broadcaster
    };
    let t = this.csrfToken();
    t && (this.options.auth.headers["X-CSRF-TOKEN"] = t, this.options.userAuthentication.headers["X-CSRF-TOKEN"] = t), t = this.options.bearerToken, t && (this.options.auth.headers.Authorization = "Bearer " + t, this.options.userAuthentication.headers.Authorization = "Bearer " + t);
  }
  /**
   * Extract the CSRF token from the page.
   */
  csrfToken() {
    return typeof window < "u" && window.Laravel?.csrfToken ? window.Laravel.csrfToken : this.options.csrfToken ? this.options.csrfToken : typeof document < "u" && typeof document.querySelector == "function" ? document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") ?? null : null;
  }
};
_r._defaultOptions = {
  auth: {
    headers: {}
  },
  authEndpoint: "/broadcasting/auth",
  userAuthentication: {
    endpoint: "/broadcasting/user-auth",
    headers: {}
  },
  csrfToken: null,
  bearerToken: null,
  host: null,
  key: null,
  namespace: "App.Events"
};
var r = _r;
var o = class extends r {
  constructor() {
    super(...arguments), this.channels = {};
  }
  /**
   * Create a fresh Pusher connection.
   */
  connect() {
    if (typeof this.options.client < "u")
      this.pusher = this.options.client;
    else if (this.options.Pusher)
      this.pusher = new this.options.Pusher(
        this.options.key,
        this.options
      );
    else if (typeof window < "u" && typeof window.Pusher < "u")
      this.pusher = new window.Pusher(this.options.key, this.options);
    else
      throw new Error(
        "Pusher client not found. Should be globally available or passed via options.client"
      );
  }
  /**
   * Sign in the user via Pusher user authentication (https://pusher.com/docs/channels/using_channels/user-authentication/).
   */
  signin() {
    this.pusher.signin();
  }
  /**
   * Listen for an event on a channel instance.
   */
  listen(e, t, n) {
    return this.channel(e).listen(t, n);
  }
  /**
   * Get a channel instance by name.
   */
  channel(e) {
    return this.channels[e] || (this.channels[e] = new u(
      this.pusher,
      e,
      this.options
    )), this.channels[e];
  }
  /**
   * Get a private channel instance by name.
   */
  privateChannel(e) {
    return this.channels["private-" + e] || (this.channels["private-" + e] = new d(
      this.pusher,
      "private-" + e,
      this.options
    )), this.channels["private-" + e];
  }
  /**
   * Get a private encrypted channel instance by name.
   */
  encryptedPrivateChannel(e) {
    return this.channels["private-encrypted-" + e] || (this.channels["private-encrypted-" + e] = new g(
      this.pusher,
      "private-encrypted-" + e,
      this.options
    )), this.channels["private-encrypted-" + e];
  }
  /**
   * Get a presence channel instance by name.
   */
  presenceChannel(e) {
    return this.channels["presence-" + e] || (this.channels["presence-" + e] = new w(
      this.pusher,
      "presence-" + e,
      this.options
    )), this.channels["presence-" + e];
  }
  /**
   * Leave the given channel, as well as its private and presence variants.
   */
  leave(e) {
    [
      e,
      "private-" + e,
      "private-encrypted-" + e,
      "presence-" + e
    ].forEach((n) => {
      this.leaveChannel(n);
    });
  }
  /**
   * Leave the given channel.
   */
  leaveChannel(e) {
    this.channels[e] && (this.channels[e].unsubscribe(), delete this.channels[e]);
  }
  /**
   * Get the socket ID for the connection.
   */
  socketId() {
    return this.pusher.connection.socket_id;
  }
  /**
   * Get the current connection status.
   */
  connectionStatus() {
    const e = this.pusher.connection.state;
    switch (e) {
      case "connected":
      case "connecting":
        return e;
      case "failed":
      case "unavailable":
        return "failed";
      default:
        return "disconnected";
    }
  }
  /**
   * Subscribe to connection status changes.
   */
  onConnectionChange(e) {
    const t = () => {
      e(this.connectionStatus());
    }, n = ["state_change", "connected", "disconnected"];
    return n.forEach((i) => {
      this.pusher.connection.bind(i, t);
    }), () => {
      n.forEach((i) => {
        this.pusher.connection.unbind(i, t);
      });
    };
  }
  /**
   * Disconnect Pusher connection.
   */
  disconnect() {
    this.pusher.disconnect();
  }
};
var m = class extends r {
  constructor() {
    super(...arguments), this.channels = {};
  }
  /**
   * Create a fresh Socket.io connection.
   */
  connect() {
    let e = this.getSocketIO();
    this.socket = e(
      this.options.host ?? void 0,
      this.options
    ), this.socket.io.on("reconnect", () => {
      Object.values(this.channels).forEach((t) => {
        t.subscribe();
      });
    });
  }
  /**
   * Get socket.io module from global scope or options.
   */
  getSocketIO() {
    if (typeof this.options.client < "u")
      return this.options.client;
    if (typeof window < "u" && typeof window.io < "u")
      return window.io;
    throw new Error(
      "Socket.io client not found. Should be globally available or passed via options.client"
    );
  }
  /**
   * Listen for an event on a channel instance.
   */
  listen(e, t, n) {
    return this.channel(e).listen(t, n);
  }
  /**
   * Get a channel instance by name.
   */
  channel(e) {
    return this.channels[e] || (this.channels[e] = new f(
      this.socket,
      e,
      this.options
    )), this.channels[e];
  }
  /**
   * Get a private channel instance by name.
   */
  privateChannel(e) {
    return this.channels["private-" + e] || (this.channels["private-" + e] = new b(
      this.socket,
      "private-" + e,
      this.options
    )), this.channels["private-" + e];
  }
  /**
   * Get a presence channel instance by name.
   */
  presenceChannel(e) {
    return this.channels["presence-" + e] || (this.channels["presence-" + e] = new C(
      this.socket,
      "presence-" + e,
      this.options
    )), this.channels["presence-" + e];
  }
  /**
   * Leave the given channel, as well as its private and presence variants.
   */
  leave(e) {
    [e, "private-" + e, "presence-" + e].forEach((n) => {
      this.leaveChannel(n);
    });
  }
  /**
   * Leave the given channel.
   */
  leaveChannel(e) {
    this.channels[e] && (this.channels[e].unsubscribe(), delete this.channels[e]);
  }
  /**
   * Get the socket ID for the connection.
   */
  socketId() {
    return this.socket.id;
  }
  /**
   * Get the current connection status.
   */
  connectionStatus() {
    return this.socket.connected ? "connected" : this.socket.io._reconnecting ? "reconnecting" : this.socket.id !== void 0 ? "disconnected" : "connecting";
  }
  /**
   * Subscribe to connection status changes.
   */
  onConnectionChange(e) {
    const t = () => {
      e(this.connectionStatus());
    }, n = [
      "connect",
      "disconnect",
      "connect_error",
      "reconnect_attempt",
      "reconnect",
      "reconnect_error",
      "reconnect_failed"
    ];
    return n.forEach((i) => {
      this.socket.on(i, t);
    }), () => {
      n.forEach((i) => {
        this.socket.off(i, t);
      });
    };
  }
  /**
   * Disconnect Socketio connection.
   */
  disconnect() {
    this.socket.disconnect();
  }
};
var l = class extends r {
  constructor() {
    super(...arguments), this.channels = {};
  }
  /**
   * Create a fresh connection.
   */
  connect() {
  }
  /**
   * Listen for an event on a channel instance.
   */
  listen(e, t, n) {
    return new c();
  }
  /**
   * Get a channel instance by name.
   */
  channel(e) {
    return new c();
  }
  /**
   * Get a private channel instance by name.
   */
  privateChannel(e) {
    return new v();
  }
  /**
   * Get a private encrypted channel instance by name.
   */
  encryptedPrivateChannel(e) {
    return new _();
  }
  /**
   * Get a presence channel instance by name.
   */
  presenceChannel(e) {
    return new y();
  }
  /**
   * Leave the given channel, as well as its private and presence variants.
   */
  leave(e) {
  }
  /**
   * Leave the given channel.
   */
  leaveChannel(e) {
  }
  /**
   * Get the socket ID for the connection.
   */
  socketId() {
    return "fake-socket-id";
  }
  /**
   * Get the current connection status.
   */
  connectionStatus() {
    return "connected";
  }
  /**
   * Subscribe to connection status changes.
   */
  onConnectionChange(e) {
    return () => {
    };
  }
  /**
   * Disconnect the connection.
   */
  disconnect() {
  }
};
var S = class {
  /**
   * Create a new class instance.
   */
  constructor(e) {
    this.options = e, this.connect(), this.options.withoutInterceptors || this.registerInterceptors();
  }
  /**
   * Get a channel instance by name.
   */
  channel(e) {
    return this.connector.channel(e);
  }
  /**
   * Create a new connection.
   */
  connect() {
    if (this.options.broadcaster === "reverb")
      this.connector = new o({
        ...this.options,
        cluster: ""
      });
    else if (this.options.broadcaster === "pusher")
      this.connector = new o(this.options);
    else if (this.options.broadcaster === "ably")
      this.connector = new o({
        ...this.options,
        cluster: "",
        broadcaster: "pusher"
      });
    else if (this.options.broadcaster === "socket.io")
      this.connector = new m(this.options);
    else if (this.options.broadcaster === "null")
      this.connector = new l(this.options);
    else if (typeof this.options.broadcaster == "function" && k(this.options.broadcaster))
      this.connector = new this.options.broadcaster(this.options);
    else
      throw new Error(
        `Broadcaster ${typeof this.options.broadcaster} ${String(this.options.broadcaster)} is not supported.`
      );
  }
  /**
   * Disconnect from the Echo server.
   */
  disconnect() {
    this.connector.disconnect();
  }
  /**
   * Get a presence channel instance by name.
   */
  join(e) {
    return this.connector.presenceChannel(e);
  }
  /**
   * Leave the given channel, as well as its private and presence variants.
   */
  leave(e) {
    this.connector.leave(e);
  }
  /**
   * Leave the given channel.
   */
  leaveChannel(e) {
    this.connector.leaveChannel(e);
  }
  /**
   * Leave all channels.
   */
  leaveAllChannels() {
    for (const e in this.connector.channels)
      this.leaveChannel(e);
  }
  /**
   * Listen for an event on a channel instance.
   */
  listen(e, t, n) {
    return this.connector.listen(e, t, n);
  }
  /**
   * Get a private channel instance by name.
   */
  private(e) {
    return this.connector.privateChannel(e);
  }
  /**
   * Get a private encrypted channel instance by name.
   */
  encryptedPrivate(e) {
    if (this.connectorSupportsEncryptedPrivateChannels(this.connector))
      return this.connector.encryptedPrivateChannel(e);
    throw new Error(
      `Broadcaster ${typeof this.options.broadcaster} ${String(
        this.options.broadcaster
      )} does not support encrypted private channels.`
    );
  }
  connectorSupportsEncryptedPrivateChannels(e) {
    return e instanceof o || e instanceof l;
  }
  /**
   * Get the Socket ID for the connection.
   */
  socketId() {
    return this.connector.socketId();
  }
  /**
   * Get the current connection status.
   */
  connectionStatus() {
    return this.connector.connectionStatus();
  }
  /**
   * Register 3rd party request interceptors. These are used to automatically
   * send a connections socket id to a Laravel app with a X-Socket-Id header.
   */
  registerInterceptors() {
    typeof Vue < "u" && Vue?.http && this.registerVueRequestInterceptor(), typeof axios == "function" && this.registerAxiosRequestInterceptor(), typeof jQuery == "function" && this.registerjQueryAjaxSetup(), typeof Turbo == "object" && this.registerTurboRequestInterceptor();
  }
  /**
   * Register a Vue HTTP interceptor to add the X-Socket-ID header.
   */
  registerVueRequestInterceptor() {
    Vue.http.interceptors.push(
      (e, t) => {
        this.socketId() && e.headers.set("X-Socket-ID", this.socketId()), t();
      }
    );
  }
  /**
   * Register an Axios HTTP interceptor to add the X-Socket-ID header.
   */
  registerAxiosRequestInterceptor() {
    axios.interceptors.request.use(
      (e) => (this.socketId() && (e.headers["X-Socket-Id"] = this.socketId()), e)
    );
  }
  /**
   * Register jQuery AjaxPrefilter to add the X-Socket-ID header.
   */
  registerjQueryAjaxSetup() {
    typeof jQuery.ajax < "u" && jQuery.ajaxPrefilter(
      (e, t, n) => {
        this.socketId() && n.setRequestHeader("X-Socket-Id", this.socketId());
      }
    );
  }
  /**
   * Register the Turbo Request interceptor to add the X-Socket-ID header.
   */
  registerTurboRequestInterceptor() {
    document.addEventListener(
      "turbo:before-fetch-request",
      (e) => {
        e.detail.fetchOptions.headers["X-Socket-Id"] = this.socketId();
      }
    );
  }
};

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
  const callerHeaders = options.auth?.headers ?? {};
  const resolveAuthHeaders = () => ({
    ...createSyncBearerHeaders(options.tokenProvider),
    ...callerHeaders
  });
  const authHeaders = resolveAuthHeaders();
  return {
    broadcaster: "reverb",
    key,
    wsHost: options.host ?? windowSafeHost(),
    wsPort: port,
    wssPort: port,
    forceTLS,
    enabledTransports: options.enabledTransports ?? (forceTLS ? ["wss"] : ["ws", "wss"]),
    authEndpoint: options.authEndpoint ?? "/broadcasting/auth",
    auth: options.tokenProvider ? { headers: authHeaders, headersProvider: resolveAuthHeaders } : Object.keys(authHeaders).length > 0 ? { headers: authHeaders } : options.auth
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

// src/core/connection.ts
var NOOP = () => {
};
var mapState = (state) => {
  if (state === "connected") return "online";
  if (state === "failed" || state === "disconnected") return "offline";
  return "reconnecting";
};
var getPusher = (echo) => echo?.connector?.pusher;
function createConnectionClient(echo) {
  return {
    status() {
      const pusher = getPusher(echo);
      return pusher ? mapState(pusher.connection?.state) : "offline";
    },
    onChange(handler) {
      const pusher = getPusher(echo);
      if (!pusher?.connection?.bind) {
        handler(pusher ? mapState(pusher.connection?.state) : "offline");
        return NOOP;
      }
      const { connection } = pusher;
      const listener = () => handler(mapState(connection.state));
      connection.bind("state_change", listener);
      handler(mapState(connection.state));
      return () => connection.unbind("state_change", listener);
    },
    reconnect() {
      const pusher = getPusher(echo);
      if (!pusher) return;
      pusher.disconnect();
      pusher.connect();
    }
  };
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
    },
    connection: createConnectionClient(options.echo)
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
  const echo = new S({
    ...createReverbEchoConfig({ key, host, port, scheme, authEndpoint, auth, tokenProvider, enabledTransports }),
    Pusher: Pusher__default.default
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
      const sorted = [...latencies].sort((a2, b2) => a2 - b2);
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
function percentile(sorted, p2) {
  if (sorted.length === 0) {
    return 0;
  }
  const rank = p2 / 100 * (sorted.length - 1);
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
exports.createConnectionClient = createConnectionClient;
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