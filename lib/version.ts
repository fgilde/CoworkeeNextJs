import pkg from "../package.json";

export const APP_VERSION = pkg.version; // "1.0.0"
export const GIT_SHA = process.env.GIT_SHA?.slice(0, 7) || null; // stamped at build/deploy, optional
export const VERSION_LABEL = GIT_SHA ? `v${APP_VERSION} (${GIT_SHA})` : `v${APP_VERSION}`;
