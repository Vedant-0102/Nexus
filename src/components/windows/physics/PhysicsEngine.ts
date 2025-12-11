/**
 * Lightweight 2D Physics Engine
 * Handles gravity, collision detection, and physics simulation for desktop elements
 */

export interface PhysicsBody {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number; // velocity x
  vy: number; // velocity y
  mass: number;
  restitution: number; // bounciness (0-1)
  friction: number; // friction coefficient
  isStatic: boolean; // static bodies don't move (like taskbar)
  rotation: number; // rotation in radians
  angularVelocity: number;
  isDragging?: boolean; // being dragged by user
  dragOffsetX?: number;
  dragOffsetY?: number;
}

export class PhysicsEngine {
  private bodies: Map<string, PhysicsBody> = new Map();
  private gravity: number = 980; // pixels per second squared
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private bounds: { width: number; height: number };
  private airResistance: number = 0.99; // air resistance multiplier
  private minVelocity: number = 0.5; // minimum velocity before stopping
  private gravityMultiplier: number = 1; // adjustable gravity

  constructor(bounds: { width: number; height: number }) {
    this.bounds = bounds;
  }

  setGravityMultiplier(multiplier: number): void {
    this.gravityMultiplier = Math.max(0, Math.min(3, multiplier));
  }

  getGravityMultiplier(): number {
    return this.gravityMultiplier;
  }

  addBody(body: PhysicsBody): void {
    this.bodies.set(body.id, body);
  }

  removeBody(id: string): void {
    this.bodies.delete(id);
  }

  getBody(id: string): PhysicsBody | undefined {
    return this.bodies.get(id);
  }

  updateBody(id: string, updates: Partial<PhysicsBody>): void {
    const body = this.bodies.get(id);
    if (body) {
      Object.assign(body, updates);
    }
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.update();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private update = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.016); // Cap at 60fps
    this.lastTime = currentTime;

    // Update all dynamic bodies
    for (const body of this.bodies.values()) {
      if (!body.isStatic) {
        this.updatePhysics(body, deltaTime);
      }
    }

    // Check collisions (run multiple iterations for better separation)
    for (let iteration = 0; iteration < 2; iteration++) {
      this.checkCollisions();
    }

    // Apply anti-stacking forces
    this.applyAntiStackingForces();

