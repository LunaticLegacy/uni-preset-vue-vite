import {
	createSSRApp
} from "vue";
import App from "./App.vue";
import { applyTheme, getTheme } from "./utils/theme.js";
export function createApp() {
	const app = createSSRApp(App);
	app.mixin({
		onShow() {
			applyTheme(getTheme());
		}
	});
	return {
		app,
	};
}
