<script lang="ts">
import { defineComponent } from "vue";
import StreamContainer from "@/components/StreamContainer.vue";
import type { PeerInfo } from "@/components/StreamContainer.vue";
import { Room } from "@/lib/room";
import MicOnIcon from "@/components/icons/MicOnIcon.vue";
import MicOffIcon from "@/components/icons/MicOffIcon.vue";
import CameraOnIcon from "@/components/icons/CameraOnIcon.vue";
import CameraOffIcon from "@/components/icons/CameraOffIcon.vue";
import HangUpIcon from "@/components/icons/HangUpIcon.vue";

export default defineComponent({
  name: "Room",

  components: {
    StreamContainer,
    MicOnIcon,
    MicOffIcon,
    CameraOnIcon,
    CameraOffIcon,
    HangUpIcon,
  },

  props: {
    name: String,
  },

  data() {
    return {
      room: null as Room | null,
      localStream: new MediaStream(),
      peers: {} as Record<string, PeerInfo>,
      cameraOn: true,
      micOn: true,
    };
  },

  computed: {
    localPeerId(): string {
      return this.room?.peerId ?? "";
    },
  },

  async mounted() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      stream.getTracks().forEach((track) => this.localStream.addTrack(track));
    } catch (e) {
      console.warn("Could not access camera/microphone:", e);
      this.cameraOn = false;
      this.micOn = false;
    }
    this.setupRoom(this.name!);
  },

  watch: {
    name(val: string) {
      this.setupRoom(val);
    },
  },

  unmounted() {
    this.room?.leave();
    this.localStream.getTracks().forEach((track) => track.stop());
  },

  methods: {
    async setupRoom(name: string) {
      this.room?.leave();

      for (const key of Object.keys(this.peers)) {
        delete this.peers[key];
      }

      const room = new Room(name);
      this.room = room;

      room.onPeersChanged = () => {
        // Sync room.peers into Vue-reactive this.peers
        const current = new Set(Object.keys(this.peers));
        const updated = new Set(Object.keys(room.peers));

        for (const id of current) {
          if (!updated.has(id)) {
            delete this.peers[id];
          }
        }
        for (const id of updated) {
          const p = room.peers[id];
          this.peers[id] = {
            stream: p.stream,
            status: p.status,
            error: p.error,
          };
        }
      };

      await room.join(this.localStream);
    },

    leaveRoom() {
      this.$router.push({ name: "Home" });
    },

    toggleCamera() {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      this.cameraOn = !this.cameraOn;
    },

    toggleMicrophone() {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      this.micOn = !this.micOn;
    },

  },
});
</script>

<template>
  <div class="room">
    <StreamContainer :localStream="localStream" :localPeerId="localPeerId" :peers="peers" />
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
