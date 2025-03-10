import { createHexagonPoints } from "../../utils/threeUtils";
import * as THREE from "three";

export interface TileData {
  row: number;
  col: number;
  type: number;
}

export class TileManager {
  tiles: THREE.Mesh[] = [];
  originalMaterials = new Map<THREE.Mesh, THREE.Material>();
  selectedTile: THREE.Mesh | null = null;
  highlightMaterial: THREE.MeshStandardMaterial;

  constructor(private scene: THREE.Scene) {
    // Create a simple highlight material
    this.highlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.5,
    });
  }

  createTiles(gridSize: number): void {
    const size = 1; // Size for the grid
    const hexWidth = size * 2;
    const hexHeight = size * Math.sqrt(3);

    // Create tile geometry
    const tileShape = new THREE.Shape();
    const hexPoints = createHexagonPoints(size);
    tileShape.setFromPoints(hexPoints);

    // Extrude the shape to create a 3D tile
    const extrudeSettings = {
      steps: 1,
      depth: 0.2,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelOffset: 0,
      bevelSegments: 3,
    };

    const geometry = new THREE.ExtrudeGeometry(tileShape, extrudeSettings);

    // Create simplified materials for variety
    const materials = [
      new THREE.MeshStandardMaterial({ color: 0xc19a6b }), // Light brown
      new THREE.MeshStandardMaterial({ color: 0x8b4513 }), // Dark brown
      new THREE.MeshStandardMaterial({ color: 0x228b22 }), // Forest green
      new THREE.MeshStandardMaterial({ color: 0x4682b4 }), // Steel blue (water)
    ];

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        // Position each hexagon in a grid
        // Offset every other row to create the hexagonal pattern
        const xPos = col * hexWidth * 0.75;
        const zPos = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2);

        // Randomly select a material
        const materialIndex = Math.floor(Math.random() * materials.length);
        const tile = new THREE.Mesh(geometry, materials[materialIndex]);

        tile.position.set(xPos, 0, zPos);
        tile.rotation.x = -Math.PI / 2;

        // Add a slight random height variation for terrain effect
        if (materialIndex !== 3) {
          // Not water
          tile.position.y = Math.random() * 0.1;
        }

        // Store the original material
        this.originalMaterials.set(tile, tile.material);

        // Add user data to identify the tile
        tile.userData = { row, col, type: materialIndex };

        this.scene.add(tile);
        this.tiles.push(tile);
      }
    }

    // Center the grid in the scene
    const gridCenterX = (gridSize * hexWidth * 0.75) / 2;
    const gridCenterZ = (gridSize * hexHeight) / 2;

    this.tiles.forEach(tile => {
      tile.position.x -= gridCenterX;
      tile.position.z -= gridCenterZ;
    });
  }

  getCenterTile(gridSize: number): THREE.Mesh | undefined {
    const centerRow = Math.floor(gridSize / 2);
    const centerCol = Math.floor(gridSize / 2);
    const centerTileIndex = centerRow * gridSize + centerCol;
    return this.tiles[centerTileIndex];
  }

  selectTile(tile: THREE.Mesh): void {
    // If the same tile is clicked again, do nothing
    if (this.selectedTile === tile) return;

    // Store the previous selected tile to handle material changes
    const previousTile = this.selectedTile;

    // Select new tile
    this.selectedTile = tile;

    // Apply highlight material to the newly selected tile
    tile.material = this.highlightMaterial;

    // Restore original material to the previously selected tile
    if (previousTile && this.originalMaterials.has(previousTile)) {
      previousTile.material = this.originalMaterials.get(previousTile)!;
    }
  }

  deselectTile(): void {
    if (this.selectedTile && this.originalMaterials.has(this.selectedTile)) {
      // Restore original material
      this.selectedTile.material = this.originalMaterials.get(this.selectedTile)!;
      this.selectedTile = null;
    }
  }

  dispose(): void {
    // Clean up resources
    this.tiles.forEach(tile => {
      this.scene.remove(tile);
      if (tile.geometry) tile.geometry.dispose();
      if (tile.material instanceof THREE.Material) {
        tile.material.dispose();
      } else if (Array.isArray(tile.material)) {
        tile.material.forEach(material => material.dispose());
      }
    });

    this.highlightMaterial.dispose();
    this.tiles = [];
    this.originalMaterials.clear();
  }
}
