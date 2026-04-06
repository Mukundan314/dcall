<script lang="ts">
import { defineComponent, PropType } from "vue";
import PipIcon from "@/components/icons/PipIcon.vue";

export interface PeerInfo {
  stream: MediaStream | null;
  status: "connecting" | "connected";
}

export default defineComponent({
  name: "StreamContainer",

  components: {
    PipIcon,
  },

  props: {
    localStream: MediaStream,
    localPeerId: String,
    peers: Object as PropType<Record<string, PeerInfo>>,
  },

  data() {
    return {
      pipSupported: document.pictureInPictureEnabled ?? false,
    };
  },

  methods: {
    async pip(event: Event) {
      const tile = (event.target as HTMLElement).closest(".tile");
      const video = tile?.querySelector("video");
      if (!video) return;
      if (document.pictureInPictureElement === video) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    },
  },

  computed: {
    peerCount() {
      return this.peers ? Object.keys(this.peers).length : 0;
    },
    columns() {
      const total = this.peerCount + 1;
      if (total <= 1) return 1;
      if (total <= 4) return 2;
      if (total <= 9) return 3;
      return 4;
    },
    rows() {
      return Math.ceil((this.peerCount + 1) / this.columns);
    },
  },
});
</script>

<template>
  <div class="grid" :style="{ '--cols': columns, '--rows': rows }">
    <div class="cell">
      <div class="tile">
        <video class="video mirror" :srcObject="localStream" muted autoplay />
        <span class="label">{{ localPeerId }}</span>
        <button v-if="pipSupported" class="pip-btn" @click="pip" title="Picture in picture">
          <PipIcon />
        </button>
      </div>
    </div>
    <div v-for="(peer, key) in peers" :key="key" class="cell">
      <div class="tile">
        <video
          v-if="peer.stream"
          class="video"
          :srcObject="peer.stream"
          autoplay
        />
        <button v-if="peer.stream && pipSupported" class="pip-btn" @click="pip" title="Picture in picture">
          <PipIcon />
        </button>
        <div v-else class="status">
          <div class="status-connecting">
            <div class="spinner" />
            <span>Connecting</span>
          </div>
        </div>
        <span class="label">{{ key }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  grid-template-rows: repeat(var(--rows), 1fr);
  gap: 8px;
  padding: 12px;
}

.cell {
  container-type: size;
  display: grid;
  place-items: center;
  min-height: 0;
  min-width: 0;
}

.tile {
  position: relative;
  width: min(100cqw, calc(100cqh / 9 * 16));
  height: min(100cqh, calc(100cqw / 16 * 9));
  background: #1a1a1a;
  border-radius: 12px;
  overflow: hidden;
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

.pip-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  padding: 4px;
  border: none;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
}

.tile:hover .pip-btn {
  opacity: 1;
}

.pip-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

.status {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-connecting {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #888;
  font-size: 13px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: #888;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

</style>
