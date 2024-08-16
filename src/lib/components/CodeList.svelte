<script>
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { v4 as uuidv4 } from 'uuid';
	import { browser } from '$app/environment';

	import Card from './Card.svelte';
	import RedeemCode from './RedeemCode.svelte';

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

	let codeList = [];

	// const q = query(
	// 		collection(db, 'alerts'),
	// 		where('userId', '==', auth.currentUser.uid),
	// 		orderBy('createdAt', 'asc'),
	// 	);

	// 	alertSnapshot = await getDocs(q);

	let querySnapshot;

	onMount(async () => {
		// Get all codes
		const q = query(collection(db, 'redeemCodes'));

		querySnapshot = await getDocs(q);

		console.log(querySnapshot);

		querySnapshot.forEach((doc) => {
			console.log(doc.data());
			
			codeList = [...codeList, doc.data()];
		});

		console.log(codeList.length);
	});
</script>

<h1 class="text-2xl font-bold my-5">Redeem Codes</h1>

<div class="flex flex-col w-full max-w-xl gap-y-3">
	{#if codeList.length === 0}
		<p>Loading...</p>
	{:else}
		{#each codeList as code}
			<Card>
				<RedeemCode
					code={code.code}
					expired={code.expired}
					game={code.game}
					verifications={code.verifications}
				/>
			</Card>
		{/each}
	{/if}
	
</div>