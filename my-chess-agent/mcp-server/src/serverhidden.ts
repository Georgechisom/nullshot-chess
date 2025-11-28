// import { Implementation } from '@modelcontextprotocol/sdk/types.js';
// import { McpHonoServerDO } from '@nullshot/mcp';
// import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// import { Chess } from 'chess.js';
// import { z } from 'zod';

// export class ChessAgentServer extends McpHonoServerDO<Env> {
// 	constructor(ctx: DurableObjectState, env: Env) {
// 		super(ctx, env);
// 	}

// 	getImplementation(): Implementation {
// 		return {
// 			name: 'NullShotChessAI',
// 			version: '1.0.0',
// 		};
// 	}

// 	configureServer(server: McpServer): void {
// 		// Setup tools, resources, prompts here
// 		this.setupChessTools(server);
// 		this.setupChessResources(server);
// 		this.setupChessPrompts(server);
// 		this.setupBlockchainTools(server);
// 	}

// 	// Override to make sessionId optional for Inspector compatibility
// 	processSSEConnection(request: Request): Response {
// 		const url = new URL(request.url);
// 		let sessionId = url.searchParams.get('sessionId');

// 		// Auto-generate sessionId if not provided (for Inspector compatibility)
// 		if (!sessionId) {
// 			sessionId = `auto-${Date.now()}-${Math.random().toString(36).substring(7)}`;
// 			console.log(`[SSE] Auto-generated sessionId: ${sessionId}`);
// 		}

// 		// Add sessionId to URL and call parent implementation
// 		url.searchParams.set('sessionId', sessionId);
// 		const modifiedRequest = new Request(url.toString(), request);
// 		return super.processSSEConnection(modifiedRequest);
// 	}

// 	private setupChessTools(server: McpServer) {
// 		server.tool(
// 			'make_chess_move',
// 			'Generate and validate a chess move based on the current board state.',
// 			{
// 				fen: z.string().describe('Current board state in FEN notation'),
// 				side: z.enum(['white', 'black']).describe('Side to move (white or black)'),
// 				difficulty: z.enum(['easy', 'medium', 'hard']).optional().describe('AI difficulty level'),
// 			},
// 			async ({ fen, side, difficulty = 'medium' }) => {
// 				const chess = new Chess(fen);
// 				if (chess.turn() !== side[0]) {
// 					return { content: [{ type: 'text', text: 'Not your turn!' }] };
// 				}
// 				// AI logic: For demo, random move; enhance with LLM call via MCP/Anthropic
// 				const moves = chess.moves();
// 				if (moves.length === 0) {
// 					return { content: [{ type: 'text', text: 'Game over!' }] };
// 				}
// 				const move = moves[Math.floor(Math.random() * moves.length)];
// 				chess.move(move);
// 				return {
// 					content: [
// 						{
// 							type: 'text',
// 							text: `Moved: ${move}. New FEN: ${chess.fen()}`,
// 						},
// 					],
// 				};
// 			}
// 		);
// 	}

// 	private setupChessResources(server: McpServer) {
// 		server.resource('chess_game_state', 'resource://chess/game/{gameId}', async (uri: URL) => {
// 			const gameId = uri.pathname.split('/').pop();
// 			// Mock storage; use Cloudflare KV in production
// 			const state = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'; // Default FEN
// 			return {
// 				contents: [
// 					{
// 						text: state,
// 						uri: uri.href,
// 					},
// 				],
// 			};
// 		});
// 	}

// 	private setupChessPrompts(server: McpServer) {
// 		server.prompt('chess_strategy', 'Prompt for AI to think like a chess player.', () => ({
// 			messages: [
// 				{
// 					role: 'user',
// 					content: {
// 						type: 'text',
// 						text: 'You are NullShot AI, an expert chess player. Analyze the board and suggest strategic moves. Ensure that you opponent do not win you and you win all games',
// 					},
// 				},
// 			],
// 		}));
// 	}

// 	private setupBlockchainTools(server: McpServer) {
// 		server.tool(
// 			'submit_game_result',
// 			'Submit chess game result to blockchain (AI wins or draws), using stored wallet key.',
// 			{
// 				gameId: z.string().describe('Unique game ID'),
// 				humanAddress: z.string().describe('Human player Ethereum address'),
// 				winner: z.enum(['human', 'ai', 'draw']).describe('Who won: human, ai, or draw'),
// 				signature: z.string().describe('Human signature for result (EIP-712)'),
// 			},
// 			async ({ gameId, humanAddress, winner, signature }) => {
// 				if (winner === 'human') {
// 					return { content: [{ type: 'text', text: 'Human won; frontend should submit directly.' }] };
// 				}

// 				try {
// 					// Import ethers dynamically
// 					const { ethers } = await import('ethers');

// 					// Get wallet private key from Cloudflare KV (requires KV binding in wrangler.jsonc)
// 					// Example: [[kv_namespaces]] binding = "KV_NAMESPACE" id = "your-kv-id"
// 					// Store key: wrangler kv:key put --binding=KV_NAMESPACE "AI_WALLET_KEY" "0xYourPrivateKey"
// 					const kv = (this.env as any).KV_NAMESPACE;
// 					if (!kv) {
// 						return {
// 							content: [
// 								{
// 									type: 'text',
// 									text: 'KV_NAMESPACE not configured. Add KV binding to wrangler.jsonc.',
// 								},
// 							],
// 						};
// 					}

// 					const privateKey = await kv.get('AI_WALLET_KEY');
// 					if (!privateKey) {
// 						return {
// 							content: [
// 								{
// 									type: 'text',
// 									text: 'Wallet key not found in KV. Store it with: wrangler kv:key put --binding=KV_NAMESPACE "AI_WALLET_KEY" "0x5527d5a87e9775c833c8ce7f817cf06b55631fa8364e411bfba9ab3f1c0c557d"',
// 								},
// 							],
// 						};
// 					}

// 					// Connect to blockchain (use Sepolia testnet or your preferred network)
// 					const rpcUrl = 'https://rpc.sepolia-api.lisk.com'; // Lisk Sepolia RPC
// 					const provider = new ethers.JsonRpcProvider(rpcUrl);
// 					const wallet = new ethers.Wallet(privateKey, provider);

// 					// Contract details (Deployed on Lisk Sepolia)
// 					const contractAddress = '0x9B7CeF0B7cFf1a46D2cEC347DCAD63C3c721a183';
// 					const abi = [
// 						'function submitAIGame(string memory gameId, address humanPlayer, bool humanWon, bool isDraw, bytes memory signature) external',
// 					];

// 					const contract = new ethers.Contract(contractAddress, abi, wallet);

// 					// Submit transaction
// 					const isDraw = winner === 'draw';
// 					const humanWon = false; // Ignored if isDraw is true
// 					const tx = await contract.submitAIGame(gameId, humanAddress, humanWon, isDraw, signature);
// 					await tx.wait();

// 					const resultText = isDraw ? 'Draw' : 'AI';

// 					return {
// 						content: [
// 							{
// 								type: 'text',
// 								text: `✅ Game result submitted to blockchain!\nTx hash: ${tx.hash}\nGame ID: ${gameId}\nResult: ${resultText}`,
// 							},
// 						],
// 					};
// 				} catch (error: any) {
// 					return {
// 						content: [
// 							{
// 								type: 'text',
// 								text: `❌ Error submitting to blockchain: ${error.message}`,
// 							},
// 						],
// 					};
// 				}
// 			}
// 		);
// 	}
// }

// export const ExampleMcpServer = ChessAgentServer;

// api

// import { Implementation } from '@modelcontextprotocol/sdk/types.js';
// import { McpHonoServerDO } from '@nullshot/mcp';
// import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// import { Chess } from 'chess.js';
// import { z } from 'zod';
// import type { Env } from './env';
// import { cors } from 'hono/cors';

// export class ChessAgentServer extends McpHonoServerDO<Env> {
// 	constructor(ctx: DurableObjectState, env: Env) {
// 		super(ctx, env);
// 	}

// 	getImplementation(): Implementation {
// 		return {
// 			name: 'NullShotChessAI',
// 			version: '1.0.0',
// 		};
// 	}

// 	// ========== ADD REST API ROUTES HERE ==========
// 	configureRoutes(app: any): void {
// 		// Enable CORS for all routes
// 		app.use(
// 			'*',
// 			cors({
// 				origin: '*',
// 				allowMethods: ['GET', 'POST', 'OPTIONS'],
// 				allowHeaders: ['Content-Type'],
// 				maxAge: 86400,
// 			})
// 		);

// 		// Health check endpoint
// 		app.get('/api/health', (c: any) => {
// 			return c.json({
// 				status: 'ok',
// 				service: 'NullShot Chess MCP Server',
// 				version: '1.0.0',
// 			});
// 		});

// 		// Chess move endpoint - calls the strategic move function
// 		app.post('/api/chess/move', async (c: any) => {
// 			try {
// 				const body = await c.req.json();
// 				const { fen, side, difficulty = 'hard' } = body;

// 				if (!fen || !side) {
// 					return c.json({ error: 'Missing fen or side parameter' }, 400);
// 				}

// 				console.log(`[API] Move request - Side: ${side}, Difficulty: ${difficulty}`);

// 				// Use the same strategic function as MCP tools
// 				const move = await this.getStrategicMoveWithClaude(fen, side, difficulty);

