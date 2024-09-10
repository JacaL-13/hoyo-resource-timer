import { error } from '@sveltejs/kit';

import scrape from 'website-scraper';

const options = {
	urls: ['http://nodejs.org/'],
	directory: './scraped-files/',
};

let lastScrapeTime = new Date();

const scrapeTimes = [18, 12, 6, 0];

export default async function GET() {
	// if the last scrape time was before the most recent scrape time then scrape the website
	// else return the last scrape time

	const nowHour = new Date().getHours();
	const lastScrapeHour = lastScrapeTime.getHours();

	const result = 'error'
	
	scrapeTimes.forEach(hour => {
		if (nowHour >= hour && lastScrapeHour < hour) {
			result = 'Last scrape time: ' + lastScrapeTime + ' next scrape time: ' + hour;
		}
	});

	return new Response(result);

	// const result = await scrape(options);

	// scrape(options)
	// 	.then((result) => {
	// 		console.log(result);
	// 	})
	// 	.catch((err) => {
	// 		console.error(err);
	// 	});
}
