import Physics_world from './src/Physics_world.js'

const physicsWorld = new Physics_world();
physicsWorld.init();

physicsWorld.addBox({ x: 0, y: 20, z: 0 }, { x: 1, y: 1, z: 1 }, 1);

physicsWorld.addBox({ x: 2, y: 20, z: -1 }, { x: 2, y: 2, z: 2 }, 3);
physicsWorld.addBox({ x: -3, y: 20, z: 2 }, { x: 1.5, y: 1.5, z: 1.5 }, 2);