export function generateSlugFromArray(arr: string[]): string {
	const strings = arr.filter((str) => str.trim().length > 0);

	return strings
		.join("-")
		.trim()
		.toLowerCase()
		.replace(/[\s-]+/g, "-")
		.replace(/[^a-z0-9]/g, "-");
}
