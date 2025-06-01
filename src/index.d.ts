declare module "weblib" {
  export * as Common from "./lib/common/index.mjs";
  export * as Cloudflare from "./lib/cloudflare/index.mjs";
  export * as CloudRun from "./lib/cloudrun/index.mjs";
  export * as Lambda from "./lib/lambda/index.mjs";

  const WebLib: {
    Common: typeof import("./lib/common/index.mjs");
    Cloudflare: typeof import("./lib/cloudflare/index.mjs");
    CloudRun: typeof import("./lib/cloudrun/index.mjs");
    Lambda: typeof import("./lib/lambda/index.mjs");
  };

  export default WebLib;
}