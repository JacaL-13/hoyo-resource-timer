<script>
	import Timers from '$lib/components/Timers.svelte';

	const maxResource = 160;
	const regenTime = 8; //8 minutes
	const localStorageId = 'Genshin';
	const resourceName = 'Original Resin'
	const weekBossName = 'Weekly Bosses'
	const notifySrc = ''

	// Ley Line Outcrops 20 (or 1× Condensed Resin)
	// Domains 	20 (or 1× Condensed Resin)
	// Normal Bosses 	40
	// Weekly Bosses 	30 (60 after 3rd claimed reward)

	let activityTable = [
		{
			activity: 'Ley Line Outcrops',
			cost: 20,
			reward: 'XP',
			timerSeconds: null,
			timerString: '--:--:--'
		},
		{
			activity: 'Domains',
			cost: 20,
			reward: 'Varies',
			timerSeconds: null,
			timerString: '--:--:--'
		},
		{
			activity: 'Weekly Bosses',
			cost: 30,
			modCost: 60,
			reward: 'Ascension',
			timerSeconds: null,
			timerString: '--:--:--'
		},
		{
			activity: 'Normal Bosses',
			cost: 40,
			reward: 'Ascension',
			timerSeconds: null,
			timerString: '--:--:--'
		},
	];

</script>

<Timers {maxResource} {regenTime} {localStorageId} {activityTable} {resourceName} {weekBossName} />
