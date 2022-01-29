<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "Home",
  data() {
    return {
      roomName: "",
    };
  },
  methods: {
    joinRoom() {
      this.$router.push({ name: "Room", params: { name: this.roomName } });
    },
  },
});
</script>

<template>
  <div class="home">
    <input v-model="roomName" placeholder="Room Name" />
    <button @click="joinRoom">Join</button>
  </div>
</template>
