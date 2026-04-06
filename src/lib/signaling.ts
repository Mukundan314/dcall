import {
  generateSecretKey,
  getPublicKey,
  finalizeEvent,
  type EventTemplate,
} from "nostr-tools/pure";
import { SimplePool, type SubCloser } from "nostr-tools/pool";
import {
  deriveRoomTopic,
  deriveSelfTopic,
  deriveRoomKey,
  encrypt,
  decrypt,
} from "./crypto";

const EVENT_KIND = 20314;

export interface SignalingCallbacks {
  onHeartbeat(peerId: string): void;
  onLeave(peerId: string): void;
  onOffer(peerId: string, sdp: string): void;
  onAnswer(peerId: string, sdp: string): void;
  onCandidate(peerId: string, candidate: RTCIceCandidateInit): void;
}

export class RoomSignaling {
  readonly peerId: string;

  private readonly sk: Uint8Array;
  private readonly pool: SimplePool;
  private readonly relayUrls: string[];
  private readonly roomName: string;
  private readonly callbacks: SignalingCallbacks;

  private roomTopic: string | null = null;
  private selfTopic: string | null = null;
  private roomKey: CryptoKey | null = null;

  private roomSub: SubCloser | null = null;
  private selfSub: SubCloser | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    pool: SimplePool,
    relayUrls: string[],
    roomName: string,
    callbacks: SignalingCallbacks,
  ) {
    this.sk = generateSecretKey();
    this.peerId = getPublicKey(this.sk);
    this.pool = pool;
    this.relayUrls = relayUrls;
    this.roomName = roomName;
    this.callbacks = callbacks;
  }

  async start(heartbeatIntervalMs: number): Promise<void> {
    const [roomTopic, selfTopic, roomKey] = await Promise.all([
      deriveRoomTopic(this.roomName),
      deriveSelfTopic(this.roomName, this.peerId),
      deriveRoomKey(this.roomName),
    ]);
    this.roomTopic = roomTopic;
    this.selfTopic = selfTopic;
    this.roomKey = roomKey;

    const since = Math.floor(Date.now() / 1000);

    this.roomSub = this.pool.subscribeMany(
      this.relayUrls,
      { kinds: [EVENT_KIND], "#t": [roomTopic], since },
      {
        onevent: async (event) => {
          if (event.pubkey === this.peerId) return;
          try {
            const payload = JSON.parse(await decrypt(roomKey, event.content));
            if (payload.type === "heartbeat") {
              this.callbacks.onHeartbeat(event.pubkey);
            } else if (payload.type === "leave") {
              this.callbacks.onLeave(event.pubkey);
            }
          } catch {
            // ignore malformed events
          }
        },
      },
    );

    this.selfSub = this.pool.subscribeMany(
      this.relayUrls,
      { kinds: [EVENT_KIND], "#t": [selfTopic], since },
      {
        onevent: async (event) => {
          if (event.pubkey === this.peerId) return;
          try {
            const payload = JSON.parse(await decrypt(roomKey, event.content));
            if (payload.type === "offer") {
              this.callbacks.onOffer(event.pubkey, payload.sdp);
            } else if (payload.type === "answer") {
              this.callbacks.onAnswer(event.pubkey, payload.sdp);
            } else if (payload.type === "candidate") {
              this.callbacks.onCandidate(event.pubkey, payload.candidate);
            }
          } catch {
            // ignore malformed events
          }
        },
      },
    );

    await this.sendHeartbeat();
    this.heartbeatTimer = setInterval(
      () => this.sendHeartbeat(),
      heartbeatIntervalMs,
    );
  }

  async sendHeartbeat(): Promise<void> {
    await this.publishToRoom({ type: "heartbeat" });
  }

  async sendLeave(): Promise<void> {
    await this.publishToRoom({ type: "leave" });
  }

  async sendOffer(targetPeerId: string, sdp: string): Promise<void> {
    await this.publishToPeer(targetPeerId, { type: "offer", sdp });
  }

  async sendAnswer(targetPeerId: string, sdp: string): Promise<void> {
    await this.publishToPeer(targetPeerId, { type: "answer", sdp });
  }

  async sendCandidate(
    targetPeerId: string,
    candidate: RTCIceCandidateInit,
  ): Promise<void> {
    await this.publishToPeer(targetPeerId, { type: "candidate", candidate });
  }

  stop(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.roomSub?.close();
    this.selfSub?.close();
  }

  private async publishToRoom(payload: object): Promise<void> {
    const content = await encrypt(this.roomKey!, JSON.stringify(payload));
    const event = this.signEvent([["t", this.roomTopic!]], content);
    await Promise.allSettled(this.pool.publish(this.relayUrls, event));
  }

  private async publishToPeer(
    targetPeerId: string,
    payload: object,
  ): Promise<void> {
    const selfTopic = await deriveSelfTopic(this.roomName, targetPeerId);
    const content = await encrypt(this.roomKey!, JSON.stringify(payload));
    const event = this.signEvent([["t", selfTopic]], content);
    await Promise.allSettled(this.pool.publish(this.relayUrls, event));
  }

  private signEvent(tags: string[][], content: string) {
    const template: EventTemplate = {
      kind: EVENT_KIND,
      tags,
      content,
      created_at: Math.floor(Date.now() / 1000),
    };
    return finalizeEvent(template, this.sk);
  }
}
