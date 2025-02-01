import * as THREE from 'three';
import { marked, Renderer } from 'marked';
import * as monaco from 'monaco-editor';
import hljs from 'highlight.js';

// Define types
interface ThreeJSModule {
    setup: () => void;
    animate?: (scene: THREE.Scene, camera: THREE.Camera, lib: any) => void;
}

interface EditorContainer extends HTMLElement {
    editor?: monaco.editor.IStandaloneCodeEditor;
}

// Store all Three.js environments
const environments = new Map<string, ThreeJSEnvironment>();

// Store code snippets by container ID
const codeSnippets = new Map<string, string>();

class ThreeJSEnvironment {
    private containerId: string;
    private code: string;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer | null;
    private animationFunction: ((scene: THREE.Scene, camera: THREE.Camera, lib: any) => void) | null;
    private isAnimating: boolean;
    private animationFrameId: number | null;

    constructor(containerId: string, code: string) {
        this.containerId = containerId;
        this.code = code;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.renderer = null;
        this.animationFunction = null;
        this.isAnimating = false;
        this.animationFrameId = null;
    }

    init(): void {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });

        // Set size based on container
        const updateSize = (): void => {
            if (!this.renderer || !container) return;
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

    animate(): void {
        if (!this.isAnimating || !this.renderer) return;

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

    run(code: string): void {
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
            const module = new Function('scene', 'camera', 'THREE', wrappedCode)(
                this.scene, 
                this.camera, 
                THREE
            ) as ThreeJSModule;
            
            if (!module.setup || typeof module.setup !== 'function') {
                throw new Error('Each example must export a setup function');
            }

            // Run the setup code
            module.setup();
            
            // Store the animation function if it exists
            this.animationFunction = module.animate || null;

            // Ensure initial render
            if (this.renderer) {
                this.renderer.render(this.scene, this.camera);
            }
            
            // Start animation loop if there's an animation function
            if (this.animationFunction) {
                this.isAnimating = true;
                this.animate();
            }
        } catch (error) {
            console.error('Error executing code:', error);
            const container = document.getElementById(this.containerId);
            if (container) {
                container.innerHTML = `<div style="color: red; padding: 1rem;">Error: ${error instanceof Error ? error.message : 'Unknown error'}</div>`;
            }
        }
    }

    stop(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.isAnimating = false;
    }

    cleanup(): void {
        while(this.scene.children.length > 0) { 
            const object = this.scene.children[0];
            if (object instanceof THREE.Mesh) {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if ('map' in object.material && object.material.map) {
                        object.material.map.dispose();
                    }
                    object.material.dispose();
                }
            }
            this.scene.remove(object);
        }
    }
}

// Function to handle preview clicks
function handlePreviewClick(containerId: string): void {
    const code = codeSnippets.get(containerId);
    const editorElement = document.querySelector('#editor-container') as EditorContainer;
    if (code && editorElement && editorElement.editor) {
        editorElement.editor.setValue(code);
    }
}

// Configure marked with custom renderer for animate blocks
const renderer = new Renderer();

marked.setOptions({
    renderer: renderer,
    gfm: true,
    breaks: true
});

// Set up custom highlighting for code blocks
const originalCodeRenderer = renderer.code.bind(renderer);
renderer.code = function(code: string, language: string | undefined, isEscaped: boolean = false): string {
    if (language === 'animate') {
        const containerId = 'preview-' + Math.random().toString(36).substr(2, 9);
        
        // Store the code snippet
        codeSnippets.set(containerId, code);
        
        // Create new Three.js environment
        const env = new ThreeJSEnvironment(containerId, code);
        environments.set(containerId, env);

        // Create container with code preview
        const highlightedCode = hljs.highlight(code, { language: 'javascript' }).value;
        return `
            <div class="preview-container" id="${containerId}"></div>
            <pre><code class="language-javascript">${highlightedCode}</code></pre>
        `;
    }

    // Handle normal code blocks
    if (language && hljs.getLanguage(language)) {
        try {
            const highlightedCode = hljs.highlight(code, { language }).value;
            return `<pre><code class="language-${language}">${highlightedCode}</code></pre>`;
        } catch (e) {
            console.error(e);
        }
    }
    return originalCodeRenderer.call(this, code, language, isEscaped);
};

// Initialize Monaco Editor
const editorContainer = document.getElementById('editor-container');
if (editorContainer) {
    const editor = monaco.editor.create(editorContainer, {
        value: '',
        language: 'typescript',
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
    (editorContainer as EditorContainer).editor = editor;
}

// Function to process markdown and initialize all environments
async function processMarkdown(markdownContent: string): Promise<void> {
    // Render markdown
    const markdownElement = document.getElementById('markdown-content');
    if (markdownElement) {
        markdownElement.innerHTML = await Promise.resolve(marked(markdownContent));
    }

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
function initResizer(): void {
    const resizer = document.getElementById('resizer');
    const leftPanel = document.querySelector('.docs-content');
    const rightPanel = document.querySelector('.editor-panel');
    let isResizing = false;
    let lastDownX = 0;

    if (!resizer) return;

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        lastDownX = e.clientX;
        resizer.classList.add('resizing');
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        const container = document.querySelector('.content-wrapper');
        if (!container || !(container instanceof HTMLElement)) return;

        const containerRect = container.getBoundingClientRect();
        const minWidth = 300;
        const maxWidth = containerRect.width - minWidth;
        
        const currentX = e.clientX - containerRect.left;
        const newLeftWidth = Math.min(Math.max(currentX, minWidth), maxWidth);
        
        container.style.gridTemplateColumns = `${newLeftWidth}px 5px minmax(300px, auto)`;
        
        // Update editor size
        const editorContainer = document.querySelector('#editor-container') as EditorContainer;
        if (editorContainer?.editor) {
            editorContainer.editor.layout();
        }
    });

    document.addEventListener('mouseup', () => {
        isResizing = false;
        if (resizer) {
            resizer.classList.remove('resizing');
        }
    });
}

// Initialize resizer
initResizer();

// Load and process the markdown content
fetch('/content/transformations.md')
    .then(response => response.text())
    .then(markdown => processMarkdown(markdown))
    .catch(error => console.error('Error loading markdown:', error)); 