    this.animationFrameId = requestAnimationFrame(this.update);
  };

  private updatePhysics(body: PhysicsBody, dt: number): void {
    // Skip physics if being dragged
    if (body.isDragging) {
      body.vx = 0;
      body.vy = 0;
      body.angularVelocity *= 0.9;
      return;
    }

    // Apply gravity with multiplier
    body.vy += this.gravity * this.gravityMultiplier * dt;

    // Apply air resistance
    body.vx *= this.airResistance;
    body.vy *= this.airResistance;

    // Apply velocity
    body.x += body.vx * dt;
    body.y += body.vy * dt;

    // Apply angular velocity
    body.rotation += body.angularVelocity * dt;

    // Apply friction to horizontal velocity
    body.vx *= (1 - body.friction * dt);
    body.angularVelocity *= (1 - body.friction * dt);

    // Stop very slow movement
    if (Math.abs(body.vx) < this.minVelocity) body.vx = 0;
    if (Math.abs(body.vy) < this.minVelocity && body.y + body.height >= this.bounds.height - 48) {
      body.vy = 0;
    }
    if (Math.abs(body.angularVelocity) < 0.01) body.angularVelocity = 0;

    // Boundary collisions
    this.checkBoundaryCollisions(body);
  }

  private checkBoundaryCollisions(body: PhysicsBody): void {
    const taskbarHeight = 48;
    const groundY = this.bounds.height - taskbarHeight;
    const allowedOffscreen = body.width * 0.8; // Allow 80% of width offscreen

    // Bottom collision (ground/taskbar)
    if (body.y + body.height >= groundY) {
      body.y = groundY - body.height;
      body.vy = -body.vy * body.restitution;
      body.angularVelocity *= body.restitution;

      // Stop bouncing if velocity is too low
      if (Math.abs(body.vy) < 10) {
        body.vy = 0;
        body.angularVelocity *= 0.9;
      }
    }

    // Left boundary - allow windows to go mostly offscreen
    if (body.x + body.width < allowedOffscreen) {
      body.x = allowedOffscreen - body.width;
      body.vx = -body.vx * body.restitution;
      body.angularVelocity = -body.angularVelocity * body.restitution;
    }

    // Right boundary - allow windows to go mostly offscreen
    if (body.x > this.bounds.width - allowedOffscreen) {
      body.x = this.bounds.width - allowedOffscreen;
      body.vx = -body.vx * body.restitution;
      body.angularVelocity = -body.angularVelocity * body.restitution;
    }

    // Top boundary - allow windows to go mostly offscreen
    if (body.y + body.height < allowedOffscreen) {
      body.y = allowedOffscreen - body.height;
      body.vy = -body.vy * body.restitution;
    }
  }

  private checkCollisions(): void {
    const bodiesArray = Array.from(this.bodies.values());

    for (let i = 0; i < bodiesArray.length; i++) {
      for (let j = i + 1; j < bodiesArray.length; j++) {
        const bodyA = bodiesArray[i];
        const bodyB = bodiesArray[j];

        // Skip if both are static or either is being dragged
        if ((bodyA.isStatic && bodyB.isStatic) || bodyA.isDragging || bodyB.isDragging) continue;

        if (this.checkAABBCollision(bodyA, bodyB)) {
          this.resolveCollision(bodyA, bodyB);
        }
      }
    }
  }

  private checkAABBCollision(a: PhysicsBody, b: PhysicsBody): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  private resolveCollision(a: PhysicsBody, b: PhysicsBody): void {
    // Calculate overlap
    const overlapX = Math.min(a.x + a.width - b.x, b.x + b.width - a.x);
    const overlapY = Math.min(a.y + a.height - b.y, b.y + b.height - a.y);

    // Calculate centers
    const aCenterX = a.x + a.width / 2;
    const aCenterY = a.y + a.height / 2;
    const bCenterX = b.x + b.width / 2;
    const bCenterY = b.y + b.height / 2;

    // Calculate collision normal
    const dx = bCenterX - aCenterX;
    const dy = bCenterY - aCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / distance;
    const ny = dy / distance;

    // Separate along the axis of least penetration with improved separation
    if (overlapX < overlapY) {
      // Horizontal separation
      const direction = a.x < b.x ? -1 : 1;
      const totalSeparation = overlapX + 2; // Add extra spacing to prevent sticking

      if (!a.isStatic && !b.isStatic) {
        // Both dynamic - split separation based on mass
        const totalMass = a.mass + b.mass;
        const aRatio = b.mass / totalMass;
        const bRatio = a.mass / totalMass;
        
        a.x += direction * totalSeparation * aRatio;
        b.x -= direction * totalSeparation * bRatio;
        
        // Exchange velocities with restitution
        const relativeVx = a.vx - b.vx;
        const impulse = relativeVx * (1 + Math.min(a.restitution, b.restitution));
        
        a.vx -= impulse * bRatio;
        b.vx += impulse * aRatio;
      } else if (!a.isStatic) {
        a.x += direction * totalSeparation;
        a.vx = -a.vx * a.restitution;
      } else if (!b.isStatic) {
        b.x -= direction * totalSeparation;
        b.vx = -b.vx * b.restitution;
      }
    } else {
      // Vertical separation
      const direction = a.y < b.y ? -1 : 1;
      const totalSeparation = overlapY + 2; // Add extra spacing to prevent sticking

      if (!a.isStatic && !b.isStatic) {
        // Both dynamic - split separation based on mass
        const totalMass = a.mass + b.mass;
        const aRatio = b.mass / totalMass;
        const bRatio = a.mass / totalMass;
        
        a.y += direction * totalSeparation * aRatio;
        b.y -= direction * totalSeparation * bRatio;
        
        // Exchange velocities with restitution
        const relativeVy = a.vy - b.vy;
        const impulse = relativeVy * (1 + Math.min(a.restitution, b.restitution));
        
        a.vy -= impulse * bRatio;
        b.vy += impulse * aRatio;
      } else if (!a.isStatic) {
        a.y += direction * totalSeparation;
        a.vy = -a.vy * a.restitution;
      } else if (!b.isStatic) {
        b.y -= direction * totalSeparation;
        b.vy = -b.vy * b.restitution;
      }
    }

    // Add some push force to prevent sticking
    if (!a.isStatic && !b.isStatic) {
      const pushForce = 50;
      a.vx -= nx * pushForce / a.mass;
      a.vy -= ny * pushForce / a.mass;
      b.vx += nx * pushForce / b.mass;
      b.vy += ny * pushForce / b.mass;
      
      // Transfer some angular momentum on collision
      const avgAngularVel = (a.angularVelocity + b.angularVelocity) / 2;
      a.angularVelocity = avgAngularVel * 0.7;
      b.angularVelocity = avgAngularVel * 0.7;
    }
  }

  applyForce(id: string, fx: number, fy: number): void {
    const body = this.bodies.get(id);
    if (body && !body.isStatic) {
      body.vx += fx / body.mass;
      body.vy += fy / body.mass;
    }
  }

  applyImpulse(id: string, vx: number, vy: number): void {
    const body = this.bodies.get(id);
    if (body && !body.isStatic) {
      body.vx += vx;
      body.vy += vy;
    }
  }

  setGravity(gravity: number): void {
    this.gravity = gravity;
  }

  reset(): void {
    this.bodies.clear();
  }

  getAllBodies(): PhysicsBody[] {
    return Array.from(this.bodies.values());
  }

  // Drag and drop support
  startDrag(id: string, mouseX: number, mouseY: number): void {
    const body = this.bodies.get(id);
    if (body && !body.isStatic) {
      body.isDragging = true;
      body.dragOffsetX = mouseX - body.x;
      body.dragOffsetY = mouseY - body.y;
      body.vx = 0;
      body.vy = 0;
    }
  }

  updateDrag(id: string, mouseX: number, mouseY: number): void {
    const body = this.bodies.get(id);
    if (body && body.isDragging) {
      const newX = mouseX - (body.dragOffsetX || 0);
      const newY = mouseY - (body.dragOffsetY || 0);
      
      // Calculate velocity based on movement
      body.vx = (newX - body.x) * 20;
      body.vy = (newY - body.y) * 20;
      
      body.x = newX;
      body.y = newY;
    }
  }

  endDrag(id: string): void {
    const body = this.bodies.get(id);
    if (body) {
      body.isDragging = false;
      // Velocity is already set from updateDrag
    }
  }

  // Shake all elements
  shake(intensity: number = 100): void {
    for (const body of this.bodies.values()) {
      if (!body.isStatic) {
        body.vx += (Math.random() - 0.5) * intensity;
        body.vy += (Math.random() - 0.5) * intensity;
        body.angularVelocity += (Math.random() - 0.5) * 2;
      }
    }
  }

  // Explode from center
  explode(centerX: number, centerY: number, force: number = 500): void {
    for (const body of this.bodies.values()) {
      if (!body.isStatic) {
        const dx = (body.x + body.width / 2) - centerX;
        const dy = (body.y + body.height / 2) - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;
        
        body.vx += normalizedDx * force;
        body.vy += normalizedDy * force;
        body.angularVelocity += (Math.random() - 0.5) * 5;
      }
    }
  }

  // Attract to point
  attract(centerX: number, centerY: number, force: number = 300): void {
    for (const body of this.bodies.values()) {
      if (!body.isStatic) {
        const dx = centerX - (body.x + body.width / 2);
        const dy = centerY - (body.y + body.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;
        
        body.vx += normalizedDx * force * 0.016;
        body.vy += normalizedDy * force * 0.016;
      }
    }
  }

  // Zero gravity mode
  setZeroGravity(enabled: boolean): void {
    this.gravityMultiplier = enabled ? 0 : 1;
  }

  // Anti-stacking forces to prevent windows from overlapping
  private applyAntiStackingForces(): void {
    const bodiesArray = Array.from(this.bodies.values());
    const minDistance = 5; // Minimum distance between windows

    for (let i = 0; i < bodiesArray.length; i++) {
      for (let j = i + 1; j < bodiesArray.length; j++) {
        const bodyA = bodiesArray[i];
        const bodyB = bodiesArray[j];

        // Skip if either is static or being dragged
        if (bodyA.isStatic || bodyB.isStatic || bodyA.isDragging || bodyB.isDragging) continue;

        // Calculate centers
        const aCenterX = bodyA.x + bodyA.width / 2;
        const aCenterY = bodyA.y + bodyA.height / 2;
        const bCenterX = bodyB.x + bodyB.width / 2;
        const bCenterY = bodyB.y + bodyB.height / 2;

        // Calculate distance between centers
        const dx = bCenterX - aCenterX;
        const dy = bCenterY - aCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Calculate minimum safe distance (sum of half-widths + half-heights + buffer)
        const minSafeDistance = (bodyA.width + bodyB.width) / 2 + minDistance;

        // If too close, apply repulsion force
        if (distance < minSafeDistance && distance > 0) {
          const force = (minSafeDistance - distance) * 0.5;
          const nx = dx / distance;
          const ny = dy / distance;

          // Apply force proportional to mass
          const totalMass = bodyA.mass + bodyB.mass;
          const aForce = force * (bodyB.mass / totalMass);
          const bForce = force * (bodyA.mass / totalMass);

          bodyA.vx -= nx * aForce;
          bodyA.vy -= ny * aForce;
          bodyB.vx += nx * bForce;
          bodyB.vy += ny * bForce;
        }
      }
    }
  }
}
