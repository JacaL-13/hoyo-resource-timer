<script>
	import Timers from '$lib/components/Timers.svelte';

	const props = {
		maxResource: 240,
		regenTime: 6, //6 minutes
		tabId: 'Starrail',
		resourceName: 'Trailblaze Power',
		weekBossName: 'Echo of War',
		// notifySrc: 'https://www.youtube.com/watch?v=KvKNieeClHc',
		activityTable: [
			{
				activity: 'Calyx',
				cost: 10,
				reward: 'XP/Trace',
				timerSeconds: null,
				timerString: '--:--:--',
			},
			{
				activity: 'Echo of War',
				cost: 30,
				modCost: 'No Reward',
				reward: 'Trace/Light Cones',
				timerSeconds: null,
				timerString: '--:--:--',
			},
			{
				activity: 'Stagnant Shadow',
				cost: 30,
				reward: 'Ascension',
				timerSeconds: null,
				timerString: '--:--:--',
			},
			{
				activity: 'Cavern of Corrosion',
				cost: 40,
				reward: 'Relics',
				timerSeconds: null,
				timerString: '--:--:--',
			},
			{
				activity: 'Simulated Universe',
				cost: 40,
				reward: 'Ornaments',
				timerSeconds: null,
				timerString: '--:--:--',
			},
		],
	};
</script>

<Timers {...props} />
