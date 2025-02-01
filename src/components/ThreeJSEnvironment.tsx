import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeJSEnvironmentProps {
  code: string;
  containerId: string;
}

interface ThreeJSModule {
  setup: (scene: THREE.Scene, camera: THREE.Camera, lib: typeof THREE) => void;
  animate?: (scene: THREE.Scene, camera: THREE.Camera, lib: typeof THREE) => void;
}

const ThreeJSEnvironment: React.FC<ThreeJSEnvironmentProps> = ({ code, containerId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>(new THREE.Scene());
  const cameraRef = useRef<THREE.PerspectiveCamera>(
    new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
  );
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const moduleRef = useRef<ThreeJSModule | null>(null);

  const cleanup = () => {
    if (sceneRef.current) {
      while(sceneRef.current.children.length > 0) { 
        const object = sceneRef.current.children[0];
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
        sceneRef.current.remove(object);
      }
    }
  };

  const stop = () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const animate = () => {
    if (!rendererRef.current) return;

    animationFrameRef.current = requestAnimationFrame(animate);
    
    try {
      if (moduleRef.current?.animate) {
        moduleRef.current.animate(sceneRef.current, cameraRef.current, THREE);
      }
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    } catch (error) {
      console.error('Animation error:', error);
      stop();
    }
  };

  const run = (code: string) => {
    stop();
    cleanup();

    try {
      const wrappedCode = `
        let setup, animate;
        ${code}
        return { setup, animate };
      `;
      
      moduleRef.current = new Function('scene', 'camera', 'THREE', wrappedCode)(
        sceneRef.current, 
        cameraRef.current, 
        THREE
      ) as ThreeJSModule;

      if (!moduleRef.current?.setup) {
        throw new Error('Each example must export a setup function');
      }

      moduleRef.current.setup(sceneRef.current, cameraRef.current, THREE);

      if (rendererRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      if (moduleRef.current.animate) {
        animate();
      }
    } catch (error) {
      console.error('Error executing code:', error);
      if (containerRef.current) {
        containerRef.current.innerHTML = `<div style="color: red; padding: 1rem;">Error: ${error instanceof Error ? error.message : 'Unknown error'}</div>`;
      }
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    rendererRef.current = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });

    const updateSize = () => {
      if (!rendererRef.current || !containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      rendererRef.current.setSize(width, height);
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    containerRef.current.appendChild(rendererRef.current.domElement);
    run(code);

    return () => {
      window.removeEventListener('resize', updateSize);
      stop();
      cleanup();
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [code]);

  return <div ref={containerRef} id={containerId} className="preview-container" />;
};

export default ThreeJSEnvironment; 