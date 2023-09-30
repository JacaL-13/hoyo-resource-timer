<script>
	import '../app.css';

	//import genshin and starrail pages
	import Starrail from './starrail/Starrail.svelte';
	import Genshin from './genshin/Genshin.svelte';

	import Toast from '$lib/components/Toast.svelte';

	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	const isGenshinActive = $page.route.id === '/genshin';
	const isStarrailActive = $page.route.id === '/starrail';

	
</script>

<div class="tabs w-full absolute top-0 justify-center overflow-x-hidden">
	<a
		href="/genshin"
		class="tab tab-lifted w-1/2 tab-lg"
		class:tab-active={$page.route.id?.includes('genshin')}>Genshin</a
	>
	<a
		href="/starrail"
		class="tab tab-lifted w-1/2 tab-lg"
		class:tab-active={$page.route.id?.includes('starrail')}>Star Rail</a
	>
</div>


<main class="flex flex-col items-center h-full">
	<div class:hidden={!$page.route.id?.includes('genshin')}>
		<Genshin />
	</div>
	<div class:hidden={!$page.route.id?.includes('starrail')}>
		<Starrail />
	</div>
</main>
