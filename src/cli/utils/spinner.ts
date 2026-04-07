const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const SPINNER_INTERVAL = 80;

export class Spinner {
	private interval: ReturnType<typeof setInterval> | null = null;
	private frameIndex = 0;
	private message = "";

	start(message: string): void {
		this.message = message;
		this.frameIndex = 0;
		this.interval = setInterval(() => {
			const frame = FRAMES[this.frameIndex % FRAMES.length];
			process.stdout.write(`\r\x1b[36m${frame}\x1b[0m ${this.message}`);
			this.frameIndex++;
		}, SPINNER_INTERVAL);
	}

	update(message: string): void {
		this.message = message;
	}

	succeed(message: string): void {
		this.stop();
		process.stdout.write(`\r\x1b[32m✔\x1b[0m ${message}\n`);
	}

	fail(message: string): void {
		this.stop();
		process.stdout.write(`\r\x1b[31m✖\x1b[0m ${message}\n`);
	}

	stop(): void {
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = null;
		}
		// Clear the current spinner line
		process.stdout.write("\r\x1b[K");
	}
}