// 				const chess = new Chess(fen);
// 				chess.move(move);

// 				return c.json({
// 					move,
// 					fen: chess.fen(),
// 					newFen: chess.fen(),
// 					success: true,
// 				});
// 			} catch (error: any) {
// 				console.error('[API] Error in /api/chess/move:', error);
// 				return c.json(
// 					{
// 						error: error.message,
// 						success: false,
// 					},
// 					500
// 				);
// 			}
// 		});

// 		// Game submission endpoint (optional - for direct API calls)
// 		app.post('/api/chess/submit', async (c: any) => {
// 			try {
// 				const body = await c.req.json();
// 				const { gameId, humanAddress, winner, signature } = body;

// 				if (!gameId || !humanAddress || !winner || !signature) {
// 					return c.json({ error: 'Missing required parameters' }, 400);
// 				}

// 				// Call the blockchain submission logic
// 				const result = await this.submitGameToBlockchain(gameId, humanAddress, winner, signature);
// 				return c.json(result);
// 			} catch (error: any) {
// 				console.error('[API] Error in /api/chess/submit:', error);
// 				return c.json({ error: error.message, success: false }, 500);
// 			}
// 		});
// 	}

// 	configureServer(server: McpServer): void {
// 		this.setupChessTools(server);
// 		this.setupChessResources(server);
// 		this.setupChessPrompts(server);
// 		this.setupBlockchainTools(server);
// 	}

// 	processSSEConnection(request: Request): Response {
// 		const url = new URL(request.url);
// 		let sessionId = url.searchParams.get('sessionId');

// 		if (!sessionId) {
// 			sessionId = `auto-${Date.now()}-${Math.random().toString(36).substring(7)}`;
// 			console.log(`[SSE] Auto-generated sessionId: ${sessionId}`);
// 		}

// 		url.searchParams.set('sessionId', sessionId);
// 		const modifiedRequest = new Request(url.toString(), request);
// 		return super.processSSEConnection(modifiedRequest);
// 	}

// 	// ========== STRATEGIC MOVE WITH CLAUDE API ==========
// 	private async getStrategicMoveWithClaude(fen: string, side: string, difficulty: string): Promise<string> {
// 		try {
// 			const chess = new Chess(fen);
// 			const legalMoves = chess.moves({ verbose: true });

// 			// Get API key from environment
// 			const apiEnv = this.env as Env;
// 			const apiKey = apiEnv.AI_PROVIDER_API_KEY ?? apiEnv.ANTHROPIC_API_KEY;

// 			if (!apiKey) {
// 				console.warn('No API key found, using fallback minimax algorithm');
// 				return this.getStrategicMoveFallback(fen, side, difficulty);
// 			}

// 			console.log(`[Claude] Requesting move for ${side} at ${difficulty} difficulty`);

// 			const response = await fetch('https://api.anthropic.com/v1/messages', {
// 				method: 'POST',
// 				headers: {
// 					'Content-Type': 'application/json',
// 					'x-api-key': apiKey,
// 					'anthropic-version': '2023-06-01',
// 				},
// 				body: JSON.stringify({
// 					model: 'claude-sonnet-4-20250514',
// 					max_tokens: 1024,
// 					messages: [
// 						{
// 							role: 'user',
// 							content: `You are NullShot AI, an expert chess engine playing at ${difficulty} level.

// 							Position (FEN): ${fen}
// 							You are playing as: ${side}

// 							Legal moves available (SAN notation): ${legalMoves.map((m) => m.san).join(', ')}

// 							INSTRUCTIONS:
// 							${
// 								difficulty === 'hard'
// 									? `HARD MODE - Play like a 2500+ ELO grandmaster:
// 							- Calculate 4-5 moves ahead
// 							- Prioritize forcing moves (checks, captures, threats)
// 							- Look for tactical patterns (forks, pins, skewers, discovered attacks)
// 							- Control the center (e4, e5, d4, d5)
// 							- Attack the opponent's king aggressively
// 							- NEVER miss hanging pieces - always capture free material
// 							- Create threats that force opponent into bad positions
// 							- Look for checkmate patterns`
// 									: difficulty === 'medium'
// 									? `MEDIUM MODE - Play like a 1800 ELO player:
// 							- Calculate 3 moves ahead
// 							- Look for simple tactics (captures, checks)
// 							- Develop pieces logically
// 							- Control center squares
// 							- Protect your king with pawns`
// 									: `EASY MODE - Play like a 2500+ ELO grandmaster:
// 							- Calculate 4-5 moves ahead
// 							- Prioritize forcing moves (checks, captures, threats)
// 							- Look for tactical patterns (forks, pins, skewers, discovered attacks)
// 							- Control the center (e4, e5, d4, d5)
// 							- Attack the opponent's king aggressively
// 							- NEVER miss hanging pieces - always capture free material
// 							- Create threats that force opponent into bad positions
// 							- Look for checkmate patternss`
// 							}

// 							CRITICAL: You MUST respond with ONLY the move in SAN notation (e.g., "Nf3", "e4", "Qxf7+", "O-O").
// 							No explanation, no preamble, just the move notation.`,
// 						},
// 					],
// 				}),
// 			});

// 			if (!response.ok) {
// 				throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
// 			}

// 			const data: any = await response.json();
// 			const aiMove = data.content[0].text.trim();

// 			console.log(`[Claude] Suggested move: ${aiMove}`);

// 			// Validate the move
// 			const validMove = legalMoves.find((m) => m.san === aiMove || m.lan === aiMove || m.from + m.to === aiMove);

// 			if (validMove) {
// 				return validMove.san;
// 			}

// 			console.warn(`[Claude] Invalid move returned: ${aiMove}, using fallback`);
// 			return this.getStrategicMoveFallback(fen, side, difficulty);
// 		} catch (error: any) {
// 			console.error('[Claude] Error:', error.message);
// 			return this.getStrategicMoveFallback(fen, side, difficulty);
// 		}
// 	}

// 	// ========== FALLBACK MINIMAX ALGORITHM ==========
// 	private readonly PIECE_VALUES: { [key: string]: number } = {
// 		p: 100,
// 		n: 320,
// 		b: 330,
// 		r: 500,
// 		q: 900,
// 		k: 20000,
// 	};

// 	private getStrategicMoveFallback(fen: string, side: string, difficulty: string): string {
// 		console.log(`[Minimax] Using fallback for ${side} at ${difficulty}`);

// 		const chess = new Chess(fen);
// 		const moves = chess.moves({ verbose: true });

// 		if (moves.length === 0) return '';

// 		const depth = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4;

// 		let bestMove = moves[0].san;
// 		let bestValue = -Infinity;

// 		// Prioritize tactical moves for hard difficulty
// 		const priorityMoves = moves.filter((m) => m.captured || m.san.includes('+') || m.san.includes('#'));
// 		const movesToEvaluate = priorityMoves.length > 0 && difficulty === 'hard' ? priorityMoves : moves;

// 		for (const move of movesToEvaluate) {
// 			chess.move(move.san);
// 			const value = this.minimax(chess, depth - 1, -Infinity, Infinity, false);
// 			chess.undo();

// 			const adjustedValue = difficulty === 'easy' ? value + Math.random() * 100 - 50 : value;

// 			if (adjustedValue > bestValue) {
// 				bestValue = adjustedValue;
// 				bestMove = move.san;
// 			}
// 		}

// 		return bestMove;
// 	}

// 	private minimax(chess: Chess, depth: number, alpha: number, beta: number, maximizing: boolean): number {
// 		if (depth === 0 || chess.isGameOver()) {
// 			return this.evaluateBoard(chess);
// 		}

// 		const moves = chess.moves();

// 		if (maximizing) {
// 			let maxEval = -Infinity;
// 			for (const move of moves) {
// 				chess.move(move);
// 				const evaluation = this.minimax(chess, depth - 1, alpha, beta, false);
// 				chess.undo();
// 				maxEval = Math.max(maxEval, evaluation);
// 				alpha = Math.max(alpha, evaluation);
// 				if (beta <= alpha) break;
// 			}
// 			return maxEval;
// 		} else {
// 			let minEval = Infinity;
// 			for (const move of moves) {
// 				chess.move(move);
// 				const evaluation = this.minimax(chess, depth - 1, alpha, beta, true);
// 				chess.undo();
// 				minEval = Math.min(minEval, evaluation);
// 				beta = Math.min(beta, evaluation);
// 				if (beta <= alpha) break;
// 			}
// 			return minEval;
// 		}
// 	}

// 	private evaluateBoard(chess: Chess): number {
// 		if (chess.isCheckmate()) {
// 			return chess.turn() === 'w' ? -9999 : 9999;
// 		}
// 		if (chess.isDraw() || chess.isStalemate()) {
// 			return 0;
// 		}

// 		let score = 0;
// 		const board = chess.board();

// 		for (let i = 0; i < 8; i++) {
// 			for (let j = 0; j < 8; j++) {
// 				const piece = board[i][j];
// 				if (piece) {
// 					const value = this.PIECE_VALUES[piece.type] || 0;
// 					score += piece.color === 'b' ? value : -value;
// 				}
// 			}
// 		}

// 		// Center control
// 		const centerSquares = ['e4', 'e5', 'd4', 'd5'];
// 		centerSquares.forEach((square) => {
// 			const piece = chess.get(square as any);
// 			if (piece) {
// 				score += piece.color === 'b' ? 30 : -30;
// 			}
// 		});

