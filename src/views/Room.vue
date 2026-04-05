<script lang="ts">
import { defineComponent } from "vue";
import StreamContainer from "@/components/StreamContainer.vue";
import type { PeerInfo } from "@/components/StreamContainer.vue";
import { joinRoom } from "trystero";

export default defineComponent({
  name: "Room",

  components: {
    StreamContainer,
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
        :title="cameraOn ? 'Turn off camera' : 'Turn on camera'"
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

      <button class="ctrl-btn leave" @click="leaveRoom" title="Leave call">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 0 1 0-1.36C3.69 8.68 7.65 7 12 7s8.31 1.68 11.71 4.72c.38.36.38.96 0 1.36l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 0 0-2.67-1.85.996.996 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"
          />
        </svg>
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
