import { writable } from 'svelte/store';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';

function authStore() {
	let unsubscribe;

	const auth = getAuth();

	if (!auth || !globalThis.window) {
		console.warn('Auth is not initialized or not in browser');

		const { subscribe } = writable(null);
		return { subscribe };
	}

	// const { subscribe } = writable(auth.currentUser ?? null, (set) => {
	// 	unsubscribe = onAuthStateChanged(auth, (user) => {
	// 		set(user);
	// 	});

	// 	return () => unsubscribe();
	// });

	// if not signed in, sign in anonymously
	const { subscribe } = writable(auth.currentUser ?? null, (set) => {
		unsubscribe = onAuthStateChanged(auth, (user) => {
			if (!user) {
				// sign in anonymously
				signInAnonymously(auth).then((userCredential) => {
					set(userCredential.user);
				});
			} else {
				set(user);
			}
		});

		return () => unsubscribe();
	});

	return {
		subscribe,
	};
}

export const user = authStore();
