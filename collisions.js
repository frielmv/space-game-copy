var Collisions = {
	colliding: false,
	collidedLastTick: false,
	COLLISION_TOLERANCE: 0.02, // how many meters off the ground to consider a collision
	BOUNCE_MULTIPLIER: 0.25, // 0 is no bounce, 1 is 100% bounce
	BOUNCE_THESHOLD: 3, // min impact velocity for a bounce
	SLIDE_MULTIPLIER: 0.02, // 1 is zero friction, 0 is immediate stop. Multiplied by this every second
	CRASH_VEL: 10,
	WEAK_COLLISION_THRESHOLD: 30, // how many degrees either direction is not considered 'on the legs' landing
	BODY_STRENGTH: 1/4, // multiplier for ship body impact vs landding legs
	STOPPED_VEL: 0.05, // too high will freeze up motion while accelerating
	tick() {
		this.stopped = this.colliding && Ship.vel.magnitude < this.STOPPED_VEL;
		if(this.stopped) {
			Ship.vel = new Point();
		}

		function altOf(point) { // get altitude of a collider
			return Ship.pos.addedTo(point, -1).magnitude - Bodies.soi.radius;
		}
		function colliderPos(collider) { // get the position of an angled collider
			return Point.fromVector(rotate(Ship.angle, collider.angle), collider.magnitude);
		}

		const activeCollider = Ship.COLLIDERS.reduce((prev, curr) =>
			altOf(colliderPos(curr)) < altOf(colliderPos(prev)) ? curr : prev
		);
		this.activeColliderRelative = colliderPos(activeCollider); // position of current collider relative to ship

		this.collisionAngle = Ship.pos.addedTo(this.activeColliderRelative).angle;

		this.colliding = altOf(this.activeColliderRelative) < this.COLLISION_TOLERANCE;

		const velAngleDiff = angleDiff(
			Ship.vel.angle, // prograde angle
			this.collisionAngle // angle of line between ship and body
		);
		this.impactVel = Ship.vel.magnitude * -Math.cos(velAngleDiff / 180 * Math.PI); // portion of ship's velocity that's towards the body

		const colliderVel = Point.fromVector(rotate(this.collisionAngle, 90), activeCollider.magnitude * Ship.velRot * Math.PI / 180); // linear velocity from angular

		if(this.colliding) {
			const impactVelChange = Point.fromVector(this.collisionAngle, Math.max(0, this.impactVel)); // velocity change needed to cancel out impact velocity

			if(this.impactVel > this.BOUNCE_THESHOLD) {
				// bouncing
				if(altOf(this.activeColliderRelative) < 0) {
					Ship.vel.add(impactVelChange, 1 + this.BOUNCE_MULTIPLIER);
				}
			} else { // sliding
				if(altOf(this.activeColliderRelative) < 0) { // canceling out impact velocity
					Ship.vel.add(impactVelChange);
				}

				// reducing overall velocity from friction, using rotating collider
				Ship.vel
					.add(colliderVel, -1)
					.multiply(this.SLIDE_MULTIPLIER ** (1 / Viewport.fps))
					.add(colliderVel);
			}

			// pushing ship away from body (not strictly necessary but minimizes clipping)
			Ship.pos.add(Point.fromVector(this.collisionAngle, Math.max(0, -altOf(this.activeColliderRelative))));

			// whether the ship is landing on its legs or not
			const weakCollision = Math.abs(rotate(Ship.angle, -Ship.pos.angle + 180) - 180) > this.WEAK_COLLISION_THRESHOLD;

			// runs once on collision
			if(!this.collidedLastTick) {
				if(
					(weakCollision && this.impactVel > this.CRASH_VEL * this.BODY_STRENGTH)
					||
					(this.impactVel > this.CRASH_VEL)
				) {
					Engine.resetAll();
				}
			}

			this.collidedLastTick = true;
		} else {
			this.collidedLastTick = false;
		}
	}
};