/*
 * THEME-BASED CHESS PIECE STYLING - CHANGES START HERE
 * =====================================================
 * 
 * This file has been modified to apply theme-based colors to chess pieces.
 * The theme prop is now used to determine piece colors and materials.
 * 
 * TO REMOVE THESE CHANGES:
 * 1. Remove the 'theme' property from the ChessPieceProps interface (line ~17)
 * 2. Remove the 'theme' parameter from the ChessPiece function (line ~20)
 * 3. Delete the entire getPieceColors function (lines ~23-62)
 * 4. Replace the pieceColor assignment on line ~65 with:
 *    const pieceColor = color === 'w' ? '#E8D5B7' : '#1A1A1A';
 * 5. In ChessBoard3D.tsx, remove theme={theme} from all <ChessPiece /> calls
 * 
 * =====================================================
 */

import { useRef } from 'react';
import { Group } from 'three';
import { ChessTheme } from '@/pages/Arena';

interface ChessPieceProps {
  type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
  color: 'w' | 'b';
  position: [number, number, number];
  theme: ChessTheme; // ADDED: Theme prop for piece styling
}

const ChessPiece = ({ type, color, position, theme }: ChessPieceProps) => {
  const groupRef = useRef<Group>(null);
  
  // ADDED: Theme-based color function
  const getPieceColors = () => {
    const themes = {
      classic: { white: '#E8D5B7', black: '#1A1A1A', metalness: 0.4, roughness: 0.6 },
      marble: { white: '#F5F5DC', black: '#2C2C2C', metalness: 0.7, roughness: 0.3 },
      mystic: { white: '#90EE90', black: '#0B3D0B', metalness: 0.5, roughness: 0.5 },
      gold: { white: '#FFD700', black: '#B8860B', metalness: 0.9, roughness: 0.2 },
      sapphire: { white: '#87CEEB', black: '#0F52BA', metalness: 0.7, roughness: 0.4 },
      jade: { white: '#50C878', black: '#00563F', metalness: 0.6, roughness: 0.4 },
      ruby: { white: '#FF6B9D', black: '#9B111E', metalness: 0.7, roughness: 0.3 },
      obsidian: { white: '#696969', black: '#0A0A0A', metalness: 0.8, roughness: 0.2 },
      pearl: { white: '#FFDAB9', black: '#8B7355', metalness: 0.6, roughness: 0.3 },
      emerald: { white: '#50C878', black: '#046307', metalness: 0.7, roughness: 0.3 },
    };
    return themes[theme];
  };

  const themeColors = getPieceColors();
  const pieceColor = color === 'w' ? themeColors.white : themeColors.black;
  const metalness = themeColors.metalness;
  const roughness = themeColors.roughness;
  
  // Simplified piece geometries (in production, load GLTF models)
  const renderPiece = () => {
    switch (type) {
      case 'p': // Pawn
        return (
          <group>
            <mesh castShadow>
              <cylinderGeometry args={[0.2, 0.25, 0.8, 16]} />
              <meshStandardMaterial color={pieceColor} metalness={metalness} roughness={roughness} />
            </mesh>
            <mesh position={[0, 0.5, 0]} castShadow>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshStandardMaterial color={pieceColor} metalness={metalness} roughness={roughness} />
            </mesh>
          </group>
        );
      
      case 'n': // Knight
        return (
          <group>
            <mesh castShadow>
              <cylinderGeometry args={[0.25, 0.3, 1, 16]} />
              <meshStandardMaterial color={pieceColor} metalness={metalness} roughness={roughness} />
            </mesh>
            <mesh position={[0, 0.7, 0]} rotation={[0, 0, Math.PI / 6]} castShadow>
              <boxGeometry args={[0.3, 0.5, 0.3]} />
              <meshStandardMaterial color={pieceColor} metalness={metalness} roughness={roughness} />
            </mesh>
          </group>
        );
      
      case 'b': // Bishop
        return (
          <group>
            <mesh castShadow>
              <cylinderGeometry args={[0.25, 0.3, 1.2, 16]} />
              <meshStandardMaterial color={pieceColor} metalness={metalness} roughness={roughness} />
            </mesh>
            <mesh position={[0, 0.8, 0]} castShadow>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshStandardMaterial color={pieceColor} metalness={metalness} roughness={roughness} />
            </mesh>
            <mesh position={[0, 1, 0]} castShadow>
              <coneGeometry args={[0.1, 0.3, 8]} />
              <meshStandardMaterial color={pieceColor} metalness={metalness} roughness={roughness} />
            </mesh>
          </group>
        );
      
      case 'r': // Rook
        return (
          <group>
            <mesh castShadow>
              <cylinderGeometry args={[0.3, 0.35, 1, 4]} />
              <meshStandardMaterial color={pieceColor} metalness={metalness} roughness={roughness} />
            </mesh>
            <mesh position={[0, 0.7, 0]} castShadow>
              <boxGeometry args={[0.5, 0.3, 0.5]} />
              <meshStandardMaterial color={pieceColor} metalness={metalness} roughness={roughness} />
            </mesh>
          </group>
        );
      
      case 'q': // Queen
        return (
          <group>
            <mesh castShadow>
              <cylinderGeometry args={[0.3, 0.35, 1.3, 16]} />
              <meshStandardMaterial color={pieceColor} metalness={metalness} roughness={roughness} />
            </mesh>
            <mesh position={[0, 0.9, 0]} castShadow>
              <coneGeometry args={[0.35, 0.6, 8]} />
              <meshStandardMaterial color={pieceColor} metalness={metalness} roughness={roughness} />
            </mesh>
            <mesh position={[0, 1.3, 0]} castShadow>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial color={pieceColor} metalness={0.7} roughness={0.3} />
            </mesh>
          </group>
        );
      
      case 'k': // King
        return (
          <group>
            <mesh castShadow>
              <cylinderGeometry args={[0.3, 0.35, 1.4, 16]} />
              <meshStandardMaterial color={pieceColor} metalness={metalness} roughness={roughness} />
            </mesh>
            <mesh position={[0, 1, 0]} castShadow>
              <sphereGeometry args={[0.25, 16, 16]} />
              <meshStandardMaterial color={pieceColor} metalness={metalness} roughness={roughness} />
            </mesh>
            <mesh position={[0, 1.4, 0]} castShadow>
              <boxGeometry args={[0.1, 0.5, 0.1]} />
              <meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0, 1.4, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <boxGeometry args={[0.1, 0.3, 0.1]} />
              <meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.1} />
            </mesh>
          </group>
        );
    }
  };

  return (
    <group ref={groupRef} position={position}>
      {renderPiece()}
    </group>
  );
};

export default ChessPiece;
