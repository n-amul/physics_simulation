import * as THREE from 'three';
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
      this.margin = 0.05;
      this.collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
      this.dispatcher = new Ammo.btCollisionDispatcher(this.collisionConfiguration);
      this.broadphaseCache = new Ammo.btDbvtBroadphase();
      this.solver = new Ammo.btSequentialImpulseConstraintSolver();
      this.softBodySolver = new Ammo.btDefaultSoftBodySolver();
      this.world = new Ammo.btSoftRigidDynamicsWorld(
          this.dispatcher,
          this.broadphaseCache,
          this.solver,
          this.collisionConfiguration,
          this.softBodySolver
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
      this.textureLoader=new THREE.TextureLoader();
  
      // Storage for physics and visuals
      this.rigidBodies = [];
      this.softBodies = [];
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
      this.addObjects();
    }
    // Ammo.js physics world setup
    createWorld() {
      
    }
  
    // Create Three.js scene
    createScene() {
      //set loop
      this.renderer.renderer.setAnimationLoop(this.animate.bind(this));
      const axesHelper = new THREE.AxesHelper(5);
      this.scene.add(axesHelper);
      var ambientLight = new THREE.AmbientLight( 0x404040 );
      this.scene.add( ambientLight );

      var light = new THREE.DirectionalLight( 0xffffff, 1 );
      light.position.set( -10, 10, 5 );
      light.castShadow = true;
      var d = 20;
      light.shadow.camera.left = -d;
      light.shadow.camera.right = d;
      light.shadow.camera.top = d;
      light.shadow.camera.bottom = -d;

      light.shadow.camera.near = 2;
      light.shadow.camera.far = 50;
      light.shadow.mapSize.x = 1024;
      light.shadow.mapSize.y = 1024;
      this.scene.add( light );
    }
    addObjects(){
       //create objs
      //ground
      this.pos.set( 0, - 0.5, 0 );
	  this.quat.set( 0, 0, 0, 1 );
	  var ground = this.createParalellepiped( 40, 1, 40, 0, this.pos, this.quat, new THREE.MeshPhongMaterial( { color: 0xFFFFFF } ) );
	  ground.castShadow = true;
	  ground.receiveShadow = true;
	  this.textureLoader.load( "../textures/grid.png", ( texture ) => {
	  	texture.wrapS = THREE.RepeatWrapping;
	  	texture.wrapT = THREE.RepeatWrapping;
	  	texture.repeat.set( 40, 40 );
	  	ground.material.map = texture;
	  	ground.material.needsUpdate = true;
	  });
        //  obstacle
        this.pos.set( 0, 0.5, 0 );
        this.quat.set( 0, 0, 0, 1 );
        var obstacle = this.createParalellepiped( 6, 1, 1, 0, this.pos, this.quat, new THREE.MeshPhongMaterial( { color: 0x606060 } ) );
        obstacle.castShadow = true;
        obstacle.receiveShadow = true;
        // Create soft volumes
        var volumeMass = 15;
        var bx = 2;
        var by = 1;
        var bz = 3;
        var nn = 5;
        this.createSoftBox( bx, by, bz, nn * bx, nn * by, nn * bz, 0, 8, 0, volumeMass, 0 );
    }
    createParalellepiped( sx, sy, sz, mass, pos, quat, material ) {
        var threeObject = new THREE.Mesh( new THREE.BoxGeometry( sx, sy, sz, 1, 1, 1 ), material );
        var shape = new Ammo.btBoxShape( new Ammo.btVector3( sx * 0.5, sy * 0.5, sz * 0.5 ) );
        shape.setMargin( this.margin );
    
        this.createRigidBody( threeObject, shape, mass, pos, quat );
    
        return threeObject;
    }
    createRigidBody( threeObject, physicsShape, mass, pos, quat ) {
        threeObject.position.copy( pos );
        threeObject.quaternion.copy( quat );
    
        var transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
        transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
        var motionState = new Ammo.btDefaultMotionState( transform );
    
        var localInertia = new Ammo.btVector3( 0, 0, 0 );
        physicsShape.calculateLocalInertia( mass, localInertia );
    
        var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
        var body = new Ammo.btRigidBody( rbInfo );
    
        threeObject.userData.physicsBody = body; //save ref for an update
        this.scene.add( threeObject );
    
        if ( mass > 0 ) {
            this.rigidBodies.push( threeObject );// non static
            body.setActivationState( 4 );
        }
        this.world.addRigidBody( body );
    
        return body;
    }

    createSoftBox(sizeX, sizeY, sizeZ, numPointsX, numPointsY, numPointsZ, tX, tY, tZ, mass, pressure) {

        if (numPointsX < 2 || numPointsY < 2 || numPointsZ < 2) {
            return;
        }
    
        // Offset is the numbers assigned to 8 vertices of the cube in ascending Z, Y, X in this order.
        // indexFromOffset is the vertex index increase for a given offset.
        var indexFromOffset = [];
        for (var offset = 0; offset < 8; offset++) {
            var a = offset & 1 ? 1 : 0;
            var b = offset & 2 ? 1 : 0;
            var c = offset & 4 ? 1 : 0;
            var index = a + b * numPointsX + c * numPointsX * numPointsY;
            indexFromOffset[offset] = index;
        }
    
        // Construct BufferGeometry
    
        var numVertices = numPointsX * numPointsY * numPointsZ;
        var numFaces = 4 * ((numPointsX - 1) * (numPointsY - 1) + (numPointsX - 1) * (numPointsZ - 1) + (numPointsY - 1) * (numPointsZ - 1));
    
        var bufferGeom = new THREE.BufferGeometry();
        var vertices = new Float32Array(numVertices * 3);
        var normals = new Float32Array(numVertices * 3);
        var indices = new (numFaces * 3 > 65535 ? Uint32Array : Uint16Array)(numFaces * 3);
    
        // Create vertices and faces
        var sx = sizeX / (numPointsX - 1);
        var sy = sizeY / (numPointsY - 1);
        var sz = sizeZ / (numPointsZ - 1);
        var numFacesAdded = 0;
        for (var p = 0, k = 0; k < numPointsZ; k++) {
            for (var j = 0; j < numPointsY; j++) {
                for (var i = 0; i < numPointsX; i++) {
                    // Vertex and normal
                    var p3 = p * 3;
                    vertices[p3] = i * sx - sizeX * 0.5;
                    normals[p3++] = 0;
                    vertices[p3] = j * sy - sizeY * 0.5;
                    normals[p3++] = 0;
                    vertices[p3] = k * sz - sizeZ * 0.5;
                    normals[p3] = 0;
    
                    // XY faces
                    if (k == 0 && i < numPointsX - 1 && j < numPointsY - 1) {
    
                        var faceIndex = numFacesAdded * 3;
    
                        indices[faceIndex++] = p + indexFromOffset[0];
                        indices[faceIndex++] = p + indexFromOffset[3];
                        indices[faceIndex++] = p + indexFromOffset[1];
    
                        indices[faceIndex++] = p + indexFromOffset[0];
                        indices[faceIndex++] = p + indexFromOffset[2];
                        indices[faceIndex++] = p + indexFromOffset[3];
    
                        numFacesAdded += 2;
                    }
                    if (k == numPointsZ - 2 && i < numPointsX - 1 && j < numPointsY - 1) {
    
                        var faceIndex = numFacesAdded * 3;
    
                        indices[faceIndex++] = p + indexFromOffset[7];
                        indices[faceIndex++] = p + indexFromOffset[6];
                        indices[faceIndex++] = p + indexFromOffset[5];
    
                        indices[faceIndex++] = p + indexFromOffset[5];
                        indices[faceIndex++] = p + indexFromOffset[6];
                        indices[faceIndex++] = p + indexFromOffset[4];
    
                        numFacesAdded += 2;
                    }
    
                    // XZ faces
                    if (j == 0 && i < numPointsX - 1 && k < numPointsZ - 1) {
    
                        var faceIndex = numFacesAdded * 3;
    
                        indices[faceIndex++] = p + indexFromOffset[0];
                        indices[faceIndex++] = p + indexFromOffset[5];
                        indices[faceIndex++] = p + indexFromOffset[4];
    
                        indices[faceIndex++] = p + indexFromOffset[0];
                        indices[faceIndex++] = p + indexFromOffset[1];
                        indices[faceIndex++] = p + indexFromOffset[5];
    
                        numFacesAdded += 2;
                    }
                    if (j == numPointsY - 2 && i < numPointsX - 1 && k < numPointsZ - 1) {
    
                        var faceIndex = numFacesAdded * 3;
    
                        indices[faceIndex++] = p + indexFromOffset[3];
                        indices[faceIndex++] = p + indexFromOffset[2];
                        indices[faceIndex++] = p + indexFromOffset[6];
    
                        indices[faceIndex++] = p + indexFromOffset[3];
                        indices[faceIndex++] = p + indexFromOffset[6];
                        indices[faceIndex++] = p + indexFromOffset[7];
    
                        numFacesAdded += 2;
                    }
    
                    // YZ faces
                    if (i == 0 && j < numPointsY - 1 && k < numPointsZ - 1) {
    
                        var faceIndex = numFacesAdded * 3;
    
                        indices[faceIndex++] = p + indexFromOffset[0];
                        indices[faceIndex++] = p + indexFromOffset[6];
                        indices[faceIndex++] = p + indexFromOffset[2];
    
                        indices[faceIndex++] = p + indexFromOffset[0];
                        indices[faceIndex++] = p + indexFromOffset[4];
                        indices[faceIndex++] = p + indexFromOffset[6];
    
                        numFacesAdded += 2;
                    }
                    if (i == numPointsX - 2 && j < numPointsY - 1 && k < numPointsZ - 1) {
    
                        var faceIndex = numFacesAdded * 3;
    
                        indices[faceIndex++] = p + indexFromOffset[1];
                        indices[faceIndex++] = p + indexFromOffset[3];
                        indices[faceIndex++] = p + indexFromOffset[5];
    
                        indices[faceIndex++] = p + indexFromOffset[3];
                        indices[faceIndex++] = p + indexFromOffset[7];
                        indices[faceIndex++] = p + indexFromOffset[5];
    
                        numFacesAdded += 2;
                    }
    
                    p++;
                }
            }
        }
    
        bufferGeom.setIndex(new THREE.BufferAttribute(indices, 1));
        bufferGeom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        bufferGeom.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    
        bufferGeom.translate(tX, tY, tZ);
    
        // Create mesh from geometry
        var volume = new THREE.Mesh(bufferGeom, new THREE.MeshPhongMaterial({ color: 0xFFFFFF, wireframe: true }));
        volume.castShadow = true;
        volume.receiveShadow = true;
        volume.frustumCulled = false;
        this.scene.add(volume);
    
        // Create soft body
        var vectorTemp = new Ammo.btVector3(0, 0, 0);
        vectorTemp.setValue(vertices[0], vertices[1], vertices[2]);
    
        var volumeSoftBody = new Ammo.btSoftBody(this.world.getWorldInfo(), 1, vectorTemp, [1.0]);
    
        var physMat0 = volumeSoftBody.get_m_materials().at(0);
    
        for (var i = 1, il = vertices.length / 3; i < il; i++) {
            var i3 = i * 3;
            vectorTemp.setValue(vertices[i3], vertices[i3 + 1], vertices[i3 + 2]);
            volumeSoftBody.appendNode(vectorTemp, 1.0);
        }
    
        for (var i = 0, il = indices.length / 3; i < il; i++) {
            var i3 = i * 3;
            volumeSoftBody.appendFace(indices[i3], indices[i3 + 1], indices[i3 + 2]);
        }
    
        // Create tetrahedrons
        var p = 0;
    
        var newTetra = (i0, i1, i2, i3) => {
    
            var v0 = p + indexFromOffset[i0];
            var v1 = p + indexFromOffset[i1];
            var v2 = p + indexFromOffset[i2];
            var v3 = p + indexFromOffset[i3];
    
            volumeSoftBody.appendTetra(v0, v1, v2, v3);
    
            volumeSoftBody.appendLink(v0, v1, physMat0, true);
            volumeSoftBody.appendLink(v0, v2, physMat0, true);
            volumeSoftBody.appendLink(v0, v3, physMat0, true);
            volumeSoftBody.appendLink(v1, v2, physMat0, true);
            volumeSoftBody.appendLink(v2, v3, physMat0, true);
            volumeSoftBody.appendLink(v3, v1, physMat0, true);
    
        };
    
        for (var k = 0; k < numPointsZ - 1; k++) {
            for (var j = 0; j < numPointsY - 1; j++) {
                for (var i = 0; i < numPointsX - 1; i++) {
    
                    // Creates 5 tetrahedrons for each cube
                    newTetra(0, 4, 5, 6);
                    newTetra(0, 2, 3, 6);
                    newTetra(0, 1, 3, 5);
                    newTetra(3, 5, 6, 7);
                    newTetra(0, 3, 5, 6);
    
                    p++;
                }
                p++;
            }
            p += numPointsX;
        }
    
        // Config soft body
    
        var sbConfig = volumeSoftBody.get_m_cfg();
        sbConfig.set_viterations(40);
        sbConfig.set_piterations(40);
    
        // Soft-soft and soft-rigid collisions
        sbConfig.set_collisions(0x11);
    
        // Friction
        sbConfig.set_kDF(0.1);
        // Damping
        sbConfig.set_kDP(0.01);
        // Pressure
        sbConfig.set_kPR(pressure);
        // Stiffness
        var stiffness = 0.05;
        physMat0.set_m_kLST(stiffness);
        physMat0.set_m_kAST(stiffness);
        physMat0.set_m_kVST(stiffness);
    
        volumeSoftBody.setTotalMass(mass, false);
        Ammo.castObject(volumeSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(this.margin);
        this.world.addSoftBody(volumeSoftBody, 1, -1);
        volume.userData.physicsBody = volumeSoftBody;
        // Disable deactivation
        volumeSoftBody.setActivationState(4);
    
        this.softBodies.push(volume);
    }
    
    
    // Animation loop
    updatePhysics(deltaTime) {
        const transformAux1 = new Ammo.btTransform();
    
        // Step world
        this.world.stepSimulation(deltaTime, 10);
    
        // Update soft bodies
        for (let volume of this.softBodies) {
            let geometry = volume.geometry;
            let softBody = volume.userData.physicsBody;
            let volumePositions = geometry.attributes.position.array;
            let volumeNormals = geometry.attributes.normal.array;
            let nodes = softBody.get_m_nodes();
            let p = 0;
    
            for (let j = 0, len = volumePositions.length / 3; j < len; j++) {
                let node = nodes.at(j);
                let nodePos = node.get_m_x();
                let nodeNormal = node.get_m_n();
    
                volumePositions[p] = nodePos.x();
                volumeNormals[p++] = nodeNormal.x();
                volumePositions[p] = nodePos.y();
                volumeNormals[p++] = nodeNormal.y();
                volumePositions[p] = nodePos.z();
                volumeNormals[p++] = nodeNormal.z();
            }
    
            geometry.attributes.position.needsUpdate = true;
            geometry.attributes.normal.needsUpdate = true;
        }
    
        // Update rigid bodies
        for (let objThree of this.rigidBodies) {
            let objPhys = objThree.userData.physicsBody;
            let ms = objPhys.getMotionState();
            if (ms) {
                ms.getWorldTransform(transformAux1);
                let p = transformAux1.getOrigin();
                let q = transformAux1.getRotation();
                objThree.position.set(p.x(), p.y(), p.z());
                objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
            }
        }
    }

    animate(time) {
        this.cameraController.update();

        if (this.lastTime !== undefined) {
            const deltaTime = (time - this.lastTime) / 1000;
            this.updatePhysics(deltaTime); // Update physics simulation
        }

        this.renderer.render();
        this.lastTime = time;
    }
}
export default Physics_world;