// 		return score;
// 	}

// 	// ========== MCP TOOLS ==========
// 	private setupChessTools(server: McpServer) {
// 		server.tool(
// 			'make_chess_move',
// 			'Generate and validate a chess move based on the current board state.',
// 			{
// 				fen: z.string().describe('Current board state in FEN notation'),
// 				side: z.enum(['white', 'black']).describe('Side to move (white or black)'),
// 				difficulty: z.enum(['easy', 'medium', 'hard']).optional().describe('AI difficulty level'),
// 			},
// 			async ({ fen, side, difficulty = 'hard' }) => {
// 				const chess = new Chess(fen);
// 				if (chess.turn() !== side[0]) {
// 					return { content: [{ type: 'text', text: 'Not your turn!' }] };
// 				}

// 				const moves = chess.moves();
// 				if (moves.length === 0) {
// 					return { content: [{ type: 'text', text: 'Game over!' }] };
// 				}

// 				const move = await this.getStrategicMoveWithClaude(fen, side, difficulty);
// 				chess.move(move);

// 				return {
// 					content: [
// 						{
// 							type: 'text',
// 							text: `Moved: ${move}. New FEN: ${chess.fen()}`,
// 						},
// 					],
// 				};
// 			}
// 		);
// 	}

// 	private setupChessResources(server: McpServer) {
// 		server.resource('chess_game_state', 'resource://chess/game/{gameId}', async (uri: URL) => {
// 			const gameId = uri.pathname.split('/').pop();
// 			const state = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
// 			return {
// 				contents: [
// 					{
// 						text: state,
// 						uri: uri.href,
// 					},
// 				],
// 			};
// 		});
// 	}

// 	private setupChessPrompts(server: McpServer) {
// 		server.prompt('chess_strategy', 'Prompt for AI to think like a chess player.', () => ({
// 			messages: [
// 				{
// 					role: 'user',
// 					content: {
// 						type: 'text',
// 						text: 'You are NullShot AI, powered by Claude. Analyze positions deeply and play winning chess.',
// 					},
// 				},
// 			],
// 		}));
// 	}

// 	// ========== BLOCKCHAIN TOOLS ==========
// 	private setupBlockchainTools(server: McpServer) {
// 		server.tool(
// 			'submit_game_result',
// 			'Submit chess game result to blockchain (AI wins or draws), using stored wallet key.',
// 			{
// 				gameId: z.string().describe('Unique game ID'),
// 				humanAddress: z.string().describe('Human player Ethereum address'),
// 				winner: z.enum(['human', 'ai', 'draw']).describe('Who won: human, ai, or draw'),
// 				signature: z.string().describe('Human signature for result (EIP-712)'),
// 			},
// 			async ({ gameId, humanAddress, winner, signature }) => {
// 				const result = await this.submitGameToBlockchain(gameId, humanAddress, winner, signature);
// 				return { content: [{ type: 'text', text: result.message }] };
// 			}
// 		);
// 	}

// 	// ========== BLOCKCHAIN SUBMISSION LOGIC ==========
// 	private async submitGameToBlockchain(
// 		gameId: string,
// 		humanAddress: string,
// 		winner: 'human' | 'ai' | 'draw',
// 		signature: string
// 	): Promise<{ success: boolean; message: string; txHash?: string }> {
// 		if (winner === 'human') {
// 			return {
// 				success: false,
// 				message: 'Human won; frontend should submit directly.',
// 			};
// 		}

// 		try {
// 			const { ethers } = await import('ethers');

// 			const kv = (this.env as any).KV_NAMESPACE;
// 			if (!kv) {
// 				return {
// 					success: false,
// 					message: 'KV_NAMESPACE not configured.',
// 				};
// 			}

// 			const privateKey = await kv.get('AI_WALLET_KEY');
// 			if (!privateKey) {
// 				return {
// 					success: false,
// 					message: 'Wallet key not found in KV.',
// 				};
// 			}

// 			const rpcUrl = 'https://rpc.sepolia-api.lisk.com';
// 			const provider = new ethers.JsonRpcProvider(rpcUrl);
// 			const wallet = new ethers.Wallet(privateKey, provider);

// 			const contractAddress = '0x9B7CeF0B7cFf1a46D2cEC347DCAD63C3c721a183';
// 			const abi = [
// 				'function submitAIGame(string memory gameId, address humanPlayer, bool humanWon, bool isDraw, bytes memory signature) external',
// 			];

// 			const contract = new ethers.Contract(contractAddress, abi, wallet);

// 			const isDraw = winner === 'draw';
// 			const humanWon = false;
// 			const tx = await contract.submitAIGame(gameId, humanAddress, humanWon, isDraw, signature);
// 			await tx.wait();

// 			const resultText = isDraw ? 'Draw' : 'AI';

// 			return {
// 				success: true,
// 				message: `✅ Game result submitted to blockchain!\nTx hash: ${tx.hash}\nGame ID: ${gameId}\nResult: ${resultText}`,
// 				txHash: tx.hash,
// 			};
// 		} catch (error: any) {
// 			return {
// 				success: false,
// 				message: `❌ Error submitting to blockchain: ${error.message}`,
// 			};
// 		}
// 	}
// }

// export const ExampleMcpServer = ChessAgentServer;

// dc error reject code

// import { Implementation } from '@modelcontextprotocol/sdk/types.js';
// import { McpHonoServerDO } from '@nullshot/mcp';
// import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// import { Chess } from 'chess.js';
// import { z } from 'zod';
// import type { Env } from './env';

// export class ChessAgentServer extends McpHonoServerDO<Env> {
// 	constructor(ctx: DurableObjectState, env: Env) {
// 		super(ctx, env);
// 	}

// 	getImplementation(): Implementation {
// 		return {
// 			name: 'NullShotChessAI',
// 			version: '1.0.0',
// 		};
// 	}

// 	override async fetch(request: Request): Promise<Response> {
// 		const url = new URL(request.url);
// 		const pathname = url.pathname;

// 		console.log(`[DO] ${request.method} ${pathname}`);

// 		if (request.method === 'OPTIONS') {
// 			return new Response(null, {
// 				status: 204,
// 				headers: {
// 					'Access-Control-Allow-Origin': '*',
// 					'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
// 					'Access-Control-Allow-Headers': 'Content-Type',
// 					'Access-Control-Max-Age': '86400',
// 				},
// 			});
// 		}

// 		if (pathname === '/api/health') {
// 			return new Response(
// 				JSON.stringify({
// 					status: 'ok',
// 					service: 'NullShot Chess MCP Server',
// 					version: '1.0.0',
// 				}),
// 				{
// 					headers: {
// 						'Content-Type': 'application/json',
// 						'Access-Control-Allow-Origin': '*',
// 					},
// 				}
// 			);
// 		}

// 		if (pathname === '/api/chess/move' && request.method === 'POST') {
// 			try {
// 				const body: any = await request.json();
// 				const { fen, side, difficulty = 'hard' } = body;

// 				if (!fen || !side) {
// 					return new Response(JSON.stringify({ error: 'Missing fen or side parameter' }), {
// 						status: 400,
// 						headers: {
// 							'Content-Type': 'application/json',
// 							'Access-Control-Allow-Origin': '*',
// 						},
// 					});
// 				}

// 				console.log(`[API] Move request - Side: ${side}, Difficulty: ${difficulty}`);

// 				const move = await this.getStrategicMoveWithClaude(fen, side, difficulty);
// 				const chess = new Chess(fen);
// 				chess.move(move);

// 				return new Response(
// 					JSON.stringify({
// 						move,
// 						fen: chess.fen(),
// 						newFen: chess.fen(),
// 						success: true,
// 					}),
// 					{
// 						headers: {
// 							'Content-Type': 'application/json',
// 							'Access-Control-Allow-Origin': '*',
// 						},
// 					}
// 				);
// 			} catch (error: any) {
// 				console.error('[API] Error in /api/chess/move:', error);
// 				return new Response(
// 					JSON.stringify({
// 						error: error.message,
// 						success: false,
// 					}),
// 					{
// 						status: 500,
// 						headers: {
// 							'Content-Type': 'application/json',
// 							'Access-Control-Allow-Origin': '*',
// 						},
// 					}
// 				);
// 			}
// 		}

// 		if (pathname === '/api/chess/submit' && request.method === 'POST') {
// 			try {
// 				const body: any = await request.json();
// 				const { gameId, humanAddress, winner, signature } = body;

// 				if (!gameId || !humanAddress || !winner || !signature) {
// 					return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
// 						status: 400,
// 						headers: {
// 							'Content-Type': 'application/json',
// 							'Access-Control-Allow-Origin': '*',
// 						},
// 					});
// 				}

// 				const result = await this.submitGameToBlockchain(gameId, humanAddress, winner, signature);
// 				return new Response(JSON.stringify(result), {
// 					headers: {
// 						'Content-Type': 'application/json',
// 						'Access-Control-Allow-Origin': '*',
// 					},
// 				});
// 			} catch (error: any) {
// 				console.error('[API] Error in /api/chess/submit:', error);
// 				return new Response(JSON.stringify({ error: error.message, success: false }), {
// 					status: 500,
// 					headers: {
// 						'Content-Type': 'application/json',
// 						'Access-Control-Allow-Origin': '*',
// 					},
// 				});
// 			}
// 		}

