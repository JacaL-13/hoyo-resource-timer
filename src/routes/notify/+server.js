import schedule from 'node-schedule';

import { json } from '@sveltejs/kit';

import webPush from 'web-push';
import { PUBLIC_VAPID_KEY } from '$env/static/public';
import { PRIVATE_VAPID_KEY } from '$env/static/private';

// import { adminDB, adminAuth } from '$lib/server/admin';
import { collection, query, where, getDocs } from 'firebase/firestore';

import { waitUntil } from 'async-wait-until';

// console.log('starting server')

let timeoutId;

let nextNotifTime = Infinity;

// getNextNotifTime();

// async function getNextNotifTime() {
// 	console.log('getting next notif time')
// 	const q = query(collection(adminDB, 'alerts'));
// 	const querySnapshot = await getDocs(q).catch((error) => {
// 		console.log(error);
// 	});

// 	console.log(querySnapshot);
// }

webPush.setVapidDetails(
	'https://hoyoresourcetimer.com',
	PUBLIC_VAPID_KEY,
	PRIVATE_VAPID_KEY,
);

export function GET() {
	return json(PUBLIC_VAPID_KEY);
}

export async function POST({ request }) {
	const { body } = await request.json();

	// await waitUntil(() => nextNotifTime);

	const { completeTimeStamp } = body;

	console.log(completeTimeStamp < nextNotifTime);

	// if (completeTimeStamp < nextNotifTime) {
	// 	console.log('setting timer')
	// 	nextNotifTime = completeTimeStamp;
	// 	clearTimeout(timeoutId);
	// 	setTimeout(() => {

	// 	}, completeTimeStamp - Date.now());
	// }

	return json('ok');
}
