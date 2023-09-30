<script>
	export let toastTimer = 10; //seconds
	export let toastText = 'hey there';
	export let toastClass = '';

	let toastProgress = 100;

	let toastIntervalId;

	$: if (toastTimer) {
		clearInterval(toastIntervalId);
		toastIntervalId = setInterval(() => {
			toastProgress -= 100 / (toastTimer * 50);

			if (toastProgress < 0) {
				clearInterval(toastIntervalId);
			}
		}, 10);
	}
</script>

<div class={toastClass + " bg-slate-900 card p-5 w-auto flex flex-col gap-1 z-10"}>
	<p>{toastText}</p>
	<progress class="progress progress-info" value={toastProgress} max="100" />
</div>
