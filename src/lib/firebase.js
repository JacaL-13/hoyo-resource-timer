import { initializeApp } from 'firebase/app';

import { onMount } from 'svelte';

const firebaseConfig = {
	apiKey: 'AIzaSyBY2DpzKqf9vPQH5EUkt3FSPWGR_p57foU',
	authDomain: 'hoyo-resource-timer.firebaseapp.com',
	projectId: 'hoyo-resource-timer',
	storageBucket: 'hoyo-resource-timer.appspot.com',
	messagingSenderId: '870847368921',
	appId: '1:870847368921:web:9fb6fd1303d8f3da5b38c8',
	measurementId: 'G-7C7CBDHQSZ',
};

export const app = initializeApp(firebaseConfig);
