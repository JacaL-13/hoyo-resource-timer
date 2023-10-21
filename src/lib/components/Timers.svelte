<script>
	import ActivityTable from './ActivityTable.svelte';
	import AlertModal from './AlertModal.svelte';

	import { onMount } from 'svelte';

	import { fade } from 'svelte/transition';

	export let maxResource;
	export let regenTime;
	export let tabId;
	export let activityTable;
	export let resourceName;
	export let weekBossName;

	let startTime; // Timestamp when timer started
	let setResource; // Resource value initially set by the user
	let weekBossSetTime; // Timestamp when week boss counter was last changed by user

	let weekBossCounter;
	let timeElapsedInSeconds; // Time elapsed since timer started
	let curResource; // Current resource value updated by the timer

	let intervalId;
	let maxTimer = '--:--:--';
	let pause = false; // Pause resource update by timer while user editing so input isn't overwritten

	let notify = false;
	let notifyIntervalId;

	//Prevent double presses on week boss counter buttons
	let debounceTimer;
	let disabled = false;

	let screenSizeY;

	let showAlerts = false;

	let showNotifsOffAlert = false;

	let currentTime = new Date().valueOf();

	let rescheduleAlerts

	// On mount, get the current resource, start time, and weekly boss set time from local storage
	onMount(() => {
		startTime = +localStorage.getItem('startTime' + tabId) || null;
		setResource = +localStorage.getItem('setResource' + tabId) || null;

		weekBossSetTime = +localStorage.getItem('weekBossSetTime' + tabId) || null;

		//get last monday 4am
		const lastMonday = new Date(
			new Date().setDate(new Date().getDate() - new Date().getDay() + 1),
		).setHours(4, 0, 0, 0);

		//check if last monday is after weekBossSetTime
		if (lastMonday > weekBossSetTime) {
			localStorage.removeItem('weekBossCounter' + tabId);
		}

		weekBossCounter = +localStorage.getItem('weekBossCounter' + tabId) || 3;

		// If localStorage exists, start the timer
		if (startTime) {
			currentTime = new Date().valueOf();
			timeElapsedInSeconds = Math.floor((currentTime - startTime) / 1000);
			curResource =
				Math.floor(timeElapsedInSeconds / 60 / regenTime) + +setResource;

			setTimer();
		}
		
	});

	// Parses time in seconds into a timer string
	function parseTimer(timeInSeconds) {
		const timerHrs = Math.floor(timeInSeconds / 3600);
		const timerMins = Math.floor((timeInSeconds % 3600) / 60);
		const timerSecs = Math.floor(timeInSeconds % 60);

		const timerHrsText = timerHrs < 10 ? `0${timerHrs}` : timerHrs;
		const timerMinsText = timerMins < 10 ? `0${timerMins}` : timerMins;
		const timerSecsText = timerSecs < 10 ? `0${timerSecs}` : timerSecs;

		return `${timerHrsText}:${timerMinsText}:${timerSecsText}`;
	}

	// Start the timer
	function setTimer() {
		// Clear any existing timers
		if (intervalId) {
			clearInterval(intervalId);
		}

		//Calculate initial timers and parse into strings
		let secondsToMax = (maxResource - setResource) * regenTime * 60;
		maxTimer = parseTimer(secondsToMax < 0 ? 0 : secondsToMax);

		activityTable.forEach((row) => {
			row.timerSeconds = (row.cost - (setResource % row.cost)) * regenTime * 60;
			row.timerString = parseTimer(row.timerSeconds < 0 ? 0 : row.timerSeconds);

			activityTable = activityTable;
		});

		//Every second, update timers and resource value
		intervalId = setInterval(() => {
			currentTime = new Date().valueOf();

			timeElapsedInSeconds = Math.floor((currentTime - startTime) / 1000);

			if (!pause) {
				curResource =
					Math.floor(timeElapsedInSeconds / 60 / regenTime) + +setResource;
			}

			if (curResource > maxResource) {
				curResource = maxResource;
			}

			secondsToMax =
				(maxResource - setResource) * regenTime * 60 - timeElapsedInSeconds;

			if (secondsToMax < 0) {
				secondsToMax = 0;
				notify = true;
			} else {
				notify = false;
			}

			maxTimer = parseTimer(secondsToMax);

			const timeSinceAdded = timeElapsedInSeconds % (regenTime * 60);

			activityTable.forEach((row) => {
				row.timerSeconds =
					curResource >= maxResource
						? 0
						: (row.cost - (curResource % row.cost)) * regenTime * 60 -
						  timeSinceAdded;

				row.timerString = parseTimer(row.timerSeconds < 0 ? 0 : row.timerSeconds);

				activityTable = activityTable;
			});
		}, 1000);
	}

	//if notify changes, set document to blink and play sound
	// $: if (notify) {
	// 	const notifyText = `${resourceName} at ${curResource}!`;

	// 	clearInterval(notifyIntervalId);

	// 	notifyIntervalId = setInterval(() => {
	// 		if (document.title === 'Hoyo Resource Timer') {
	// 			document.title = notifyText;
	// 		} else {
	// 			document.title = 'Hoyo Resource Timer';
	// 		}
	// 	}, 1500);
	// } else if (notifyIntervalId) {
	// 	clearInterval(notifyIntervalId);
	// }

	// Enforce numeric input and maximum resource value
	function enforceNumeric() {
		curResource = curResource.replace(/[^0-9]/g, '');

		if (curResource > maxResource) {
			curResource = maxResource;
		}
	}

	// Handle week boss counter buttons
	function hdlCounter(num) {
		clearTimeout(debounceTimer);

		if (!disabled && weekBossCounter + num > -1 && weekBossCounter + num < 4) {
			weekBossCounter += num;
			localStorage.setItem('weekBossCounter' + tabId, weekBossCounter);
			localStorage.setItem('weekBossSetTime' + tabId, new Date().valueOf());
			disabled = true;
		}

		debounceTimer = setTimeout(() => {
			disabled = false;
		}, 100);
	}

	//Handle user change of current resource
	function hdlChange() {
		startTime = new Date().valueOf();
		setResource = curResource;
		rescheduleAlerts()

		localStorage.setItem('setResource' + tabId, setResource);
		localStorage.setItem('startTime' + tabId, startTime);

		setTimer();
	}

	function setShowAlerts(bool) {
		showAlerts = bool;
	}

	function alertNotifsOff() {
		if (Notification.permission !== 'granted') {
			showNotifsOffAlert = true;

			setTimeout(() => {
				showNotifsOffAlert = false;
			}, 5000);
		}
	}

	// =========================================================
	// End of script
	// =========================================================
