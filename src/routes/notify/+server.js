import schedule from 'node-schedule';

import { json } from '@sveltejs/kit';

import webPush from 'web-push';
import { PUBLIC_VAPID_KEY } from '$env/static/public';
import { PRIVATE_VAPID_KEY } from '$env/static/private';

import { adminDB } from '$lib/server/admin';

webPush.setVapidDetails(
	'https://hoyoresourcetimer.com',
	PUBLIC_VAPID_KEY,
	PRIVATE_VAPID_KEY,
);

console.log('server started')

let dbAlerts = [];

schedule.gracefulShutdown();

process.on('SIGINT', function () {
	schedule.gracefulShutdown().then(() => process.exit(0));
});

const query = adminDB.collection('alerts').where('isComplete', '==', false);

const unsubscribe = query.onSnapshot(async (querySnapshot) => {
	console.log('db change')
	
	const userSnap = await adminDB.collection('users').get();

	const users = userSnap.docs.map((doc) => {
		return { userId: doc.id, ...doc.data() };
	});

	const alertQuery = querySnapshot.docs.map((doc) => {
		const alert = { alertId: doc.id, ...doc.data() };
		const user = users.find((user) => user.userId === doc.data().userId);

		if (!user) {
			return;
		}

		const existingAlert = dbAlerts.find(
			(dbAlert) => dbAlert?.alertId === alert.alertId,
		);

		//if alert already in dbAlerts reschedule job else add and schedule job

		if (existingAlert) {
			if (existingAlert.completeTimeStamp === alert.completeTimeStamp) {
				return existingAlert;
			}

			existingAlert.job.cancel();

		}

		const job = scheduleAlert(alert, user.subscription);
		return { ...alert, job };
	}).filter((alert) => {
		//remove alerts that have no user
		return alert !== undefined;
	});

	//cancel all jobs that are not in alertQuery
	dbAlerts.forEach((dbAlert) => {
		const existingAlert = alertQuery.find(
			(alert) => alert?.alertId === dbAlert.alertId,
		);

		if (!existingAlert) {
			dbAlert.job.cancel();
		}
	});

	dbAlerts = alertQuery;
});

function scheduleAlert(alert, subscription) {
	const scheduleDate =
		alert.completeTimeStamp > new Date().valueOf() + 1000
			? new Date(alert.completeTimeStamp)
			: new Date(new Date().valueOf() + 1000);

	const job = schedule.scheduleJob(scheduleDate, () => {
		sendNotification(alert.alertId, alert, subscription);
	});
	return job;
}

async function sendNotification(alertId, alert, subscription) {
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
	await docRef.update({ isComplete: true });
}

export function GET() {
	return json(PUBLIC_VAPID_KEY);
}
