/**
 * PhysicsEngine - Core physics simulation for the Interactive Universe Simulator
 * 
 * Implements gravitational force calculations, velocity updates, and position updates
 * using Newton's law of universal gravitation.
 */

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface CelestialBody {
  name: string;
  radius: number;
  color: number;
  
  // Physics properties
  velocity: Vector3D;
  position: Vector3D;
  mass: number;
  
  // State properties
  isCustom: boolean;
  isDragging: boolean;
  trailHistory: Vector3D[];
  metadata: Record<string, any>;
  
  // Legacy properties (for backward compatibility)
  distance?: number;
  speed?: number;
  angle?: number;
}

export interface PhysicsConfig {
  gravitationalConstant: number;
  collisionEnabled: boolean;
  mergeOnCollision: boolean;
  minPlanetRadius: number;
  maxPlanetRadius: number;
}

const DEFAULT_CONFIG: PhysicsConfig = {
  gravitationalConstant: 0.1,
  collisionEnabled: true,
  mergeOnCollision: true,
  minPlanetRadius: 0.1,
  maxPlanetRadius: 10,
};

export class PhysicsEngine {
  private config: PhysicsConfig;

  constructor(config: Partial<PhysicsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Calculates the gravitational force vector between two planets using Newton's law:
   * F = G * (m1 * m2) / r²
   * 
   * Returns the force vector acting on planet1 due to planet2.
   * 
   * @param planet1 - First celestial body
   * @param planet2 - Second celestial body
   * @returns Force vector acting on planet1
   */
  calculateGravitationalForce(planet1: CelestialBody, planet2: CelestialBody): Vector3D {
    // Calculate distance vector from planet1 to planet2
    const dx = planet2.position.x - planet1.position.x;
    const dy = planet2.position.y - planet1.position.y;
    const dz = planet2.position.z - planet1.position.z;
    
    // Calculate distance magnitude
    const distanceSquared = dx * dx + dy * dy + dz * dz;
    const distance = Math.sqrt(distanceSquared);
    
    // Avoid division by zero or extremely small distances
    if (distance < 0.001) {
      return { x: 0, y: 0, z: 0 };
    }
    
    // Calculate force magnitude: F = G * (m1 * m2) / r²
    const forceMagnitude = 
      (this.config.gravitationalConstant * planet1.mass * planet2.mass) / distanceSquared;
    
    // Calculate unit direction vector
    const directionX = dx / distance;
    const directionY = dy / distance;
    const directionZ = dz / distance;
    
    // Return force vector (force magnitude * direction)
    return {
      x: forceMagnitude * directionX,
      y: forceMagnitude * directionY,
      z: forceMagnitude * directionZ,
    };
  }

  /**
   * Updates velocities of all planets based on gravitational forces.
   * 
   * For each planet, calculates the net gravitational force from all other planets,
   * then updates velocity using: v_new = v_old + (F / m) * deltaTime
   * 
   * Planets that are being dragged are skipped.
   * 
   * @param planets - Array of celestial bodies
   * @param deltaTime - Time step in seconds
   */
  updateVelocities(planets: CelestialBody[], deltaTime: number): void {
    for (let i = 0; i < planets.length; i++) {
      const planet = planets[i];
      
      // Skip planets being dragged
      if (planet.isDragging) {
        continue;
      }
      
      // Calculate net force from all other planets
      let netForceX = 0;
      let netForceY = 0;
      let netForceZ = 0;
      
      for (let j = 0; j < planets.length; j++) {
        if (i === j) continue; // Skip self
        
        const force = this.calculateGravitationalForce(planet, planets[j]);
        netForceX += force.x;
        netForceY += force.y;
        netForceZ += force.z;
      }
      
      // Update velocity using F = ma => a = F/m => v_new = v_old + a * dt
      const accelerationX = netForceX / planet.mass;
      const accelerationY = netForceY / planet.mass;
      const accelerationZ = netForceZ / planet.mass;
      
      planet.velocity.x += accelerationX * deltaTime;
      planet.velocity.y += accelerationY * deltaTime;
      planet.velocity.z += accelerationZ * deltaTime;
    }
  }

  /**
   * Updates positions of all planets based on their velocities.
   * 
   * Uses simple Euler integration: position_new = position_old + velocity * deltaTime
   * 
   * Planets that are being dragged are skipped.
   * 
   * @param planets - Array of celestial bodies
   * @param deltaTime - Time step in seconds
   */
  updatePositions(planets: CelestialBody[], deltaTime: number): void {
    for (const planet of planets) {
      // Skip planets being dragged
      if (planet.isDragging) {
        continue;
      }
      
      // Update position using velocity
      planet.position.x += planet.velocity.x * deltaTime;
      planet.position.y += planet.velocity.y * deltaTime;
      planet.position.z += planet.velocity.z * deltaTime;
    }
  }

  /**
   * Gets the current physics configuration.
   */
  getConfig(): PhysicsConfig {
    return { ...this.config };
  }

  /**
   * Updates the physics configuration.
   */
  setConfig(config: Partial<PhysicsConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
