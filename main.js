import Physics_world from './src/Physics_world.js'

Ammo().then(() => {
    const physicsWorld = new Physics_world();
    physicsWorld.init();
});
