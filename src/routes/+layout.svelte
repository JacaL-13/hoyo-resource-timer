<script>
	import '../app.css';

	//import genshin and starrail pages
	import Starrail from './starrail/Starrail.svelte';
	import Genshin from './genshin/Genshin.svelte';

	import Toast from '$lib/components/Toast.svelte';

	import trailblazePower from '$lib/images/trailblaze-power.webp';
	import originalResin from '$lib/images/original-resin.webp';

	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	import { app } from '$lib/firebase';
	import { getMessaging, getToken } from 'firebase/messaging';

	import { PUBLIC_VAPID_KEY } from '$env/static/public';

	import { dev } from '$app/environment';

	let sub;

	onMount(async () => {
		// if ('serviceWorker' in navigator) {
		// 	navigator.serviceWorker
		// 		.register('firebase-messaging-sw.js', { type: dev ? 'module' : 'classic', scope: '/firebase-cloud-messaging-push-scope' })
		// 		.then(function (reg) {
		// 			// registration worked
		// 			console.log('Registration succeeded. Scope is ' + reg.scope);
		// 		})
		// 		.catch(function (error) {
		// 			// registration failed
		// 			console.log('Registration failed with ' + error);
		// 		});
		// }

		// const messaging = getMessaging(app);

		// getToken(messaging, { vapidKey: PUBLIC_VAPID_KEY })
		// 	.then((currentToken) => {
		// 		if (currentToken) {
		// 			console.log('current token for client: ', currentToken);
		// 		} else {
		// 			// Show permission request UI
		// 			console.log(
		// 				'No registration token available. Request permission to generate one.',
		// 			);
		// 			// ...
		// 		}
		// 	})
		// 	.catch((err) => {
		// 		console.log('An error occurred while retrieving token. ', err);
		// 		// ...
		// 	});

		// navigator.serviceWorker.register('/service-worker.js', {type: dev ? 'module' : 'classic'});
		// const reg = await navigator.serviceWorker.ready;
		// reg.pushManager.subscribe({ userVisibleOnly: true });

		
	});
</script>

<div class="tabs w-full absolute top-0 justify-center overflow-x-hidden text-white">
	<a
		href="/genshin"
		class="tab tab-lifted w-1/2 tab-lg"
		class:tab-active={$page.route.id?.includes('genshin')}
		class:tab-inactive={!$page.route.id?.includes('genshin')}
		>Genshin<img
			class="mx-1"
			src={originalResin}
			alt="Original Resin icon"
			width="32"
			height="32"
		/>
	</a>
	<a
		href="/starrail"
		class="tab tab-lifted w-1/2 tab-lg"
		class:tab-active={$page.route.id?.includes('starrail')}
		class:tab-inactive={!$page.route.id?.includes('starrail')}
		>Star Rail<img
			class="mx-2"
			src={trailblazePower}
			alt="Trailblaze Power icon"
			width="32"
			height="32"
		/></a
	>
</div>

<main class="flex flex-col items-center h-full overflow-hidden">
	<div
		class="flex flex-col h-full justify-center"
		class:hidden={!$page.route.id?.includes('genshin')}
	>
		<Genshin />
	</div>
	<div
		class="flex flex-col h-full justify-center"
		class:hidden={!$page.route.id?.includes('starrail')}
	>
		<Starrail />
	</div>

	{#if !($page.route.id?.includes('genshin') || $page.route.id?.includes('starrail'))}
		<slot />
	{/if}
</main>

<style>
	.tab-inactive {
		background-color: hsl(212, 18%, 12%);
		color: #a8a8a8;
	}
</style>
