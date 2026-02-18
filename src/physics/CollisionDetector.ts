/**
 * CollisionDetector - Efficient collision detection using spatial partitioning
 * 
 * Uses a grid-based spatial partitioning system to reduce collision checks
 * from O(n²) to approximately O(n) in typical cases.
 */

import { CelestialBody, Vector3D } from './PhysicsEngine';

interface SpatialGrid {
  cellSize: number;
  cells: Map<string, CelestialBody[]>;
}

export class CollisionDetector {
  private grid: SpatialGrid;
  private cellSize: number;

  constructor(cellSize: number = 10) {
    this.cellSize = cellSize;
    this.grid = {
      cellSize,
      cells: new Map(),
    };
  }

  /**
   * Detects all collisions between planets using spatial partitioning.
   * 
   * Returns an array of collision pairs. Each pair is represented as a tuple
   * of two CelestialBody objects that are colliding.
   * 
   * @param planets - Array of celestial bodies to check for collisions
   * @returns Array of collision pairs [planet1, planet2]
   */
  detectCollisions(planets: CelestialBody[]): Array<[CelestialBody, CelestialBody]> {
    // Build spatial grid
    this.buildGrid(planets);
    
    const collisions: Array<[CelestialBody, CelestialBody]> = [];
    const checkedPairs = new Set<string>();
    
    // Check collisions within each cell and adjacent cells
    for (const planet of planets) {
      const cellKeys = this.getCellKeysForPlanet(planet);
      
      for (const cellKey of cellKeys) {
        const cellPlanets = this.grid.cells.get(cellKey) || [];
        
        for (const otherPlanet of cellPlanets) {
          // Skip self-collision
          if (planet === otherPlanet) continue;
          
          // Create unique pair identifier (sorted to avoid duplicates)
          const pairId = this.getPairId(planet, otherPlanet);
          if (checkedPairs.has(pairId)) continue;
          checkedPairs.add(pairId);
          
          // Check if collision occurs
          if (this.checkCollision(planet, otherPlanet)) {
            collisions.push([planet, otherPlanet]);
          }
        }
      }
    }
    
    return collisions;
  }

  /**
   * Checks if two planets are colliding.
   * 
   * Collision occurs when the distance between planet centers is less than
   * the sum of their radii.
   * 
   * @param p1 - First planet
   * @param p2 - Second planet
   * @returns true if planets are colliding, false otherwise
   */
  checkCollision(p1: CelestialBody, p2: CelestialBody): boolean {
    const dx = p2.position.x - p1.position.x;
    const dy = p2.position.y - p1.position.y;
    const dz = p2.position.z - p1.position.z;
    
    const distanceSquared = dx * dx + dy * dy + dz * dz;
    const radiusSum = p1.radius + p2.radius;
    const radiusSumSquared = radiusSum * radiusSum;
    
    return distanceSquared < radiusSumSquared;
  }

  /**
   * Builds the spatial grid by assigning planets to cells based on their positions.
   * 
   * @param planets - Array of celestial bodies
   */
  private buildGrid(planets: CelestialBody[]): void {
    // Clear existing grid
    this.grid.cells.clear();
    
    // Assign each planet to appropriate cells
    for (const planet of planets) {
      const cellKeys = this.getCellKeysForPlanet(planet);
      
      for (const cellKey of cellKeys) {
        if (!this.grid.cells.has(cellKey)) {
          this.grid.cells.set(cellKey, []);
        }
        this.grid.cells.get(cellKey)!.push(planet);
      }
    }
  }

  /**
   * Gets all cell keys that a planet occupies (including cells it overlaps due to its radius).
   * 
   * @param planet - The celestial body
   * @returns Array of cell key strings
   */
  private getCellKeysForPlanet(planet: CelestialBody): string[] {
    const keys: string[] = [];
    
    // Calculate the range of cells the planet occupies
    const minX = Math.floor((planet.position.x - planet.radius) / this.cellSize);
    const maxX = Math.floor((planet.position.x + planet.radius) / this.cellSize);
    const minY = Math.floor((planet.position.y - planet.radius) / this.cellSize);
    const maxY = Math.floor((planet.position.y + planet.radius) / this.cellSize);
    const minZ = Math.floor((planet.position.z - planet.radius) / this.cellSize);
    const maxZ = Math.floor((planet.position.z + planet.radius) / this.cellSize);
    
    // Generate keys for all cells the planet occupies
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          keys.push(this.getCellKey(x, y, z));
        }
      }
    }
    
    return keys;
  }

  /**
   * Generates a unique key for a grid cell.
   * 
   * @param x - Cell x coordinate
   * @param y - Cell y coordinate
   * @param z - Cell z coordinate
   * @returns Cell key string
   */
  private getCellKey(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
  }

  /**
   * Creates a unique identifier for a planet pair (order-independent).
   * 
   * @param p1 - First planet
   * @param p2 - Second planet
   * @returns Unique pair identifier
   */
  private getPairId(p1: CelestialBody, p2: CelestialBody): string {
    // Use object references to create unique IDs
    const id1 = p1.name + '_' + p1.position.x + '_' + p1.position.y + '_' + p1.position.z;
    const id2 = p2.name + '_' + p2.position.x + '_' + p2.position.y + '_' + p2.position.z;
    
    // Sort to ensure order-independence
    return id1 < id2 ? `${id1}|${id2}` : `${id2}|${id1}`;
  }

  /**
   * Updates the cell size for the spatial grid.
   * 
   * @param cellSize - New cell size
   */
  setCellSize(cellSize: number): void {
    this.cellSize = cellSize;
    this.grid.cellSize = cellSize;
  }

  /**
   * Gets the current cell size.
   */
  getCellSize(): number {
    return this.cellSize;
  }
}
