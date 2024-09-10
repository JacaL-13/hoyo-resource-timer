<script>
	import trailblazePower from '$lib/images/trailblaze-power.webp';
	import originalResin from '$lib/images/original-resin.webp';
	import { page } from '$app/stores';
</script>

<div >
	<div class="tabs w-full justify-center overflow-hidden text-white">
		<a
			href="/resource-timer/genshin"
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
			href="/resource-timer/starrail"
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
	
	<slot />
</div>

<style>
	.tabs{
		background-color: #181e26;
	}
</style>