<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "Home",
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
          <svg v-if="micOn" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm-1-9a1 1 0 1 1 2 0v6a1 1 0 1 1-2 0V5zm6 6a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V20H8v2h8v-2h-3v-2.07A7 7 0 0 0 19 11h-2z"
            />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M19 11h-2a5 5 0 0 1-.78 2.68l1.46 1.46A6.96 6.96 0 0 0 19 11zm-4.27.91L8 5.18V5a4 4 0 0 1 7.73 1.02L14.73 11.91zM4.27 3L3 4.27l6 6V11a3 3 0 0 0 4.52 2.59l1.7 1.7A6.97 6.97 0 0 1 13 17.93V20h3v2H8v-2h3v-2.07A7 7 0 0 1 5 11h2a5 5 0 0 0 7.72 4.18l1.55 1.55A6.95 6.95 0 0 1 12 18a7 7 0 0 1-7-7h-.01L3 9.27 4.27 3z"
            />
            <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" stroke-width="2" />
          </svg>
        </button>
        <button
          class="ctrl-btn"
          :class="{ off: !cameraOn }"
          @click="toggleCamera"
          :disabled="!previewStream"
        >
          <svg v-if="cameraOn" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"
            />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M21 6.5l-4 4V7a1 1 0 0 0-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12c.2 0 .39-.06.55-.16L19.73 21 21 19.73 3.27 2z"
            />
          </svg>
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
