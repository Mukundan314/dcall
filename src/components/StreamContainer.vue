<script lang="ts">
import { defineComponent, PropType } from "vue";

export default defineComponent({
  name: "StreamContainer",

  props: {
    localStream: MediaStream,
    remoteStreams: Object as PropType<Record<string, MediaStream>>,
  },

  computed: {
    peerCount() {
      return this.remoteStreams ? Object.keys(this.remoteStreams).length : 0;
    },
    columns() {
      const total = this.peerCount + 1;
      if (total <= 1) return 1;
      if (total <= 4) return 2;
      if (total <= 9) return 3;
      return 4;
    },
  },
});
</script>

<template>
  <div class="grid" :style="{ '--cols': columns }">
    <div class="tile">
      <video class="video mirror" :srcObject="localStream" muted autoplay />
      <span class="label">You</span>
    </div>
    <div v-for="(stream, key) in remoteStreams" :key="key" class="tile">
      <video class="video" :srcObject="stream" autoplay />
    </div>
  </div>
</template>

<style scoped>
.grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  gap: 6px;
  padding: 6px;
  align-content: center;
  overflow: hidden;
}

.tile {
  position: relative;
  background: #1a1a1a;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 16 / 9;
}

.video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.mirror {
  transform: scaleX(-1);
}

.label {
  position: absolute;
  bottom: 8px;
  left: 10px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.7);
}
</style>
