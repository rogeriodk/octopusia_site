export const APP_VERSION = "0.1.0";

export function buildHealthPayload(env = process.env) {
  return {
    ok: true,
    service: "octopus-ia-site",
    environment: env.APP_ENV || env.NODE_ENV || "development",
    version: APP_VERSION,
    commit: env.GIT_SHA || env.APP_COMMIT_SHA || "unknown"
  };
}
