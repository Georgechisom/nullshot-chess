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
