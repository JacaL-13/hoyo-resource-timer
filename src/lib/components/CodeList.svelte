<script>
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { v4 as uuidv4 } from 'uuid';
	import { browser } from '$app/environment';

	import Card from './Card.svelte';
	import RedeemCode from './RedeemCode.svelte';
	import Filters from './Filters.svelte';

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
		limit,
		startAt,
	} from 'firebase/firestore';

	import { user } from '$lib/auth';

	const codeList = writable([]);
	const filterStore = writable({
		gi: true,
		hsr: true,
		zzz: true,
		isExpired: false,
	});

	onMount(() => {
		// get codes from localstorage
		const checkLocal = localStorage.getItem('codes');
		if (checkLocal) {
			checkForNewCodes(JSON.parse(checkLocal));
		} else {
			// get codes from firestore
			getCodes();
		}

		// get filters from localstorage
		const localFilters = localStorage.getItem('filters');
		if (localFilters) {
			filterStore.set(JSON.parse(localFilters));
		}
	});

	async function getCodes() {
		console.log('Codes not found in local storage. Getting codes from database...');

		const q = query(
			collection(db, 'redeemCodes'),
			orderBy('isExpired'),
			orderBy('discoveredDate', 'desc'),
			orderBy('expirationDate', 'desc'),
		);

		const codesSnapshot = await getDocs(q).catch((error) => {
			console.error('Error getting codes');
		});

		// Get the user's codes from the 'usersToCodes' collection in Firestore
		const userToCodesSnapshot = await getDocs(
			query(collection(db, 'usersToCodes'), where('userId', '==', $user.uid)),
		).catch((error) => {
			console.error('Error getting user data');
		});

		let firestoreCodes = [];
		codesSnapshot.forEach((doc) => {
			const code = doc.data();
			const userToCode = userToCodesSnapshot.docs.find(
				(userToCode) => userToCode.data().codeId === doc.id,
			);

			// Create an object for each code with additional information
			firestoreCodes.push({
				docId: doc.id,
				...code,
				used: userToCode ? userToCode.data().used : false,
			});
		});

		// Set the codeList store with the Firestore codes
		codeList.set(firestoreCodes);

		// Save the Firestore codes to local storage
		localStorage.setItem('codes', JSON.stringify(firestoreCodes));
	}

	async function checkForNewCodes(localCodes) {
		if (localCodes.length === 0) {
			getCodes();
			return;
		}

		// get the latest code for each game from Firestore
		const giQuery = query(
			collection(db, 'redeemCodes'),
			where('game', '==', 'gi'),
			orderBy('discoveredDate', 'desc'),
			limit(1),
		);
		const hsrQuery = query(
			collection(db, 'redeemCodes'),
			where('game', '==', 'hsr'),
			orderBy('discoveredDate', 'desc'),
			limit(1),
		);
		const zzzQuery = query(
			collection(db, 'redeemCodes'),
			where('game', '==', 'zzz'),
			orderBy('discoveredDate', 'desc'),
			limit(1),
		);

		const snapshots = await Promise.all([
			getDocs(giQuery),
			getDocs(hsrQuery),
			getDocs(zzzQuery),
		]);

		for (let i = 0; i < snapshots.length; i++) {
			if (snapshots[i].empty) {
				continue;
			}

			const codeId = snapshots[i].docs[0].id;

			// check if the code is already in local storage
			const codeExists = localCodes.find(({ docId }) => docId === codeId);

			// if the code is not in local storage, break and get all codes from Firestore
			if (!codeExists) {
				getCodes();
				break;
			} else {
				// set the codeList store with the local codes
				codeList.set(localCodes);
			}
		}
	}

	//When codeList or filterStore changes, filter the codes based on the user's filters

	let filteredCodes = [];

	$: filteredCodes = $codeList ? 
		$codeList.filter((code) => {
			const filters = $filterStore;
			return !(!filters.isExpired && code.isExpired) && filters[code.game];
		})
		?.toSorted((a, b) => {
			// sort by expired status, then by used, then by discovered date desc
			if (a.isExpired === b.isExpired) {
				if (a.used === b.used) {
					// convert the discoveredDate to a date for comparison
					return new Date(b.discoveredDate) - new Date(a.discoveredDate);
				}
				return a.used - b.used;
			}
		}) : [];

	// when the codeList changes, update local storage
	$: {
		if ($codeList.length > 0) {
			localStorage.setItem('codes', JSON.stringify($codeList));
		}
	}

	function hdlChangeFilters(e) {
		filterStore.set(e.detail);
		// update the filters in local storage
		localStorage.setItem('filters', JSON.stringify(e.detail));
	}

	import gi from '$lib/images/genshin.webp';
	import hsr from '$lib/images/starrail.webp';
	import zzz from '$lib/images/zzz.webp';

	let gameIcons = {
		gi,
		hsr,
		zzz,
	};

	function hdlCheckUsed(e) {
		// update the used value in the userToCodes collection
		const { codeId, used } = e.detail;

		const userToCodeId = `${$user.uid}-${codeId}`;
		
		setDoc(doc(db, 'usersToCodes', userToCodeId), {
			userId: $user.uid,
			codeId,
			used,
			createdAt: Timestamp.now(),
		});

		// update the codeList store
		codeList.update((codes) => {
			return codes.map((code) => {
				if (code.docId === codeId) {
					code.used = used;
				}
				return code;
			});
		});
	}
</script>

<h1 class="text-2xl font-bold my-5">Redeem Codes</h1>

<Filters on:changeFilters={hdlChangeFilters} />

<ul class="flex flex-col w-full max-h-full overflow-auto max-w-xl gap-y-3">
	{#key filteredCodes}
		{#if filteredCodes.length === 0}
			<p>Loading...</p>
		{:else}
			{#each filteredCodes as code}
				<li key={code.docId}>
					<Card>
						<RedeemCode
							icon={gameIcons[code.game]}
							code={code.code}
							codeId={code.docId}
							expired={code.isExpired}
							game={code.game}
							used={code.used}
							on:checkUsed={hdlCheckUsed}
						/>
					</Card>
				</li>
			{/each}
		{/if}
	{/key}
</ul>
