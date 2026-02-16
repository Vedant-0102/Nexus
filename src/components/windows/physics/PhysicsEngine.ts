/**
 * 2D Physics Engine
 * Handles gravity, collision detection, physics simulation, and special effects
 * for desktop elements (windows, icons)
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
  isFrozen?: boolean; // temporarily frozen
  speed?: number; // cached speed magnitude for visual effects
  trail?: { x: number; y: number; age: number }[]; // position trail for visuals
}

export type PhysicsEffect = 'tornado' | 'magnet' | 'wind-left' | 'wind-right' | 'slow-mo' | 'reverse-gravity' | 'chaos';

export class PhysicsEngine {
  private bodies: Map<string, PhysicsBody> = new Map();
  private gravity: number = 980; // pixels per second squared
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private bounds: { width: number; height: number };
  private airResistance: number = 0.985; // air resistance multiplier
  private minVelocity: number = 1; // minimum velocity before stopping
  private gravityMultiplier: number = 1; // adjustable gravity
  private timeScale: number = 1; // slow-mo / speed-up
  private bounciness: number = 1; // global bounciness multiplier
  private activeEffects: Set<PhysicsEffect> = new Set();
  private magnetPosition: { x: number; y: number } | null = null;
  private magnetStrength: number = 400;
  private tornadoAngle: number = 0;
  private windForce: number = 300;
  private trailLength: number = 8;
  private onUpdate: (() => void) | null = null;

  constructor(bounds: { width: number; height: number }) {
    this.bounds = bounds;
  }

  setOnUpdate(callback: (() => void) | null): void {
    this.onUpdate = callback;
  }

  setBounds(bounds: { width: number; height: number }): void {
    this.bounds = bounds;
  }

  setGravityMultiplier(multiplier: number): void {
    this.gravityMultiplier = Math.max(0, Math.min(3, multiplier));
  }

  getGravityMultiplier(): number {
    return this.gravityMultiplier;
  }

  setTimeScale(scale: number): void {
    this.timeScale = Math.max(0.1, Math.min(3, scale));
  }

  getTimeScale(): number {
    return this.timeScale;
  }

  setBounciness(bounce: number): void {
    this.bounciness = Math.max(0, Math.min(3, bounce));
  }

  getBounciness(): number {
    return this.bounciness;
  }

  // Effect management
  toggleEffect(effect: PhysicsEffect): boolean {
    if (this.activeEffects.has(effect)) {
      this.activeEffects.delete(effect);
      // Clean up effect-specific state
      if (effect === 'magnet') this.magnetPosition = null;
      if (effect === 'slow-mo') this.timeScale = 1;
      if (effect === 'reverse-gravity') this.gravityMultiplier = Math.abs(this.gravityMultiplier);
      return false;
    } else {
      // Mutually exclusive effects
      if (effect === 'wind-left') this.activeEffects.delete('wind-right');
      if (effect === 'wind-right') this.activeEffects.delete('wind-left');
      if (effect === 'slow-mo') this.timeScale = 0.25;
      if (effect === 'reverse-gravity') this.gravityMultiplier = -Math.abs(this.gravityMultiplier);
      this.activeEffects.add(effect);
      return true;
    }
  }

  isEffectActive(effect: PhysicsEffect): boolean {
    return this.activeEffects.has(effect);
  }

  getActiveEffects(): PhysicsEffect[] {
    return Array.from(this.activeEffects);
  }

  clearAllEffects(): void {
    this.activeEffects.clear();
    this.magnetPosition = null;
    this.timeScale = 1;
    if (this.gravityMultiplier < 0) this.gravityMultiplier = Math.abs(this.gravityMultiplier);
  }

  updateMagnetPosition(x: number, y: number): void {
    this.magnetPosition = { x, y };
  }

  addBody(body: PhysicsBody): void {
    body.speed = 0;
    body.trail = [];
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
    let deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.016); // Cap at 60fps
    this.lastTime = currentTime;

    // Apply time scale
    deltaTime *= this.timeScale;

    // Update tornado angle
    if (this.activeEffects.has('tornado')) {
      this.tornadoAngle += deltaTime * 3;
    }

    // Update all dynamic bodies
    for (const body of this.bodies.values()) {
      if (!body.isStatic && !body.isFrozen) {
        this.updatePhysics(body, deltaTime);
        this.updateTrail(body);
      }
      // Update speed cache for visual effects
      body.speed = Math.sqrt(body.vx * body.vx + body.vy * body.vy);
    }

    // Check collisions (run multiple iterations for better separation)
    for (let iteration = 0; iteration < 2; iteration++) {
      this.checkCollisions();
    }

    // Apply anti-stacking forces
    this.applyAntiStackingForces();

    // Notify listeners
    if (this.onUpdate) this.onUpdate();

    this.animationFrameId = requestAnimationFrame(this.update);
  };

  private updateTrail(body: PhysicsBody): void {
    if (!body.trail) body.trail = [];

    const speed = body.speed || 0;
    // Only add trail points when moving fast enough
    if (speed > 50) {
      body.trail.unshift({
        x: body.x + body.width / 2,
        y: body.y + body.height / 2,
        age: 0,
      });
    }

    // Age and trim trail
    body.trail = body.trail
      .map(p => ({ ...p, age: p.age + 1 }))
      .filter(p => p.age < this.trailLength);
  }

  private updatePhysics(body: PhysicsBody, dt: number): void {
    // Skip physics if being dragged
    if (body.isDragging) {
      body.vx = 0;
      body.vy = 0;
      body.angularVelocity *= 0.9;
      return;
    }

    // Apply gravity with multiplier (can be negative for reverse gravity)
    body.vy += this.gravity * this.gravityMultiplier * dt;

    // Apply active effects
    this.applyEffects(body, dt);

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

    // Cap angular velocity to prevent insane spinning
    const maxAngular = 15;
    if (body.angularVelocity > maxAngular) body.angularVelocity = maxAngular;
    if (body.angularVelocity < -maxAngular) body.angularVelocity = -maxAngular;

    // Boundary collisions
    this.checkBoundaryCollisions(body);
  }

  private applyEffects(body: PhysicsBody, dt: number): void {
    // Tornado - circular vortex force pulling toward center with spin
    if (this.activeEffects.has('tornado')) {
      const centerX = this.bounds.width / 2;
      const centerY = this.bounds.height / 2 - 100;
      const bx = body.x + body.width / 2;
      const by = body.y + body.height / 2;
      const dx = centerX - bx;
      const dy = centerY - by;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;

      // Inward pull (stronger when closer)
      const pullStrength = Math.min(400, 80000 / (distance + 100));
      body.vx += (dx / distance) * pullStrength * dt;
      body.vy += (dy / distance) * pullStrength * dt;

      // Tangential spin force (perpendicular to radius)
      const tangentX = -dy / distance;
      const tangentY = dx / distance;
      const spinStrength = Math.min(600, 120000 / (distance + 100));
      body.vx += tangentX * spinStrength * dt;
      body.vy += tangentY * spinStrength * dt;

      // Add angular spin from tornado
      body.angularVelocity += (Math.random() - 0.5) * 3 * dt;

      // Upward lift near center
      if (distance < 200) {
        body.vy -= 400 * dt * (1 - distance / 200);
      }
    }

    // Magnet - attract to cursor position
    if (this.activeEffects.has('magnet') && this.magnetPosition) {
      const bx = body.x + body.width / 2;
      const by = body.y + body.height / 2;
      const dx = this.magnetPosition.x - bx;
      const dy = this.magnetPosition.y - by;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;

      // Inverse-square attraction (stronger when closer)
      const strength = this.magnetStrength * Math.min(1, 50000 / (distance * distance + 1000));
      body.vx += (dx / distance) * strength * dt;
      body.vy += (dy / distance) * strength * dt;
    }

    // Wind - horizontal constant force
    if (this.activeEffects.has('wind-left')) {
      body.vx -= this.windForce * dt;
      // Slight lift and tumble from wind
      body.vy -= 30 * dt;
      body.angularVelocity -= 0.5 * dt;
    }
    if (this.activeEffects.has('wind-right')) {
      body.vx += this.windForce * dt;
      body.vy -= 30 * dt;
      body.angularVelocity += 0.5 * dt;
    }

    // Chaos - random forces each frame
    if (this.activeEffects.has('chaos')) {
      body.vx += (Math.random() - 0.5) * 800 * dt;
      body.vy += (Math.random() - 0.5) * 800 * dt;
      body.angularVelocity += (Math.random() - 0.5) * 8 * dt;
    }
  }

  private checkBoundaryCollisions(body: PhysicsBody): void {
    const taskbarHeight = 48;
    const groundY = this.bounds.height - taskbarHeight;
    const effectiveRestitution = body.restitution * this.bounciness;

    // Cap max velocity to prevent bodies from escaping
    const maxVelocity = 2000;
    if (body.vx > maxVelocity) body.vx = maxVelocity;
    if (body.vx < -maxVelocity) body.vx = -maxVelocity;
    if (body.vy > maxVelocity) body.vy = maxVelocity;
    if (body.vy < -maxVelocity) body.vy = -maxVelocity;

    // Bottom collision (ground/taskbar)
    if (body.y + body.height >= groundY) {
      body.y = groundY - body.height;
      body.vy = -body.vy * effectiveRestitution;

      // Transfer horizontal velocity to angular velocity on bounce
      const contactSpeed = Math.abs(body.vx);
      if (contactSpeed > 20) {
        body.angularVelocity += (body.vx > 0 ? 1 : -1) * contactSpeed * 0.003;
      }

      body.angularVelocity *= effectiveRestitution;

      // Stop bouncing if velocity is too low
      if (Math.abs(body.vy) < 30) {
        body.vy = 0;
        body.angularVelocity *= 0.8;
      }

      // Apply ground friction to horizontal movement
      body.vx *= 0.95;

      // Gradually settle rotation when on ground and slow
      if (Math.abs(body.vx) < 10 && Math.abs(body.angularVelocity) < 0.5) {
        const targetRotation = Math.round(body.rotation / (Math.PI * 2)) * (Math.PI * 2);
        body.rotation += (targetRotation - body.rotation) * 0.05;
      }
    }

    // Top boundary
    if (this.gravityMultiplier < 0) {
      // Reverse gravity: ceiling becomes ground
      if (body.y < 0) {
        body.y = 0;
        body.vy = -body.vy * effectiveRestitution;
        if (Math.abs(body.vy) < 30) body.vy = 0;
        body.vx *= 0.95;
      }
    } else if (body.y < 0) {
      body.y = 0;
      body.vy = -body.vy * effectiveRestitution;
    }

    // Left boundary - keep body on screen
    if (body.x < 0) {
      body.x = 0;
      body.vx = -body.vx * effectiveRestitution;
      body.angularVelocity = -body.angularVelocity * effectiveRestitution;
    }

    // Right boundary - keep body on screen
    if (body.x + body.width > this.bounds.width) {
      body.x = this.bounds.width - body.width;
      body.vx = -body.vx * effectiveRestitution;
      body.angularVelocity = -body.angularVelocity * effectiveRestitution;
    }
  }

  private checkCollisions(): void {
    const bodiesArray = Array.from(this.bodies.values());

    for (let i = 0; i < bodiesArray.length; i++) {
      for (let j = i + 1; j < bodiesArray.length; j++) {
        const bodyA = bodiesArray[i];
        const bodyB = bodiesArray[j];

        // Skip if both are static, either is being dragged, or either is frozen
        if ((bodyA.isStatic && bodyB.isStatic) || bodyA.isDragging || bodyB.isDragging) continue;
        if (bodyA.isFrozen && bodyB.isFrozen) continue;

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
    const effectiveBounceA = a.restitution * this.bounciness;
    const effectiveBounceB = b.restitution * this.bounciness;

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

    // Calculate collision point for torque
    const collisionX = (aCenterX + bCenterX) / 2;
    const collisionY = (aCenterY + bCenterY) / 2;

    // Separate along the axis of least penetration with improved separation
    if (overlapX < overlapY) {
      // Horizontal separation
      const direction = a.x < b.x ? -1 : 1;
      const totalSeparation = overlapX + 2;

      if (!a.isStatic && !a.isFrozen && !b.isStatic && !b.isFrozen) {
        const totalMass = a.mass + b.mass;
        const aRatio = b.mass / totalMass;
        const bRatio = a.mass / totalMass;

        a.x += direction * totalSeparation * aRatio;
        b.x -= direction * totalSeparation * bRatio;

        const relativeVx = a.vx - b.vx;
        const impulse = relativeVx * (1 + Math.min(effectiveBounceA, effectiveBounceB));

        a.vx -= impulse * bRatio;
        b.vx += impulse * aRatio;

        // Torque from off-center collision
        const torqueA = (collisionY - aCenterY) / a.height * relativeVx * 0.01;
        const torqueB = (collisionY - bCenterY) / b.height * relativeVx * 0.01;
        a.angularVelocity += torqueA / a.mass;
        b.angularVelocity -= torqueB / b.mass;
      } else if (!a.isStatic && !a.isFrozen) {
        a.x += direction * totalSeparation;
        a.vx = -a.vx * effectiveBounceA;
        a.angularVelocity += (collisionY - aCenterY) / a.height * a.vx * 0.005;
      } else if (!b.isStatic && !b.isFrozen) {
        b.x -= direction * totalSeparation;
        b.vx = -b.vx * effectiveBounceB;
        b.angularVelocity += (collisionY - bCenterY) / b.height * b.vx * 0.005;
      }
    } else {
      // Vertical separation
      const direction = a.y < b.y ? -1 : 1;
      const totalSeparation = overlapY + 2;

      if (!a.isStatic && !a.isFrozen && !b.isStatic && !b.isFrozen) {
        const totalMass = a.mass + b.mass;
        const aRatio = b.mass / totalMass;
        const bRatio = a.mass / totalMass;

        a.y += direction * totalSeparation * aRatio;
        b.y -= direction * totalSeparation * bRatio;

        const relativeVy = a.vy - b.vy;
        const impulse = relativeVy * (1 + Math.min(effectiveBounceA, effectiveBounceB));

        a.vy -= impulse * bRatio;
        b.vy += impulse * aRatio;

        // Torque from off-center collision
        const torqueA = (collisionX - aCenterX) / a.width * relativeVy * 0.01;
        const torqueB = (collisionX - bCenterX) / b.width * relativeVy * 0.01;
        a.angularVelocity -= torqueA / a.mass;
        b.angularVelocity += torqueB / b.mass;
      } else if (!a.isStatic && !a.isFrozen) {
        a.y += direction * totalSeparation;
        a.vy = -a.vy * effectiveBounceA;
        a.angularVelocity -= (collisionX - aCenterX) / a.width * a.vy * 0.005;
      } else if (!b.isStatic && !b.isFrozen) {
        b.y -= direction * totalSeparation;
        b.vy = -b.vy * effectiveBounceB;
        b.angularVelocity -= (collisionX - bCenterX) / b.width * b.vy * 0.005;
      }
    }

    // Add gentle push force to prevent sticking
    if (!a.isStatic && !a.isFrozen && !b.isStatic && !b.isFrozen) {
      const pushForce = 15;
      a.vx -= nx * pushForce / a.mass;
      a.vy -= ny * pushForce / a.mass;
      b.vx += nx * pushForce / b.mass;
      b.vy += ny * pushForce / b.mass;

      // Dampen angular momentum on collision
      a.angularVelocity *= 0.6;
      b.angularVelocity *= 0.6;
    }
  }

  applyForce(id: string, fx: number, fy: number): void {
    const body = this.bodies.get(id);
    if (body && !body.isStatic && !body.isFrozen) {
      body.vx += fx / body.mass;
      body.vy += fy / body.mass;
    }
  }

  applyImpulse(id: string, vx: number, vy: number): void {
    const body = this.bodies.get(id);
    if (body && !body.isStatic && !body.isFrozen) {
      body.vx += vx;
      body.vy += vy;
    }
  }

  setGravity(gravity: number): void {
    this.gravity = gravity;
  }

  reset(): void {
    this.bodies.clear();
    this.activeEffects.clear();
    this.magnetPosition = null;
    this.timeScale = 1;
  }

  getAllBodies(): PhysicsBody[] {
    return Array.from(this.bodies.values());
  }

  getBodyCount(): number {
    return this.bodies.size;
  }

  // Get total kinetic energy for stats display
  getTotalEnergy(): number {
    let energy = 0;
    for (const body of this.bodies.values()) {
      if (!body.isStatic) {
        energy += 0.5 * body.mass * (body.vx * body.vx + body.vy * body.vy);
      }
    }
    return energy;
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
      body.vx = (newX - body.x) * 8;
      body.vy = (newY - body.y) * 8;

      body.x = newX;
      body.y = newY;
    }
  }

  endDrag(id: string): void {
    const body = this.bodies.get(id);
    if (body) {
      body.isDragging = false;
      if (body.isFrozen) {
        // Keep frozen bodies still after repositioning
        body.vx = 0;
        body.vy = 0;
        body.angularVelocity = 0;
      } else {
        // Cap throw velocity to prevent extreme launches
        const maxThrow = 1500;
        if (body.vx > maxThrow) body.vx = maxThrow;
        if (body.vx < -maxThrow) body.vx = -maxThrow;
        if (body.vy > maxThrow) body.vy = maxThrow;
        if (body.vy < -maxThrow) body.vy = -maxThrow;
      }
    }
  }

  // Freeze/unfreeze a specific body
  freezeBody(id: string): void {
    const body = this.bodies.get(id);
    if (body && !body.isStatic) {
      body.isFrozen = true;
      body.vx = 0;
      body.vy = 0;
      body.angularVelocity = 0;
    }
  }

  unfreezeBody(id: string): void {
    const body = this.bodies.get(id);
    if (body) {
      body.isFrozen = false;
    }
  }

  // Freeze/unfreeze all bodies
  freezeAll(): void {
    for (const body of this.bodies.values()) {
      if (!body.isStatic) {
        body.isFrozen = true;
        body.vx = 0;
        body.vy = 0;
        body.angularVelocity = 0;
      }
    }
  }

  unfreezeAll(): void {
    for (const body of this.bodies.values()) {
      body.isFrozen = false;
    }
  }

  isAllFrozen(): boolean {
    for (const body of this.bodies.values()) {
      if (!body.isStatic && !body.isFrozen) return false;
    }
    return this.bodies.size > 0;
  }

  // Shake all elements
  shake(intensity: number = 100): void {
    for (const body of this.bodies.values()) {
      if (!body.isStatic && !body.isFrozen) {
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
        body.isFrozen = false; // Unfreeze on explode
        const dx = (body.x + body.width / 2) - centerX;
        const dy = (body.y + body.height / 2) - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;

        // Inverse distance for stronger near-center push
        const distanceFactor = Math.max(0.3, 1 - distance / 1000);
        body.vx += normalizedDx * force * distanceFactor;
        body.vy += normalizedDy * force * distanceFactor;
        body.angularVelocity += (Math.random() - 0.5) * 8;
      }
    }
  }

  // Implode - pull everything to center
  implode(centerX: number, centerY: number, force: number = 500): void {
    for (const body of this.bodies.values()) {
      if (!body.isStatic) {
        body.isFrozen = false;
        const dx = centerX - (body.x + body.width / 2);
        const dy = centerY - (body.y + body.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

        body.vx += (dx / distance) * force * 0.8;
        body.vy += (dy / distance) * force * 0.8;
        body.angularVelocity += (Math.random() - 0.5) * 4;
      }
    }
  }

  // Attract to point (continuous)
  attract(centerX: number, centerY: number, force: number = 300): void {
    for (const body of this.bodies.values()) {
      if (!body.isStatic && !body.isFrozen) {
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

  // Launch all bodies upward
  launchAll(force: number = 500): void {
    for (const body of this.bodies.values()) {
      if (!body.isStatic) {
        body.isFrozen = false;
        body.vy -= force;
        body.vx += (Math.random() - 0.5) * force * 0.3;
        body.angularVelocity += (Math.random() - 0.5) * 4;
      }
    }
  }

  // Scatter - random directions
  scatter(force: number = 400): void {
    for (const body of this.bodies.values()) {
      if (!body.isStatic) {
        body.isFrozen = false;
        const angle = Math.random() * Math.PI * 2;
        body.vx += Math.cos(angle) * force;
        body.vy += Math.sin(angle) * force;
        body.angularVelocity += (Math.random() - 0.5) * 6;
      }
    }
  }

  // Stack all bodies in center
  stackInCenter(): void {
    const centerX = this.bounds.width / 2;
    let currentY = this.bounds.height - 48; // Start from ground

    const sortedBodies = Array.from(this.bodies.values())
      .filter(b => !b.isStatic)
      .sort((a, b) => b.mass - a.mass); // Heaviest at bottom

    for (const body of sortedBodies) {
      body.isFrozen = false;
      currentY -= body.height;
      body.x = centerX - body.width / 2;
      body.y = currentY - 5; // Small gap
      body.vx = 0;
      body.vy = 0;
      body.rotation = 0;
      body.angularVelocity = 0;
    }
  }

  // Zero gravity mode
  setZeroGravity(enabled: boolean): void {
    this.gravityMultiplier = enabled ? 0 : 1;
  }

  // Anti-stacking forces to prevent windows from overlapping
  private applyAntiStackingForces(): void {
    const bodiesArray = Array.from(this.bodies.values());
    const minDistance = 5;

    for (let i = 0; i < bodiesArray.length; i++) {
      for (let j = i + 1; j < bodiesArray.length; j++) {
        const bodyA = bodiesArray[i];
        const bodyB = bodiesArray[j];

        // Skip if either is static, dragged, or both frozen
        if (bodyA.isStatic || bodyB.isStatic || bodyA.isDragging || bodyB.isDragging) continue;
        if (bodyA.isFrozen && bodyB.isFrozen) continue;

        // Calculate centers
        const aCenterX = bodyA.x + bodyA.width / 2;
        const aCenterY = bodyA.y + bodyA.height / 2;
        const bCenterX = bodyB.x + bodyB.width / 2;
        const bCenterY = bodyB.y + bodyB.height / 2;

        // Calculate distance between centers
        const dx = bCenterX - aCenterX;
        const dy = bCenterY - aCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Calculate minimum safe distance
        const avgHalfWidth = (bodyA.width + bodyB.width) / 4;
        const avgHalfHeight = (bodyA.height + bodyB.height) / 4;
        const minSafeDistance = Math.sqrt(avgHalfWidth * avgHalfWidth + avgHalfHeight * avgHalfHeight) + minDistance;

        // If too close, apply repulsion force
        if (distance < minSafeDistance && distance > 0) {
          const force = (minSafeDistance - distance) * 0.5;
          const nxd = dx / distance;
          const nyd = dy / distance;

          const totalMass = bodyA.mass + bodyB.mass;
          const aForce = force * (bodyB.mass / totalMass);
          const bForce = force * (bodyA.mass / totalMass);

          if (!bodyA.isFrozen) {
            bodyA.vx -= nxd * aForce;
            bodyA.vy -= nyd * aForce;
          }
          if (!bodyB.isFrozen) {
            bodyB.vx += nxd * bForce;
            bodyB.vy += nyd * bForce;
          }
        }
      }
    }
  }
}
