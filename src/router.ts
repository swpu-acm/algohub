import {
  createRouter,
  createWebHashHistory,
  type RouteRecordRaw,
} from "vue-router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

const views = import.meta.glob([
  "./views/**/*.vue",
  "./views/**/index.vue",
  "./views/**/\\[*\\].vue",
]);

const routes: RouteRecordRaw[] = Object.entries(views).map(
  ([filePath, component]) => {
    let path = filePath
      .replace(/^\.\/views\//, "")
      .replace(/\.vue$/, "")
      .replace(/^(.*)\/?index$/, "$1")
      .replace(/\[(\w+)\]$/, ":$1");
    path = "/" + path;

    return {
      path,
      name: filePath.replace(/^\.\/views\//, ""),
      component,
    } satisfies RouteRecordRaw;
  }
);

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [...routes],
});

NProgress.configure({
  easing: "ease",
  speed: 500,
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.3,
});

router.beforeEach((_to, _from, next) => {
  NProgress.start();
  next();
});

router.afterEach(() => {
  NProgress.done();
});

export default router;
