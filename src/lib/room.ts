import { SimplePool } from "nostr-tools/pool";
import { type Config, defaultConfig, buildRtcConfig } from "./config";
import { RoomSignaling } from "./signaling";
import { PeerConnection } from "./webrtc";

export type PeerStatus = "discovered" | "connecting" | "connected" | "failed";

export interface PeerState {
  status: PeerStatus;
  stream: MediaStream | null;
  lastHeartbeat: number;
  error: string;
}

export class Room {
  peerId = "";
  readonly peers: Record<string, PeerState> = {};
  onPeersChanged: (() => void) | null = null;

  private readonly roomName: string;
  private readonly config: Config;
  private pool: SimplePool | null = null;
  private signaling: RoomSignaling | null = null;
  private connections: Record<string, PeerConnection> = {};
  private heartbeatCheckerTimer: ReturnType<typeof setInterval> | null = null;
  private localStream: MediaStream | null = null;

  constructor(roomName: string, config?: Partial<Config>) {
    this.roomName = roomName;
    this.config = { ...defaultConfig, ...config };
  }

  async join(localStream: MediaStream): Promise<void> {
    this.localStream = localStream;
    this.pool = new SimplePool();

    this.signaling = new RoomSignaling(
      this.pool,
      this.config.relayUrls,
      this.roomName,
      {
        onHeartbeat: (peerId) => this.handleHeartbeat(peerId),
        onLeave: (peerId) => this.removePeer(peerId),
        onOffer: (peerId, sdp) => this.handleOffer(peerId, sdp),
        onAnswer: (peerId, sdp) => this.handleAnswer(peerId, sdp),
        onCandidate: (peerId, candidate) =>
          this.handleCandidate(peerId, candidate),
      },
    );

    this.peerId = this.signaling.peerId;

    await this.signaling.start(this.config.heartbeatIntervalMs);

    this.heartbeatCheckerTimer = setInterval(
      () => this.checkHeartbeats(),
      5000,
    );
  }

  leave(): void {
    this.signaling?.sendLeave();
    this.signaling?.stop();

    for (const peerId of Object.keys(this.connections)) {
      this.connections[peerId].close();
      delete this.connections[peerId];
    }
    for (const peerId of Object.keys(this.peers)) {
      delete this.peers[peerId];
    }

    if (this.heartbeatCheckerTimer) clearInterval(this.heartbeatCheckerTimer);
    this.pool?.destroy();

    this.pool = null;
    this.signaling = null;
    this.localStream = null;
    this.onPeersChanged?.();
  }

  private handleHeartbeat(peerId: string): void {
    const existing = this.peers[peerId];

    if (existing) {
      existing.lastHeartbeat = Date.now();
      // If peer was failed, reset to discovered for a fresh WebRTC attempt
      if (existing.status === "failed") {
        this.destroyConnection(peerId);
        existing.status = "discovered";
        existing.stream = null;
        existing.error = "";
        this.initiateWebRTC(peerId);
      }
      this.onPeersChanged?.();
      return;
    }

    // New peer
    this.peers[peerId] = {
      status: "discovered",
      stream: null,
      lastHeartbeat: Date.now(),
      error: "",
    };
    this.onPeersChanged?.();

    // Send immediate heartbeat back so they discover us quickly
    this.signaling?.sendHeartbeat();

    this.initiateWebRTC(peerId);
  }

  private async handleOffer(peerId: string, sdp: string): Promise<void> {
    // Offer direction: smaller peerId initiates. Reject offers from larger peerIds.
    if (peerId > this.peerId) return;

    // Add peer if not yet tracked (offer arrived before heartbeat)
    if (!this.peers[peerId]) {
      this.peers[peerId] = {
        status: "connecting",
        stream: null,
        lastHeartbeat: Date.now(),
        error: "",
      };
      this.onPeersChanged?.();
    }

    this.destroyConnection(peerId);
    const pc = this.createPeerConnection(peerId);
    this.peers[peerId].status = "connecting";
    this.onPeersChanged?.();

    if (this.localStream) {
      pc.addStream(this.localStream);
    }

    const answerSdp = await pc.handleOffer(sdp);
    await this.signaling?.sendAnswer(peerId, answerSdp);
  }

  private async handleAnswer(peerId: string, sdp: string): Promise<void> {
    const pc = this.connections[peerId];
    if (!pc) return;
    await pc.handleAnswer(sdp);
  }

  private async handleCandidate(
    peerId: string,
    candidate: RTCIceCandidateInit,
  ): Promise<void> {
    const pc = this.connections[peerId];
    if (!pc) return;
    await pc.addIceCandidate(candidate);
  }

  private initiateWebRTC(peerId: string): void {
    // Only initiate if we're the smaller peerId
    if (this.peerId >= peerId) return;

    this.destroyConnection(peerId);
    const pc = this.createPeerConnection(peerId);

    if (this.peers[peerId]) {
      this.peers[peerId].status = "connecting";
      this.onPeersChanged?.();
    }

    if (this.localStream) {
      pc.addStream(this.localStream);
    }

    pc.createOffer().then((sdp) => {
      this.signaling?.sendOffer(peerId, sdp);
    });
  }

  private createPeerConnection(peerId: string): PeerConnection {
    const rtcConfig = buildRtcConfig(this.config);
    const pc = new PeerConnection(rtcConfig, {
      onIceCandidate: (candidate) => {
        this.signaling?.sendCandidate(peerId, candidate);
      },
      onStream: (stream) => {
        if (this.peers[peerId]) {
          this.peers[peerId].status = "connected";
          this.peers[peerId].stream = stream;
          this.onPeersChanged?.();
        }
      },
      onConnectionStateChange: (state) => {
        if (state === "disconnected" || state === "closed") {
          this.removePeer(peerId);
        } else if (state === "failed") {
          this.destroyConnection(peerId);
          if (this.peers[peerId]) {
            this.peers[peerId].status = "failed";
            this.peers[peerId].stream = null;
            this.peers[peerId].error =
              "Connection failed — a TURN server may be required";
            this.onPeersChanged?.();
          }
        }
      },
    });

    this.connections[peerId] = pc;
    return pc;
  }

  private destroyConnection(peerId: string): void {
    const pc = this.connections[peerId];
    if (pc) {
      pc.close();
      delete this.connections[peerId];
    }
  }

  private removePeer(peerId: string): void {
    this.destroyConnection(peerId);
    if (this.peers[peerId]) {
      delete this.peers[peerId];
      this.onPeersChanged?.();
    }
  }

  private checkHeartbeats(): void {
    const now = Date.now();
    for (const peerId of Object.keys(this.peers)) {
      const peer = this.peers[peerId];
      if (now - peer.lastHeartbeat > this.config.heartbeatTimeoutMs) {
        this.removePeer(peerId);
      }
    }
  }
}
