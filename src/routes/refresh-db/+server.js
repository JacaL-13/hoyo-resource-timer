import { error } from '@sveltejs/kit';

import { adminDB } from '$lib/server/admin';
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
} from 'firebase-admin/firestore';

import scrape from 'website-scraper';
import fs from 'fs';

const options = {
	urls: ['http://nodejs.org/'],
	directory: './scraped-files/',
};

// set to a date in the past to force a scrape
let lastScrapeTime = new Date('2021-01-01T00:00:00Z');

const scrapeTimes = [18, 12, 6, 0];


export async function GET() {
	const now = new Date();
	
	const todayScrapeTimes = scrapeTimes.map((hour) => {
		const date = new Date();
		date.setHours(hour, 0, 0, 0);
		return date;
	});
	
	const mostRecentScrapeTime = todayScrapeTimes.find((scrapeTime) => now > scrapeTime);

	if (lastScrapeTime < mostRecentScrapeTime) {
		// get the most recent scrape time from the database
		q = query(collection(adminDB, 'redeemCodes'), orderBy('updatedDT', 'desc'), limit(1));
		const querySnapshot = await getDocs(q);
		if (querySnapshot.empty) {
			throw error(500, 'No redeem codes found in the database');
		} else {
			lastScrapeTime = querySnapshot.docs[0].data().updatedDT.toDate();
		}

		console.debug('lastScrapeTime', lastScrapeTime, 'mostRecentScrapeTime', mostRecentScrapeTime);

	}

	let result = 'Codes last updated ' + lastScrapeTime;

	if (false) {
	// if (lastScrapeTime < mostRecentScrapeTime) {
		const folderName = new Date().toJSON().replace(/[^\w\s]/gi, '');

		const scrapeFiles = [
			{
				game: 'gi',
				fileName: 'gi.html',
				url: 'https://genshin-impact.fandom.com/wiki/Promotional_Code',
			},
			{
				game: 'gi',
				fileName: 'gi-expired.html',
				url: 'https://genshin-impact.fandom.com/wiki/Promotional_Code/History',
			},
			{
				game: 'hsr',
				fileName: 'hsr.html',
				url: 'https://honkai-star-rail.fandom.com/wiki/Redemption_Code',
			},
		];

		const urls = scrapeFiles.map((file) => {
			return {
				url: file.url,
				filename: file.fileName,
			};
		});

		console.debug('urls', urls);

		// do the scrape
		const options = {
			urls,
			directory: 'src/lib/server/scraped-files/' + folderName,
			sources: [],
		};

		const scrapeResult = await scrape(options);

		console.debug('scrapeResult', scrapeResult);

		scrapeFiles.forEach(file => {
			parseFile(file.game, folderName, file.fileName);
		});
	}

	return new Response(result);
}

async function parseFile(game, folderName, fileName) {
	const html = fs.readFileSync(
		`src/lib/server/scraped-files/${folderName}/${fileName}`,
		'utf8',
	);

	// find the table with class 'wikitable' and convert it to an array of objects
	const table = html.match(/<table class="wikitable[\s\S]*?<\/table>/g)[0];
	const rows = table.match(/<tr[\s\S]*?<\/tr>/g);
	const headers = rows[0].match(/<th[\s\S]*?<\/th>/g).map((header) => {
		return header.replace(/<[^>]*>/g, '').trim();
	});
	const codes = rows.slice(1).map((row) => {
		const cells = row.match(/<td[\s\S]*?<\/td>/g).map((cell) => {
			// Preserve line breaks while removing HTML tags
			return cell
				.replace(/<br\s*\/?>/gi, '\n')
				.replace(/<[^>]*>/g, '')
				.trim();
		});
		return headers.reduce((acc, header, i) => {
			acc[header] = cells[i];
			return acc;
		}, {});
	});

	const codesCleaned = codes.map((item) => {
		const code = item['Code'].split('\n')[0].split('[')[0];
		const expirationDate = item['Duration'].split('\n')[1].split(': ')[1];
		
		return {
			//remove all after '[' from code
			docId: game + '-' + code,
			game,
			code,
			server: item['Server'],
			isExpired: item['Duration'].toLowerCase().includes('expired'),
			discoveredDate: item['Duration'].split('\n')[0].split(': ')[1],
			expirationDate: expirationDate ? expirationDate : 'undefined',
			updatedDT: Timestamp.fromDate(new Date()),
		};
	});

	codesCleaned.forEach((code) => {
		console.debug('code', code.game, code.code, code.expirationDate);

		// upsert to database
		const res = adminDB.collection('redeemCodes').doc(code.docId).set(code);
	});

	

	// setDoc(doc(db, 'alerts', tableEntry.alertId), {
	// 	userId: tableEntry.userId,
	// 	alertValue: tableEntry.alertValue,
	// 	alertMessage: tableEntry.alertMessage,
	// 	completeTimeStamp,
	// 	completeTimeString,
	// 	isComplete,
	// 	createdAt: tableEntry.createdAt,
	// });
}