// 		return super.fetch(request);
// 	}

// 	configureServer(server: McpServer): void {
// 		this.setupChessTools(server);
// 		this.setupChessResources(server);
// 		this.setupChessPrompts(server);
// 		this.setupBlockchainTools(server);
// 	}

// 	processSSEConnection(request: Request): Response {
// 		const url = new URL(request.url);
// 		let sessionId = url.searchParams.get('sessionId');

// 		if (!sessionId) {
// 			sessionId = `auto-${Date.now()}-${Math.random().toString(36).substring(7)}`;
// 			console.log(`[SSE] Auto-generated sessionId: ${sessionId}`);
// 		}

// 		url.searchParams.set('sessionId', sessionId);
// 		const modifiedRequest = new Request(url.toString(), request);
// 		return super.processSSEConnection(modifiedRequest);
// 	}

// 	// ========== ULTIMATE STRATEGIC MOVE GENERATOR ==========
// 	private async getStrategicMoveWithClaude(fen: string, side: string, difficulty: string): Promise<string> {
// 		try {
// 			const chess = new Chess(fen);
// 			const legalMoves = chess.moves({ verbose: true });

// 			const apiEnv = this.env as Env;
// 			const apiKey = apiEnv.AI_PROVIDER_API_KEY ?? apiEnv.ANTHROPIC_API_KEY;

// 			if (!apiKey) {
// 				console.warn('[Claude] No API key, using enhanced fallback');
// 				return this.getUltraStrategicMoveFallback(fen, side, difficulty);
// 			}

// 			console.log(`[Claude] Requesting ULTIMATE move for ${side} at ${difficulty}`);

// 			// Analyze position context
// 			const inCheck = chess.inCheck();
// 			const turnNumber = Math.floor(chess.moveNumber());
// 			const phase = turnNumber < 10 ? 'opening' : turnNumber < 25 ? 'middlegame' : 'endgame';

// 			const response = await fetch('https://api.anthropic.com/v1/messages', {
// 				method: 'POST',
// 				headers: {
// 					'Content-Type': 'application/json',
// 					'x-api-key': apiKey,
// 					'anthropic-version': '2023-06-01',
// 				},
// 				body: JSON.stringify({
// 					model: 'claude-sonnet-4-20250514',
// 					max_tokens: 2048,
// 					messages: [
// 						{
// 							role: 'user',
// 							content: `You are NullShot AI - a RUTHLESS, UNBEATABLE chess engine at SUPER-GRANDMASTER level (3000+ ELO).

// 							━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 							CURRENT POSITION ANALYSIS
// 							━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 							FEN: ${fen}
// 							You are: ${side.toUpperCase()}
// 							Game Phase: ${phase.toUpperCase()}
// 							Turn Number: ${turnNumber}
// 							In Check: ${inCheck ? 'YES - MUST DEFEND!' : 'NO'}
// 							Legal Moves (SAN): ${legalMoves.map((m) => m.san).join(', ')}

// 							━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 							YOUR MISSION: CRUSH THE OPPONENT - NEVER LOSE
// 							━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 							${
// 								difficulty === 'hard'
// 									? `🔥 HARD MODE - ULTRA-GRANDMASTER (3000+ ELO) 🔥

// 							STRATEGIC IMPERATIVES:
// 							┌────────────────────────────────────────────────────┐
// 							│ 1. CALCULATE 6-7 MOVES DEEP - No shallow thinking │
// 							│ 2. NEVER REPEAT OPENING PATTERNS - Be unpredictable│
// 							│ 3. KING SAFETY IS PARAMOUNT - Never expose your king│
// 							│ 4. EVERY MOVE MUST HAVE MULTIPLE THREATS           │
// 							│ 5. THINK LIKE ALPHAZERO - Sacrifice for position   │
// 							└────────────────────────────────────────────────────┘

// 							PHASE-SPECIFIC INSTRUCTIONS:

// 							${
// 								phase === 'opening'
// 									? `🎯 OPENING STRATEGY (Moves 1-10):
// 							• VARY your openings - randomize between: e4/d4/Nf3/c4/g3
// 							• Control center with PIECES not just pawns
// 							• Develop knights before bishops
// 							• Castle EARLY (by move 8) unless tactical reason not to
// 							• Create pawn tension, don't exchange too early
// 							• Look for UNORTHODOX moves (b3, g3, a3) to confuse opponent
// 							• AVOID book moves after move 4 - think independently!`
// 									: phase === 'middlegame'
// 									? `⚔️ MIDDLEGAME WARFARE (Moves 11-25):
// 							• Identify weakest enemy square - ATTACK IT RELENTLESSLY
// 							• Stack rooks on open files
// 							• Create pawn storms against enemy king
// 							• Exchange pieces when ahead, avoid when behind
// 							• Every piece MUST have an active role
// 							• Look for SHOCKING sacrifices that lead to forced wins
// 							• Find the move that opponent LEAST expects
// 							• Create multiple threats SIMULTANEOUSLY`
// 									: `👑 ENDGAME MASTERY (Moves 26+):
// 							• Activate king as attacking piece
// 							• Create passed pawns aggressively
// 							• Cut off enemy king from action
// 							• Calculate every variation to mate
// 							• Zugzwang positions - force opponent into bad moves
// 							• NEVER ALLOW PERPETUAL CHECK
// 							• Push passed pawns with king support`
// 							}

// 							TACTICAL PRIORITIES (CHECK EVERY MOVE):
// 							┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// 							┃ ✓ Is opponent's king exposed? ATTACK IT!        ┃
// 							┃ ✓ Can I fork/pin/skewer? EXECUTE IT!            ┃
// 							┃ ✓ Are there hanging pieces? CAPTURE THEM!       ┃
// 							┃ ✓ Can I win material? TAKE IT!                  ┃
// 							┃ ✓ Does this move put me in danger? REJECT IT!   ┃
// 							┃ ✓ Is my king safe after this move? VERIFY!      ┃
// 							┃ ✓ Does opponent have counter-tactics? PREVENT!  ┃
// 							┃ ✓ Am I being predictable? RANDOMIZE!            ┃
// 							┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

// 							ANTI-PATTERN CHECKS:
// 							❌ DON'T move same piece twice in opening
// 							❌ DON'T expose king to attacks (CRITICAL!)
// 							❌ DON'T ignore opponent's threats
// 							❌ DON'T make passive moves - ALWAYS threaten something
// 							❌ DON'T play predictable sequences
// 							❌ DON'T trade queens without positional advantage
// 							❌ DON'T push pawns that weaken your king

// 							MOVE SELECTION ALGORITHM:
// 							1. Find ALL forcing moves (checks, captures, threats)
// 							2. Evaluate each for king safety (yours AND opponent's)
// 							3. Calculate 6-7 moves ahead for each candidate
// 							4. Choose the move with:
// 							- Maximum positional advantage
// 							- Unpredictable element (not obvious)
// 							- Multiple threats created
// 							- Perfect king safety
// 							- NO weaknesses left behind

// 							UNPREDICTABILITY REQUIREMENT:
// 							• If position has been seen before: Choose 2nd or 3rd best move
// 							• Add positional randomness: Vary plans between games
// 							• Psychological warfare: Make moves opponent won't expect`
// 									: difficulty === 'medium'
// 									? `MEDIUM MODE (2200 ELO):
// 							• Calculate 4 moves ahead
// 							• Look for simple tactics (forks, pins)
// 							• Develop pieces harmoniously
// 							• Castle early for safety
// 							• Control central squares
// 							• Capture hanging pieces
// 							• Avoid obvious blunders`
// 									: `EASY MODE (1500 ELO):
// 							• Calculate 2-3 moves ahead
// 							• Make solid developing moves
// 							• Sometimes miss simple tactics
// 							• Castle when possible
// 							• Try to control center`
// 							}

// 							━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 							RESPONSE FORMAT
// 							━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 							Respond with ONLY the move in SAN notation.
// 							Examples: "Nf3", "e4", "Qxf7+", "O-O-O", "Bxh7+"

// 							NO explanations. NO analysis. JUST THE MOVE.

// 							Think deeply. Choose the UNBEATABLE move. Make opponent fear you.`,
// 						},
// 					],
// 				}),
// 			});

// 			if (!response.ok) {
// 				throw new Error(`Claude API: ${response.status}`);
// 			}

// 			const data: any = await response.json();
// 			const aiMove = data.content[0].text.trim();

// 			console.log(`[Claude] ULTIMATE MOVE: ${aiMove}`);

// 			const validMove = legalMoves.find((m) => m.san === aiMove || m.lan === aiMove || m.from + m.to === aiMove);

// 			if (validMove) {
// 				return validMove.san;
// 			}

// 			console.warn(`[Claude] Invalid move: ${aiMove}, using ultra-fallback`);
// 			return this.getUltraStrategicMoveFallback(fen, side, difficulty);
// 		} catch (error: any) {
// 			console.error('[Claude] Error:', error.message);
// 			return this.getUltraStrategicMoveFallback(fen, side, difficulty);
// 		}
// 	}

// 	// ========== ENHANCED FALLBACK WITH DEEP ANALYSIS ==========
// 	private readonly PIECE_VALUES: { [key: string]: number } = {
// 		p: 100,
// 		n: 320,
// 		b: 330,
// 		r: 500,
// 		q: 900,
// 		k: 20000,
// 	};

