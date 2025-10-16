<script>
	// TODO: configurable base URL
	import { onMount } from 'svelte';

	async function init() {
		const result = await fetch("http://localhost:8000/projects");
		console.log(result)
		console.log(await result.json())
	}

	onMount(() => {
		init()
	})
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
