import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
	worker: defineWorker({
		name: "financial-dashboard-next",
		entrypoint: "vinext/server/fetch-handler",
		compatibilityDate: "2026-11-05",
		compatibilityFlags: ["nodejs_compat"],
		assets: {
			htmlHandling: "none",
			notFoundHandling: "none",
			runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
		},
		env: {
			ASSETS: bindings.assets(),
			IMAGES: bindings.images(),
			POSTGRES_URL: bindings.secret(),
			POSTGRES_URL_NON_POOLING: bindings.secret(),
			AUTH_SECRET: bindings.secret(),

			AUTH_URL: bindings.text("https://YOUR-PRODUCTION-DOMAIN/api/auth"),
		},
	}),
});
