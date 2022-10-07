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
  <head>
    <link
      rel="stylesheet"
      href="https://use.fontawesome.com/releases/v5.3.1/css/all.css"
      integrity="sha384-mzrmE5qonljUremFsqc01SB46JvROS7bZs3IO2EmfFsd15uHvIt+Y8vEf7N7fWAU"
      crossorigin="anonymous"
    />
  </head>

  <div class="home">
    <div class="search">
      <input
        v-model="roomName"
        placeholder="Room Name"
        name="search"
        class="searchbar"
      />
      <button @click="joinRoom" class="search_button">
        <i class="fa fa-search"> Join </i>
      </button>
    </div>
  </div>
</template>
