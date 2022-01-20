<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "Room",
  props: {
    id: String,
  },
});
</script>

<template>
  <div class="room">
    <p>room id: {{ id }}</p>
  </div>
</template>
