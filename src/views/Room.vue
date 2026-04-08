<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import StreamContainer from "@/components/StreamContainer.vue";
import type { PeerInfo } from "@/components/StreamContainer.vue";
import { Room } from "@/lib/room";
import MicOnIcon from "@/components/icons/MicOnIcon.vue";
import MicOffIcon from "@/components/icons/MicOffIcon.vue";
import CameraOnIcon from "@/components/icons/CameraOnIcon.vue";
import CameraOffIcon from "@/components/icons/CameraOffIcon.vue";
import HangUpIcon from "@/components/icons/HangUpIcon.vue";

const router = useRouter();

const props = defineProps<{
  name?: string;
}>();

const room = ref<Room | null>(null);
const localStream = ref(new MediaStream());
const peers = reactive<Record<string, PeerInfo>>({});
const cameraOn = ref(true);
const micOn = ref(true);

const localPeerId = computed(() => room.value?.peerId ?? "");

onMounted(async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    });
    stream.getTracks().forEach((track) => localStream.value.addTrack(track));
  } catch (e) {
    console.warn("Could not access camera/microphone:", e);
    cameraOn.value = false;
    micOn.value = false;
  }
  setupRoom(props.name!);
});

watch(
  () => props.name,
  (val) => {
    if (val) setupRoom(val);
  },
);

onUnmounted(() => {
  room.value?.leave();
  localStream.value.getTracks().forEach((track) => track.stop());
});

async function setupRoom(name: string) {
  room.value?.leave();

  for (const key of Object.keys(peers)) {
    delete peers[key];
  }

  const r = new Room(name);
  room.value = r;

  r.onPeersChanged = () => {
    const current = new Set(Object.keys(peers));
    const updated = new Set(Object.keys(r.peers));

    for (const id of current) {
      if (!updated.has(id)) {
        delete peers[id];
      }
    }
    for (const id of updated) {
      const p = r.peers[id];
      peers[id] = {
        stream: p.stream,
        status: p.status,
        error: p.error,
        micOn: p.micOn,
        cameraOn: p.cameraOn,
      };
    }
  };

  await r.join(localStream.value);
}

function leaveRoom() {
  router.push({ name: "Home" });
}

function toggleCamera() {
  localStream.value.getVideoTracks().forEach((track) => {
    track.enabled = !track.enabled;
  });
  cameraOn.value = !cameraOn.value;
  room.value?.sendMuteState(micOn.value, cameraOn.value);
}

function toggleMicrophone() {
  localStream.value.getAudioTracks().forEach((track) => {
    track.enabled = !track.enabled;
  });
  micOn.value = !micOn.value;
  room.value?.sendMuteState(micOn.value, cameraOn.value);
}
</script>

<template>
  <div class="room">
    <StreamContainer
      :localStream="localStream"
      :localPeerId="localPeerId"
      :peers="peers"
      :micOn="micOn"
      :cameraOn="cameraOn"
    />
    <div class="controls">
      <button
        class="ctrl-btn"
        :class="{ off: !micOn }"
        @click="toggleMicrophone"
        :title="micOn ? 'Mute' : 'Unmute'"
      >
        <MicOnIcon v-if="micOn" />
        <MicOffIcon v-else />
      </button>

      <button
        class="ctrl-btn"
        :class="{ off: !cameraOn }"
        @click="toggleCamera"
        :title="cameraOn ? 'Turn off camera' : 'Turn on camera'"
      >
        <CameraOnIcon v-if="cameraOn" />
        <CameraOffIcon v-else />
      </button>

      <button class="ctrl-btn leave" @click="leaveRoom" title="Leave call">
        <HangUpIcon />
      </button>
    </div>
  </div>
</template>

<style scoped>
.room {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 12px;
}

.ctrl-btn {
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: #eee;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  transition: background 0.15s;
}

.ctrl-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.ctrl-btn.off {
  background: rgba(234, 67, 53, 0.9);
  color: #fff;
}

.ctrl-btn.off:hover {
  background: rgba(234, 67, 53, 1);
}

.ctrl-btn.leave {
  background: #ea4335;
  color: #fff;
}

.ctrl-btn.leave:hover {
  background: #d93025;
}
</style>
