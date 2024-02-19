import { h } from "vue";
import DefaultTheme from "vitepress/theme";
import Comment from "./components/comment.vue";
import Donate from "./components/Donate.vue";
import "./styles/index.css";


/**
 * https://vitepress.dev/guide/extending-default-theme
 */
export default {
  ...DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
      "doc-after": () => h(Comment),
      "doc-footer-before": () => h(Donate),
    });
  },
  enhanceApp({ app, router, siteData }) {
    // app is the Vue 3 app instance from createApp()
    // router is VitePress' custom router (see `lib/app/router.js`)
    // siteData is a ref of current site-level metadata.
  },
};
