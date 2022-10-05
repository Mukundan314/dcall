<script lang="ts">
import { defineComponent } from "vue";
import StreamContainer from "@/components/StreamContainer.vue";
import getIPFS from "@/getIPFS";
import "webrtc-adapter";

const PEER_POLL_INTERVAL = 1000;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export default defineComponent({
  name: "Room",

  components: {
    StreamContainer,
  },

  props: {
    name: String,
  },

  data() {
    return {
      connections: new Map<string, RTCPeerConnection>(),
      unsubscribe: () => Promise.resolve(),
      localStream: new MediaStream(),
      remoteStreams: {} as Record<string, MediaStream>,
    };
  },

  computed: {
    pubsubTopic() {
      return `dcall-${this.name}`;
    },
  },

  watch: {
    pubsubTopic: {
      immediate: true,
      handler(val: string) {
        const promise = this.unsubscribe().then(async () => {
          const ipfs = await getIPFS();

          const interval = setInterval(async () => {
            const peers = await ipfs.pubsub.peers(val);

            this.connections.forEach((connection, key) => {
              if (!peers.includes(key)) {
                connection.close();
                this.connections.delete(key);
                delete this.remoteStreams[key];
              }
            });

            peers.forEach((peer) => {
              const state = this.connections.get(peer)?.connectionState;
              if (
                state === "failed" ||
                state === "closed" ||
                state === undefined
              ) {
                this.connect(peer, true);
              }
            });
          }, PEER_POLL_INTERVAL);

          await ipfs.pubsub.subscribe(val, this.handlePubsubMessage);

          return async () => {
            clearInterval(interval);
            await ipfs.pubsub.unsubscribe(val, this.handlePubsubMessage);
          };
        });

        this.unsubscribe = () => promise.then((unsubscribe) => unsubscribe());
      },
    },
  },

  async beforeCreate() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    });

    stream.getTracks().forEach((track) => this.localStream.addTrack(track));
  },

  unmounted() {
    this.unsubscribe();
    this.connections.forEach((connection) => connection.close());
    this.localStream.getTracks().forEach((track) => track.stop());
  },

  methods: {
    async pubsubPublish(data: {
      target: string;
      description?: RTCSessionDescription | null;
      candidate?: RTCIceCandidate | null;
    }) {
      const ipfs = await getIPFS();
      ipfs.pubsub.publish(
        this.pubsubTopic,
        encoder.encode(JSON.stringify(data))
      );
    },

    async handlePubsubMessage({
      from,
      data,
    }: {
      from: string;
      data: Uint8Array;
    }) {
      const ipfs = await getIPFS();
      const { id } = await ipfs.id();
      const { target, description, candidate } = JSON.parse(
        decoder.decode(data)
      );

      if (id === target) {
        if (description && description.type === "offer") {
          let peerConnection = this.connections.get(from);
          if (
            peerConnection?.connectionState === "failed" ||
            peerConnection?.connectionState === "closed" ||
            peerConnection?.connectionState === undefined
          ) {
            peerConnection = this.connect(from, false);
          }

          const polite = from < id;
          if (!polite && peerConnection.signalingState !== "stable") {
            return;
          }

          await peerConnection.setRemoteDescription(description);
          await peerConnection.setLocalDescription();
          await this.pubsubPublish({
            target: from,
            description: peerConnection.localDescription,
          });
        } else if (description && description.type === "answer") {
          await this.connections.get(from)?.setRemoteDescription(description);
        } else if (candidate) {
          await this.connections.get(from)?.addIceCandidate(candidate);
        }
      }
    },

    connect(target: string, offerer: boolean) {
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      this.connections.get(target)?.close();
      this.connections.set(target, peerConnection);

      if (offerer) {
        peerConnection.addEventListener("negotiationneeded", async () => {
          await peerConnection.setLocalDescription();
          await this.pubsubPublish({
            target,
            description: peerConnection.localDescription,
          });
        });
      }

      peerConnection.addEventListener("icecandidate", async ({ candidate }) => {
        await this.pubsubPublish({ target, candidate });
      });

      peerConnection.addEventListener("track", ({ streams }) => {
        this.remoteStreams[target] = streams[0];
      });

      const senders = {} as Record<string, RTCRtpSender>;

      const addTrack = ({ track }: { track: MediaStreamTrack }) => {
        senders[track.id] = peerConnection.addTrack(track, this.localStream);
      };

      const removeTrack = ({ track }: { track: MediaStreamTrack }) => {
        peerConnection.removeTrack(senders[track.id]);
        delete senders[track.id];
      };

      peerConnection.addEventListener("connectionstatechange", () => {
        if (
          peerConnection.connectionState === "failed" ||
          peerConnection.connectionState === "closed"
        ) {
          this.localStream.removeEventListener("addtrack", addTrack);
          this.localStream.removeEventListener("removetrack", removeTrack);
        }
      });

      this.localStream.getTracks().forEach((track) => addTrack({ track }));
      this.localStream.addEventListener("addtrack", addTrack);
      this.localStream.addEventListener("removetrack", removeTrack);

      return peerConnection;
    },

    leaveRoom() {
      this.$router.push({ name: "Home" });
    },

    async toggleCamera() {
      const videoTracks = this.localStream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
    },

    async toggleMicrophone() {
      const audioTracks = this.localStream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
    },
  },
});
</script>

<template>
  <div class="room">
    <StreamContainer
      :localStream="localStream"
      :remoteStreams="remoteStreams"
    />
    <div class="controls">
      <button class="btn btn-1" @click="leaveRoom">Leave Room</button>
      <button class="btn btn-1" @click="toggleCamera">Toggle Camera</button>
      <button class="btn btn-1" @click="toggleMicrophone">Toggle Microphone</button>
    </div>
  </div>
</template>

<style scoped>
.room {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
