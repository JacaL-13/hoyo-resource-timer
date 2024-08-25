<script>
	import '../app.css';

	import Analytics from '$lib/Analytics.svelte';

	//import genshin and starrail pages
	import Starrail from './starrail/Starrail.svelte';
	import Genshin from './genshin/Genshin.svelte';
	import RedeemCodes from './redeem-codes/RedeemCodes.svelte';

	import trailblazePower from '$lib/images/trailblaze-power.webp';
	import originalResin from '$lib/images/original-resin.webp';

	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	async function refreshDB() {
		try {
			const res = await fetch('/refresh-db', {
				method: 'GET',
			});

			const text = await res.text();

			console.debug(text);
		} catch (error) {
			console.error(error);
		}
	}

	onMount(() => {
		refreshDB();
	});
</script>

<Analytics />

<div class="tabs w-full absolute top-0 justify-center overflow-x-hidden text-white">
	<a
		href="/genshin"
		class="tab tab-lifted w-1/2 tab-lg"
		class:tab-active={$page.route.id?.includes('genshin')}
		class:tab-inactive={!$page.route.id?.includes('genshin')}
		>Genshin<img
			class="mx-1"
			src={originalResin}
			alt="Original Resin icon"
			width="32"
			height="32"
		/>
	</a>
	<a
		href="/starrail"
		class="tab tab-lifted w-1/2 tab-lg"
		class:tab-active={$page.route.id?.includes('starrail')}
		class:tab-inactive={!$page.route.id?.includes('starrail')}
		>Star Rail<img
			class="mx-2"
			src={trailblazePower}
			alt="Trailblaze Power icon"
			width="32"
			height="32"
		/></a
	>
</div>

<main class="flex flex-col items-center h-full mt-11">
	<!-- <div
		class="flex flex-col h-full justify-center overflow-hidden"
		class:hidden={!$page.route.id?.includes('genshin')}
	>
		<Genshin />
	</div>
	<div
		class="flex flex-col h-full justify-center overflow-hidden"
		class:hidden={!$page.route.id?.includes('starrail')}
	>
		<Starrail />
	</div> -->
	<div
		class="flex flex-col h-full w-full items-center justify-start"
		class:hidden={!$page.route.id?.includes('redeem-codes')}
	>
		<RedeemCodes />
	</div>

	{#if !($page.route.id?.includes('genshin') || $page.route.id?.includes('starrail'))}
		<slot />
	{/if}
</main>

<style>
	.tab-inactive {
		background-color: hsl(212, 18%, 12%);
		color: #a8a8a8;
	}
</style>
