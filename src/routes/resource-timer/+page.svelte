<script>
	import trailblazePower from '$lib/images/trailblaze-power.webp';
	import originalResin from '$lib/images/original-resin.webp';
	import { page } from '$app/stores';
</script>

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
