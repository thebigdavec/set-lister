import { createApp, Component } from "vue";
import "./style.css";
import App from "./App.vue";

// register all components in ~/components/base/ as global components
import Button from "./components/base/Button.vue";
import ConfirmDialog from "./components/base/ConfirmDialog.vue";

const app = createApp(App);
app.component("Button", Button);
app.component("ConfirmDialog", ConfirmDialog);
app.mount("#app");
