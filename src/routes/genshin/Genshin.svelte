<script>
	import Timers from '$lib/components/Timers.svelte';

	const props = {
		maxResource: 160,
		regenTime: 8, //8 minutes
		tabId: 'Genshin',
		resourceName: 'Original Resin',
		weekBossName: 'Weekly Bosses',
		notifySrc: '',
		activityTable: [
			{
				activity: 'Ley Line Outcrops',
				cost: 20,
				reward: 'XP',
				timerSeconds: null,
				timerString: '--:--:--',
			},
			{
				activity: 'Domains',
				cost: 20,
				reward: 'Varies',
				timerSeconds: null,
				timerString: '--:--:--',
			},
			{
				activity: 'Weekly Bosses',
				cost: 30,
				modCost: 60,
				reward: 'Ascension',
				timerSeconds: null,
				timerString: '--:--:--',
			},
			{
				activity: 'Normal Bosses',
				cost: 40,
				reward: 'Ascension',
				timerSeconds: null,
				timerString: '--:--:--',
			},
		],
	};
</script>

<Timers {...props} />
