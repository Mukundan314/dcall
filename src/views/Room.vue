<script lang="ts">
import { defineComponent } from "vue";
import StreamContainer from "@/components/StreamContainer.vue";
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
      remoteStreams: {} as Record<string, MediaStream>,
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
    setupRoom(name: string) {
      this.room?.leave();

      for (const key of Object.keys(this.remoteStreams)) {
        delete this.remoteStreams[key];
      }

      const room = joinRoom({ appId: "dcall" }, name);
      this.room = room;

      room.addStream(this.localStream);

      room.onPeerLeave((peerId) => {
        delete this.remoteStreams[peerId];
      });

      room.onPeerStream((stream, peerId) => {
        this.remoteStreams[peerId] = stream;
      });
    },

    leaveRoom() {
      this.$router.push({ name: "Home" });
    },

    toggleCamera() {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    },

    toggleMicrophone() {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    },
  },
});
</script>

<template>
  <div class="room">
    <StreamContainer
      :localStream="localStream"
      :remoteStreams="remoteStreams"
    />
    <div class="controls">
      <button class="btn" @click="leaveRoom">Leave Room</button>
      <button class="btn" @click="toggleCamera">Toggle Camera</button>
      <button class="btn" @click="toggleMicrophone">Toggle Microphone</button>
    </div>
  </div>
</template>

<style scoped>
.room {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