</script>

<svelte:window bind:innerHeight={screenSizeY} />

<div id="timers" class="flex flex-col items-center justify-around mt-12 mb-1 relative">
	<div class="w-auto h-auto mx-5">
		<ActivityTable
			{activityTable}
			{curResource}
			{weekBossName}
			{weekBossCounter}
			{regenTime}
		/>
	</div>

	<!-- // =========================================================
	// Weekly boss counter
	// ========================================================= -->
	<div class="flex justify-center items-center gap-x-1 w-full px-5 py-1">
		<p class="mr-5 whitespace-nowrap">{weekBossName}<br /> Remaining:</p>
		<div class="counter join">
			<button
				class="btn join-item h-full min-h-full"
				on:click={() => {
					hdlCounter(1);
				}}>➕</button
			>
			<div
				class=" flex justify-center items-center text-black w-20 cursor-default join-item"
				style="background-color: #6db4f9;"
			>
				<p>{weekBossCounter <= 0 ? 0 : weekBossCounter || '-'} / 3</p>
			</div>
			<button
				class="btn join-item h-full min-h-full"
				on:click={() => {
					hdlCounter(-1);
				}}>➖</button
			>
		</div>
	</div>

	<!-- // =========================================================
	// Current resource input and progress
	// ========================================================= -->
	<div class="flex flex-col items-center gap-y-3">
		<h3>Current {resourceName} :</h3>

		<div
			class="radial-progress aspect-square pointer-events-none bg-blue-600 text-yellow-300"
			style={`--value:${
				isNaN(curResource) ? 0 : (curResource / maxResource) * 100
			}; --size: ${screenSizeY > 860 ? '12rem' : '22vh'}; --thickness: 0.5rem;`}
		>
			<input
				id={'current-resource' + tabId}
				class="resource-input text-center bg-inherit rounded-lg pointer-events-auto placeholder-shown:border-2 aspect-video"
				type="text"
				pattern="[0-9]*"
				inputmode="numeric"
				max={maxResource}
				min="0"
				maxlength="3"
				placeholder="---"
				bind:value={curResource}
				on:input={enforceNumeric}
				on:focus={(event) => {
					pause = true;
					event.target.select();
				}}
				on:blur={() => {
					pause = false;
				}}
				on:change={hdlChange}
				on:keydown={(event) => {
					if (event.key === 'Enter') {
						event.target.blur();
					}
				}}
				autoComplete="off"
			/>
		</div>
		<p class="main-timer">Time to full {maxTimer}</p>
	</div>

	<!-- // =========================================================
	// Clear timer button
	// ========================================================= -->
	<button
		class="responsive-button btn-ghost text-xs"
		on:click={() => {
			localStorage.removeItem('startTime' + tabId);
			localStorage.removeItem('setResource' + tabId);

			//refresh page
			location.reload();
		}}>Clear Timer</button
	>

	<!-- // =========================================================
	// Alert modal
	// ========================================================= -->
	<AlertModal
		{showAlerts}
		{setShowAlerts}
		{curResource}
		{regenTime}
		{maxResource}
		{resourceName}
		{currentTime}
		{timeElapsedInSeconds}
		{alertNotifsOff}
		bind:rescheduleAlerts={rescheduleAlerts}
	/>

	{#if showNotifsOffAlert}
		<div class="toast toast-top toast-start z-50" transition:fade>
			<div class="alert alert-info">
				Enable notifications to receive custom alerts.
			</div>
		</div>
	{/if}

	<!-- // =========================================================
		// Show alert modal button
		// ========================================================= -->
	<button
		class="swap swap-flip text-2xl absolute bottom-2 right-5 z-10"
		class:swap-active={showAlerts}
		on:click={() => {
			showAlerts = !showAlerts;
		}}
	>
		<div class="swap-on" />
		<div class="swap-off">🔔</div>
		<!-- <div>{showAlarms}</div> -->
	</button>

	<!-- // =========================================================
	// End of component
	// ========================================================= -->
</div>

<style>
	#timers {
		height: 100%;
		max-height: 750px;
	}

	.resource-input {
		width: 16vh;
		height: 10vh;
		max-width: 128px;
		max-height: 95px;
		font-size: 4.5rem;
	}

	.counter {
		height: 4vh;
		max-height: 2.5rem;
	}

	@media screen and (max-height: 860px) {
		h3 {
			font-size: 3.5vh;
		}

		.resource-input {
			font-size: 8vh;
		}

		p {
			font-size: 2vh;
		}

		.main-timer {
			font-size: 2.5vh;
		}

		.responsive-button {
			font-size: 1.7vh;
		}

		.counter-btn {
			width: 3rem;
		}
	}
</style>
