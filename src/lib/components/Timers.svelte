<script>
	export let maxResource;
	export let regenTime;
	// Name of localStorage key for resource value set by user
	export let localStorageId;

	export let activityTable;

	export let resourceName;

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

	import { onMount } from 'svelte';

	// On mount, get the current resource and start time from local storage
	onMount(() => {
		startTime = +localStorage.getItem('startTime' + localStorageId) || null;
		setResource = +localStorage.getItem('setResource' + localStorageId) || null;

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

	//Handle user change of input
	function hdlChange() {
		startTime = new Date().valueOf();
		setResource = curResource;

		localStorage.setItem('setResource' + localStorageId, setResource);
		localStorage.setItem('startTime' + localStorageId, startTime);

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
			row.timerSeconds = (row.cost - setResource) * regenTime * 60;
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

			activityTable.forEach((row) => {
				row.timerSeconds =
					(row.cost - setResource) * regenTime * 60 - timeElapsedInSeconds;
				row.timerString = parseTimer(row.timerSeconds < 0 ? 0 : row.timerSeconds);

				activityTable = activityTable;
			});
		}, 1000);
	}

	function notifyMe() {
	}

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


</script>

<!-- Table of activities with timers -->
<div class="flex flex-col gap-y-5 items-center justify-end my-10 h-full">
	<table class="table-sm mx-5">
		<tbody>
			<tr class="text-left">
				<th>Activity</th>
				<th>Cost</th>
				<th>Reward</th>
				<th>Timer</th>
			</tr>
			{#each activityTable as row}
				<tr class={curResource > row.cost - 1 ? 'bg-green-700 text-black' : ''}>
					<td>{row.activity}</td>
					<td>{row.cost}</td>
					<td>{row.reward}</td>
					<td>{row.timerString}</td>
				</tr>
				<tr style="line-height: 1px">
					<td class="p-0" colspan="4">
						<progress
							class="progress progress-success h-2 w-full"
							value={curResource || 0}
							max={row.cost}
						/>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<h3>Current {resourceName} :</h3>

	<!-- Current resource progress and input -->
	<div
		class="radial-progress pointer-events-none bg-blue-600 text-yellow-300"
		style={`--value:${
			isNaN(curResource) ? 0 : (curResource / maxResource) * 100
		}; --size:14rem; --thickness: 0.5rem;`}
	>
		<input
			id="current-resource"
			class="text-center bg-inherit rounded-lg h-auto w-36 text-7xl pointer-events-auto placeholder-shown:border-2"
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
	<button
		class=" btn-ghost text-xs"
		on:click={() => {
			localStorage.removeItem('startTime' + localStorageId);
			localStorage.removeItem('setResource' + localStorageId);

			//refresh page
			location.reload();
		}}>Clear Timer</button
	>
	

</div>
