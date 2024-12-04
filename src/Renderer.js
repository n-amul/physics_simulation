import * as THREE from 'three';

export default class Renderer {
    constructor(scene, cameraController) {
        this.scene = scene;
        this.cameraController = cameraController;

        // Create the WebGL renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        this.renderer.setClearColor(0xbfd1e5);
        this.renderer.shadowMap.enabled=true;

        // Handle window resize
        window.addEventListener('resize', () => {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    render() {
        this.renderer.render(this.scene, this.cameraController.camera);
    }
}