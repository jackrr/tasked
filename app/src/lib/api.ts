const baseUrl = 'http://localhost:8000';

export async function get(path: string) {
	const result = await fetch(`${baseUrl}${path}`);

	return await result.json();
}

export async function post(path: string, body: object) {
	const result = await fetch(`${baseUrl}${path}`, {
		method: 'post',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	});

	return await result.json();
}
