<script>
	import { onMount, createEventDispatcher } from 'svelte';

	// user Filters
	let filters = {
		gi: true,
		hsr: true,
		zzz: true,
		isExpired: false,
	};

	// on mount get user Filters
	onMount(() => {
		// get user Filters from local storage
		let localFilters = localStorage.getItem('filters');
		if (localFilters) {
			filters = JSON.parse(localFilters);
		}
	});

	const dispatch = createEventDispatcher();

	// when a checkbox is changed, update the user Filters
	function hdlChange(e) {
		dispatch('changeFilters', filters);
	}
</script>

<!-- three buttons that function as checkboxes. when any are changed, update the list to include that game -->
<div class="flex flex-row justify-between items-center gap-3 mb-3 ">
	<!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->
	<svg
		fill="#a4adba"
		version="1.1"
		id="Capa_1"
		xmlns="http://www.w3.org/2000/svg"
		xmlns:xlink="http://www.w3.org/1999/xlink"
		width="25px"
		height="25px"
		viewBox="0 0 971.986 971.986"
		xml:space="preserve"
	>
		<g>
			<path
				d="M370.216,459.3c10.2,11.1,15.8,25.6,15.8,40.6v442c0,26.601,32.1,40.101,51.1,21.4l123.3-141.3
		c16.5-19.8,25.6-29.601,25.6-49.2V500c0-15,5.7-29.5,15.8-40.601L955.615,75.5c26.5-28.8,6.101-75.5-33.1-75.5h-873
		c-39.2,0-59.7,46.6-33.1,75.5L370.216,459.3z"
			/>
		</g>
	</svg>
	<p class="text-3xl -ml-2 -mt-2">:</p>
	<label class="swap">
		<input type="checkbox" bind:checked={filters.gi} on:change={hdlChange} />
		<div class="swap-on btn btn-sm rounded-md btn-info  transition-none">
			Genshin
		</div>
		<div
			class="swap-off btn btn-sm btn-info rounded-md  bg-transparent text-gray-400 transition-none"
		>
			Genshin
		</div>
	</label>

	<label class="swap">
		<input type="checkbox" bind:checked={filters.hsr} on:change={hdlChange} />
		<div class="swap-on btn btn-sm rounded-md btn-info  transition-none">
			Star Rail
		</div>
		<div
			class="swap-off btn btn-sm btn-info rounded-md  bg-transparent text-gray-400 transition-none"
		>
			Star Rail
		</div>
	</label>

	<label class="swap">
		<input type="checkbox" bind:checked={filters.zzz} on:change={hdlChange} />
		<div class="swap-on btn btn-sm rounded-md btn-info  transition-none">
			ZZZ
		</div>
		<div
			class="swap-off btn btn-sm btn-info rounded-md  bg-transparent text-gray-400 transition-none"
		>
			ZZZ
		</div>
	</label>

	<p>|</p>

	<label class="swap">
		<!-- expired -->
		<input type="checkbox" bind:checked={filters.isExpired} on:change={hdlChange} />
		<div class="swap-on btn btn-sm rounded-md btn-info  transition-none">
			Expired
		</div>
		<div
			class="swap-off btn btn-sm btn-info rounded-md  bg-transparent text-gray-400 transition-none"
		>
			Expired
		</div>
	</label>
</div>

<style>
	.btn-sm {
		/* top and bottom 0, left and right 0.9 */
		padding: 0.1rem 0.5rem;
	}
</style>
