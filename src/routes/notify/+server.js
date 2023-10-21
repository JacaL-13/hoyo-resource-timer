import schedule from 'node-schedule';

import { json } from '@sveltejs/kit';

import webPush from 'web-push';
import { PUBLIC_VAPID_KEY } from '$env/static/public';
import { PRIVATE_VAPID_KEY } from '$env/static/private';

import { adminDB, adminAuth } from '$lib/server/admin';

import { waitUntil } from 'async-wait-until';

webPush.setVapidDetails(
	'https://hoyoresourcetimer.com',
	PUBLIC_VAPID_KEY,
	PRIVATE_VAPID_KEY,
);

let timeoutId;

let nextNotifTime = 86400000;

let dbAlerts = [];

schedule.gracefulShutdown();

const query = adminDB.collection('alerts').where('isComplete', '==', false);

const unsubscribe = query.onSnapshot(async (querySnapshot) => {
	schedule.gracefulShutdown()
	
	const userSnap = await adminDB.collection('users').get();

	const users = userSnap.docs.map((doc) => {
		return { userId: doc.id, ...doc.data() };
	});

	dbAlerts = querySnapshot.docs.map((doc) => {
		const alert = doc.data();

		const user = users.find((user) => user.userId === doc.data().userId);

		const scheduleDate =
			alert.completeTimeStamp > new Date().valueOf()
				? new Date(alert.completeTimeStamp)
				: new Date(new Date().valueOf() + 5000);

		const job = schedule.scheduleJob(scheduleDate, () => {
			sendNotification(doc.id, alert, user.subscription);
		});
		return { alertId: doc.id, ...alert };
	});
});

async function sendNotification(alertId, alert, subscription) {
	console.log('sendNotification', alertId, subscription)
	
	const payload = JSON.stringify({
		title: 'Hoyo Resource Timer',
		body: alert.alertMessage,
		icon: '/favicon.png',
		badge: '/favicon.png',
		data: { url: 'https://hoyoresourcetimer.com' },
	});

	console.log('payload', payload);

	webPush.sendNotification(subscription, payload).catch((error) => {
		console.error('webPush error', error.stack);
	});

	//update isComplete in db
	const docRef = adminDB.collection('alerts').doc(alertId);
	const dbRes = await docRef.update({ isComplete: true });
	console.log('dbRes', dbRes);
}

export function GET() {
	return json(PUBLIC_VAPID_KEY);
}
