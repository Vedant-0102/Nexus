/**
 * Property-Based Tests for PhysicsEngine
 * 
 * Uses fast-check for property-based testing to verify universal correctness properties
 * across randomized inputs.
 */

import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { PhysicsEngine, Vector3D } from './PhysicsEngine';
import { CollisionDetector } from './CollisionDetector';

/**
 * Arbitrary generator for Vector3D
 */
const vector3DArbitrary = fc.record({
  x: fc.float({ min: Math.fround(-100), max: Math.fround(100), noNaN: true }),
  y: fc.float({ min: Math.fround(-100), max: Math.fround(100), noNaN: true }),
  z: fc.float({ min: Math.fround(-100), max: Math.fround(100), noNaN: true }),
});

/**
 * Arbitrary generator for CelestialBody
 */
const celestialBodyArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 20 }),
  radius: fc.float({ min: Math.fround(0.1), max: Math.fround(5), noNaN: true }),
  color: fc.integer({ min: 0, max: 0xFFFFFF }),
  velocity: vector3DArbitrary,
  position: vector3DArbitrary,
  mass: fc.float({ min: Math.fround(0.1), max: Math.fround(100), noNaN: true }),
  isCustom: fc.boolean(),
  isDragging: fc.boolean(),
  trailHistory: fc.constant([] as Vector3D[]),
  metadata: fc.constant({} as Record<string, any>),
});

/**
 * Helper function to calculate distance between two positions
 */
function calculateDistance(pos1: Vector3D, pos2: Vector3D): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  const dz = pos2.z - pos1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Helper function to calculate vector magnitude
 */