// 	private readonly PAWN_POSITION_BONUS = [
// 		0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 27, 27, 10, 5, 5, 0, 0, 0, 25, 25, 0,
// 		0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -25, -25, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
// 	];

// 	private readonly KNIGHT_POSITION_BONUS = [
// 		-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30,
// 		-30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50,
// 	];

// 	private getUltraStrategicMoveFallback(fen: string, side: string, difficulty: string): string {
// 		console.log(`[ULTRA-MINIMAX] Computing UNBEATABLE move for ${side} at ${difficulty}`);

// 		const chess = new Chess(fen);
// 		const moves = chess.moves({ verbose: true });
// 		if (moves.length === 0) return '';

// 		// Deeper search for harder difficulty
// 		const depth = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;

// 		// Categorize moves by type
// 		const checkMoves = moves.filter((m) => m.san.includes('+') || m.san.includes('#'));
// 		const captureMoves = moves.filter((m) => m.captured);
// 		const developmentMoves = moves.filter((m) => !m.captured && !m.san.includes('+'));

// 		let bestMove = moves[0].san;
// 		let bestValue = -Infinity;

// 		// Prioritize tactical moves in hard mode
// 		const movePool =
// 			difficulty === 'hard' && (checkMoves.length > 0 || captureMoves.length > 0)
// 				? [...checkMoves, ...captureMoves, ...developmentMoves.slice(0, 5)]
// 				: moves;

// 		// Add unpredictability: shuffle moves slightly for variety
// 		const shuffledMoves = difficulty === 'hard' ? this.shuffleTopMoves(movePool, 3) : movePool;

// 		for (const move of shuffledMoves) {
// 			chess.move(move.san);

// 			// Deeper evaluation with king safety check
// 			let value = this.minimax(chess, depth - 1, -Infinity, Infinity, false);

// 			// Bonus for king safety
// 			value += this.evaluateKingSafety(chess, side === 'white' ? 'w' : 'b');

// 			// Penalty for exposing own king
// 			value -= this.evaluateKingSafety(chess, side === 'white' ? 'b' : 'w') * 0.5;

// 			chess.undo();

// 			// Add slight randomness to avoid predictability
// 			const randomness = difficulty === 'hard' ? (Math.random() - 0.5) * 30 : difficulty === 'easy' ? (Math.random() - 0.5) * 150 : 0;
// 			const adjustedValue = value + randomness;

// 			if (adjustedValue > bestValue) {
// 				bestValue = adjustedValue;
// 				bestMove = move.san;
// 			}
// 		}

// 		console.log(`[ULTRA-MINIMAX] Selected: ${bestMove} (Value: ${bestValue.toFixed(0)})`);
// 		return bestMove;
// 	}

// 	// Shuffle top N moves to add variety
// 	private shuffleTopMoves(moves: any[], topN: number): any[] {
// 		const top = moves.slice(0, Math.min(topN, moves.length));
// 		const rest = moves.slice(topN);

// 		for (let i = top.length - 1; i > 0; i--) {
// 			const j = Math.floor(Math.random() * (i + 1));
// 			[top[i], top[j]] = [top[j], top[i]];
// 		}

// 		return [...top, ...rest];
// 	}

// 	private minimax(chess: Chess, depth: number, alpha: number, beta: number, maximizing: boolean): number {
// 		if (depth === 0 || chess.isGameOver()) {
// 			return this.evaluateBoard(chess);
// 		}

// 		const moves = chess.moves();

// 		if (maximizing) {
// 			let maxEval = -Infinity;
// 			for (const move of moves) {
// 				chess.move(move);
// 				const evaluation = this.minimax(chess, depth - 1, alpha, beta, false);
// 				chess.undo();
// 				maxEval = Math.max(maxEval, evaluation);
// 				alpha = Math.max(alpha, evaluation);
// 				if (beta <= alpha) break;
// 			}
// 			return maxEval;
// 		} else {
// 			let minEval = Infinity;
// 			for (const move of moves) {
// 				chess.move(move);
// 				const evaluation = this.minimax(chess, depth - 1, alpha, beta, true);
// 				chess.undo();
// 				minEval = Math.min(minEval, evaluation);
// 				beta = Math.min(beta, evaluation);
// 				if (beta <= alpha) break;
// 			}
// 			return minEval;
// 		}
// 	}

// 	private evaluateBoard(chess: Chess): number {
// 		if (chess.isCheckmate()) return chess.turn() === 'w' ? -20000 : 20000;
// 		if (chess.isDraw() || chess.isStalemate()) return 0;

// 		let score = 0;
// 		const board = chess.board();

// 		// Material and position
// 		for (let i = 0; i < 8; i++) {
// 			for (let j = 0; j < 8; j++) {
// 				const piece = board[i][j];
// 				if (piece) {
// 					const value = this.PIECE_VALUES[piece.type] || 0;
// 					const posBonus = this.getPositionBonus(piece.type, i, j, piece.color);
// 					score += piece.color === 'b' ? value + posBonus : -(value + posBonus);
// 				}
// 			}
// 		}

// 		// Center control bonus
// 		const centerSquares = ['e4', 'e5', 'd4', 'd5'];
// 		centerSquares.forEach((square) => {
// 			const piece = chess.get(square as any);
// 			if (piece) score += piece.color === 'b' ? 40 : -40;
// 		});

// 		// Mobility bonus
// 		const mobility = chess.moves().length;
// 		score += chess.turn() === 'b' ? mobility * 10 : -mobility * 10;

// 		return score;
// 	}

// 	private getPositionBonus(pieceType: string, row: number, col: number, color: string): number {
// 		const index = color === 'w' ? (7 - row) * 8 + col : row * 8 + col;
// 		if (pieceType === 'p') return this.PAWN_POSITION_BONUS[index] || 0;
// 		if (pieceType === 'n') return this.KNIGHT_POSITION_BONUS[index] || 0;
// 		return 0;
// 	}

// 	private evaluateKingSafety(chess: Chess, color: string): number {
// 		const board = chess.board();
// 		let kingRow = -1,
// 			kingCol = -1;

// 		// Find king
// 		for (let i = 0; i < 8; i++) {
// 			for (let j = 0; j < 8; j++) {
// 				const piece = board[i][j];
// 				if (piece && piece.type === 'k' && piece.color === color) {
// 					kingRow = i;
// 					kingCol = j;
// 				}
// 			}
// 		}

// 		if (kingRow === -1) return 0;

// 		let safety = 0;

// 		// Count pawns around king (shield)
// 		const directions = [
// 			[-1, -1],
// 			[-1, 0],
// 			[-1, 1],
// 			[0, -1],
// 			[0, 1],
// 			[1, -1],
// 			[1, 0],
// 			[1, 1],
// 		];
// 		directions.forEach(([dr, dc]) => {
// 			const r = kingRow + dr;
// 			const c = kingCol + dc;
// 			if (r >= 0 && r < 8 && c >= 0 && c < 8) {
// 				const piece = board[r][c];
// 				if (piece && piece.type === 'p' && piece.color === color) {
// 					safety += 50;
// 				}
// 			}
// 		});

// 		// Penalty if king is in center (exposed)
// 		if (kingRow >= 2 && kingRow <= 5 && kingCol >= 2 && kingCol <= 5) {
// 			safety -= 100;
// 		}

// 		return safety;
// 	}

// 	// ========== MCP TOOLS ==========
// 	private setupChessTools(server: McpServer) {
// 		server.tool(
// 			'make_chess_move',
// 			'Generate chess move.',
// 			{
// 				fen: z.string(),
// 				side: z.enum(['white', 'black']),
// 				difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
// 			},
// 			async ({ fen, side, difficulty = 'hard' }) => {
// 				const chess = new Chess(fen);
// 				if (chess.turn() !== side[0]) {
// 					return { content: [{ type: 'text', text: 'Not your turn!' }] };
// 				}

// 				const moves = chess.moves();
// 				if (moves.length === 0) {
// 					return { content: [{ type: 'text', text: 'Game over!' }] };
// 				}

// 				const move = await this.getStrategicMoveWithClaude(fen, side, difficulty);
// 				chess.move(move);

// 				return {
// 					content: [{ type: 'text', text: `Moved: ${move}. New FEN: ${chess.fen()}` }],
// 				};
// 			}
// 		);
// 	}

// 	private setupChessResources(server: McpServer) {
// 		server.resource('chess_game_state', 'resource://chess/game/{gameId}', async (uri: URL) => {
// 			const state = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
// 			return { contents: [{ text: state, uri: uri.href }] };
// 		});
// 	}

// 	private setupChessPrompts(server: McpServer) {
// 		server.prompt('chess_strategy', 'Ultimate chess strategy.', () => ({
// 			messages: [
// 				{
// 					role: 'user',
// 					content: { type: 'text', text: 'You are NullShot AI - unbeatable, unpredictable, unstoppable.' },
// 				},
// 			],
// 		}));
// 	}

