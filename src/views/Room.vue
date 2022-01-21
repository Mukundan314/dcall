<script lang="ts">
import { defineComponent } from "vue";
import getIPFS from "@/getIPFS";

export default defineComponent({
  name: "Room",
  data: (): { unsubscribePromise: Promise<() => void> } => ({
    unsubscribePromise: Promise.resolve(() => undefined),
  }),
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
  </div>
</template>
