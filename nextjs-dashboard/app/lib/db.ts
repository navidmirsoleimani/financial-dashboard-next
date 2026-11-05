import postgres from "postgres";

export function getSql() {
	const url = process.env.POSTGRES_URL;
	if (!url) {
		throw new Error("POSTGRES_URL is not set");
	}

	return postgres(url, {
		ssl: "require",
		max: 1,
		prepare: false,
		idle_timeout: 5,
	});
}
