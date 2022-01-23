<script lang="ts">
import { defineComponent } from "vue";
import getIPFS from "@/getIPFS";

const encoder = new TextEncoder();

export default defineComponent({
  name: "Room",
  props: {
    id: String,
  },
  data() {
    return {
      localStream: new MediaStream(),
      connections: new Map<string, RTCPeerConnection>(),
      unsubscribe: () => {
        /* noop */
      },
    };
  },
  computed: {
    topic() {
      return `dcall-${this.id}`;
    },
  },
  watch: {
    topic: {
      immediate: true,
      handler(val: string) {
        this.unsubscribe();

        const promise = getIPFS().then(async (ipfs) => {
          await ipfs.pubsub.subscribe(val, this.handlePubsubMessage);
          const interval = setInterval(async () => {
            const peers = await ipfs.pubsub.peers(val);
            peers.filter(this.notConnected).map(this.connect);
          }, 5000);

          return () => {
            clearInterval(interval);
            return ipfs.pubsub.unsubscribe(val, this.handlePubsubMessage);
          };
        });

        this.unsubscribe = () => promise.then((unsubscribe) => unsubscribe());
      },
    },
  },
  mounted() {
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })
      .then((stream) => {
        stream.getTracks().forEach((track) => this.localStream.addTrack(track));
      })
      .catch(console.error);
  },
  unmounted() {
    this.unsubscribe();
  },
  methods: {
    handlePubsubMessage() {
      // TODO: handle message from pubsub
    },
    notConnected(peer: string) {
      return this.connections.get(peer)?.connectionState !== "connected";
    },
    connect(target: string) {
      const peerConnection = new RTCPeerConnection();

      this.connections.get(target)?.close();
      this.connections.set(target, peerConnection);

      peerConnection.addEventListener("negotiationneeded", async () => {
        const ipfs = await getIPFS();
        await peerConnection.setLocalDescription();
        await ipfs.pubsub.publish(
          this.topic,
          encoder.encode(
            JSON.stringify({
              target,
              description: peerConnection.localDescription,
            })
          )
        );
      });

      peerConnection.addEventListener("icecandidate", async ({ candidate }) => {
        const ipfs = await getIPFS();
        await ipfs.pubsub.publish(
          this.topic,
          encoder.encode(JSON.stringify({ target, candidate }))
        );
      });

      peerConnection.addEventListener("connectionstatechange", () => {
        if (
          ["disconnected", "failed", "closed"].includes(
            peerConnection.connectionState
          )
        ) {
          // TODO: handle disconnect
        }
      });

      this.localStream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track));

      // TODO: add track if it was added to localStream
      // TODO: remove track if it was removed from localStream
    },
  },
});
</script>

<template #default>
  <div class="room">
    <p>room id: {{ id }}</p>
    <video :srcObject="localStream" muted autoplay></video>
  </div>
</template>
