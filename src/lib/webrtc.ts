export interface PeerConnectionCallbacks {
  onIceCandidate(candidate: RTCIceCandidateInit): void;
  onStream(stream: MediaStream): void;
  onConnectionStateChange(state: RTCPeerConnectionState): void;
  onMessage(data: string): void;
  onDataChannelOpen(): void;
}

export class PeerConnection {
  readonly pc: RTCPeerConnection;
  private readonly callbacks: PeerConnectionCallbacks;
  private pendingCandidates: RTCIceCandidateInit[] = [];
  private dc: RTCDataChannel | null = null;

  constructor(config: RTCConfiguration, callbacks: PeerConnectionCallbacks) {
    this.callbacks = callbacks;
    this.pc = new RTCPeerConnection(config);

    this.pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        callbacks.onIceCandidate({
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
        });
      }
    };

    this.pc.ontrack = ({ streams }) => {
      if (streams[0]) {
        callbacks.onStream(streams[0]);
      }
    };

    this.pc.onconnectionstatechange = () => {
      callbacks.onConnectionStateChange(this.pc.connectionState);
    };

    this.pc.ondatachannel = ({ channel }) => {
      this.setupDataChannel(channel);
    };
  }

  async createOffer(): Promise<string> {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return this.pc.localDescription!.sdp;
  }

  async handleOffer(sdp: string): Promise<string> {
    await this.pc.setRemoteDescription({ type: "offer", sdp });
    this.flushCandidates();
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return this.pc.localDescription!.sdp;
  }

  async handleAnswer(sdp: string): Promise<void> {
    await this.pc.setRemoteDescription({ type: "answer", sdp });
    this.flushCandidates();
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (this.pc.remoteDescription) {
      await this.pc.addIceCandidate(candidate);
    } else {
      this.pendingCandidates.push(candidate);
    }
  }

  addStream(stream: MediaStream): void {
    for (const track of stream.getTracks()) {
      this.pc.addTrack(track, stream);
    }
  }

  removeStream(stream: MediaStream): void {
    for (const sender of this.pc.getSenders()) {
      if (sender.track && stream.getTracks().includes(sender.track)) {
        this.pc.removeTrack(sender);
      }
    }
  }

  createDataChannel(label: string): void {
    this.setupDataChannel(this.pc.createDataChannel(label));
  }

  send(data: string): void {
    if (this.dc?.readyState === "open") {
      this.dc.send(data);
    }
  }

  close(): void {
    this.pc.close();
  }

  private setupDataChannel(channel: RTCDataChannel): void {
    this.dc = channel;
    channel.onmessage = ({ data }) => {
      this.callbacks.onMessage(data);
    };
    channel.onopen = () => {
      this.callbacks.onDataChannelOpen();
    };
  }

  private flushCandidates(): void {
    for (const candidate of this.pendingCandidates) {
      this.pc.addIceCandidate(candidate);
    }
    this.pendingCandidates = [];
  }
}
