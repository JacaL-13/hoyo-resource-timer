<script>
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
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
	} from 'firebase/firestore';

	import { user } from '$lib/auth';

	let codeList = [];

	let codesSnapshot;
	let userToCodesSnapshot;

	onMount(async () => {
		// Get all codes
		let q = query(
			collection(db, 'redeemCodes'),
			orderBy('isExpired', 'asc'),
			orderBy('discoveredDate', 'desc'),
			orderBy('expirationDate', 'desc'),
			limit(10),
		);

		codesSnapshot = await getDocs(q);

		q = query(collection(db, 'usersToCodes'), where('userId', '==', $user.uid), where('codeId', 'in', codesSnapshot.docs.map((doc) => doc.id)));

		userToCodesSnapshot = await getDocs(q);

		// Get filters from local storage
		let filters = localStorage.getItem('filters');
		if (filters) {
			filters = JSON.parse(filters);
			filterList(filters);
		} else {
			filterList({ gi: true, hsr: true, zzz: true });
		}
	});

	function hdlChangeFilters(e) {
		let filters = e.detail;

		filterList(filters);
	}

	function filterList(filters) {
		codeList = [];

		codesSnapshot.forEach((doc) => {
			//get code used value
			const userCodeData = userToCodesSnapshot.docs.find(
				(userToCode) => userToCode.data().codeId === doc.id,
			);
			const codeUsed = userCodeData ? userCodeData.data().used : false;

			if (!filters.expired && doc.data().isExpired) {
				return;
			}
			if (filters[doc.data().game]) {
				const codeData = {
					...doc.data(),
					codeId: doc.id,
					used: codeUsed,
				};
				codeList = [...codeList, codeData];
			}
		});

		// sort code list by expired, used, discovered date, expiration date
		codeList.sort((a, b) => {
			if (a.isExpired === b.isExpired) {
				if (a.used === b.used) {
					if (a.discoveredDate === b.discoveredDate) {
						return a.expirationDate - b.expirationDate;
					}
					return a.discoveredDate - b.discoveredDate;
				}
				return a.used - b.used;
			}
			return a.isExpired - b.isExpired;
		});

		// orderBy('game'),
		// 	orderBy('isExpired', 'asc'),
		// 	orderBy('discoveredDate', 'desc'),
		// 	orderBy('expirationDate', 'desc'),
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

		const userToCode = userToCodesSnapshot.docs.find(
			(userToCode) => userToCode.data().codeId === codeId,
		);
		// if the userToCode exists, update the used value else create a new userToCode
		if (userToCode) {
			updateDoc(doc(db, 'usersToCodes', userToCode.id), {
				used,
			});
		} else {
			setDoc(doc(db, 'usersToCodes', uuidv4()), {
				userId: $user.uid,
				codeId,
				used,
				createdAt: Timestamp.now(),
			});
		}
	}
</script>

<h1 class="text-2xl font-bold my-5">Redeem Codes</h1>

<Filters on:changeFilters={hdlChangeFilters} />

<ul class="flex flex-col w-full max-w-xl gap-y-3">
	{#key codeList}
		{#if codeList.length === 0}
			<p>Loading...</p>
		{:else}
			{#each codeList as code}
				<li key={code.docId}>
					<Card>
						<RedeemCode
							icon={gameIcons[code.game]}
							code={code.code}
							codeId={code.codeId}
							expired={code.isExpired}
							game={code.game}
							bind:used={code.used}
							on:checkUsed={hdlCheckUsed}
						/>
					</Card>
				</li>
			{/each}
		{/if}
	{/key}
</ul>
