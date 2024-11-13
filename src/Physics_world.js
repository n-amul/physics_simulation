import * as THREE from 'three';
import Ammo from 'ammo.js';
import CameraController from './CameraController.js';
import Materials from './Materials.js';
import Renderer from './Renderer.js';

class Physics_world {
    constructor(options = {}) {
      // Settings and defaults
      this.settings = {
        gravity: { x: 0, y: -9.82, z: 0 },
        stepFrequency: 60,
        ...options,
      };
      // Ammo.js physics world setup
      this.collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
      this.dispatcher = new Ammo.btCollisionDispatcher(this.collisionConfiguration);
      this.overlappingPairCache = new Ammo.btDbvtBroadphase();
      this.solver = new Ammo.btSequentialImpulseConstraintSolver();
      this.world = new Ammo.btDiscreteDynamicsWorld(
          this.dispatcher,
          this.overlappingPairCache,
          this.solver,
          this.collisionConfiguration
      );
      this.world.setGravity(new Ammo.btVector3(
          this.settings.gravity.x,
          this.settings.gravity.y,
          this.settings.gravity.z
      ));
      this.pos = new THREE.Vector3();
      this.quat = new THREE.Quaternion();
  
      // Three.js scene setup
      this.scene =  new THREE.Scene();
      this.cameraController = new CameraController();
      this.renderer = new Renderer(this.scene, this.cameraController);
  
      // Storage for physics and visuals
      this.bodies = [];
      this.visuals = [];
      this.fixedTimeStep=1.0/60.0;
      this.maxSubSteps = 3;
      this.lastTime;
      //shader
      this.material=new Materials();
    }
  
    // Initialize the scene and world
    init() {
      this.createWorld();
      this.createScene();
    }

  
    // Ammo.js physics world setup
    createWorld() {
      //add floor

      this.world.addRigidBody(body);
      this.bodies.push(body);
    }
  
    // Create Three.js scene
    createScene() {
      //set loop
      this.renderer.renderer.setAnimationLoop(this.animate.bind(this));

      const axesHelper = new THREE.AxesHelper(5);
      this.scene.add(axesHelper);
      const floorGeometry=new THREE.PlaneGeometry(10,10);
      const floorMaterial=this.material.createBlinnPhongMaterial();
      const floor=new THREE.Mesh(floorGeometry,floorMaterial);

      this.scene.add(floor);
      this.visuals.push(floor);
      //
    }
  
    // Update visuals to match physics bodies
    updateVisuals() {
      for (let i = 0; i < this.bodies.length; i++) {
          const body = this.bodies[i];
          const motionState = body.getMotionState();
          if (motionState) {
              const transform = new Ammo.btTransform();
              motionState.getWorldTransform(transform);

              const origin = transform.getOrigin();
              const rotation = transform.getRotation();
              const visual = this.visuals[i];
              visual.position.set(origin.x(), origin.y(), origin.z());
              visual.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
          }
      }
  }
    // Animation loop
  animate(time) {
    this.cameraController.update();
    if(this.lastTime!==undefined){
      const dt=(time-this.lastTime)/1000;
      this.world.stepSimulation(dt,this.maxSubSteps,this.fixedTimeStep);
      this.updateVisuals();
    }
    this.renderer.render();
    this.lastTime=time;
  }
}
export default Physics_world;