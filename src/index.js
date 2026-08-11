import { onRequest as yaziHandler } from "../functions/api/yazi.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/yazi") {
      return yaziHandler({ request, env });
    }

    return env.ASSETS.fetch(request);
  }
};
