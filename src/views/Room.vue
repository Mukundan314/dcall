<script lang="ts">
import { defineComponent } from "vue";
import StreamContainer from "@/components/StreamContainer.vue";
import type { PeerInfo } from "@/components/StreamContainer.vue";
import { joinRoom } from "trystero";
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
      room: null as ReturnType<typeof joinRoom> | null,
      localStream: new MediaStream(),
      peers: {} as Record<string, PeerInfo>,
      peerTimers: {} as Record<string, number>,
      cameraOn: true,
      micOn: true,
      stateInterval: null as ReturnType<typeof setInterval> | null,
    };
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
    if (this.stateInterval) clearInterval(this.stateInterval);
    this.room?.leave();
    this.localStream.getTracks().forEach((track) => track.stop());
  },

  methods: {
    setupRoom(name: string) {
      if (this.stateInterval) clearInterval(this.stateInterval);
      this.room?.leave();

      for (const key of Object.keys(this.peers)) {
        delete this.peers[key];
      }

      const room = joinRoom({ appId: "dcall" }, name);
      this.room = room;

      room.onPeerJoin((peerId) => {
        this.peers[peerId] = {
          stream: null,
          status: "connecting",
          error: "",
        };
        this.peerTimers[peerId] = Date.now();

        if (this.localStream.getTracks().length > 0) {
          room.addStream(this.localStream, [peerId]);
        }
      });

      room.onPeerLeave((peerId) => {
        delete this.peers[peerId];
        delete this.peerTimers[peerId];
      });

      room.onPeerStream((stream, peerId) => {
        this.peers[peerId] = {
          stream,
          status: "connected",
          error: "",
        };
        delete this.peerTimers[peerId];
      });

      const CONNECT_TIMEOUT_MS = 15000;

      this.stateInterval = setInterval(() => {
        const rtcPeers = room.getPeers();
        const now = Date.now();

        for (const [peerId, peer] of Object.entries(this.peers)) {
          if (peer.status !== "connecting") continue;

          const pc = rtcPeers[peerId];
          if (pc) {
            if (
              pc.connectionState === "connected" ||
              pc.iceConnectionState === "connected" ||
              pc.iceConnectionState === "completed"
            ) {
              continue;
            }

            if (
              pc.connectionState === "failed" ||
              pc.iceConnectionState === "failed"
            ) {
              this.peers[peerId] = {
                stream: null,
                status: "failed",
                error: "Connection failed — a TURN server may be required",
              };
              delete this.peerTimers[peerId];
              continue;
            }

            if (pc.iceConnectionState === "disconnected") {
              this.peers[peerId] = {
                stream: null,
                status: "failed",
                error: "Peer disconnected",
              };
              delete this.peerTimers[peerId];
              continue;
            }
          }

          const elapsed = now - (this.peerTimers[peerId] ?? now);
          if (elapsed > CONNECT_TIMEOUT_MS) {
            this.peers[peerId] = {
              stream: null,
              status: "failed",
              error: "Connection timed out — a TURN server may be required",
            };
            delete this.peerTimers[peerId];
          }
        }
      }, 2000);
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
    <StreamContainer :localStream="localStream" :peers="peers" />
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
