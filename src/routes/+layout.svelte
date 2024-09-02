<script>
	import '../app.css';

	import Analytics from '$lib/Analytics.svelte';

	import { onMount } from 'svelte';

	async function refreshDB() {
		try {
			const res = await fetch('/refresh-db', {
				method: 'GET',
			});

			if (res.ok) {
				const data = await res.json();
				
				if (data.newCodesFound) {
					console.debug('New codes found, refreshing DB');
					//force refresh
					location.reload();
				}
			} else {
				console.error('Failed to refresh DB');
			}
		} catch (error) {
			console.error(error);
		}
	}

	onMount(() => {
		refreshDB();
	});
</script>

<div role="tablist" class="flex tabs tab-bordered">
	<a role="tab" class="tab w-1/3" href="/redeem-codes">Redeem Codes</a>
	<a role="tab" class="tab tab-active w-1/3" href="/resource-timer">About</a>
</div>

<Analytics />

<main class="flex flex-col items-center h-full mt-11">
	<slot />
</main>

<style>
</style>