// 	private setupBlockchainTools(server: McpServer) {
// 		server.tool(
// 			'submit_game_result',
// 			'Submit game to blockchain.',
// 			{
// 				gameId: z.string(),
// 				humanAddress: z.string(),
// 				winner: z.enum(['human', 'ai', 'draw']),
// 				signature: z.string(),
// 			},
// 			async ({ gameId, humanAddress, winner, signature }) => {
// 				const result = await this.submitGameToBlockchain(gameId, humanAddress, winner, signature);
// 				return { content: [{ type: 'text', text: result.message }] };
// 			}
// 		);
// 	}

// 	private async submitGameToBlockchain(
// 		gameId: string,
// 		humanAddress: string,
// 		winner: 'human' | 'ai' | 'draw',
// 		signature: string
// 	): Promise<{ success: boolean; message: string; txHash?: string }> {
// 		if (winner === 'human') {
// 			return { success: false, message: 'Human won; frontend submits.' };
// 		}

// 		try {
// 			const { ethers } = await import('ethers');
// 			const kv = (this.env as any).KV_NULLSHOTCHESS;
// 			if (!kv) return { success: false, message: 'KV not configured.' };

// 			const privateKey = await kv.get('AI_WALLET_KEY');
// 			if (!privateKey) return { success: false, message: 'Wallet key not found.' };

// 			const provider = new ethers.JsonRpcProvider('https://rpc.sepolia-api.lisk.com');
// 			const wallet = new ethers.Wallet(privateKey, provider);

// 			const contract = new ethers.Contract(
// 				'0x9B7CeF0B7cFf1a46D2cEC347DCAD63C3c721a183',
// 				['function submitAIGame(string memory gameId, address humanPlayer, bool humanWon, bool isDraw, bytes memory signature) external'],
// 				wallet
// 			);

// 			const tx = await contract.submitAIGame(gameId, humanAddress, false, winner === 'draw', signature);
// 			await tx.wait();

// 			return {
// 				success: true,
// 				message: `✅ Victory recorded on blockchain!\nTx: ${tx.hash}`,
// 				txHash: tx.hash,
// 			};
// 		} catch (error: any) {
// 			return { success: false, message: `❌ Error: ${error.message}` };
// 		}
// 	}
// }

// export const ExampleMcpServer = ChessAgentServer;

// optimize code

// import { Implementation } from '@modelcontextprotocol/sdk/types.js';
// import { McpHonoServerDO } from '@nullshot/mcp';
// import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// import { Chess } from 'chess.js';
// import { z } from 'zod';
// import type { Env } from './env';

// export class ChessAgentServer extends McpHonoServerDO<Env> {
// 	constructor(ctx: DurableObjectState, env: Env) {
// 		super(ctx, env);
// 	}

// 	getImplementation(): Implementation {
// 		return {
// 			name: 'NullShotChessAI',
// 			version: '1.0.0',
// 		};
// 	}

// 	override async fetch(request: Request): Promise<Response> {
// 		const url = new URL(request.url);
// 		const pathname = url.pathname;

// 		console.log(`[DO] ${request.method} ${pathname}`);

// 		if (request.method === 'OPTIONS') {
// 			return new Response(null, {
// 				status: 204,
// 				headers: {
// 					'Access-Control-Allow-Origin': '*',
// 					'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
// 					'Access-Control-Allow-Headers': 'Content-Type',
// 					'Access-Control-Max-Age': '86400',
// 				},
// 			});
// 		}

// 		if (pathname === '/api/health') {
// 			return new Response(
// 				JSON.stringify({
// 					status: 'ok',
// 					service: 'NullShot Chess MCP Server',
// 					version: '1.0.0',
// 				}),
// 				{
// 					headers: {
// 						'Content-Type': 'application/json',
// 						'Access-Control-Allow-Origin': '*',
// 					},
// 				}
// 			);
// 		}

// 		if (pathname === '/api/chess/move' && request.method === 'POST') {
// 			try {
// 				const body: any = await request.json();
// 				const { fen, side, difficulty = 'hard' } = body;

// 				if (!fen || !side) {
// 					return new Response(JSON.stringify({ error: 'Missing fen or side parameter' }), {
// 						status: 400,
// 						headers: {
// 							'Content-Type': 'application/json',
// 							'Access-Control-Allow-Origin': '*',
// 						},
// 					});
// 				}

// 				console.log(`[API] Move request - Side: ${side}, Difficulty: ${difficulty}`);

// 				const move = await this.getStrategicMoveWithClaude(fen, side, difficulty);
// 				const chess = new Chess(fen);
// 				chess.move(move);

// 				return new Response(
// 					JSON.stringify({
// 						move,
// 						fen: chess.fen(),
// 						newFen: chess.fen(),
// 						success: true,
// 					}),
// 					{
// 						headers: {
// 							'Content-Type': 'application/json',
// 							'Access-Control-Allow-Origin': '*',
// 						},
// 					}
// 				);
// 			} catch (error: any) {
// 				console.error('[API] Error in /api/chess/move:', error);
// 				return new Response(
// 					JSON.stringify({
// 						error: error.message,
// 						success: false,
// 					}),
// 					{
// 						status: 500,
// 						headers: {
// 							'Content-Type': 'application/json',
// 							'Access-Control-Allow-Origin': '*',
// 						},
// 					}
// 				);
// 			}
// 		}

// 		if (pathname === '/api/chess/submit' && request.method === 'POST') {
// 			try {
// 				const body: any = await request.json();
// 				const { gameId, humanAddress, winner, signature } = body;

// 				if (!gameId || !humanAddress || !winner || !signature) {
// 					return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
// 						status: 400,
// 						headers: {
// 							'Content-Type': 'application/json',
// 							'Access-Control-Allow-Origin': '*',
// 						},
// 					});
// 				}

// 				const result = await this.submitGameToBlockchain(gameId, humanAddress, winner, signature);
// 				return new Response(JSON.stringify(result), {
// 					headers: {
// 						'Content-Type': 'application/json',
// 						'Access-Control-Allow-Origin': '*',
// 					},
// 				});
// 			} catch (error: any) {
// 				console.error('[API] Error in /api/chess/submit:', error);
// 				return new Response(JSON.stringify({ error: error.message, success: false }), {
// 					status: 500,
// 					headers: {
// 						'Content-Type': 'application/json',
// 						'Access-Control-Allow-Origin': '*',
// 					},
// 				});
// 			}
// 		}

// 		return super.fetch(request);
// 	}

// 	configureServer(server: McpServer): void {
// 		this.setupChessTools(server);
// 		this.setupChessResources(server);
// 		this.setupChessPrompts(server);
// 		this.setupBlockchainTools(server);
// 	}

// 	processSSEConnection(request: Request): Response {
// 		const url = new URL(request.url);
// 		let sessionId = url.searchParams.get('sessionId');

// 		if (!sessionId) {
// 			sessionId = `auto-${Date.now()}-${Math.random().toString(36).substring(7)}`;
// 			console.log(`[SSE] Auto-generated sessionId: ${sessionId}`);
// 		}

// 		url.searchParams.set('sessionId', sessionId);
// 		const modifiedRequest = new Request(url.toString(), request);
// 		return super.processSSEConnection(modifiedRequest);
// 	}

// 	// ========== ULTIMATE STRATEGIC MOVE GENERATOR ==========
// 	private async getStrategicMoveWithClaude(fen: string, side: string, difficulty: string): Promise<string> {
// 		try {
// 			const chess = new Chess(fen);
// 			const legalMoves = chess.moves({ verbose: true });

// 			const apiEnv = this.env as Env;
// 			const apiKey = apiEnv.AI_PROVIDER_API_KEY ?? apiEnv.ANTHROPIC_API_KEY;

// 			if (!apiKey) {
// 				console.warn('[Claude] No API key, using enhanced fallback');
// 				return this.getUltraStrategicMoveFallback(fen, side, difficulty);
// 			}

// 			console.log(`[Claude] Requesting ULTIMATE move for ${side} at ${difficulty}`);

// 			// Analyze position context
// 			const inCheck = chess.inCheck();
// 			const turnNumber = Math.floor(chess.moveNumber());
// 			const phase = turnNumber < 10 ? 'opening' : turnNumber < 25 ? 'middlegame' : 'endgame';

// 			const response = await fetch('https://api.anthropic.com/v1/messages', {
// 				method: 'POST',
// 				headers: {
// 					'Content-Type': 'application/json',
// 					'x-api-key': apiKey,
// 					'anthropic-version': '2023-06-01',
// 				},
// 				body: JSON.stringify({
// 					model: 'claude-sonnet-4-20250514',
// 					max_tokens: 2048,
// 					messages: [
// 						{
// 							role: 'user',
// 							content: `You are NullShot AI - a RUTHLESS, UNBEATABLE chess engine at SUPER-GRANDMASTER level (3000+ ELO).

// 							━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 							CURRENT POSITION ANALYSIS
// 							━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 							FEN: ${fen}
// 							You are: ${side.toUpperCase()}
// 							Game Phase: ${phase.toUpperCase()}
// 							Turn Number: ${turnNumber}
// 							In Check: ${inCheck ? 'YES - MUST DEFEND!' : 'NO'}
// 							Legal Moves (SAN): ${legalMoves.map((m) => m.san).join(', ')}

// 							━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 							YOUR MISSION: CRUSH THE OPPONENT - NEVER LOSE
// 							━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 							${
// 								difficulty === 'hard'
// 									? `🔥 HARD MODE - ULTRA-GRANDMASTER (3000+ ELO) 🔥

