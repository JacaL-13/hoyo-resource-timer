<script>
	import { onMount } from 'svelte';

	export let maxResource;
	export let regenTime;
	export let tabId;
	export let activityTable;
	export let resourceName;
	export let weekBossName;

	let startTime;

	let secondsToMax;
	let maxTimer = '--:--:--';

	// Current resource value entered by the user and updated by the timer
	let curResource;
	// Resource value set by the user
	let setResource;

	let intervalId;
	let notifyIntervalId;

	// Allows pause of resource update from timer while user is editing so their input isn't overwritten
	let pause = false;

	let notify = false;

	let weekBossSetTime;

	// On mount, get the current resource and start time from local storage
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
			const currentTime = new Date().valueOf();
			const timeElapsedInSeconds = Math.floor((currentTime - startTime) / 1000);
			curResource =
				Math.floor(timeElapsedInSeconds / 60 / regenTime) + +setResource;

			setTimer();
		}

		notifyMe();
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

	//Handle user change of input
	function hdlChange() {
		startTime = new Date().valueOf();
		setResource = curResource;

		localStorage.setItem('setResource' + tabId, setResource);
		localStorage.setItem('startTime' + tabId, startTime);

		setTimer();
	}

	// Start the timer
	function setTimer() {
		// Clear any existing timers
		if (intervalId) {
			clearInterval(intervalId);
		}

		//Calculate initial timers and parse into strings
		secondsToMax = (maxResource - setResource) * regenTime * 60;
		maxTimer = parseTimer(secondsToMax < 0 ? 0 : secondsToMax);

		activityTable.forEach((row) => {
			row.timerSeconds = (row.cost - (setResource % row.cost)) * regenTime * 60;
			row.timerString = parseTimer(row.timerSeconds < 0 ? 0 : row.timerSeconds);

			activityTable = activityTable;
		});

		//Every second, update timers and resource value
		intervalId = setInterval(() => {
			const currentTime = new Date().valueOf();

			const timeElapsedInSeconds = Math.floor((currentTime - startTime) / 1000);

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
					curResource >= 240
						? 0
						: (row.cost - (curResource % row.cost)) * regenTime * 60 -
						  timeSinceAdded;

				row.timerString = parseTimer(row.timerSeconds < 0 ? 0 : row.timerSeconds);

				activityTable = activityTable;
			});
		}, 1000);
	}

	function notifyMe() {}

	//if notify changes, set document to blink and play sound
	$: if (notify) {
		const notifyText = `${resourceName} at ${curResource}!`;

		clearInterval(notifyIntervalId);

		notifyIntervalId = setInterval(() => {
			if (document.title === 'Hoyo Resource Timer') {
				document.title = notifyText;
			} else {
				document.title = 'Hoyo Resource Timer';
			}
		}, 1500);

		notifyMe();
	} else if (notifyIntervalId) {
		clearInterval(notifyIntervalId);
		document.title = 'Hoyo Resource Timer';
	}

	// Enforce numeric input and maximum resource value
	function enforceNumeric() {
		curResource = curResource.replace(/[^0-9]/g, '');

		if (curResource > maxResource) {
			curResource = maxResource;
		}
	}

	let screenSizeY;

	const breakPoint = 860;

	let weekBossCounter;

	let debounceTimer;
	let disabled = false;

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

	//end of script marker
	//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
</script>

<svelte:window bind:innerHeight={screenSizeY} />

<!-- Table of activities with timers -->
<div id="timers" class="flex flex-col items-center justify-around mt-12 mb-1">
	<div class="w-auto h-auto mx-5">
		<table id="timer-table" class="table-sm">
			<tbody>
				<tr class="text-left">
					<th class="header-row">Activity</th>
					<th class="header-row">Cost</th>
					<th class="header-row">Reward</th>
					<th class="header-row">Timer</th>
					<th class="header-row">Avail.</th>
				</tr>
				{#each activityTable as row}
					<tr
						class={curResource > row.cost - 1
							? 'bg-green-700 text-black'
							: ''}
					>
						<td class="text-row">{row.activity}</td>
						<td class="text-row"
							>{row.activity === weekBossName && weekBossCounter <= 0
								? row.modCost
								: row.cost}</td
						>
						<td class="text-row">{row.reward}</td>
						<td class="text-row">{row.timerString}</td>
						<td class="text-row text-center"
							>{curResource < row.cost
								? 0
								: Math.floor(curResource / row.cost) || '-'}</td
						>
					</tr>
					<tr style="line-height: 1px">
						<td class="p-0" colspan="5">
							<progress
								class="progress progress-success h-2 w-full"
								value={row.cost * regenTime * 60 - row.timerSeconds}
								max={row.cost * regenTime * 60}
							/>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Weekly boss counter -->
	<div class="flex justify-center items-center gap-x-1 w-full px-5">
		<p class="mr-5 whitespace-nowrap">{weekBossName}<br /> Remaining:</p>
		<button
			class="counter-btn btn btn-xs"
			on:click={() => {
				hdlCounter(1);
			}}>➕</button
		>
		<div
			class="counter-card flex justify-center items-center card bg-base-200 w-20 cursor-default"
		>
			<p>{weekBossCounter || '-'} / 3</p>
		</div>
		<button
			class="counter-btn btn btn-xs"
			on:click={() => {
				hdlCounter(-1);
			}}>➖</button
		>
	</div>

	<div class="flex flex-col items-center gap-y-3">
		<h3>Current {resourceName} :</h3>

		<!-- Current resource progress and input -->
		<div
			class="radial-progress aspect-square pointer-events-none bg-blue-600 text-yellow-300"
			style={`--value:${
				isNaN(curResource) ? 0 : (curResource / maxResource) * 100
			}; --size: ${
				screenSizeY > breakPoint ? '12rem' : '22vh'
			}; --thickness: 0.5rem;`}
		>
			<input
				id={'current-resource' + tabId}
				class="text-center bg-inherit rounded-lg pointer-events-auto placeholder-shown:border-2 aspect-video"
				type="text"
				pattern="[0-9]*"
				inputmode="numeric"
				max="240"
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
			/>
		</div>
		<p>Time to full {maxTimer}</p>
	</div>
	<button
		class=" btn-ghost text-xs"
		on:click={() => {
			localStorage.removeItem('startTime' + tabId);
			localStorage.removeItem('setResource' + tabId);

			//refresh page
			location.reload();
		}}>Clear Timer</button
	>
</div>

<style>
	#timers {
		height: 90vh;
		max-height: 750px;
	}

	.header-row {
		padding-left: 10px;
	}

	input {
		width: 16vh;
		height: 10vh;
		max-width: 128px;
		max-height: 95px;
		font-size: 4.5rem;
	}

	.counter-card {
		height: 4vh;
		max-height: 2.5rem;
	}

	@media screen and (max-height: 860px) {
		.header-row {
			padding-left: 5px;
		}

		#timer-table tr {
			line-height: 2vh;
			font-size: 2vh;
		}

		#timer-table td.text-row {
			padding: 0.5rem 1vw 0.5rem 1vw;
		}

		h3 {
			font-size: 3.5vh;
		}

		input {
			font-size: 8vh;
		}

		p {
			font-size: 2vh;
		}

		button {
			font-size: 2vh;
		}

		.counter-btn {
			width: 3rem;
		}
	}
</style>
