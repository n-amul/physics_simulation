import * as THREE from 'three';
import { FLOOR_BOUNDARY, CEILING_BOUNDARY } from './common.js';

const width = window.innerWidth, height = window.innerHeight;

class CameraController {
  constructor() {
    this.camera = new THREE.PerspectiveCamera(70, width / height, 0.01, 10);
    this.camera.position.set(0, 0.5, 1);
    // movement variables
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.moveUp = false;
    this.moveDown = false;
    this.isMousePressed = false;
    // rotation variables
    this.rotationSpeed = 0.002;
    this.lastMouseX = null;
    this.lastMouseY = null;
    this.cameraFront = new THREE.Vector3(0, 0, -1);
    this.cameraRight = new THREE.Vector3(1, 0, 0);
    this.cameraUp = new THREE.Vector3(0, 1, 0);
    this.rotationUpdated = true; // Flag to indicate if recalculation is needed
    // camera movement speed
    this.moveSpeed = 0.01;
    // event listeners for keydown, keyup, and mouse events
    document.addEventListener('keydown', (event) => this.onKeyDown(event));
    document.addEventListener('keyup', (event) => this.onKeyUp(event));
    document.addEventListener('mousedown', (event) => this.onMouseDown(event));
    document.addEventListener('mouseup', () => this.onMouseUp());
    document.addEventListener('mousemove', (event) => this.onMouseMove(event));
  }

  onKeyDown(event) {
    switch (event.key) {
      case 'w':
        this.moveForward = true;
        break;
      case 's':
        this.moveBackward = true;
        break;
      case 'a':
        this.moveLeft = true;
        break;
      case 'd':
        this.moveRight = true;
        break;
      case 'q':
        this.moveUp = true;
        break;
      case 'e':
        this.moveDown = true;
        break;
    }
  }

  onKeyUp(event) {
    switch (event.key) {
      case 'w':
        this.moveForward = false;
        break;
      case 's':
        this.moveBackward = false;
        break;
      case 'a':
        this.moveLeft = false;
        break;
      case 'd':
        this.moveRight = false;
        break;
      case 'q':
        this.moveUp = false;
        break;
      case 'e':
        this.moveDown = false;
        break;
    }
  }

  onMouseDown(event) {
    this.isMousePressed = true;
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
  }

  onMouseUp() {
    this.isMousePressed = false;
    this.lastMouseX = null;
    this.lastMouseY = null;
  }

  onMouseMove(event) {
    if (this.isMousePressed) {
      const deltaX = event.clientX - this.lastMouseX;
      const deltaY = event.clientY - this.lastMouseY;

      // Create rotation quaternions based on mouse movement deltas
      const yawQuaternion = new THREE.Quaternion();
      const pitchQuaternion = new THREE.Quaternion();

      // Apply yaw (rotation around Y-axis)
      yawQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -deltaX * this.rotationSpeed);
      // Apply pitch (rotation around X-axis)
      pitchQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -deltaY * this.rotationSpeed);

      // Update camera quaternion by applying yaw, then pitch
      this.camera.quaternion.multiplyQuaternions(yawQuaternion, this.camera.quaternion);
      this.camera.quaternion.multiplyQuaternions(this.camera.quaternion, pitchQuaternion);

      // Set rotationUpdated flag to true for recalculating directions
      this.rotationUpdated = true;

      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    }
  }

  update() {
    // Update camera rotation if needed
    if (this.rotationUpdated) {
      this.cameraFront.set(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();
      this.cameraRight.set(1, 0, 0).applyQuaternion(this.camera.quaternion).normalize();
      this.rotationUpdated = false; // Reset flag after recalculating directions
    }

    // Handle movement
    const direction = new THREE.Vector3();
    if (this.moveForward) direction.add(this.cameraFront);
    if (this.moveBackward) direction.addScaledVector(this.cameraFront, -1);
    if (this.moveLeft) direction.addScaledVector(this.cameraRight, -1);
    if (this.moveRight) direction.add(this.cameraRight);
    if (this.moveUp) direction.add(this.cameraUp);
    if (this.moveDown) direction.addScaledVector(this.cameraUp, -1);

    if (direction.lengthSq() > 0) {
      direction.normalize();
      this.camera.position.addScaledVector(direction, this.moveSpeed);

      // Apply floor and ceiling boundaries
      this.camera.position.y = Math.max(FLOOR_BOUNDARY, Math.min(CEILING_BOUNDARY, this.camera.position.y));
    }
  }
}

export default CameraController;
