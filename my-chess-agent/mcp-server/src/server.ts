import { Implementation } from '@modelcontextprotocol/sdk/types.js';
import { McpHonoServerDO } from '@nullshot/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Chess } from 'chess.js';
import { z } from 'zod';

export class ChessAgentServer extends McpHonoServerDO<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	getImplementation(): Implementation {
		return {
			name: 'NullShotChessAI',
			version: '1.0.0',
		};
	}

	configureServer(server: McpServer): void {
		// Setup tools, resources, prompts here
		this.setupChessTools(server);
		this.setupChessResources(server);
		this.setupChessPrompts(server);
		this.setupBlockchainTools(server);
	}

	// Override to make sessionId optional for Inspector compatibility
	processSSEConnection(request: Request): Response {
		const url = new URL(request.url);
		let sessionId = url.searchParams.get('sessionId');

		// Auto-generate sessionId if not provided (for Inspector compatibility)
		if (!sessionId) {
			sessionId = `auto-${Date.now()}-${Math.random().toString(36).substring(7)}`;
			console.log(`[SSE] Auto-generated sessionId: ${sessionId}`);
		}

		// Add sessionId to URL and call parent implementation
		url.searchParams.set('sessionId', sessionId);
		const modifiedRequest = new Request(url.toString(), request);
		return super.processSSEConnection(modifiedRequest);
	}

	private setupChessTools(server: McpServer) {
		server.tool(
			'make_chess_move',
			'Generate and validate a chess move based on the current board state.',
			{
				fen: z.string().describe('Current board state in FEN notation'),
				side: z.enum(['white', 'black']).describe('Side to move (white or black)'),
				difficulty: z.enum(['easy', 'medium', 'hard']).optional().describe('AI difficulty level'),
			},
			async ({ fen, side, difficulty = 'medium' }) => {
				const chess = new Chess(fen);
				if (chess.turn() !== side[0]) {
					return { content: [{ type: 'text', text: 'Not your turn!' }] };
				}
				// AI logic: For demo, random move; enhance with LLM call via MCP/Anthropic
				const moves = chess.moves();
				if (moves.length === 0) {
					return { content: [{ type: 'text', text: 'Game over!' }] };
				}
				const move = moves[Math.floor(Math.random() * moves.length)];
				chess.move(move);
				return {
					content: [
						{
							type: 'text',
							text: `Moved: ${move}. New FEN: ${chess.fen()}`,
						},
					],
				};
			}
		);
	}

	private setupChessResources(server: McpServer) {
		server.resource('chess_game_state', 'resource://chess/game/{gameId}', async (uri: URL) => {
			const gameId = uri.pathname.split('/').pop();
			// Mock storage; use Cloudflare KV in production
			const state = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'; // Default FEN
			return {
				contents: [
					{
						text: state,
						uri: uri.href,
					},
				],
			};
		});
	}

	private setupChessPrompts(server: McpServer) {
		server.prompt('chess_strategy', 'Prompt for AI to think like a chess player.', () => ({
			messages: [
				{
					role: 'user',
					content: {
						type: 'text',
						text: 'You are NullShot AI, an expert chess player. Analyze the board and suggest strategic moves. Ensure that you opponent do not win you',
					},
				},
			],
		}));
	}

	private setupBlockchainTools(server: McpServer) {
		server.tool(
			'submit_game_result',
			'Submit chess game result to blockchain (AI wins or draws), using stored wallet key.',
			{
				gameId: z.string().describe('Unique game ID'),
				humanAddress: z.string().describe('Human player Ethereum address'),
				winner: z.enum(['human', 'ai', 'draw']).describe('Who won: human, ai, or draw'),
				signature: z.string().describe('Human signature for result (EIP-712)'),
			},
			async ({ gameId, humanAddress, winner, signature }) => {
				if (winner === 'human') {
					return { content: [{ type: 'text', text: 'Human won; frontend should submit directly.' }] };
				}

				try {
					// Import ethers dynamically
					const { ethers } = await import('ethers');

					// Get wallet private key from Cloudflare KV (requires KV binding in wrangler.jsonc)
					// Example: [[kv_namespaces]] binding = "KV_NAMESPACE" id = "your-kv-id"
					// Store key: wrangler kv:key put --binding=KV_NAMESPACE "AI_WALLET_KEY" "0xYourPrivateKey"
					const kv = (this.env as any).KV_NAMESPACE;
					if (!kv) {
						return {
							content: [
								{
									type: 'text',
									text: 'KV_NAMESPACE not configured. Add KV binding to wrangler.jsonc.',
								},
							],
						};
					}

					const privateKey = await kv.get('AI_WALLET_KEY');
					if (!privateKey) {
						return {
							content: [
								{
									type: 'text',
									text: 'Wallet key not found in KV. Store it with: wrangler kv:key put --binding=KV_NAMESPACE "AI_WALLET_KEY" "0x5527d5a87e9775c833c8ce7f817cf06b55631fa8364e411bfba9ab3f1c0c557d"',
								},
							],
						};
					}

					// Connect to blockchain (use Sepolia testnet or your preferred network)
					const rpcUrl = 'https://rpc.sepolia-api.lisk.com'; // Lisk Sepolia RPC
					const provider = new ethers.JsonRpcProvider(rpcUrl);
					const wallet = new ethers.Wallet(privateKey, provider);

					// Contract details (Deployed on Lisk Sepolia)
					const contractAddress = '0x9B7CeF0B7cFf1a46D2cEC347DCAD63C3c721a183';
					const abi = [
						'function submitAIGame(string memory gameId, address humanPlayer, bool humanWon, bool isDraw, bytes memory signature) external',
					];

					const contract = new ethers.Contract(contractAddress, abi, wallet);

					// Submit transaction
					const isDraw = winner === 'draw';
					const humanWon = false; // Ignored if isDraw is true
					const tx = await contract.submitAIGame(gameId, humanAddress, humanWon, isDraw, signature);
					await tx.wait();

					const resultText = isDraw ? 'Draw' : 'AI';

					return {
						content: [
							{
								type: 'text',
								text: `✅ Game result submitted to blockchain!\nTx hash: ${tx.hash}\nGame ID: ${gameId}\nResult: ${resultText}`,
							},
						],
					};
				} catch (error: any) {
					return {
						content: [
							{
								type: 'text',
								text: `❌ Error submitting to blockchain: ${error.message}`,
							},
						],
					};
				}
			}
		);
	}
}

export const ExampleMcpServer = ChessAgentServer;
