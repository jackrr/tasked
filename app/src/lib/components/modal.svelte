<script>
	// heavily borrowed from https://svelte.dev/playground/modal?version=5.40.2
	let { show = $bindable(), header, children } = $props();
	let dialog = $state();

	$effect(() => {
		if (show) dialog.showModal();
	});
</script>

<dialog
	bind:this={dialog}
	onclose={() => (show = false)}
	onclick={(e) => {
		if (e.target === dialog) dialog.close();
	}}
>
	<div>
		{@render header?.()}
		<hr />
		{@render children?.()}
	</div>
</dialog>
