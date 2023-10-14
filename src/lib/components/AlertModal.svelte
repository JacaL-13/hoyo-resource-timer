<script>
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	export let showAlarms;
	export let setShowAlarms;
	export let curResource = 0;
	export let regenTime;
	export let maxResource;

	let alertNotifsOff = false;
	let alertDuplicateEntry = false;
	let time24hr = false;

	let alertTable = [];

	let subscription;

	onMount(async () => {
		if (localStorage.getItem('alertTable')) {
			alertTable = JSON.parse(localStorage.getItem('alertTable'));
		}

		getSubscription();
	});

	async function getSubscription() {
		if ('serviceWorker' in navigator) {
			// Service worker supported
			if (Notification.permission === 'default') {
				await Notification.requestPermission();
			}
			if (Notification.permission !== 'granted' && showAlarms) {
				return notifyDisabled();
			} else if (Notification.permission === 'granted') {
				console.log('getting subscription');
				const reg = await navigator.serviceWorker.ready;
				subscription = await reg.pushManager.getSubscription();
				if (!subscription) {
					const res = await fetch('/notify');
					const key = await res.json();
					subscription = await reg.pushManager.subscribe({
						userVisibleOnly: true,
						applicationServerKey: key,
					});
				}
				console.log('subscription', subscription.endpoint);
			}
		}
	}

	function parseDate(dateTime) {
		const today = new Date().getDate();

		const monthName =
			dateTime.getDate() === today
				? ''
				: dateTime.toLocaleString('default', { month: 'short' } + '/');
		const day =
			dateTime.getDate() === today
				? 'today'
				: dateTime.getDate() - today === 1
				? 'tomorrow'
				: dateTime.getDate();
		const hour = (dateTime.getHours() + 24) % 12 || 12;
		const minute = dateTime.getMinutes();
		const ampm = dateTime.getHours() >= 12 ? 'pm' : 'am';

		return `${monthName}${day} ${hour}:${minute} ${ampm}`;
	}

	function parseCompleteTime(alertValue) {
		const completeTimeStamp =
			new Date().valueOf() + alertValue * 60 * 1000 - curResource * 60 * 1000;
		return parseDate(new Date(completeTimeStamp));
	}

	function notifyDisabled() {
		alertNotifsOff = true;

		setTimeout(() => {
			alertNotifsOff = false;
		}, 5000);
	}

	async function hdlAddAlert() {
		if (Notification.permission !== 'granted') {
			return notifyDisabled();
		}

		// Add blank row to alertTable if one doesn't already exist
		if (!alertTable.some((row) => row.alertValue === null)) {
			alertTable = [
				...alertTable,
				{
					alertValue: null,
					completeTime: '--:--:--',
				},
			];
		}
	}

	function hdlInputChange(event) {
		let index = event.target.parentNode.parentNode.rowIndex;
		index = index - Math.floor(index / 2) - 1;

		// If input value is a duplicate, clear input.
		if (
			alertTable.some(
				(row) => row.alertValue === event.target.value && row.alertValue !== null,
			)
		) {
			event.target.value = '';
			duplicateEntry();
		} else {
			alertTable[index].alertValue = event.target.value;
			alertTable[index].completeTime = parseCompleteTime(event.target.value);
		}
	}

	function duplicateEntry() {
		alertDuplicateEntry = true;

		setTimeout(() => {
			alertDuplicateEntry = false;
		}, 2000);
	}

	function enforceNumeric(event) {
		let index = event.target.parentNode.parentNode.rowIndex;
		index = index - Math.floor(index / 2) - 1;

		event.target.value = event.target.value.replace(/[^0-9]/g, '');

		if (event.target.value > maxResource) {
			event.target.value = maxResource;
		}

		alertTable = alertTable;
	}

	function hdlDelete(event) {
		let index = event.target.parentNode.parentNode.rowIndex;
		index = index - Math.floor(index / 2) - 1;

		alertTable.splice(index, 1);

		alertTable = alertTable;

		if (alertTable.length === 0) {
			localStorage.setItem('alertTable', JSON.stringify(alertTable));
		}
	}

	// Save alertTable to localStorage
	$: if (browser && alertTable.length > 0) {
		localStorage.setItem('alertTable', JSON.stringify(alertTable));
	}
	// $: console.log('alertTable: ', alertTable);

	$: if (showAlarms) {
		getSubscription();
	}

	// =========================================================
	// end of script
	// =========================================================
</script>

<div class="modal" class:modal-open={showAlarms}>
	{#if alertNotifsOff}
		<div class="toast toast-top toast-start z-10" transition:fade>
			<div class="alert alert-info">Enable notifications to receive alerts.</div>
		</div>
	{/if}
	{#if alertDuplicateEntry}
		<div class="alert alert-info absolute w-1/2 z-10" transition:fade>
			<span>Alert already exists.</span>
		</div>
	{/if}

	<div class="modal-box h-full flex flex-col items-center gap-y-2">
		<table id="timer-table" class="table-sm w-full">
			<tbody>
				{#if alertTable.length > 0}
					<tr>
						<th class="text-left">Alert At:</th>
						<th class="text-right">Complete Time:</th>
						<th />
					</tr>
				{/if}
				{#each alertTable as row}
					<tr>
						<td
							class="text-row text-left"
							class:bg-green-700={row.alertValue &&
								curResource > row.alertValue - 1}
							class:text-black={row.alertValue &&
								curResource > row.alertValue - 1}
							><input
								class="text-center bg-inherit rounded-lg pointer-events-auto border-2 w-14 h-7"
								style="border-width: 1px;"
								type="text"
								pattern="[0-9]*"
								inputmode="numeric"
								placeholder="---"
								min="0"
								maxlength="3"
								value={row.alertValue}
								on:input={(event) => {
									enforceNumeric(event);
								}}
								on:focus={(event) => {
									event.target.select();
								}}
								on:change={(event) => {
									hdlInputChange(event);
								}}
								on:keydown={(event) => {
									if (event.key === 'Enter') {
										event.target.blur();
									}
								}}
							/></td
						>
						<td
							class="text-row text-right min-w-max"
							class:bg-green-700={row.alertValue &&
								curResource > row.alertValue - 1}
							class:text-black={row.alertValue &&
								curResource > row.alertValue - 1}>{row.completeTime}</td
						>
						<td class="text-row text-center w-1/12"
							><button
								on:click={(event) => {
									hdlDelete(event);
								}}>🗑️</button
							></td
						>
					</tr>
					<tr style="line-height: 1px">
						<td class="p-0" colspan="2">
							<progress
								class="progress progress-success h-2 w-full"
								value={curResource * regenTime * 60}
								max={row.alertValue * regenTime * 60}
							/>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		<button class="btn" on:click={hdlAddAlert}>➕</button>
		<label class="label cursor-pointer absolute bottom-3 left-3">
			<span class="label-text mr-2">24hr time</span>
			<input type="checkbox" class="checkbox checkbox-sm" bind:checked={time24hr} />
		</label>
		<div class="modal-action">
			<button
				class="btn absolute bottom-3 right-3"
				on:click={() => setShowAlarms(false)}>✖️</button
			>
		</div>
	</div>

	<!-- close on click outside -->
	<form method="dialog" class="modal-backdrop">
		<button
			on:click={() => {
				setShowAlarms(false);
			}}>close</button
		>
	</form>
</div>
