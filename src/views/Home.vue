<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "Home",
  data() {
    return {
      roomId: "",
    };
  },
  methods: {
    joinRoom() {
      this.$router.push({ name: "Room", params: { id: this.roomId } });
    },
  },
});
</script>

<template>
  <div class="home">
    <input v-model="roomId" placeholder="Room ID" />
    <button @click="joinRoom">Join</button>
  </div>
</template>
