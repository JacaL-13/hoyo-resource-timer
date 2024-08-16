<script>
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { v4 as uuidv4 } from 'uuid';
	import { browser } from '$app/environment';

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

	export let showAlerts;
	export let setShowAlerts;
	export let curResource = 0;
	export let regenTime;
	export let maxResource;
	export let resourceName;
	export let currentTime;
	export let timeElapsedInSeconds;
	export let alertNotifsOff;

	export async function rescheduleAlerts() {
		await refreshAlertTable();
		// TODO: send alertTable to server
	}

	let auth = getAuth();

	//web-push subscription
	let subscription;

	let showDuplicateEntryAlert = false;

	// 24hr time setting
	let time24hr;
	if (browser) {
		time24hr = localStorage.getItem('time24hr');
		if (!time24hr) {
			localStorage.setItem('time24hr', false);
			time24hr = false;
		}
	}

	let alertSnapshot = [];
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

	// on mount get permission for notifications and check if user is signed in
	onMount(async () => {
		await Notification.requestPermission().then((result) => {
			if (result === 'default') {
				alertNotifsOff();
			}
		});

		if (!auth.currentUser) {
			await signInAnonymously(auth).then(checkUserId).catch((err) =>
				console.error('server error: ', err),
			);
		}

		updateSubscription();

		refreshAlertTable();
	});

	
	// Check if the user ID in local storage is different from the current user ID
	// If different, update the user ID in all the alerts associated with the previous user ID
	async function checkUserId() {
		const localUserId = localStorage.getItem('userId');
		if (localUserId && localUserId !== auth.currentUser.uid) {
			const q = query(collection(db, 'alerts'), where('userId', '==', localUserId));

			const querySnapshot = await getDocs(q);

			querySnapshot.forEach((document) => {
				updateDoc(doc(db, 'alerts', document.id), {
					userId: auth.currentUser.uid,
				});
			});

		}
		localStorage.setItem('userId', auth.currentUser.uid);
	}

	async function updateSubscription() {
		if ('serviceWorker' in navigator && Notification.permission === 'granted') {
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
		}

		// update subscription in database
		if (!auth.currentUser) {
			await signInAnonymously(auth)
				.then(checkUserId)
				.catch((err) => console.error('server error: ', err));
		}

		setDoc(doc(db, 'users', auth.currentUser.uid), {
			subscription: subscription?.toJSON() || null,
		});
	}

	async function refreshAlertTable() {
		if (!auth.currentUser) {
			await signInAnonymously(auth)
				.then(checkUserId)
				.catch((err) => console.error('server error: ', err));
		}

		const q = query(
			collection(db, 'alerts'),
			where('userId', '==', auth.currentUser.uid),
			orderBy('createdAt', 'asc'),
		);

		alertSnapshot = await getDocs(q);

		alertTable = [];

		// Add alerts to alertTable
		alertSnapshot.forEach((document) => {

			// If alert is not already in alertTable, add it
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
		const hour = time24hr
			? dateTime.getHours() < 10
				? '0' + dateTime.getHours()
				: dateTime.getHours()
			: (dateTime.getHours() + 24) % 12 || 12;
		const minute =
			dateTime.getMinutes() < 10
				? '0' + dateTime.getMinutes()
				: dateTime.getMinutes();
		const ampm = time24hr ? '' : dateTime.getHours() >= 12 ? 'pm' : 'am';

		return `${day} ${hour}:${minute} ${ampm}`;
	}

	// =========================================================
	// Add blank alert to alertTable
	// =========================================================
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

	$: if (showAlerts) {
		if (Notification.permission !== 'granted') {
			alertNotifsOff();
		} else {
			updateSubscription();
		}
	}

	// if currentTime is past midnight of render time, update alertTable
	$: if (currentTime > midnight.valueOf() && alertTable && alertTable.length > 0) {
		console.log('midnight refreshing table');
		refreshAlertTable();
	}

	// =========================================================
	// end of script
	// =========================================================
</script>

<div class="modal z-40" class:modal-open={showAlerts}>
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
								autoComplete="off"
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
				on:change={() => {
					localStorage.setItem('time24hr', time24hr);
					refreshAlertTable();
				}}
			/>
		</label>
		<div class="modal-action">
			<button
				class="btn absolute bottom-3 right-3"
				on:click={() => setShowAlerts(false)}>✖️</button
			>
		</div>
	</div>

	<!-- close on click outside -->
	<form method="dialog" class="modal-backdrop">
		<button
			on:click={() => {
				setShowAlerts(false);
			}}>close</button
		>
	</form>
</div>
