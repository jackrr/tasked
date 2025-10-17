<script>
	import { onMount } from 'svelte';
	import Modal from '$lib/components/modal.svelte';
	import Input from '$lib/components/input.svelte';

	let projects = $state([]);
	let addingProject = $state(false);
	let newProjectTitle = $state();

	onMount(async () => {
		// TODO: configurable base URL
		const result = await fetch('http://localhost:8000/projects');
		projects = await result.json();
	});

	async function createProject() {
		const result = await fetch('http://localhost:8000/projects', {
			method: 'post',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ title: newProjectTitle })
		});

		// FIXME: why doesn't this hide the modal?
		addingProject = false;
		newProjectTitle = null;
	}
</script>

<h1>All Projects</h1>
<ul>
	{#each projects as project (project.id)}
		<li>
			<a href={`/projects/${project.id}`}>
				<h2>{project.title}</h2>
			</a>
		</li>
	{/each}
	<button onclick={() => (addingProject = true)}>+ Add Project</button>
</ul>
<Modal bind:show={addingProject}>
	{#snippet header()}
		<h2>New Project</h2>
	{/snippet}

	<Input placeholder="Make that project management software..." bind:value={newProjectTitle} />

	<button onclick={createProject}>Save</button>
</Modal>
