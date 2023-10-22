<script>
	import { page } from '$app/stores';

	import { app } from '$lib/firebase.js';
	import { getAnalytics, isSupported } from 'firebase/analytics';

	const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null)

	$: {
		if (typeof gtag !== 'undefined') {
			gtag('config', 'G-7C7CBDHQSZ', {
				page_title: document.title,
				page_path: $page.url.pathname,
			});
		}
	}
</script>

<svelte:head>
	<script async src="https://www.googletagmanager.com/gtag/js?id=G-7C7CBDHQSZ"></script>
	<script>
		window.dataLayer = window.dataLayer || [];
		function gtag() {
			dataLayer.push(arguments);
		}
		gtag('js', new Date());
		gtag('config', 'G-7C7CBDHQSZ');
	</script>
</svelte:head>
