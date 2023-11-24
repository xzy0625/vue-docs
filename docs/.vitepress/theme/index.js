import DefaultTheme from "vitepress/theme";
import './styles/index.css'
 
/**
 * https://vitepress.dev/guide/extending-default-theme
 */
export default {
  extends: DefaultTheme,
  enhanceApp({ app, router, siteData }) {
    // app is the Vue 3 app instance from createApp()
    // router is VitePress' custom router (see `lib/app/router.js`)
    // siteData is a ref of current site-level metadata.
  },
};