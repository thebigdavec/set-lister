import { createApp, Component } from "vue";
import "./style.css";
import App from "./App.vue";

// register all components in ~/components/base/ as global components
import Button from "./components/base/Button.vue";
import Card from "./components/base/Card.vue";
import ConfirmDialog from "./components/base/ConfirmDialog.vue";
import Tooltip from "./components/base/Tooltip.vue";

const app = createApp(App);
app.component("Button", Button);
app.component("Card", Card);
app.component("ConfirmDialog", ConfirmDialog);
app.component("Tooltip", Tooltip);
app.mount("#app");
