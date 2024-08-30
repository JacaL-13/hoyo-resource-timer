import { error } from '@sveltejs/kit';

import { adminDB } from '$lib/server/admin';
import { Timestamp } from 'firebase-admin/firestore';

import scrape from 'website-scraper';
import fs from 'fs';

const options = {
	urls: ['http://nodejs.org/'],
	directory: './scraped-files/',
};

// set to a date in the past to force a scrape
let lastScrapeTime = new Date('2021-01-01T00:00:00Z');

const scrapeTimes = [12, 0];

export async function GET() {
	const now = new Date();

	const todayScrapeTimes = scrapeTimes.map((hour) => {
		const date = new Date();
		date.setHours(hour, 0, 0, 0);
		return date;
	});

	const mostRecentScrapeTime = todayScrapeTimes.find((scrapeTime) => now > scrapeTime);

	if (lastScrapeTime < mostRecentScrapeTime) {
		// // get the most recent scrape time from the database
		// q = query(
		// 	collection(adminDB, 'redeemCodes'),
		// 	orderBy('updatedDT', 'desc'),
		// 	limit(1),
		// );
		// const querySnapshot = await getDocs(q);
		// if (querySnapshot.empty) {
		// 	throw error(500, 'No redeem codes found in the database');
		// } else {
		// 	lastScrapeTime = querySnapshot.docs[0].data().updatedDT.toDate();
		// }

		await adminDB
			.collection('redeemCodes')
			.orderBy('updatedDT', 'desc')
			.limit(1)
			.get()
			.then((querySnapshot) => {
				if (querySnapshot.empty) {
					throw error(500, 'No redeem codes found in the database');
				} else {
					lastScrapeTime = querySnapshot.docs[0].data().updatedDT.toDate();
				}
			});
	}

	let result = 'Codes last updated ' + lastScrapeTime;

	if (lastScrapeTime < mostRecentScrapeTime) {
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

		// do the scrape
		const options = {
			urls,
			directory: 'src/lib/server/scraped-files/' + folderName,
			sources: [],
		};

		const scrapeResult = await scrape(options);

		scrapeFiles.forEach((file) => {
			parseFile(file.game, folderName, file.fileName);
		});

		// Delete the scraped files
		fs.rm(
			`src/lib/server/scraped-files/${folderName}`,
			{ recursive: true },
			(err) => {
				if (err) {
					console.error(err);
					return;
				}
			},
		);
	}

	console.log(result);

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
		const cells = row.match(/<td[\s\S]*?<\/td>/g).map((cell, i) => {
			// If header is 'Code', extract <code> items into an array
			if (headers[i] === 'Code') {
				let codes = cell.match(/<code\b[^>]*>([\s\S]*?)<\/code>/g);

				if (codes) {
					codes = codes.map((code) => {
						return code.replace(/<[^>]*>/g, '').trim();
					});

					return codes;
				} else {
					// skip row
					return 'No codes, skip row';
				}
			}

			// Preserve line breaks while removing HTML tags
			return (
				cell
					.replace(/<[^>]*>/g, ' ')
					// Remove extra whitespace
					.replace(/\s+/g, ' ')
					.trim()
			);
		});
		return headers.reduce((acc, header, i) => {
			acc[header] = cells[i];
			return acc;
		}, {});
	});

	const codesCleaned = codes
		.filter((item) => item['Code'] !== 'No codes, skip row')
		.map((item) => {

			const code = item['Code'][0];

			let duration = item['Duration'];

			const isExpired = duration.toLowerCase().includes('expired');

			const durationSplit = duration.split(': ');

			let discoveredDate = durationSplit[1];
			let expirationDate = durationSplit[2];
			discoveredDate = discoveredDate.slice(0, discoveredDate.indexOf(',') + 6);
			expirationDate = expirationDate?.includes(',')
				? expirationDate.slice(0, expirationDate.indexOf(',') + 6)
				: null;

			discoveredDate = discoveredDate
				? Timestamp.fromDate(new Date(discoveredDate))
				: null;
			expirationDate = expirationDate
				? Timestamp.fromDate(new Date(expirationDate))
				: null;

			return {
				docId: game + '-' + code,
				game,
				code,
				server: item['Server'],
				isExpired: duration.toLowerCase().includes('expired'),
				discoveredDate,
				expirationDate,
				updatedDT: Timestamp.fromDate(new Date()),
			};
		});

	// check if latest code is already in database
	const checkDoc = await adminDB
		.collection('redeemCodes')
		.doc(codesCleaned[0].docId)
		.get();

	if (checkDoc.exists) {
		console.log('No new codes found.');
	} else {
		console.log('New codes found. Updating database.');

		codesCleaned.forEach((code) => {
			// upsert to database
			console.debug('inserting code', code)
			const res = adminDB.collection('redeemCodes').doc(code.docId).set(code);
		});
	}
}
