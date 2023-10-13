import { json } from '@sveltejs/kit';

import webPush from 'web-push';
import { PUBLIC_VAPID_KEY } from '$env/static/public';
import { PRIVATE_VAPID_KEY } from '$env/static/private';

import { app } from '$lib/firebase';

console.log('VAPID_PUBLIC_KEY: ', PUBLIC_VAPID_KEY);

webPush.setVapidDetails(
	'https://hoyoresourcetimer.com',
	PUBLIC_VAPID_KEY,
	PRIVATE_VAPID_KEY,
);

export function GET() {
	return json(PUBLIC_VAPID_KEY);
}

export async function POST(req) {
	const { description } = await req.json()
	
}