import { createApp } from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";

window.addEventListener("load", () => {
  createApp(App).use(router).mount("#app");
});
