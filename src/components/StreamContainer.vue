<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, useTemplateRef } from "vue";
import PipIcon from "@/components/icons/PipIcon.vue";
import WarningIcon from "@/components/icons/WarningIcon.vue";
import MicOffIcon from "@/components/icons/MicOffIcon.vue";
import CameraOffIcon from "@/components/icons/CameraOffIcon.vue";

export interface PeerInfo {
  stream: MediaStream | null;
  status: "discovered" | "connecting" | "connected" | "failed";
  error: string;
  micOn: boolean;
  cameraOn: boolean;
}

const props = withDefaults(
  defineProps<{
    localStream?: MediaStream;
    localPeerId?: string;
    peers?: Record<string, PeerInfo>;
    micOn?: boolean;
    cameraOn?: boolean;
  }>(),
  {
    micOn: true,
    cameraOn: true,
  },
);

const gridEl = useTemplateRef("grid");
const pipSupported = ref(document.pictureInPictureEnabled ?? false);
const containerWidth = ref(0);
const containerHeight = ref(0);
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (entry) {
      containerWidth.value = entry.contentRect.width;
      containerHeight.value = entry.contentRect.height;
    }
  });
  resizeObserver.observe(gridEl.value!);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});

async function pip(event: Event) {
  const tile = (event.target as HTMLElement).closest(".tile");
  const video = tile?.querySelector("video");
  if (!video) return;
  if (document.pictureInPictureElement === video) {
    await document.exitPictureInPicture();
  } else {
    await video.requestPictureInPicture();
  }
}

const peerCount = computed(() => {
  return props.peers ? Object.keys(props.peers).length : 0;
});

const columns = computed(() => {
  const n = peerCount.value + 1;
  if (n <= 1) return 1;

  const W = containerWidth.value;
  const H = containerHeight.value;
  if (!W || !H) return Math.ceil(Math.sqrt(n));

  const GAP = 8;
  const ASPECT = 16 / 9;
  let bestCols = 1;
  let bestArea = 0;

  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const cellW = (W - (cols - 1) * GAP) / cols;
    const cellH = (H - (rows - 1) * GAP) / rows;
    const tileW = Math.min(cellW, cellH * ASPECT);
    const area = tileW * (tileW / ASPECT);
    if (area > bestArea) {
      bestArea = area;
      bestCols = cols;
    }
  }

  return bestCols;
});

const rows = computed(() => {
  return Math.ceil((peerCount.value + 1) / columns.value);
});
</script>

<template>
  <div ref="grid" class="grid" :style="{ '--cols': columns, '--rows': rows }">
    <div class="cell">
      <div class="tile">
        <video class="video mirror" :srcObject="localStream" muted autoplay />
        <span class="label">{{ localPeerId }}</span>
        <div v-if="!micOn || !cameraOn" class="mute-indicators">
          <span v-if="!micOn" class="mute-icon" title="Microphone off"
            ><MicOffIcon
          /></span>
          <span v-if="!cameraOn" class="mute-icon" title="Camera off"
            ><CameraOffIcon
          /></span>
        </div>
        <button
          v-if="pipSupported"
          class="pip-btn"
          @click="pip"
          title="Picture in picture"
        >
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
        <div v-if="!peer.micOn || !peer.cameraOn" class="mute-indicators">
          <span v-if="!peer.micOn" class="mute-icon" title="Microphone off"
            ><MicOffIcon
          /></span>
          <span v-if="!peer.cameraOn" class="mute-icon" title="Camera off"
            ><CameraOffIcon
          /></span>
        </div>
        <button
          v-if="peer.stream && pipSupported"
          class="pip-btn"
          @click="pip"
          title="Picture in picture"
        >
          <PipIcon />
        </button>
        <div v-else class="status">
          <div v-if="peer.status === 'discovered'" class="status-discovered">
            <span>Discovered</span>
          </div>
          <div
            v-else-if="peer.status === 'connecting'"
            class="status-connecting"
          >
            <div class="spinner" />
            <span>Connecting</span>
          </div>
          <div v-else-if="peer.status === 'failed'" class="status-failed">
            <WarningIcon class="warn-icon" />
            <span>{{ peer.error }}</span>
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

.mute-indicators {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  gap: 4px;
}

.mute-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 5px;
  border-radius: 6px;
  background: rgba(234, 67, 53, 0.85);
  color: #fff;
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

.status-discovered {
  color: #888;
  font-size: 13px;
}

.status-failed {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #ea4335;
  font-size: 13px;
  padding: 16px;
  text-align: center;
  line-height: 1.4;
}

.warn-icon {
  width: 28px;
  height: 28px;
}
</style>