// 							STRATEGIC IMPERATIVES:
// 							┌────────────────────────────────────────────────────┐
// 							│ 1. CALCULATE 6-7 MOVES DEEP - No shallow thinking │
// 							│ 2. NEVER REPEAT OPENING PATTERNS - Be unpredictable│
// 							│ 3. KING SAFETY IS PARAMOUNT - Never expose your king│
// 							│ 4. EVERY MOVE MUST HAVE MULTIPLE THREATS           │
// 							│ 5. THINK LIKE ALPHAZERO - Sacrifice for position   │
// 							└────────────────────────────────────────────────────┘

// 							PHASE-SPECIFIC INSTRUCTIONS:

// 							${
// 								phase === 'opening'
// 									? `🎯 OPENING STRATEGY (Moves 1-10):
// 							• VARY your openings - randomize between: e4/d4/Nf3/c4/g3
// 							• Control center with PIECES not just pawns
// 							• Develop knights before bishops
// 							• Castle EARLY (by move 8) unless tactical reason not to
// 							• Create pawn tension, don't exchange too early
// 							• Look for UNORTHODOX moves (b3, g3, a3) to confuse opponent
// 							• AVOID book moves after move 4 - think independently!`
// 									: phase === 'middlegame'
// 									? `⚔️ MIDDLEGAME WARFARE (Moves 11-25):
// 							• Identify weakest enemy square - ATTACK IT RELENTLESSLY
// 							• Stack rooks on open files
// 							• Create pawn storms against enemy king
// 							• Exchange pieces when ahead, avoid when behind
// 							• Every piece MUST have an active role
// 							• Look for SHOCKING sacrifices that lead to forced wins
// 							• Find the move that opponent LEAST expects
// 							• Create multiple threats SIMULTANEOUSLY`
// 									: `👑 ENDGAME MASTERY (Moves 26+):
// 							• Activate king as attacking piece
// 							• Create passed pawns aggressively
// 							• Cut off enemy king from action
// 							• Calculate every variation to mate
// 							• Zugzwang positions - force opponent into bad moves
// 							• NEVER ALLOW PERPETUAL CHECK
// 							• Push passed pawns with king support`
// 							}

// 							TACTICAL PRIORITIES (CHECK EVERY MOVE):
// 							┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// 							┃ ✓ Is opponent's king exposed? ATTACK IT!        ┃
// 							┃ ✓ Can I fork/pin/skewer? EXECUTE IT!            ┃
// 							┃ ✓ Are there hanging pieces? CAPTURE THEM!       ┃
// 							┃ ✓ Can I win material? TAKE IT!                  ┃
// 							┃ ✓ Does this move put me in danger? REJECT IT!   ┃
// 							┃ ✓ Is my king safe after this move? VERIFY!      ┃
// 							┃ ✓ Does opponent have counter-tactics? PREVENT!  ┃
// 							┃ ✓ Am I being predictable? RANDOMIZE!            ┃
// 							┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

// 							ANTI-PATTERN CHECKS:
// 							❌ DON'T move same piece twice in opening
// 							❌ DON'T expose king to attacks (CRITICAL!)
// 							❌ DON'T ignore opponent's threats
// 							❌ DON'T make passive moves - ALWAYS threaten something
// 							❌ DON'T play predictable sequences
// 							❌ DON'T trade queens without positional advantage
// 							❌ DON'T push pawns that weaken your king

// 							MOVE SELECTION ALGORITHM:
// 							1. Find ALL forcing moves (checks, captures, threats)
// 							2. Evaluate each for king safety (yours AND opponent's)
// 							3. Calculate 6-7 moves ahead for each candidate
// 							4. Choose the move with:
// 							- Maximum positional advantage
// 							- Unpredictable element (not obvious)
// 							- Multiple threats created
// 							- Perfect king safety
// 							- NO weaknesses left behind

// 							UNPREDICTABILITY REQUIREMENT:
// 							• If position has been seen before: Choose 2nd or 3rd best move
// 							• Add positional randomness: Vary plans between games
// 							• Psychological warfare: Make moves opponent won't expect`
// 									: difficulty === 'medium'
// 									? `MEDIUM MODE (2200 ELO):
// 							• Calculate 4 moves ahead
// 							• Look for simple tactics (forks, pins)
// 							• Develop pieces harmoniously
// 							• Castle early for safety
// 							• Control central squares
// 							• Capture hanging pieces
// 							• Avoid obvious blunders`
// 									: `EASY MODE (1500 ELO):
// 							• Calculate 2-3 moves ahead
// 							• Make solid developing moves
// 							• Sometimes miss simple tactics
// 							• Castle when possible
// 							• Try to control center`
// 							}

// 							━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 							RESPONSE FORMAT
// 							━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 							Respond with ONLY the move in SAN notation.
// 							Examples: "Nf3", "e4", "Qxf7+", "O-O-O", "Bxh7+"

// 							NO explanations. NO analysis. JUST THE MOVE.

// 							Think deeply. Choose the UNBEATABLE move. Make opponent fear you.`,
// 						},
// 					],
// 				}),
// 			});

// 			if (!response.ok) {
// 				throw new Error(`Claude API: ${response.status}`);
// 			}

// 			const data: any = await response.json();
// 			const aiMove = data.content[0].text.trim();

// 			console.log(`[Claude] ULTIMATE MOVE: ${aiMove}`);

// 			const validMove = legalMoves.find((m) => m.san === aiMove || m.lan === aiMove || m.from + m.to === aiMove);

// 			if (validMove) {
// 				return validMove.san;
// 			}

// 			console.warn(`[Claude] Invalid move: ${aiMove}, using ultra-fallback`);
// 			return this.getUltraStrategicMoveFallback(fen, side, difficulty);
// 		} catch (error: any) {
// 			console.error('[Claude] Error:', error.message);
// 			return this.getUltraStrategicMoveFallback(fen, side, difficulty);
// 		}
// 	}

// 	// ========== ENHANCED FALLBACK WITH DEEP ANALYSIS ==========
// 	private readonly PIECE_VALUES: { [key: string]: number } = {
// 		p: 100,
// 		n: 320,
// 		b: 330,
// 		r: 500,
// 		q: 900,
// 		k: 20000,
// 	};

// 	private readonly PAWN_POSITION_BONUS = [
// 		0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 27, 27, 10, 5, 5, 0, 0, 0, 25, 25, 0,
// 		0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -25, -25, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
// 	];

// 	private readonly KNIGHT_POSITION_BONUS = [
// 		-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30,
// 		-30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50,
// 	];

// 	// ========== ULTIMATE UNBEATABLE FALLBACK ==========
// 	private getUltraStrategicMoveFallback(fen: string, side: string, difficulty: string): string {
// 		console.log(`[UNBEATABLE FALLBACK] ${side} ${difficulty}`);

// 		const chess = new Chess(fen);
// 		const moves = chess.moves({ verbose: true });
// 		if (moves.length === 0) return '';

// 		// Depth 5 even on free tier — safe because we limit moves
// 		const depth = 5;

// 		// PRIORITIZE DANGER: checks > captures > everything else
// 		const checkMoves = moves.filter((m) => m.san.includes('+') || m.san.includes('#'));
// 		const captureMoves = moves.filter((m) => m.captured);
// 		const otherMoves = moves.filter((m) => !m.captured && !m.san.includes('+') && !m.san.includes('#'));

// 		// Take only the most threatening moves
// 		const candidates = [...checkMoves, ...captureMoves, ...otherMoves.slice(0, 12 - checkMoves.length - captureMoves.length)];

// 		let bestMoves: { move: string; value: number }[] = [];

// 		for (const move of candidates) {
// 			chess.move(move.san);
// 			// Quiescence: keep searching if there are captures (catches sacrifices)
// 			const value = this.minimaxQuiescence(chess, depth - 1, -Infinity, Infinity, false);
// 			chess.undo();

// 			if (!bestMoves.length || value > bestMoves[0].value) {
// 				bestMoves = [{ move: move.san, value }];
// 			} else if (value === bestMoves[0].value) {
// 				bestMoves.push({ move: move.san, value });
// 			}
// 		}

// 		// UNPREDICTABLE: pick random among the top 1–3 best moves
// 		const topCount = difficulty === 'hard' ? Math.min(3, bestMoves.length) : 1;
// 		const chosen = bestMoves.sort((a, b) => b.value - a.value).slice(0, topCount);
// 		const finalMove = chosen[Math.floor(Math.random() * chosen.length)].move;

// 		console.log(`[UNBEATABLE] Chose ${finalMove} from ${chosen.length} best moves`);
// 		return finalMove;
// 	}

// 	// Quiescence search — only captures after horizon
// 	private minimaxQuiescence(chess: Chess, depth: number, alpha: number, beta: number, maximizing: boolean): number {
// 		if (depth === 0) return this.evaluateBoard(chess);

// 		let evaluation = this.evaluateBoard(chess);

