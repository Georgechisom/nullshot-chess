import { Implementation } from '@modelcontextprotocol/sdk/types.js';
import { McpHonoServerDO } from '@nullshot/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Chess } from 'chess.js';
import { z } from 'zod';
import type { Env } from './env';

export class ChessAgentServer extends McpHonoServerDO<Env> {
	private moveCache: Map<string, string> = new Map();
	private readonly MAX_CACHE_SIZE = 1000;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	getImplementation(): Implementation {
		return {
			name: 'NullShotChessAI',
			version: '2.0.0',
		};
	}

	override async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const pathname = url.pathname;

		console.log(`[DO] ${request.method} ${pathname}`);

		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type',
					'Access-Control-Max-Age': '86400',
				},
			});
		}

		if (pathname === '/api/health') {
			return new Response(
				JSON.stringify({
					status: 'ok',
					service: 'NullShot Chess MCP Server',
					version: '2.0.0',
				}),
				{
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*',
					},
				}
			);
		}

		if (pathname === '/api/chess/move' && request.method === 'POST') {
			try {
				const body: any = await request.json();
				const { fen, side, difficulty = 'hard' } = body;

				if (!fen || !side) {
					return new Response(JSON.stringify({ error: 'Missing fen or side parameter' }), {
						status: 400,
						headers: {
							'Content-Type': 'application/json',
							'Access-Control-Allow-Origin': '*',
						},
					});
				}

				console.log(`[API] Move request - Side: ${side}, Difficulty: ${difficulty}`);

				const move = await this.getOptimizedMove(fen, side, difficulty);
				const chess = new Chess(fen);
				chess.move(move);

				return new Response(
					JSON.stringify({
						move,
						fen: chess.fen(),
						newFen: chess.fen(),
						success: true,
					}),
					{
						headers: {
							'Content-Type': 'application/json',
							'Access-Control-Allow-Origin': '*',
						},
					}
				);
			} catch (error: any) {
				console.error('[API] Error in /api/chess/move:', error);
				return new Response(
					JSON.stringify({
						error: error.message,
						success: false,
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
		}

		// ===== FIXED ENDPOINT: Accept human signature, AI submits =====
		if (pathname === '/api/chess/submit' && request.method === 'POST') {
			try {
				const body: any = await request.json();
				const { gameId, humanAddress, winner, signature, humanWon, isDraw } = body;

				if (!gameId || !humanAddress || !signature) {
					return new Response(
						JSON.stringify({
							error: 'Missing required parameters: gameId, humanAddress, signature',
							success: false,
						}),
						{
							status: 400,
							headers: {
								'Content-Type': 'application/json',
								'Access-Control-Allow-Origin': '*',
							},
						}
					);
				}

				// Determine values from winner if not provided
				const finalHumanWon = humanWon !== undefined ? humanWon : winner === 'human';
				const finalIsDraw = isDraw !== undefined ? isDraw : winner === 'draw';

				console.log('[API] Submission request:', {
					gameId,
					humanAddress,
					winner,
					humanWon: finalHumanWon,
					isDraw: finalIsDraw,
				});

				// AI submits using human's signature
				const result = await this.submitWithHumanSignature(gameId, humanAddress, finalHumanWon, finalIsDraw, signature);

				return new Response(JSON.stringify(result), {
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*',
					},
				});
			} catch (error: any) {
				console.error('[API] Error in /api/chess/submit:', error);
				return new Response(
					JSON.stringify({
						error: error.message,
						success: false,
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
		}

		return super.fetch(request);
	}

	configureServer(server: McpServer): void {
		this.setupChessTools(server);
		this.setupChessResources(server);
		this.setupChessPrompts(server);
		this.setupBlockchainTools(server);
	}

	processSSEConnection(request: Request): Response {
		const url = new URL(request.url);
		let sessionId = url.searchParams.get('sessionId');

		if (!sessionId) {
			sessionId = `auto-${Date.now()}-${Math.random().toString(36).substring(7)}`;
			console.log(`[SSE] Auto-generated sessionId: ${sessionId}`);
		}

		url.searchParams.set('sessionId', sessionId);
		const modifiedRequest = new Request(url.toString(), request);
		return super.processSSEConnection(modifiedRequest);
	}

	// ========== OPTIMIZED MOVE GENERATION ==========
	private async getOptimizedMove(fen: string, side: string, difficulty: string): Promise<string> {
		const cacheKey = `${fen}:${side}:${difficulty}`;
		if (this.moveCache.has(cacheKey)) {
			console.log('[CACHE] Move found in cache');
			return this.moveCache.get(cacheKey)!;
		}

		try {
			const chess = new Chess(fen);
			const legalMoves = chess.moves({ verbose: true });

			if (legalMoves.length === 0) {
				throw new Error('No legal moves available');
			}

			const moveNumber = Math.floor(chess.moveNumber());
			if (moveNumber <= 3) {
				const bookMove = this.getOpeningBookMove(fen, side);
				if (bookMove) {
					this.cacheMove(cacheKey, bookMove);
					return bookMove;
				}
			}

			const apiEnv = this.env as Env;
			const apiKey = apiEnv.AI_PROVIDER_API_KEY ?? apiEnv.ANTHROPIC_API_KEY;

			if (apiKey && difficulty === 'hard') {
				try {
					const move = await this.getClaudeMoveWithTimeout(fen, side, legalMoves, apiKey, 8000);
					if (move) {
						this.cacheMove(cacheKey, move);
						return move;
					}
				} catch (error: any) {
					console.warn('[Claude] Timeout or error, using fallback:', error.message);
				}
			}

			const move = this.getSmartFallbackMove(fen, side, difficulty);
			this.cacheMove(cacheKey, move);
			return move;
		} catch (error: any) {
			console.error('[Move Generation] Error:', error);
			const chess = new Chess(fen);
			const moves = chess.moves();
			return moves[Math.floor(Math.random() * moves.length)];
		}
	}

	private getOpeningBookMove(fen: string, side: string): string | null {
		const openingBook: { [key: string]: string[] } = {
			'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1': ['e4', 'd4', 'Nf3', 'c4', 'g3'],
			'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1': ['e5', 'c5', 'e6', 'c6'],
			'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1': ['d5', 'Nf6', 'e6', 'g6'],
		};

		const moves = openingBook[fen];
		if (moves && moves.length > 0) {
			return moves[Math.floor(Math.random() * moves.length)];
		}
		return null;
	}

	private async getClaudeMoveWithTimeout(
		fen: string,
		side: string,
		legalMoves: any[],
		apiKey: string,
		timeoutMs: number
	): Promise<string | null> {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), timeoutMs);

		try {
			const chess = new Chess(fen);
			const turnNumber = Math.floor(chess.moveNumber());
			const phase = turnNumber < 10 ? 'opening' : turnNumber < 25 ? 'middlegame' : 'endgame';

			const response = await fetch('https://api.anthropic.com/v1/messages', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': apiKey,
					'anthropic-version': '2023-06-01',
				},
				body: JSON.stringify({
					model: 'claude-sonnet-4-20250514',
					max_tokens: 300,
					messages: [
						{
							role: 'user',
							content: `You are an elite chess engine (2800+ ELO). Analyze this position and return ONLY the best move in SAN notation.
							Position: ${fen}
							You play: ${side.toUpperCase()}
							Phase: ${phase}
							Legal moves: ${legalMoves.map((m) => m.san).join(', ')}

							Requirements:
							- ${phase === 'opening' ? 'Control center, develop pieces, castle early' : ''}
							- ${phase === 'middlegame' ? 'Attack weaknesses, create threats, maintain king safety' : ''}
							- ${phase === 'endgame' ? 'Activate king, push passed pawns, calculate precisely' : ''}
							- Look for tactics: checks, captures, forks, pins
							- NEVER expose your king to danger
							- Choose unpredictable but strong moves

							Respond with ONLY the move (e.g., "Nf3" or "e4"). No explanation.`,
						},
					],
				}),
				signal: controller.signal,
			});

			clearTimeout(timeout);

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const data: any = await response.json();
			const aiMove = data.content[0].text.trim().replace(/[^a-zA-Z0-9+#=-]/g, '');

			const validMove = legalMoves.find((m) => m.san === aiMove || m.lan === aiMove || m.from + m.to === aiMove);

			if (validMove) {
				console.log(`[Claude] Move: ${validMove.san}`);
				return validMove.san;
			}

			return null;
		} catch (error: any) {
			clearTimeout(timeout);
			if (error.name === 'AbortError') {
				console.warn('[Claude] Request timeout');
			}
			return null;
		}
	}

	private readonly PIECE_VALUES: { [key: string]: number } = {
		p: 100,
		n: 320,
		b: 330,
		r: 500,
		q: 900,
		k: 20000,
	};

	private getSmartFallbackMove(fen: string, side: string, difficulty: string): string {
		console.log(`[SMART-FALLBACK] Computing move for ${side} at ${difficulty}`);

		const chess = new Chess(fen);
		const moves = chess.moves({ verbose: true });

		if (moves.length === 0) {
			throw new Error('No legal moves');
		}

		if (moves.length === 1) {
			return moves[0].san;
		}

		const checkmates = moves.filter((m) => {
			chess.move(m.san);
			const isCheckmate = chess.isCheckmate();
			chess.undo();
			return isCheckmate;
		});

		if (checkmates.length > 0) {
			return checkmates[0].san;
		}

		const checks = moves.filter((m) => m.san.includes('+'));
		const captures = moves.filter((m) => m.captured);
		const tactical = [...checks, ...captures];

		const depth = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4;
		const movePool = difficulty === 'hard' && tactical.length > 0 ? [...tactical, ...moves.slice(0, 8)] : moves.slice(0, 12);

		let bestMove = moves[0].san;
		let bestValue = -Infinity;

		for (const move of movePool) {
			chess.move(move.san);

			const value = this.fastMinimax(chess, depth - 1, -Infinity, Infinity, false, side === 'white');

			chess.undo();

			const randomness =
				difficulty === 'hard'
					? (Math.random() - 0.5) * 20
					: difficulty === 'medium'
					? (Math.random() - 0.5) * 50
					: (Math.random() - 0.5) * 100;

			const adjustedValue = value + randomness;

			if (adjustedValue > bestValue) {
				bestValue = adjustedValue;
				bestMove = move.san;
			}
		}

		console.log(`[FALLBACK] Selected: ${bestMove} (Score: ${bestValue.toFixed(0)})`);
		return bestMove;
	}

	private fastMinimax(chess: Chess, depth: number, alpha: number, beta: number, maximizing: boolean, isWhite: boolean): number {
		if (depth === 0 || chess.isGameOver()) {
			return this.fastEvaluate(chess, isWhite);
		}

		const moves = chess.moves();
		const orderedMoves = this.orderMoves(chess, moves);

		if (maximizing) {
			let maxEval = -Infinity;
			for (const move of orderedMoves) {
				chess.move(move);
				const evaluation = this.fastMinimax(chess, depth - 1, alpha, beta, false, isWhite);
				chess.undo();

				maxEval = Math.max(maxEval, evaluation);
				alpha = Math.max(alpha, evaluation);
				if (beta <= alpha) break;
			}
			return maxEval;
		} else {
			let minEval = Infinity;
			for (const move of orderedMoves) {
				chess.move(move);
				const evaluation = this.fastMinimax(chess, depth - 1, alpha, beta, true, isWhite);
				chess.undo();

				minEval = Math.min(minEval, evaluation);
				beta = Math.min(beta, evaluation);
				if (beta <= alpha) break;
			}
			return minEval;
		}
	}

	private orderMoves(chess: Chess, moves: string[]): string[] {
		const scored: { move: string; score: number }[] = [];

		for (const move of moves) {
			let score = 0;

			if (move.includes('x')) score += 100;
			if (move.includes('+')) score += 80;
			if (move.includes('e4') || move.includes('d4') || move.includes('e5') || move.includes('d5')) {
				score += 30;
			}

			scored.push({ move, score });
		}

		scored.sort((a, b) => b.score - a.score);
		return scored.map((s) => s.move);
	}

	private fastEvaluate(chess: Chess, isWhite: boolean): number {
		if (chess.isCheckmate()) return chess.turn() === 'w' ? -20000 : 20000;
		if (chess.isDraw() || chess.isStalemate()) return 0;

		let score = 0;
		const board = chess.board();

		for (let i = 0; i < 8; i++) {
			for (let j = 0; j < 8; j++) {
				const piece = board[i][j];
				if (piece) {
					const value = this.PIECE_VALUES[piece.type] || 0;
					score += piece.color === 'w' ? value : -value;
				}
			}
		}

		const mobility = chess.moves().length;
		score += chess.turn() === 'w' ? mobility * 5 : -mobility * 5;

		return isWhite ? score : -score;
	}

	private cacheMove(key: string, move: string): void {
		if (this.moveCache.size >= this.MAX_CACHE_SIZE) {
			const firstKey = this.moveCache.keys().next().value;
			if (firstKey !== undefined) {
				this.moveCache.delete(firstKey);
			}
		}
		this.moveCache.set(key, move);
	}

	// ========== MCP TOOLS ==========
	private setupChessTools(server: McpServer) {
		server.tool(
			'make_chess_move',
			'Generate chess move.',
			{
				fen: z.string(),
				side: z.enum(['white', 'black']),
				difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
			},
			async ({ fen, side, difficulty = 'hard' }) => {
				const chess = new Chess(fen);
				if (chess.turn() !== side[0]) {
					return { content: [{ type: 'text', text: 'Not your turn!' }] };
				}

				const moves = chess.moves();
				if (moves.length === 0) {
					return { content: [{ type: 'text', text: 'Game over!' }] };
				}

				const move = await this.getOptimizedMove(fen, side, difficulty);
				chess.move(move);

				return {
					content: [{ type: 'text', text: `Moved: ${move}. New FEN: ${chess.fen()}` }],
				};
			}
		);
	}

	private setupChessResources(server: McpServer) {
		server.resource('chess_game_state', 'resource://chess/game/{gameId}', async (uri: URL) => {
			const state = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
			return { contents: [{ text: state, uri: uri.href }] };
		});
	}

	private setupChessPrompts(server: McpServer) {
		server.prompt('chess_strategy', 'Ultimate chess strategy.', () => ({
			messages: [
				{
					role: 'user',
					content: { type: 'text', text: 'You are NullShot AI - unbeatable, unpredictable, unstoppable.' },
				},
			],
		}));
	}

	private setupBlockchainTools(server: McpServer) {
		server.tool(
			'submit_game_result',
			'Submit game to blockchain.',
			{
				gameId: z.string(),
				humanAddress: z.string(),
				winner: z.enum(['human', 'ai', 'draw']),
				signature: z.string(),
			},
			async ({ gameId, humanAddress, winner, signature }) => {
				const humanWon = winner === 'human';
				const isDraw = winner === 'draw';
				const result = await this.submitWithHumanSignature(gameId, humanAddress, humanWon, isDraw, signature);
				return { content: [{ type: 'text', text: result.message }] };
			}
		);
	}

	// ===== NEW METHOD: AI submits using human's signature =====
	private async submitWithHumanSignature(
		gameId: string,
		humanAddress: string,
		humanWon: boolean,
		isDraw: boolean,
		humanSignature: string
	): Promise<{ success: boolean; message: string; txHash?: string }> {
		try {
			console.log('[Blockchain] AI submitting with human signature...');
			console.log('  Game ID:', gameId);
			console.log('  Human Address:', humanAddress);
			console.log('  Human Won:', humanWon);
			console.log('  Is Draw:', isDraw);

			const { ethers } = await import('ethers');
			const kv = (this.env as any).KV_NULLSHOTCHESS;

			if (!kv) {
				console.error('[Blockchain] KV not configured');
				return { success: false, message: 'KV storage not configured.' };
			}

			// Get AI wallet from Cloudflare KV
			const privateKey = await kv.get('AI_WALLET_KEY');
			if (!privateKey) {
				console.error('[Blockchain] AI wallet key not found in KV');
				return {
					success: false,
					message: 'AI wallet not configured. Please set AI_WALLET_KEY in Cloudflare KV.',
				};
			}

			const provider = new ethers.JsonRpcProvider('https://rpc.sepolia-api.lisk.com');
			const aiWallet = new ethers.Wallet(privateKey, provider);

			console.log('[Blockchain] AI Wallet Address:', aiWallet.address);

			// Check AI wallet balance
			const balance = await provider.getBalance(aiWallet.address);
			const balanceInEth = ethers.formatEther(balance);
			console.log('[Blockchain] AI Wallet Balance:', balanceInEth, 'ETH');

			// If balance too low, return error for frontend fallback
			if (balance < ethers.parseEther('0.001')) {
				console.warn('[Blockchain] AI wallet gas too low');
				return {
					success: false,
					message: `AI wallet out of gas (${balanceInEth} ETH). Please submit manually.`,
				};
			}

			const contractAddress = '0x9B7CeF0B7cFf1a46D2cEC347DCAD63C3c721a183';
			const contractABI = [
				'function submitAIGame(string memory gameId, address humanPlayer, bool humanWon, bool isDraw, bytes memory signature) external',
			];

			const contract = new ethers.Contract(contractAddress, contractABI, aiWallet);

			console.log('[Blockchain] Submitting transaction...');
			console.log('  Signature (from human):', humanSignature);

			// AI wallet submits transaction (pays gas), using human's signature
			const tx = await contract.submitAIGame(gameId, humanAddress, humanWon, isDraw, humanSignature, {
				gasLimit: 500000,
			});

			console.log('[Blockchain] Transaction hash:', tx.hash);

			// Wait for confirmation
			const receipt = await tx.wait();
			console.log('[Blockchain] Transaction confirmed in block:', receipt.blockNumber);

			return {
				success: true,
				message: `✅ Result recorded on blockchain! AI paid the gas fees.\nTx: ${tx.hash}`,
				txHash: tx.hash,
			};
		} catch (error: any) {
			console.error('[Blockchain] Submission error:', error);

			// Enhanced error logging
			if (error.reason) {
				console.error('[Blockchain] Revert reason:', error.reason);
			}
			if (error.data) {
				console.error('[Blockchain] Error data:', error.data);
			}

			// Check for gas errors
			const errorMessage = error.reason || error.message || 'Unknown error';
			const isGasError =
				errorMessage.toLowerCase().includes('insufficient funds') ||
				errorMessage.toLowerCase().includes('gas') ||
				error.code === 'INSUFFICIENT_FUNDS';

			if (isGasError) {
				return {
					success: false,
					message: 'AI wallet out of gas. Please submit manually.',
				};
			}

			return {
				success: false,
				message: `❌ ${errorMessage}`,
			};
		}
	}
}

export const ExampleMcpServer = ChessAgentServer;
