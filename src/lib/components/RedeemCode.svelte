<script>
	import { createEventDispatcher } from 'svelte';

	export let icon;
	export let code;
	export let codeId;
	export let expired;
	export let game;
	export let used;

	// Example URLs
	// https://hsr.hoyoverse.com/gift?code=STARRAILGIFT
	// https://zenless.hoyoverse.com/redemption?code=ZENLESSGIFT
	// https://genshin.hoyoverse.com/gift?code=GENSHINGIFT

	let redeemURL =
		game === 'gi'
			? `https://genshin.hoyoverse.com/gift?code=${code}`
			: game === 'hsr'
				? `https://hsr.hoyoverse.com/gift?code=${code}`
				: `https://zenless.hoyoverse.com/redemption?code=${code}`;

	const dispatch = createEventDispatcher();

	// when a checkbox is changed, update the user Filters
	function hdlCheckUsed(e) {
		dispatch('checkUsed', {
			codeId,
			used: e.target.checked,
		});
	}
</script>

<tr class="flex flex-row justify-between items-center w-full" class:expired>
	<td class="flex flex-row col items-center gap-3">
		<img class="rounded-sm" src={icon} alt='game icon' width="48" height="48" />
		<!-- only show text when screen is wider than  -->
		<span class="w-1/2 hidden">{game.toUpperCase()}</span>
	</td>
	<td class=" h-8 px-2 pt-1 pb-7 border-yellow-300 border-opacity-25 border-2">
		<a
			class="flex flex-row items-center justify-center hover:underline hover:text-yellow-300 active:text-yellow-300 visited:text-yellow-200"
			href={redeemURL}
			target="_blank"
			>{code.toUpperCase()}

			<!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->
			<svg
				width="25px"
				height="25px"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				class="stroke-current min-w-fit"
			>
				<g id="Interface / External_Link">
					<path
						id="Vector"
						d="M10.0002 5H8.2002C7.08009 5 6.51962 5 6.0918 5.21799C5.71547 5.40973 5.40973 5.71547 5.21799 6.0918C5 6.51962 5 7.08009 5 8.2002V15.8002C5 16.9203 5 17.4801 5.21799 17.9079C5.40973 18.2842 5.71547 18.5905 6.0918 18.7822C6.5192 19 7.07899 19 8.19691 19H15.8031C16.921 19 17.48 19 17.9074 18.7822C18.2837 18.5905 18.5905 18.2839 18.7822 17.9076C19 17.4802 19 16.921 19 15.8031V14M20 9V4M20 4H15M20 4L13 11"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</g>
			</svg>
		</a>
	</td>
	<td>
		{#if expired}
			<p class="text-center">⌛</p>
		{/if}
	</td>
	<td class="mr-3 flex align-middle">
		<input
			class="checkbox checkbox-lg"
			type="checkbox"
			class:checkbox-info={!used}
			class:checkbox-success={used}
			bind:checked={used}
			on:change={hdlCheckUsed}
		/>
	</td>
</tr>

<style>
	@media (min-width: 425px) {
		/* show text when screen is wider than 640px */
		span {
			display: block;
		}
	}

	.expired {
		background-color: #e9460090;
		border-radius: 0.125rem;
	}
</style>