// 		if (maximizing) {
// 			let maxEval = evaluation;
// 			for (const moveSan of chess.moves()) {
// 				// Only consider captures in quiescence
// 				const movesVerbose = chess.moves({ verbose: true });
// 				const move = movesVerbose.find((m) => m.san === moveSan);
// 				if (!move || !move.captured) continue;
// 				chess.move(moveSan);
// 				const score = this.minimaxQuiescence(chess, depth - 1, alpha, beta, false);
// 				chess.undo();
// 				maxEval = Math.max(maxEval, score);
// 				alpha = Math.max(alpha, maxEval);
// 				if (beta <= alpha) break;
// 			}
// 			return maxEval;
// 		} else {
// 			let minEval = evaluation;
// 			for (const moveSan of chess.moves()) {
// 				const movesVerbose = chess.moves({ verbose: true });
// 				const move = movesVerbose.find((m) => m.san === moveSan);
// 				if (!move || !move.captured) continue;
// 				chess.move(moveSan);
// 				const score = this.minimaxQuiescence(chess, depth - 1, alpha, beta, true);
// 				chess.undo();
// 				minEval = Math.min(minEval, score);
// 				beta = Math.min(beta, minEval);
// 				if (beta <= alpha) break;
// 			}
// 			return minEval;
// 		}
// 	}

// 	// Shuffle top N moves to add variety
// 	private shuffleTopMoves(moves: any[], topN: number): any[] {
// 		const top = moves.slice(0, Math.min(topN, moves.length));
// 		const rest = moves.slice(topN);

// 		for (let i = top.length - 1; i > 0; i--) {
// 			const j = Math.floor(Math.random() * (i + 1));
// 			[top[i], top[j]] = [top[j], top[i]];
// 		}

// 		return [...top, ...rest];
// 	}

// 	private minimax(chess: Chess, depth: number, alpha: number, beta: number, maximizing: boolean): number {
// 		if (depth === 0 || chess.isGameOver()) {
// 			return this.evaluateBoard(chess);
// 		}

// 		const moves = chess.moves();

// 		if (maximizing) {
// 			let maxEval = -Infinity;
// 			for (const move of moves) {
// 				chess.move(move);
// 				const evaluation = this.minimax(chess, depth - 1, alpha, beta, false);
// 				chess.undo();
// 				maxEval = Math.max(maxEval, evaluation);
// 				alpha = Math.max(alpha, evaluation);
// 				if (beta <= alpha) break;
// 			}
// 			return maxEval;
// 		} else {
// 			let minEval = Infinity;
// 			for (const move of moves) {
// 				chess.move(move);
// 				const evaluation = this.minimax(chess, depth - 1, alpha, beta, true);
// 				chess.undo();
// 				minEval = Math.min(minEval, evaluation);
// 				beta = Math.min(beta, evaluation);
// 				if (beta <= alpha) break;
// 			}
// 			return minEval;
// 		}
// 	}

// 	private evaluateBoard(chess: Chess): number {
// 		if (chess.isCheckmate()) return chess.turn() === 'w' ? -20000 : 20000;
// 		if (chess.isDraw() || chess.isStalemate()) return 0;

// 		let score = 0;
// 		const board = chess.board();

// 		// Material and position
// 		for (let i = 0; i < 8; i++) {
// 			for (let j = 0; j < 8; j++) {
// 				const piece = board[i][j];
// 				if (piece) {
// 					const value = this.PIECE_VALUES[piece.type] || 0;
// 					const posBonus = this.getPositionBonus(piece.type, i, j, piece.color);
// 					score += piece.color === 'b' ? value + posBonus : -(value + posBonus);
// 				}
// 			}
// 		}

// 		// Center control bonus
// 		const centerSquares = ['e4', 'e5', 'd4', 'd5'];
// 		centerSquares.forEach((square) => {
// 			const piece = chess.get(square as any);
// 			if (piece) score += piece.color === 'b' ? 40 : -40;
// 		});

// 		// Mobility bonus
// 		const mobility = chess.moves().length;
// 		score += chess.turn() === 'b' ? mobility * 10 : -mobility * 10;

// 		return score;
// 	}

// 	private getPositionBonus(pieceType: string, row: number, col: number, color: string): number {
// 		const index = color === 'w' ? (7 - row) * 8 + col : row * 8 + col;
// 		if (pieceType === 'p') return this.PAWN_POSITION_BONUS[index] || 0;
// 		if (pieceType === 'n') return this.KNIGHT_POSITION_BONUS[index] || 0;
// 		return 0;
// 	}

// 	private evaluateKingSafety(chess: Chess, color: string): number {
// 		const board = chess.board();
// 		let kingRow = -1,
// 			kingCol = -1;

// 		// Find king
// 		for (let i = 0; i < 8; i++) {
// 			for (let j = 0; j < 8; j++) {
// 				const piece = board[i][j];
// 				if (piece && piece.type === 'k' && piece.color === color) {
// 					kingRow = i;
// 					kingCol = j;
// 				}
// 			}
// 		}

// 		if (kingRow === -1) return 0;

// 		let safety = 0;

// 		// Count pawns around king (shield)
// 		const directions = [
// 			[-1, -1],
// 			[-1, 0],
// 			[-1, 1],
// 			[0, -1],
// 			[0, 1],
// 			[1, -1],
// 			[1, 0],
// 			[1, 1],
// 		];
// 		directions.forEach(([dr, dc]) => {
// 			const r = kingRow + dr;
// 			const c = kingCol + dc;
// 			if (r >= 0 && r < 8 && c >= 0 && c < 8) {
// 				const piece = board[r][c];
// 				if (piece && piece.type === 'p' && piece.color === color) {
// 					safety += 50;
// 				}
// 			}
// 		});

// 		// Penalty if king is in center (exposed)
// 		if (kingRow >= 2 && kingRow <= 5 && kingCol >= 2 && kingCol <= 5) {
// 			safety -= 100;
// 		}

// 		return safety;
// 	}

// 	// ========== MCP TOOLS ==========
// 	private setupChessTools(server: McpServer) {
// 		server.tool(
// 			'make_chess_move',
// 			'Generate chess move.',
// 			{
// 				fen: z.string(),
// 				side: z.enum(['white', 'black']),
// 				difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
// 			},
// 			async ({ fen, side, difficulty = 'hard' }) => {
// 				const chess = new Chess(fen);
// 				if (chess.turn() !== side[0]) {
// 					return { content: [{ type: 'text', text: 'Not your turn!' }] };
// 				}

// 				const moves = chess.moves();
// 				if (moves.length === 0) {
// 					return { content: [{ type: 'text', text: 'Game over!' }] };
// 				}

// 				const move = await this.getStrategicMoveWithClaude(fen, side, difficulty);
// 				chess.move(move);

// 				return {
// 					content: [{ type: 'text', text: `Moved: ${move}. New FEN: ${chess.fen()}` }],
// 				};
// 			}
// 		);
// 	}

// 	private setupChessResources(server: McpServer) {
// 		server.resource('chess_game_state', 'resource://chess/game/{gameId}', async (uri: URL) => {
// 			const state = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
// 			return { contents: [{ text: state, uri: uri.href }] };
// 		});
// 	}

// 	private setupChessPrompts(server: McpServer) {
// 		server.prompt('chess_strategy', 'Ultimate chess strategy.', () => ({
// 			messages: [
// 				{
// 					role: 'user',
// 					content: { type: 'text', text: 'You are NullShot AI - unbeatable, unpredictable, unstoppable.' },
// 				},
// 			],
// 		}));
// 	}

// 	private setupBlockchainTools(server: McpServer) {
// 		server.tool(
// 			'submit_game_result',
// 			'Submit game to blockchain.',
// 			{
// 				gameId: z.string(),
// 				humanAddress: z.string(),
// 				winner: z.enum(['human', 'ai', 'draw']),
// 				signature: z.string(),
// 			},
// 			async ({ gameId, humanAddress, winner, signature }) => {
// 				const result = await this.submitGameToBlockchain(gameId, humanAddress, winner, signature);
// 				return { content: [{ type: 'text', text: result.message }] };
// 			}
// 		);
// 	}

// 	private async submitGameToBlockchain(
// 		gameId: string,
// 		humanAddress: string,
// 		winner: 'human' | 'ai' | 'draw',
// 		signature: string
// 	): Promise<{ success: boolean; message: string; txHash?: string }> {
// 		if (winner === 'human') {
// 			return { success: false, message: 'Human won; frontend submits.' };
// 		}

// 		try {
// 			const { ethers } = await import('ethers');
// 			const kv = (this.env as any).KV_NULLSHOTCHESS;
// 			if (!kv) return { success: false, message: 'KV not configured.' };

// 			const privateKey = await kv.get('AI_WALLET_KEY');
// 			if (!privateKey) return { success: false, message: 'Wallet key not found.' };

// 			const provider = new ethers.JsonRpcProvider('https://rpc.sepolia-api.lisk.com');
// 			const wallet = new ethers.Wallet(privateKey, provider);

// 			const contract = new ethers.Contract(
// 				'0x9B7CeF0B7cFf1a46D2cEC347DCAD63C3c721a183',
// 				['function submitAIGame(string memory gameId, address humanPlayer, bool humanWon, bool isDraw, bytes memory signature) external'],
// 				wallet
// 			);

// 			const tx = await contract.submitAIGame(gameId, humanAddress, false, winner === 'draw', signature);
// 			await tx.wait();

// 			return {
// 				success: true,
// 				message: `✅ Victory recorded on blockchain!\nTx: ${tx.hash}`,
// 				txHash: tx.hash,
// 			};
// 		} catch (error: any) {
// 			return { success: false, message: `❌ Error: ${error.message}` };
// 		}
// 	}
// }

// export const ExampleMcpServer = ChessAgentServer;

