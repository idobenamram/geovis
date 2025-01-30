import * as THREE from 'three';
import { marked } from 'marked';
import * as monaco from 'monaco-editor';
import hljs from 'highlight.js';

// Configure marked with syntax highlighting
marked.setOptions({
    highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
    }
});

// Sample markdown content with placeholder for preview only
const markdownContent = `
# Transformations in Three.js

Three.js provides several ways to transform objects in 3D space. The three fundamental transformations are:

1. **Translation** - Moving objects in space using \`.position\`
2. **Rotation** - Rotating objects using \`.rotation\`
3. **Scale** - Changing object size using \`.scale\`

## Interactive Example

Below you'll find an interactive example showing these transformations. The code editor on the right creates a purple cube and applies various transformations to it. Try modifying the values to see how they affect the cube's position, rotation, and scale.

<div class="preview-container" id="preview-container"></div>

### Code Explanation

The code on the right shows how to apply transformations. Here's what each transformation does:

\`\`\`javascript
// Example: Try these transformations
cube.position.x = -0.5;  // Move left/right
cube.position.y = -0.1;  // Move up/down
cube.position.z = 1;     // Move forward/back

cube.scale.x = 1.25;     // Stretch horizontally
cube.scale.y = 0.25;     // Compress vertically
cube.scale.z = 0.5;      // Scale depth
\`\`\`

Try modifying these values in the editor to see how they affect the cube!
`;

// Render markdown
document.getElementById('markdown-content').innerHTML = marked(markdownContent);

// Initialize Monaco Editor with updated default code
const editor = monaco.editor.create(document.getElementById('editor-container'), {
    value: `// Create a cube
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

// Animation
function animate() {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
}`,
    language: 'javascript',
    theme: 'vs-dark',
    minimap: { enabled: false },
    automaticLayout: true,
    fontSize: 14,
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    roundedSelection: false,
    padding: { top: 10 },
});

// Three.js setup
let scene, camera, renderer, animationFunction;
let isAnimating = false;
let animationFrameId;

function initThreeJs() {
    // Setup scene
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    
    const container = document.getElementById('preview-container');
    renderer = new THREE.WebGLRenderer({ antialias: true });
    
    // Set size based on container
    const updateSize = () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    
    container.appendChild(renderer.domElement);
}

function animate() {
    if (!isAnimating) return;
    
    animationFrameId = requestAnimationFrame(animate);
    if (animationFunction) {
        animationFunction();
    }
    renderer.render(scene, camera);
}

// Function to run the code in the editor
function runCode() {
    // Clean up previous scene
    if (isAnimating) {
        cancelAnimationFrame(animationFrameId);
    }
    isAnimating = false;
    
    if (scene) {
        while(scene.children.length > 0) { 
            const object = scene.children[0];
            if (object.geometry) object.geometry.dispose();
            if (object.material) object.material.dispose();
            scene.remove(object);
        }
    }
    
    // Initialize Three.js if not already done
    if (!renderer) {
        initThreeJs();
    }
    
    const code = editor.getValue();
    
    try {
        // Create animation function from the code
        animationFunction = new Function('scene', 'camera', 'THREE', `
            return function() {
                ${code}
            };
        `)(scene, camera, THREE);
        
        // Run the animation function once to set up the scene
        animationFunction();
        
        // Start animation loop
        isAnimating = true;
        animate();
        
    } catch (error) {
        console.error('Error executing code:', error);
        const previewContainer = document.getElementById('preview-container');
        previewContainer.innerHTML = `<div style="color: red; padding: 1rem;">Error: ${error.message}</div>`;
    }
}

// Add run button
const runButton = document.createElement('button');
runButton.textContent = 'Run Code';
runButton.className = 'run-button';
document.getElementById('preview-container').appendChild(runButton);

// Initialize Three.js on page load
initThreeJs();

// Add run button listener
runButton.addEventListener('click', runCode);

// Run the initial code
runCode();

// Initialize resizer functionality
function initResizer() {
    const resizer = document.getElementById('resizer');
    const leftPanel = document.querySelector('.docs-content');
    const rightPanel = document.querySelector('.editor-panel');
    let isResizing = false;
    let lastDownX = 0;

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        lastDownX = e.clientX;
        resizer.classList.add('resizing');
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        const container = document.querySelector('.content-wrapper');
        const containerRect = container.getBoundingClientRect();
        const minWidth = 300;
        const maxWidth = containerRect.width - minWidth;
        
        const currentX = e.clientX - containerRect.left;
        const newLeftWidth = Math.min(Math.max(currentX, minWidth), maxWidth);
        
        container.style.gridTemplateColumns = `${newLeftWidth}px 5px minmax(300px, auto)`;
        
        // Update editor size
        editor.layout();
    });

    document.addEventListener('mouseup', () => {
        isResizing = false;
        resizer.classList.remove('resizing');
    });
}

// Initialize resizer
initResizer(); 