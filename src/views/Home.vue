<script lang="ts">
import { defineComponent } from "vue";
import MicOnIcon from "@/components/icons/MicOnIcon.vue";
import MicOffIcon from "@/components/icons/MicOffIcon.vue";
import CameraOnIcon from "@/components/icons/CameraOnIcon.vue";
import CameraOffIcon from "@/components/icons/CameraOffIcon.vue";

export default defineComponent({
  name: "Home",
  components: {
    MicOnIcon,
    MicOffIcon,
    CameraOnIcon,
    CameraOffIcon,
  },
  data() {
    return {
      roomName: "",
      previewStream: null as MediaStream | null,
      cameraOn: true,
      micOn: true,
    };
  },
  async mounted() {
    try {
      this.previewStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      });
    } catch {
      this.cameraOn = false;
      this.micOn = false;
    }
  },
  unmounted() {
    this.previewStream?.getTracks().forEach((track) => track.stop());
  },
  methods: {
    joinRoom() {
      if (this.roomName.trim()) {
        this.$router.push({ name: "Room", params: { name: this.roomName } });
      }
    },
    toggleCamera() {
      this.previewStream?.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      this.cameraOn = !this.cameraOn;
    },
    toggleMic() {
      this.previewStream?.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      this.micOn = !this.micOn;
    },
  },
});
</script>

<template>
  <div class="home">
    <div class="preview">
      <video
        v-if="previewStream && cameraOn"
        class="preview-video"
        :srcObject="previewStream"
        muted
        autoplay
      />
      <div v-else class="preview-off">Camera is off</div>
      <div class="preview-controls">
        <button
          class="ctrl-btn"
          :class="{ off: !micOn }"
          @click="toggleMic"
          :disabled="!previewStream"
        >
          <MicOnIcon v-if="micOn" />
          <MicOffIcon v-else />
        </button>
        <button
          class="ctrl-btn"
          :class="{ off: !cameraOn }"
          @click="toggleCamera"
          :disabled="!previewStream"
        >
          <CameraOnIcon v-if="cameraOn" />
          <CameraOffIcon v-else />
        </button>
      </div>
    </div>

    <form class="join-form" @submit.prevent="joinRoom">
      <input
        v-model="roomName"
        placeholder="Enter room name"
        class="room-input"
        autofocus
      />
      <button type="submit" class="join-btn" :disabled="!roomName.trim()">
        Join
      </button>
    </form>
  </div>
</template>

<style scoped>
.home {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 24px;
}

.preview {
  position: relative;
  width: 540px;
  aspect-ratio: 16 / 9;
  background: #1a1a1a;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.preview-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
  display: block;
}

.preview-off {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
  font-size: 0.875rem;
}

.preview-controls {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}

.ctrl-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  color: #eee;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 11px;
  transition: background 0.15s;
}

.ctrl-btn:hover {
  background: rgba(255, 255, 255, 0.22);
}

.ctrl-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.ctrl-btn.off {
  background: rgba(234, 67, 53, 0.9);
  color: #fff;
}

.ctrl-btn.off:hover:not(:disabled) {
  background: rgba(234, 67, 53, 1);
}

.join-form {
  display: flex;
  gap: 10px;
}

.room-input {
  padding: 10px 16px;
  font-size: 0.9375rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: #eee;
  outline: none;
  width: 280px;
  transition: border-color 0.15s;
}

.room-input::placeholder {
  color: #666;
}

.room-input:focus {
  border-color: rgba(255, 255, 255, 0.3);
}

.join-btn {
  padding: 10px 28px;
  font-size: 0.9375rem;
  border: none;
  border-radius: 10px;
  background: #fff;
  color: #111;
  cursor: pointer;
  font-weight: 600;
  transition: opacity 0.15s;
}

.join-btn:hover:not(:disabled) {
  opacity: 0.85;
}

.join-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

@media (max-width: 600px) {
  .preview {
    width: 100%;
  }
}
</style>
