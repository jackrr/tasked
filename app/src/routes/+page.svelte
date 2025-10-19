<script>
	import { onMount } from 'svelte';
	import Modal from '$lib/components/modal.svelte';
	import Input from '$lib/components/input.svelte';
	import { get, post } from '$lib/api';

	let projects = $state([]);
	let addingProject = $state(false);
	let newProjectTitle = $state();

	onMount(async () => {
		// TODO: fetch stats in follow-on request
		projects = await get('/projects');
	});

	async function createProject() {
		const newProj = await post('/projects', { title: newProjectTitle });
		console.log('got project', newProj);

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
