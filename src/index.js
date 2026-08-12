import { onRequest as yaziHandler } from "../functions/api/yazi.js";
import { onRequest as modelApplicationsHandler } from "../functions/api/model-applications.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/yazi") {
      return yaziHandler({ request, env, ctx });
    }

    if (url.pathname === "/api/model-applications") {
      return modelApplicationsHandler({ request, env, ctx });
    }

    return env.ASSETS.fetch(request);
  }
};
