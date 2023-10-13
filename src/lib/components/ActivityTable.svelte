<script>
	export let activityTable
	export let curResource
	export let weekBossName
	export let weekBossCounter
	export let regenTime
</script>

<table id="timer-table" class="table-sm">
	<tbody>
		<tr>
			<th class="header-row text-left">Activity</th>
			<th class="text-center">Cost</th>
			<th class="header-row text-left">Reward</th>
			<th class="text-center">Timer</th>
			<th class="text-center">Avail.</th>
		</tr>
		{#each activityTable as row}
			<tr
				class={curResource > row.cost - 1
					? 'bg-green-700 text-black'
					: ''}
			>
				<td class="text-row">{row.activity}</td>
				<td class="text-row text-center"
					>{row.activity === weekBossName && weekBossCounter <= 0
						? row.modCost
						: row.cost}</td
				>
				<td class="text-row">{row.reward}</td>
				<td class="text-row text-center">{row.timerString}</td>
				<td class="text-row text-center"
					>{curResource < row.cost
						? 0
						: Math.floor(curResource / row.cost) || '-'}</td
				>
			</tr>
			<tr style="line-height: 1px">
				<td class="p-0" colspan="5">
					<progress
						class="progress progress-success h-2 w-full"
						value={row.cost * regenTime * 60 - row.timerSeconds}
						max={row.cost * regenTime * 60}
					/>
				</td>
			</tr>
		{/each}
	</tbody>
</table>

<style>
	@media screen and (max-height: 860px) {
		.header-row {
			padding-left: 1vw;
		}

		#timer-table tr {
			line-height: 2vh;
			font-size: 2vh;
		}

		#timer-table td.text-row {
			padding: 0.5rem 1vw 0.5rem 1vw;
		}
	}
</style>