function vectorMagnitude(v: Vector3D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

describe('PhysicsEngine', () => {
  describe('Property 3: Mass Gravitational Effect', () => {
    test('gravitational force is proportional to both masses', () => {
      const engine = new PhysicsEngine();
      
      fc.assert(
        fc.property(
          celestialBodyArbitrary,
          celestialBodyArbitrary,
          fc.float({ min: Math.fround(0.5), max: Math.fround(2), noNaN: true }), // mass multiplier
          (planet1, planet2, massMultiplier) => {
            // Ensure planets are not at the same position
            const distance = calculateDistance(planet1.position, planet2.position);
            fc.pre(distance > 0.1); // Skip if too close
            
            // Calculate force with original masses
            const force1 = engine.calculateGravitationalForce(planet1, planet2);
            const forceMagnitude1 = vectorMagnitude(force1);
            
            // Create planet with scaled mass
            const planet1Scaled = { ...planet1, mass: planet1.mass * massMultiplier };
            
            // Calculate force with scaled mass
            const force2 = engine.calculateGravitationalForce(planet1Scaled, planet2);
            const forceMagnitude2 = vectorMagnitude(force2);
            
            // Force should scale proportionally with mass
            // F2 / F1 should equal massMultiplier
            if (forceMagnitude1 > 0.001) {
              const ratio = forceMagnitude2 / forceMagnitude1;
              expect(ratio).toBeCloseTo(massMultiplier, 2);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    test('gravitational force is inversely proportional to distance squared', () => {
      const engine = new PhysicsEngine();
      
      fc.assert(
        fc.property(
          celestialBodyArbitrary,
          celestialBodyArbitrary,
          (planet1, planet2) => {
            // Ensure planets are not at the same position
            const distance = calculateDistance(planet1.position, planet2.position);
            fc.pre(distance > 1.0); // Skip if too close
            
            // Calculate force at original distance
            const force1 = engine.calculateGravitationalForce(planet1, planet2);
            const forceMagnitude1 = vectorMagnitude(force1);
            
            // Move planet2 to double the distance
            const direction = {
              x: (planet2.position.x - planet1.position.x) / distance,
              y: (planet2.position.y - planet1.position.y) / distance,
              z: (planet2.position.z - planet1.position.z) / distance,
            };
            
            const planet2Moved = {
              ...planet2,
              position: {
                x: planet1.position.x + direction.x * distance * 2,
                y: planet1.position.y + direction.y * distance * 2,
                z: planet1.position.z + direction.z * distance * 2,
              },
            };
            
            // Calculate force at doubled distance
            const force2 = engine.calculateGravitationalForce(planet1, planet2Moved);
            const forceMagnitude2 = vectorMagnitude(force2);
            
            // Force should be 1/4 of original (inverse square law)
            // F2 / F1 should equal 1/4
            if (forceMagnitude1 > 0.001) {
              const ratio = forceMagnitude2 / forceMagnitude1;
              expect(ratio).toBeCloseTo(0.25, 2);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    test('gravitational force direction points from planet1 to planet2', () => {
      const engine = new PhysicsEngine();
      
      fc.assert(
        fc.property(
          celestialBodyArbitrary,
          celestialBodyArbitrary,
          (planet1, planet2) => {
            // Ensure planets are not at the same position
            const distance = calculateDistance(planet1.position, planet2.position);
            fc.pre(distance > 0.1); // Skip if too close
            
            // Calculate force
            const force = engine.calculateGravitationalForce(planet1, planet2);
            const forceMagnitude = vectorMagnitude(force);
            
            // Skip if force is negligible
            fc.pre(forceMagnitude > 0.001);
            
            // Calculate expected direction (from planet1 to planet2)
            const expectedDirection = {
              x: (planet2.position.x - planet1.position.x) / distance,
              y: (planet2.position.y - planet1.position.y) / distance,
              z: (planet2.position.z - planet1.position.z) / distance,
            };
            
            // Normalize force vector
            const forceDirection = {
              x: force.x / forceMagnitude,
              y: force.y / forceMagnitude,
              z: force.z / forceMagnitude,
            };
            
            // Force direction should match expected direction
            expect(forceDirection.x).toBeCloseTo(expectedDirection.x, 2);
            expect(forceDirection.y).toBeCloseTo(expectedDirection.y, 2);
            expect(forceDirection.z).toBeCloseTo(expectedDirection.z, 2);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 17: Collision Detection', () => {
    test('collisions detected iff distance < radius1 + radius2', () => {
      const detector = new CollisionDetector();
      
      fc.assert(
        fc.property(
          celestialBodyArbitrary,
          celestialBodyArbitrary,
          fc.float({ min: Math.fround(0.5), max: Math.fround(2), noNaN: true }), // distance multiplier
          (planet1, planet2, distanceMultiplier) => {
            // Calculate the sum of radii
            const radiusSum = planet1.radius + planet2.radius;
            
            // Position planet2 at a specific distance from planet1
            const distance = radiusSum * distanceMultiplier;
            
            const planet2Positioned = {
              ...planet2,
              position: {
                x: planet1.position.x + distance,
                y: planet1.position.y,
                z: planet1.position.z,
              },
            };
            
            // Check collision
            const isColliding = detector.checkCollision(planet1, planet2Positioned);
            
            // Collision should occur iff distance < radiusSum
            // distanceMultiplier < 1 means collision
            // distanceMultiplier >= 1 means no collision
            if (distanceMultiplier < 1) {
              expect(isColliding).toBe(true);
            } else {
              expect(isColliding).toBe(false);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    test('detectCollisions finds all colliding pairs', () => {
      const detector = new CollisionDetector();
      
      fc.assert(
        fc.property(
          fc.array(celestialBodyArbitrary, { minLength: 2, maxLength: 10 }),
          (planets) => {
            // Detect collisions using the spatial partitioning method
            const detectedCollisions = detector.detectCollisions(planets);
            
            // Manually check all pairs for collisions (brute force)
            const expectedCollisions: Array<[number, number]> = [];
            for (let i = 0; i < planets.length; i++) {
              for (let j = i + 1; j < planets.length; j++) {
                if (detector.checkCollision(planets[i], planets[j])) {
                  expectedCollisions.push([i, j]);
                }
              }
            }
            
            // The number of detected collisions should match expected
            expect(detectedCollisions.length).toBe(expectedCollisions.length);
            
            // Verify each detected collision is valid
            for (const [p1, p2] of detectedCollisions) {
              expect(detector.checkCollision(p1, p2)).toBe(true);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    test('no duplicate collision pairs reported', () => {
      const detector = new CollisionDetector();
      
      fc.assert(
        fc.property(
          fc.array(celestialBodyArbitrary, { minLength: 2, maxLength: 10 }),
          (planets) => {
            const detectedCollisions = detector.detectCollisions(planets);
            
            // Create set of pair identifiers
            const pairIds = new Set<string>();
            
            for (const [p1, p2] of detectedCollisions) {
              const id1 = `${p1.name}_${p1.position.x}_${p1.position.y}_${p1.position.z}`;
              const id2 = `${p2.name}_${p2.position.x}_${p2.position.y}_${p2.position.z}`;
              const pairId = id1 < id2 ? `${id1}|${id2}` : `${id2}|${id1}`;
              
              // Each pair should be unique
              expect(pairIds.has(pairId)).toBe(false);
              pairIds.add(pairId);
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
