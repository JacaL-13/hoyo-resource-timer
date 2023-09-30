<script>
	import Timers from '$lib/components/Timers.svelte';

	const maxResource = 240;
	const regenTime = 6; //6 minutes
	const localStorageId = 'Starrail';
	const resourceName = 'Trailblaze Power';
	const notifySrc = 'https://www.youtube.com/watch?v=KvKNieeClHc';

	const activityTable = [
		{
			activity: 'Calyx',
			cost: 60,
			reward: 'XP/Trace',
			timerSeconds: null,
			timerString: '--:--:--'
		},
		{
			activity: 'Cavern of Corrosion',
			cost: 40,
			reward: 'Relics',
			timerSeconds: null,
			timerString: '--:--:--'
		},
		{
			activity: 'Simulated Universe',
			cost: 40,
			reward: 'Ornaments',
			timerSeconds: null,
			timerString: '--:--:--'
		},
		{
			activity: 'Stagnant Shadow',
			cost: 30,
			reward: 'Ascension',
			timerSeconds: null,
			timerString: '--:--:--'
		},
		{
			activity: 'Echo of War',
			cost: 30,
			reward: 'Trace/Light Cones',
			timerSeconds: null,
			timerString: '--:--:--'
		}
	];
</script>

<Timers
	{maxResource}
	{regenTime}
	{localStorageId}
	{activityTable}
	{resourceName}
/>
