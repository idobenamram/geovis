# Transformations in Three.js

Three.js provides several ways to transform objects in 3D space. The three fundamental transformations are:

1. **Translation** - Moving objects in space using `.position`
2. **Rotation** - Rotating objects using `.rotation`
3. **Scale** - Changing object size using `.scale`

## Interactive Example

Below you'll find an interactive example showing these transformations. Try modifying the values to see how they affect the cube's position, rotation, and scale.

```animate
// Setup function to initialize the scene
setup = function(scene, camera, THREE) {
    // Create a cube
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshPhongMaterial({ 
        color: 'purple',
        flatShading: true
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Add lights
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1);
    scene.add(light);
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    // Position camera
    camera.position.z = 5;

    // Set initial transformations
    cube.position.x = -0.5;
    cube.position.y = -0.1;
    cube.position.z = 1;

    cube.scale.x = 1.25;
    cube.scale.y = 0.25;
    cube.scale.z = 0.5;

    // Store cube reference for animation
    window.cube = cube;
};

// Animation function to update the scene
animate = function(scene, camera, THREE) {
    const cube = window.cube;
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
};
```

### Code Explanation

The code above demonstrates the three types of transformations:

1. **Translation** using `position`:
```javascript
cube.position.x = -0.5;  // Move left/right
cube.position.y = -0.1;  // Move up/down
cube.position.z = 1;     // Move forward/back
```

2. **Scale** using `scale`:
```javascript
cube.scale.x = 1.25;     // Stretch horizontally
cube.scale.y = 0.25;     // Compress vertically
cube.scale.z = 0.5;      // Scale depth
```

3. **Rotation** in the animation loop:
```javascript
cube.rotation.x += 0.01; // Rotate around X axis
cube.rotation.y += 0.01; // Rotate around Y axis
```

Try modifying these values in the editor to see how they affect the cube! 