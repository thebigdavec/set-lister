export function formatDuration(durationSecs: number): string {
	if (durationSecs <= 0) {
		return "0s";
	}

	let secsRemaning = durationSecs;

	let hours = Math.floor(secsRemaning / 3600);
	secsRemaning -= hours * 3600;

	let minutes = Math.floor(secsRemaning / 60);
	secsRemaning -= minutes * 60;

	let seconds = secsRemaning;

	let formattedDuration = "";
	if (hours > 0) {
		formattedDuration += `${hours}h `;
	}
	if (minutes > 0) {
		// make sure minutes are at least 2 digits
		formattedDuration += `${minutes.toString().padStart(hours && 2, "0")}m `;
	}
	if (seconds > 0) {
		// make sure seconds are at least 2 digits
		formattedDuration += `${seconds.toString().padStart(2, "0")}s`;
	}

	return formattedDuration.trim();
}
