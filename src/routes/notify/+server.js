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

let nextNotifTime = Infinity;

let alerts = [];

async function serverStart() {
	await getAlerts();

	nextNotifTime = getNextNotifTime();

	setTimer();
}

async function getAlerts() {
	console.log('getting next notif time');

	const alertsSnap = await adminDB.collection('alerts').get();
	alerts = alertsSnap.docs.map((doc) => {
		return { alertId: doc.id, ...doc.data() };
	});
}

function getNextNotifTime() {
	return alerts.reduce((acc, alert) => {
		if (alert.completeTimeStamp < acc) {
			return alert.completeTimeStamp;
		}
		return acc;
	}, Infinity);
}

function setTimer() {
	console.log(`Setting timer for ${(nextNotifTime - Date.now()) / 1000} seconds.`)
	clearTimeout(timeoutId);
	timeoutId = setTimeout(() => {
		sendNotifs();
	}, nextNotifTime - Date.now());
}

async function sendNotifs() {
	await getAlerts()

	const alertsToSend = alerts.filter((alert) => {
		return alert.completeTimeStamp <= Date.now() && !alert.isComplete;
	})

	console.log('alertsToSend', alertsToSend);
}

export function GET() {
	return json(PUBLIC_VAPID_KEY);
}

export async function POST({ request }) {
	const { body } = await request.json();

	if (body.completeTimeStamp < nextNotifTime) {
		nextNotifTime = body.completeTimeStamp;
		setTimer()
	}

	const { completeTimeStamp } = body;

	getAlerts();

	return json('ok');
}
