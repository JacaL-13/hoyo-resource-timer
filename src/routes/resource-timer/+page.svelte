<script>
	import genshinIcon from '$lib/images/genshin.webp';
	import starrailIcon from '$lib/images/starrail.webp';
</script>

<svelte:head>
	<title>Resource Timer</title>
</svelte:head>

<div
	class="my-16 flex flex-col md:flex-row justify-around items-center w-full h-full gap-y-10"
>
	<a href="/resource-timer/genshin" class="text-center flex flex-col items-center gap-y-5">
		<h3>Genshin Impact</h3>
		<img
			class="rounded-xl"
			src={genshinIcon}
			alt="Genshin Impact icon"
		/>
	</a>

	<a href="/resource-timer/starrail" class="text-center flex flex-col items-center gap-y-5">
		<h3>Honkai: Star Rail</h3>
		<img class="rounded-xl" src={starrailIcon} alt="Star Rail icon" />
	</a>
</div>

<style>
	img {
		height: 30vh;
	}

	@media (min-width: 768px) {
		a {
			width: 30%;
		}
	}
</style>
