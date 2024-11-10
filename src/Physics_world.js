import * as THREE from 'three';
import * as CANNON from 'cannon';
import CameraController from './CameraController.js'
import { FLOOR_BOUNDARY } from './common.js'

class Physics_world {
    constructor(options = {}) {
      // Settings and defaults
      this.settings = {
        gravity: { x: 0, y: -9.82, z: 0 },
        stepFrequency: 60,
        ...options,
      };
      // Cannon.js world setup
      this.world = null;
  
      // Three.js scene setup
      this.scene = null;
      this.cameraController = null;
      this.renderer = null;
  
      // Storage for physics and visuals
      this.bodies = [];
      this.visuals = [];
      this.fixedTimeStep=1.0/60.0;
      this.maxSubSteps = 3;
      this.lastTime;
      // Shader
      this.shader = null;
    }
  
    // Initialize the scene and world
    init() {
      this.createWorld();
      this.createScene();
    }
  
    // Create Cannon.js world
    createWorld() {
      this.world = new CANNON.World();
      this.world.gravity.set(this.settings.gravity.x, this.settings.gravity.y, this.settings.gravity.z);
      this.world.broadphase = new CANNON.NaiveBroadphase();
      this.world.solver.iterations = 10;

      //basic floor
      const groundBody = new CANNON.Body({ mass: 0 });
      const groundShape = new CANNON.Plane();
      groundBody.addShape(groundShape);
      groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
      groundBody.position.y=-0.05;
      this.world.addBody(groundBody);
      this.bodies.push(groundBody);
    }
  
    // Create Three.js scene
    createScene() {
      this.scene = new THREE.Scene();
      // Camera
      this.cameraController = new CameraController();
      // Shader
      // this.shader = new Shader('./shader/vertex.glsl','./shader/fragment.glsl');
      // this.shader.loadShaders().then(() => {console.log(this.shader.vertexShader, this.shader.fragmentShader);});
      const axesHelper = new THREE.AxesHelper(5);
      this.scene.add(axesHelper);
      //Renderer
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setAnimationLoop( this.animate.bind(this) );
      document.body.appendChild(this.renderer.domElement);
      //basic floor
      const floorGeometry = new THREE.PlaneGeometry(10, 10);
      const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.rotation.x = -Math.PI / 2; 
      floor.position.y = FLOOR_BOUNDARY-0.05; 
      this.scene.add(floor);
      this.visuals.push(floor);

      // Lights
      const ambientLight = new THREE.AmbientLight(0x404040);
      this.scene.add(ambientLight);
  
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(10, 10, 10);
      this.scene.add(directionalLight);
    }
  
    // Add a box to the scene and physics world
    addBox(position, size, mass) {
      // Cannon.js body
      const boxShape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
      const boxBody = new CANNON.Body({ mass: mass });
      boxBody.addShape(boxShape);
  
      // Set position
      boxBody.position.set(position.x, position.y, position.z);
  
      const angle = Math.PI / 6; // 30 degrees in radians
      boxBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), angle);
  
      this.world.addBody(boxBody);
      this.bodies.push(boxBody);
  
      // Three.js mesh
      const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
      const material = new THREE.MeshStandardMaterial({ color: 0x0077ff });
      const boxMesh = new THREE.Mesh(geometry, material);
  
      // Set the same rotation for the Three.js mesh
      boxMesh.position.set(position.x, position.y, position.z);
      boxMesh.rotation.y = angle; // Rotate by 45 degrees around the y-axis
  
      this.scene.add(boxMesh);
      this.visuals.push(boxMesh);
  }
  
    // Update visuals to match physics bodies
    updateVisuals() {
      for (let i = 0; i < this.bodies.length; i++) {
        const body = this.bodies[i];
        const visual = this.visuals[i];
        visual.position.copy(body.position);
        visual.quaternion.copy(body.quaternion);
      }
    }
  
    // Animation loop
    animate(time) {
      this.cameraController.update();
      if(this.lastTime!==undefined){
        const dt=(time-this.lastTime)/1000;
        this.world.step(this.fixedTimeStep,dt,this.maxSubSteps);
        this.updateVisuals();
      }
      this.renderer.render(this.scene,this.cameraController.camera);
      this.lastTime=time;
    }
}
export default Physics_world;