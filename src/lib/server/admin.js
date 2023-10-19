import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { FB_CLIENT_EMAIL, FB_PRIVATE_KEY, FB_PROJECT_ID } from '$env/static/private';

import pkg from 'firebase-admin';

const { privateKey } = JSON.parse(FB_PRIVATE_KEY);

const apps = getApps();

if (!apps.length) {
	pkg.initializeApp({
		credential: pkg.credential.cert({
			projectId: FB_PROJECT_ID,
			clientEmail: FB_CLIENT_EMAIL,
			privateKey: privateKey,
		}),
	});
}

export const adminDB = getFirestore();
export const adminAuth = getAuth();
