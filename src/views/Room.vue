<script lang="ts">
import { defineComponent } from "vue";
import getIPFS from "@/getIPFS";

export default defineComponent({
  name: "Room",
  data(): {
    unsubscribePromise: Promise<() => void>;
    localStream?: MediaStream;
  } {
    return {
      unsubscribePromise: Promise.resolve(() => undefined),
      localStream: undefined,
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
          return () => ipfs.pubsub.unsubscribe(topic, this.handlePubsubMessage);
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
  },
});
</script>

<template #default>
  <div class="room">
    <p>room id: {{ id }}</p>
    <video v-if="localStream" :srcObject="localStream" muted autoplay></video>
  </div>
</template>
