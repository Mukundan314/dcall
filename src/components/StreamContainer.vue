<script lang="ts">
import { defineComponent, ref, PropType } from "vue";

export default defineComponent({
  name: "StreamContainer",

  props: {
    localStream: MediaStream,
    remoteStreams: Object as PropType<Record<string, MediaStream>>,
  },

  setup() {
    return {
      root: ref<HTMLDivElement | null>(null),
    };
  },

  data() {
    return {
      observer: null as ResizeObserver | null,
      height: 0,
      width: 0,
      videoWidth: "0px",
      videoHeight: "0px",
    };
  },

  computed: {
    streamCount() {
      return this.remoteStreams
        ? Object.keys(this.remoteStreams).length + 1
        : 1;
    },
  },

  watch: {
    height() {
      this.updateStreamSize();
    },

    width() {
      this.updateStreamSize();
    },

    streamCount() {
      this.updateStreamSize();
    },
  },

  mounted() {
    if (this.root) {
      this.observer = new ResizeObserver(() => {
        if (this.root) {
          this.height = this.root.clientHeight;
          this.width = this.root.clientWidth;
        }
      });

      this.observer.observe(this.root);
    }
  },

  umounted() {
    this.observer?.disconnect();
  },

  methods: {
    updateStreamSize() {
      const videoWidth =
        [...Array(this.width).keys()].reverse().find((width) => {
          const height = Math.ceil((9 * width) / 16);
          const columns = Math.floor(this.width / width);
          const rows = Math.ceil(this.streamCount / columns);
          return (
            columns * rows >= this.streamCount && rows * height <= this.height
          );
        }) ?? 0;

      const videoHeight = Math.ceil((9 * videoWidth) / 16);

      this.videoWidth = `${videoWidth}px`;
      this.videoHeight = `${videoHeight}px`;
    },
  },
});
</script>

<template>
  <div ref="root" class="stream-container">
    <video
      class="local-stream stream"
      :srcObject="localStream"
      muted
      autoplay
    />
    <video
      v-for="(stream, key) in remoteStreams"
      class="stream"
      :key="key"
      :srcObject="stream"
      autoplay
    />
  </div>
</template>

<style scoped>
.stream-container {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
}

.local-stream {
  transform: rotateY(180deg);
  -webkit-transform: rotateY(180deg);
  -moz-transform: rotateY(180deg);
}

.stream {
  width: v-bind(videoWidth);
  height: v-bind(videoHeight);
}
</style>
