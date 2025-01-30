import * as THREE from 'three';
import { marked } from 'marked';
import * as monaco from 'monaco-editor';
import hljs from 'highlight.js';

// Store all Three.js environments
const environments = new Map();

// Store code snippets by container ID
const codeSnippets = new Map();

class ThreeJSEnvironment {
    constructor(containerId, code) {
        this.containerId = containerId;
        this.code = code;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.renderer = null;
        this.animationFunction = null;
        this.isAnimating = false;
        this.animationFrameId = null;
    }

    init() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });

        // Set size based on container
        const updateSize = () => {
            const width = container.clientWidth;
            const height = container.clientHeight;
            this.renderer.setSize(width, height);
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
        };

        updateSize();
        window.addEventListener('resize', updateSize);

        container.appendChild(this.renderer.domElement);

        // Run the code immediately
        this.run(this.code);
    }

    animate() {
        if (!this.isAnimating) return;

        this.animationFrameId = requestAnimationFrame(() => this.animate());
        
        try {
            if (this.animationFunction) {
                this.animationFunction(this.scene, this.camera, THREE);
            }
            this.renderer.render(this.scene, this.camera);
        } catch (error) {
            console.error('Animation error:', error);
            this.stop();
        }
    }

    run(code) {
        this.stop();
        this.cleanup();

        try {
            // Create a module from the code that exports setup and animate functions
            const wrappedCode = `
                let setup, animate;
                ${code}
                return { setup, animate };
            `;
            
            // Get the setup and animate functions
            const module = new Function('scene', 'camera', 'THREE', wrappedCode)(this.scene, this.camera, THREE);
            
            if (!module.setup || typeof module.setup !== 'function') {
                throw new Error('Each example must export a setup function');
            }

            // Run the setup code
            module.setup();
            
            // Store the animation function if it exists
            this.animationFunction = module.animate;

            // Ensure initial render
            this.renderer.render(this.scene, this.camera);
            
            // Start animation loop if there's an animation function
            if (this.animationFunction) {
                this.isAnimating = true;
                this.animate();
            }
        } catch (error) {
            console.error('Error executing code:', error);
            const container = document.getElementById(this.containerId);
            if (container) {
                container.innerHTML = `<div style="color: red; padding: 1rem;">Error: ${error.message}</div>`;
            }
        }
    }

    stop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.isAnimating = false;
    }

    cleanup() {
        while(this.scene.children.length > 0) { 
            const object = this.scene.children[0];
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (object.material.map) object.material.map.dispose();
                object.material.dispose();
            }
            this.scene.remove(object);
        }
    }
}

// Function to handle preview clicks
function handlePreviewClick(containerId) {
    const code = codeSnippets.get(containerId);
    const editorElement = document.querySelector('#editor-container');
    if (code && editorElement && editorElement.editor) {
        editorElement.editor.setValue(code);
    }
}

// Configure marked with custom renderer for animate blocks
const renderer = new marked.Renderer();
const originalCodeRenderer = renderer.code.bind(renderer);

renderer.code = function(code, language) {
    if (language === 'animate') {
        const containerId = 'preview-' + Math.random().toString(36).substr(2, 9);
        
        // Store the code snippet
        codeSnippets.set(containerId, code);
        
        // Create new Three.js environment
        const env = new ThreeJSEnvironment(containerId, code);
        environments.set(containerId, env);

        // Create container
        return `<div class="preview-container" id="${containerId}"></div>`;
    }
    return originalCodeRenderer(code, language);
};

marked.setOptions({
    renderer: renderer,
    highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
    }
});

// Initialize Monaco Editor
const editor = monaco.editor.create(document.getElementById('editor-container'), {
    value: '',
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

// Store editor reference for preview click handler
document.querySelector('#editor-container').editor = editor;

// Function to process markdown and initialize all environments
async function processMarkdown(markdownContent) {
    // Render markdown
    document.getElementById('markdown-content').innerHTML = marked(markdownContent);

    // Initialize all environments and attach click handlers
    for (const [containerId, env] of environments) {
        env.init();
        const container = document.getElementById(containerId);
        if (container) {
            container.addEventListener('click', () => handlePreviewClick(containerId));
        }
    }
}

// Initialize resizer
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

// Load and process the markdown content
fetch('/content/transformations.md')
    .then(response => response.text())
    .then(markdown => processMarkdown(markdown))
    .catch(error => console.error('Error loading markdown:', error));