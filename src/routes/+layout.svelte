<script>
	import '../app.css';

	import Analytics from '$lib/Analytics.svelte';

	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	async function refreshDB() {
		try {
			const res = await fetch('/refresh-db', {
				method: 'GET',
			});

			if (res.ok) {
				const data = await res.json();

				if (data.newCodesFound) {
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

	const navItems = [
		{
			href: '/redeem-codes',
			text: 'Redeem Codes',
		},
		{
			href: '/resource-timer',
			text: 'Resource Timer',
		},
	];
</script>

<div role="tablist" class="flex tabs tab-bordered justify-around">
	<!-- home -->
	<a
		href="/"
		role="tab"
		class:tab-active={$page.route.id === '/'}
		class="tab md:tab-lg px-8 w-1/5 whitespace-nowrap">Home 🏠</a
	>
	{#each navItems as item}
		<a
			href={item.href}
			role="tab"
			class:tab-active={$page.route.id?.includes(item.href)}
			class="tab md:tab-lg flex-grow"
		>
			{item.text}
		</a>
	{/each}
</div>

<Analytics />

<main class="flex flex-col items-center h-full overflow-hidden">
	<slot />
</main>

<style>
	.tab-active {
		border-bottom: 2px solid gray;
	}
</style>
