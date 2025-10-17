<script>
	let { value = $bindable(), placeholder } = $props();
</script>

<input type="text" {placeholder} bind:value />
