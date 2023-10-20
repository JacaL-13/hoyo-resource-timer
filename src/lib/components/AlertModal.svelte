<script>
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { v4 as uuidv4 } from 'uuid';
	import { dev } from '$app/environment';

	import { db } from '$lib/firebase';
	import {
		collection,
		getDocs,
		query,
		where,
		doc,
		orderBy,
		deleteDoc,
		Timestamp,
		setDoc,
		updateDoc,
	} from 'firebase/firestore';
	import { getAuth, signInAnonymously } from 'firebase/auth';

	export let showAlarms;
	export let setShowAlarms;
	export let setResource;
	export let curResource = 0;
	export let regenTime;
	export let maxResource;
	export let resourceName;
	export let currentTime;
	export let timeElapsedInSeconds;

	const auth = getAuth();

	//web-push subscription
	let subscription;

	let showNotifsOffAlert = false;
	let showDuplicateEntryAlert = false;

	let time24hr = false;

	let querySnapshot = [];
	let alertTable = [];

	//midnight of tomorrow
	let midnight = new Date(
		new Date().getFullYear(),
		new Date().getMonth(),
		new Date().getDate() + 1,
		0,
		0,
		0,
	);

	onMount(async () => {
		if ('serviceWorker' in navigator && Notification.permission === 'granted') {
			navigator.serviceWorker.register('/service-worker.js', {
				type: dev ? 'module' : 'classic',
			});
			const reg = await navigator.serviceWorker.ready;
			subscription = await reg.pushManager.getSubscription();
			const res = await fetch('/notify');
			if (!subscription) {
				const key = await res.json();
				subscription = await reg.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: key,
				});
			}
			console.log('subscription', subscription)
		}

		refreshAlertTable();
	});

	async function refreshAlertTable() {
		alertTable = [];

		await signInAnonymously(auth)
			.then(() => {})
			.catch((err) => console.error('server error: ', err));

		const q = query(
			collection(db, 'alerts'),
			where('userId', '==', auth.currentUser.uid),
			orderBy('createdAt', 'asc'),
		);

		querySnapshot = await getDocs(q);

		querySnapshot.forEach((document) => {
			if (!alertTable.some((row) => row.alertId === document.id)) {
				const { userId, alertValue, alertMessage, createdAt } = document.data();
				const completeTimeStamp = calculateTimeStamp(alertValue);
				if (!isNaN(completeTimeStamp)) {
					const completeTimeString = parseCompleteString(completeTimeStamp);

					const tableEntry = {
						alertId: document.id,
						userId,
						alertValue,
						alertMessage,
						completeTimeStamp,
						completeTimeString,
						isComplete: completeTimeStamp <= new Date().valueOf(),
						createdAt,
					};

					alertTable = [...alertTable, tableEntry];

					//update completeTimeStamp and completeTimeString in database
					updateDoc(doc(db, 'alerts', document.id), {
						completeTimeStamp,
						completeTimeString,
						isComplete: tableEntry.isComplete,
					});
				}
			}
		});

		midnight = new Date(
			new Date().getFullYear(),
			new Date().getMonth(),
			new Date().getDate() + 1,
			0,
			0,
			0,
		);

	}

	function calculateTimeStamp(alertValue) {
		const timeSinceAdded = timeElapsedInSeconds % (regenTime * 60);
		return alertValue
			? new Date().valueOf() +
					((alertValue - curResource) * regenTime * 60 - timeSinceAdded) * 1000
			: null;
	}

	function parseCompleteString(timeStamp) {
		return timeStamp
			? timeStamp < new Date().valueOf()
				? 'Complete!'
				: parseDate(new Date(timeStamp))
			: '--:--';
	}

	function parseDate(dateTime) {
		const today = new Date().getDate();

		const day =
			dateTime.getDate() === today
				? 'today'
				: dateTime.getDate() - today === 1
				? 'tomorrow'
				: dateTime.getDate();
		const hour = (dateTime.getHours() + 24) % 12 || 12;
		const minute =
			dateTime.getMinutes() < 10
				? '0' + dateTime.getMinutes()
				: dateTime.getMinutes();
		const ampm = dateTime.getHours() >= 12 ? 'pm' : 'am';

		return `${day} ${hour}:${minute} ${ampm}`;
	}

	function alertNotifsOff() {
		Notification.requestPermission().then((permission) => {
			if (permission !== 'granted') {
				showNotifsOffAlert = true;

				setTimeout(() => {
					showNotifsOffAlert = false;
				}, 5000);
			}
		});
	}

	async function hdlAddAlert() {
		if (Notification.permission !== 'granted') {
			return alertNotifsOff();
		}

		// Add blank row to alertTable if one doesn't already exist
		if (!alertTable.some((row) => row.alertValue === null)) {
			alertTable = [
				...alertTable,
				{
					alertValue: null,
					completeTimeStamp: null,
					completeTimeString: '--:--',
				},
			];
		}
	}

	// ---------------------------------------------------------
	// Handle Input changed. Update/add new alert.
	// ---------------------------------------------------------
	async function hdlInputChange(event) {
		let index = event.target.parentNode.parentNode.rowIndex;
		index = index - Math.floor(index / 2) - 1;

		// If input value is a duplicate, undo change.
		if (
			alertTable.some(
				(row) =>
					row.alertValue === +event.target.value && row.alertValue !== null,
			)
		) {
			//undo change
			event.target.value = alertTable[index].alertValue;
			alertDuplicateEntry();
		} else {
			const completeTimeStamp = calculateTimeStamp(event.target.value);
			const completeTimeString = parseCompleteString(completeTimeStamp);

			const isComplete = completeTimeStamp <= new Date().valueOf();
			const isSoonest = alertTable.every((row) => {
				return (
					row.alertValue === null ||
					row.completeTimeStamp < new Date().valueOf() ||
					row.alertValue > event.target.value
				);
			});

			//Add alert to alertTable
			const tableEntry = {
				alertId: alertTable[index].alertId || uuidv4(),
				userId: auth.currentUser.uid,
				alertValue: parseInt(event.target.value),
				alertMessage: `${resourceName} at ${event.target.value}!`,
				completeTimeStamp,
				completeTimeString,
				isComplete,
				createdAt: alertTable[index].createdAt || Timestamp.fromDate(new Date()),
			};

			alertTable = [
				...alertTable.slice(0, index),
				tableEntry,
				...alertTable.slice(index + 1),
			];

			// Add alert to database if it's a new entry, else update existing entry
			setDoc(doc(db, 'alerts', tableEntry.alertId), {
				userId: tableEntry.userId,
				alertValue: tableEntry.alertValue,
				alertMessage: tableEntry.alertMessage,
				completeTimeStamp,
				completeTimeString,
				isComplete,
				createdAt: tableEntry.createdAt,
			});
		}
	}

	function alertDuplicateEntry() {
		showDuplicateEntryAlert = true;

		setTimeout(() => {
			showDuplicateEntryAlert = false;
		}, 2500);
	}

	function hdlInput(event) {
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

		//delete alert from database
		if (alertTable[index].alertId !== undefined) {
			const docRef = doc(db, 'alerts', alertTable[index].alertId);
			deleteDoc(docRef);
		}

		alertTable.splice(index, 1);

		alertTable = alertTable;
	}

	//store subscription if sub or auth change
	$: if (subscription && auth.currentUser) {
		console.log('subscription', subscription);

		console.log(auth.currentUser.uid);
		// update subscription in database
		setDoc(doc(db, 'users', auth.currentUser.uid), {
			subscription: subscription.toJSON(),
		});
	}

	$: if (showAlarms && Notification.permission !== 'granted') {
		alertNotifsOff();
	}

	// if currentTime is past midnight of render time, update alertTable
	$: if (currentTime > midnight.valueOf() && alertTable && alertTable.length > 0) {
		console.log('midnight refreshing table');
		refreshAlertTable();
	}

	$: if (setResource) {
		refreshAlertTable();
	}

	// =========================================================
	// end of script
	// =========================================================
</script>

<div class="modal" class:modal-open={showAlarms}>
	{#if showNotifsOffAlert}
		<div class="toast toast-top toast-start z-10" transition:fade>
			<div class="alert alert-info">Enable notifications to receive alerts.</div>
		</div>
	{/if}
	{#if showDuplicateEntryAlert}
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
								id={`${resourceName}-alert-input-${row.alertId}`}
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
									hdlInput(event);
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
								curResource > row.alertValue - 1}
							>{row.completeTimeString}</td
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
			<input
				type="checkbox"
				id={`${resourceName}-24hour-check`}
				class="checkbox checkbox-sm"
				bind:checked={time24hr}
			/>
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
