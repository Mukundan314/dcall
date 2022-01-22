<script lang="ts">
import { defineComponent } from "vue";
import getIPFS from "@/getIPFS";

const encoder = new TextEncoder();

export default defineComponent({
  name: "Room",
  data(): {
    unsubscribePromise: Promise<() => void>;
    localStream?: MediaStream;
    connections: Record<string, RTCPeerConnection>;
  } {
    return {
      unsubscribePromise: Promise.resolve(() => undefined),
      localStream: undefined,
      connections: {},
    };
  },
  props: {
    id: String,
  },
  watch: {
    id: {
      immediate: true,
      handler(val: string) {
        this.unsubscribePromise.then((unsubscribe) => unsubscribe());
        this.unsubscribePromise = getIPFS().then(async (ipfs) => {
          const topic = `dcall-${val}`;

          await ipfs.pubsub.subscribe(topic, this.handlePubsubMessage);

          const interval = setInterval(async () => {
            const peers = await ipfs.pubsub.peers(topic);
            await Promise.all(
              peers.map(async (peer) => {
                if (this.notConnected(peer)) {
                  await this.sendOffer(topic, peer);
                }
              })
            );
          }, 5000);

          return async () => {
            clearInterval(interval);
            await ipfs.pubsub.unsubscribe(topic, this.handlePubsubMessage);
          };
        });
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
        this.localStream = stream;
      })
      .catch(console.error);
  },
  unmounted() {
    this.unsubscribePromise.then((unsubscribe) => unsubscribe());
  },
  methods: {
    handlePubsubMessage() {
      // TODO: handle message from pubsub
    },
    notConnected(peer: string) {
      return (
        this.connections[peer] === undefined ||
        this.connections[peer].connectionState !== "connected"
      );
    },
    async sendOffer(topic: string, target: string) {
      const ipfs = await getIPFS();
      this.connections[target] = new RTCPeerConnection();
      const offer = await this.connections[target].createOffer();
      await this.connections[target].setLocalDescription(offer);
      await ipfs.pubsub.publish(
        topic,
        encoder.encode(
          JSON.stringify({ type: offer.type, sdp: offer.sdp, target })
        )
      );
    },
  },
});
</script>

<template #default>
  <div class="room">
    <p>room id: {{ id }}</p>
    <video v-if="localStream" :srcObject="localStream" muted autoplay></video>
  </div>
</template>
