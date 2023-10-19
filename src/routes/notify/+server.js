import schedule from 'node-schedule';

import { json } from '@sveltejs/kit';

import webPush from 'web-push';
import { PUBLIC_VAPID_KEY } from '$env/static/public';
import { PRIVATE_VAPID_KEY } from '$env/static/private';

import { adminDB, adminAuth } from '$lib/server/admin';
import { collection, query, where, getDocs } from 'firebase/firestore';

import { waitUntil } from 'async-wait-until';

webPush.setVapidDetails(
	'https://hoyoresourcetimer.com',
	PUBLIC_VAPID_KEY,
	PRIVATE_VAPID_KEY,
);

let timeoutId;

let nextNotifTime = 86400000;

let alerts = [];

schedule.gracefulShutdown();
const job = schedule.scheduleJob('*/10 * * * * *', sendNotifs);

console.log('setting timer');

async function getAlerts() {
	const alertsSnap = await adminDB.collection('alerts').get();
	alerts = alertsSnap.docs.map((doc) => {
		return { alertId: doc.id, ...doc.data() };
	});
}

async function sendNotifs() {
	await getAlerts();

	const alertsToSend = alerts.filter((alert) => {
		return alert.completeTimeStamp <= (Date.now().valueOf() + 5000) && !alert.isComplete;
	});

	console.log('alerts to send', alertsToSend);

	if (alertsToSend.length > 0) {
		const userSnap = await adminDB
			.collection('users')
			.get();
		const users = userSnap.docs.map((doc) => {
			return { userId: doc.id, ...doc.data() };
		})
		
		const batch = adminDB.batch();
		alertsToSend.forEach((alert) => {
			const subscription = users.find((user) => user.userId === alert.userId).subscription
			
			//send notification
			const payload = JSON.stringify({
				title: 'Hoyo Resource Timer',
				body: alert.alertMessage,
				icon: '/favicon.png',
				badge: '/favicon.png',
				data: {
					url: 'https://hoyoresourcetimer.com',
				},
			});

			webPush.sendNotification(subscription, payload).catch((error) => {
				console.error(error.stack);
			});
			const docRef = adminDB.collection('alerts').doc(alert.alertId);
			batch.update(docRef, {
				isComplete: true,
			});
		});
		await batch.commit();
		console.log('commit batch');
	}
}

export function GET() {
	return json(PUBLIC_VAPID_KEY);
}
