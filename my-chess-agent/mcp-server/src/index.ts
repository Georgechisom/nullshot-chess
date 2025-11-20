import { ExampleMcpServer } from './server';
// Export the ExampleMcpServer class for Durable Object binding
export { ExampleMcpServer };

// Worker entrypoint for handling incoming requests
export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const method = request.method;
		const pathname = url.pathname;

		console.log(`[Worker] ${method} ${pathname}`);

		// Handle CORS preflight
		if (method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
			});
		}

		// Use a single, stable Durable Object instance for all MCP connections
		// This ensures session persistence across requests
		const id = env.EXAMPLE_MCP_SERVER.idFromName('mcp-session');

		console.log(`[Worker] Routing to DO instance: mcp-session, path: ${pathname}`);

		// Forward the request to the Durable Object
		try {
			const stub = env.EXAMPLE_MCP_SERVER.get(id);
			const response = await stub.fetch(request);

			console.log(`[Worker] Response status: ${response.status}`);

			// Add CORS headers to response
			const headers = new Headers(response.headers);
			headers.set('Access-Control-Allow-Origin', '*');
			headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
			headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

			return new Response(response.body, {
				status: response.status,
				statusText: response.statusText,
				headers,
			});
		} catch (err) {
			console.error(`[Worker] Error calling Durable Object:`, err);
			return new Response(
				JSON.stringify({
					error: err instanceof Error ? err.message : 'Unknown error',
					details: 'Failed to route request to Durable Object',
				}),
				{
					status: 500,
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*',
					},
				}
			);
		}
	},
};
