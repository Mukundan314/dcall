export interface Config {
  stunServers: string[];
  turnServers: RTCIceServer[];
  relayUrls: string[];
  heartbeatIntervalMs: number;
  heartbeatTimeoutMs: number;
}

export const defaultConfig: Config = {
  stunServers: [
    "stun:stun.l.google.com:19302",
    "stun:stun1.l.google.com:19302",
    "stun:stun.cloudflare.com:3478",
  ],
  turnServers: [],
  relayUrls: [
    "wss://relay.damus.io",
    "wss://nos.lol",
    "wss://relay.nostr.place",
  ],
  heartbeatIntervalMs: 10_000,
  heartbeatTimeoutMs: 30_000,
};

export function buildRtcConfig(config: Config): RTCConfiguration {
  return {
    iceServers: [
      ...config.stunServers.map((url) => ({ urls: url })),
      ...config.turnServers,
    ],
  };
}
