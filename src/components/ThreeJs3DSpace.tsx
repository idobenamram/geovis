import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';

import styled from 'styled-components';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  CSS2DRenderer,
  CSS2DObject,
} from 'three/examples/jsm/renderers/CSS2DRenderer.js';

import ControlBoard, { SelectedVector } from './ControlBoard/ControlBoard';
import { ThreeJSMultiVector } from './types';
import { R300 } from 'geo-calc';

interface ThreeJs3DSpaceProps {
  className?: string;
}

export interface ThreeJs3DSpaceRef {
  addVector: (name: string, value: R300) => void;
  addVectorWithPosition: (name: string, position: { x: number, y: number, z: number }) => void;
  removeVector: (name: string) => void;
  hasVector: (name: string) => boolean;
  getVectorNames: () => string[];
}

export const StyledApp = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  min-height: 400px;
  display: flex;

  canvas {
    position: absolute;
    z-index: 0;
    top: 0;
    left: 0;
    width: 100% !important;
    height: 100% !important;
  }

  div {
    box-sizing: border-box;
  }

  .control-board-container {
    position: absolute;
    right: 10px;
    top: 10px;
    z-index: 1;
    max-height: calc(100% - 20px);
    overflow: auto;
    max-width: calc(100% - 20px);
    
    /* Hide scrollbar but keep functionality */
    scrollbar-width: none;  /* Firefox */
    -ms-overflow-style: none;  /* IE and Edge */
    &::-webkit-scrollbar {
      display: none;  /* Chrome, Safari, Opera */
    }
  }
`;

// Function to generate a random vector
export const r300_to_threejs_object = (r300: R300) => {
  if (r300.isVector()) {
    return new THREE.Vector3(r300.get(1), r300.get(2), r300.get(3));
  }
  // if (r300.is_bivector()) {
  //   return new THREE.Vector3(r300[4], r300[5], r300[6]);
  // }
  return new THREE.Vector3(0, 0, 0);
};

const ThreeJs3DSpace = forwardRef<ThreeJs3DSpaceRef, ThreeJs3DSpaceProps>(({ className }, ref) => {
  // General scene-related THREE refs
  const observed = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const labelRendererRef = useRef<CSS2DRenderer | null>(null);
  const callbackRef = useRef<Function>(() => console.log('hi'));
  const controlsRef = useRef<OrbitControls | null>(null);
  const gridRef = useRef<THREE.Group | null>(null);

  // state to hold list of vectors
  const [vectors, setVectors] = useState<ThreeJSMultiVector[]>([]);
  const [gridSize, setGridSize] = useState(12);

  // Function to get container dimensions
  const getContainerDimensions = useCallback(() => {
    if (!observed.current) return { width: 800, height: 600 };
    const rect = observed.current.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }, []);

  // Function to update renderer and camera dimensions
  const updateDimensions = useCallback(() => {
    if (!observed.current) return;

    const { width, height } = getContainerDimensions();

    if (rendererRef.current) {
      rendererRef.current.setSize(width, height);
    }
    if (labelRendererRef.current) {
      labelRendererRef.current.setSize(width, height);
    }
    if (cameraRef.current) {
      cameraRef.current.left = -width / 2;
      cameraRef.current.right = width / 2;
      cameraRef.current.top = height / 2;
      cameraRef.current.bottom = -height / 2;
      cameraRef.current.updateProjectionMatrix();
    }
  }, []);

  const createLabel = (
    target: THREE.Vector3,
    label: string = '',
    small: boolean = false
  ) => {
    const labelDiv = document.createElement('div');
    labelDiv.textContent = label || `[${target.toArray()}]`;
    labelDiv.style.marginTop = '-1em';

    if (small) {
      labelDiv.style.color = '#888888';
      labelDiv.style.fontSize = '12px';
    } else {
      labelDiv.style.color = 'white';
    }

    const labelObj = new CSS2DObject(labelDiv);
    labelObj.position.copy(target);
    return labelObj;
  };

  const drawVector = useCallback(
    (vector: THREE.Vector3, name: string, idx: number | null) => {
      // get length of vector
      const length = vector.length();

      // set direction as normalized vector
      const dir = vector.clone().normalize();

      // create helper
      const origin = new THREE.Vector3(0, 0, 0);
      const hex = 0x00ffff;
      const vectorHelper = new THREE.ArrowHelper(
        dir,
        origin,
        length,
        hex,
        0.2,
        0.1
      );

      // create label
      const vectorLabel = createLabel(vector, name);

      const vectorContainer = new THREE.Group();
      vectorContainer.userData.target = vector;
      vectorContainer.attach(vectorHelper);
      vectorContainer.attach(vectorLabel);

      sceneRef.current!.add(vectorContainer);

      setVectors((vectors) => {
        let existingVectors = vectors;

        if (idx !== null) {
          // remove target vector first
          const targetVector = existingVectors[idx];
          targetVector.vector.remove(...targetVector.vector.children);
          sceneRef.current!.remove(targetVector.vector);
          existingVectors = existingVectors.filter(
            (_vector, index) => index !== idx
          );
        }

        let newVector = { vector: vectorContainer, name: name };
        return [...existingVectors, newVector];
      });
    },
    []
  );

  // Add methods to add/remove vectors by name
  const addVector = useCallback((name: string, value: R300) => {
    const vector = r300_to_threejs_object(value);
    drawVector(vector, name, null);
  }, [drawVector]);

  const addVectorWithPosition = useCallback((name: string, position: { x: number, y: number, z: number }) => {
    const vector = new THREE.Vector3(position.x, position.y, position.z);
    drawVector(vector, name, null);
  }, [drawVector]);

  const hasVector = useCallback((name: string) => {
    return vectors.some(v => v.name === name);
  }, [vectors]);

  const getVectorNames = useCallback(() => {
    return vectors.map(v => v.name);
  }, [vectors]);

  const removeVector = useCallback((name: string) => {
    setVectors((vectors) => {
      const idx = vectors.findIndex(v => v.name === name);
      if (idx !== -1) {
        const targetVector = vectors[idx];
        targetVector.vector.remove(...targetVector.vector.children);
        sceneRef.current!.remove(targetVector.vector);
        return vectors.filter((_, index) => index !== idx);
      }
      return vectors;
    });
  }, []);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    addVector,
    addVectorWithPosition,
    removeVector,
    hasVector,
    getVectorNames
  }), [addVector, addVectorWithPosition, removeVector, hasVector, getVectorNames]);

  useEffect(() => {
    const appElement = observed.current;

    if (appElement) {
      const { width, height } = getContainerDimensions();

      // init renderer
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
      });
      const bgColor = 0x263238 / 2;
      renderer.setClearColor(bgColor, 1);
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio || 1);

      // init label renderer
      const labelRenderer = new CSS2DRenderer();
      labelRenderer.setSize(width, height);
      labelRenderer.domElement.style.position = 'absolute';
      labelRenderer.domElement.style.top = '0';
      labelRenderer.domElement.style.outline = 'none';

      // init camera
      const camera = new THREE.OrthographicCamera(
        -width / 2,
        width / 2,
        height / 2,
        -height / 2
      );
      camera.position.x = 5;
      camera.position.y = -20;
      camera.position.z = 15;
      camera.up = new THREE.Vector3(0, 0, 1);
      camera.updateProjectionMatrix();

      // init scene
      const scene = new THREE.Scene();
      scene.add(camera);

      // init controls and raycaster stuff
      const controls = new OrbitControls(camera, labelRenderer.domElement);
      controls.enablePan = false;
      controls.keys = {
        LEFT: 'KeyA',  // A
        RIGHT: 'KeyD', // D
        UP: 'KeyW',    // W
        BOTTOM: 'KeyS'   // S
      };

      // setup render loop
      function animate(): void {

        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);


        requestAnimationFrame(animate);

        controls.update();
        callbackRef.current();
      }

      // resize observer
      const resizeObserver = new ResizeObserver(() => {
        updateDimensions();
      });
      resizeObserver.observe(appElement);

      // attach rendering canvas to DOM
      appElement.appendChild(renderer.domElement);

      // attach label canvas to DOM
      appElement.appendChild(labelRenderer.domElement);

      // define default render callback
      callbackRef.current = () => { };

      // update refs
      sceneRef.current = scene;
      cameraRef.current = camera;
      rendererRef.current = renderer;
      labelRendererRef.current = labelRenderer;
      controlsRef.current = controls;

      // trigger animation
      animate();

      // cleanup
      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', updateDimensions);
        appElement.removeChild(renderer.domElement);
        appElement.removeChild(labelRenderer.domElement);
      };
    }
  }, [observed, drawVector, getContainerDimensions, updateDimensions]);

  // draw grid
  useEffect(() => {
    if (gridRef.current) {
      // first delete existing grid
      gridRef.current.remove(...gridRef.current.children);
      sceneRef.current!.remove(gridRef.current);
    }

    console.log('drawing new grid', gridSize);
    // create grid helper for XY plane
    const size = gridSize;
    const divisions = gridSize;
    const gridHelper = new THREE.GridHelper(size, divisions, 0xffffff);
    gridHelper.rotateX(Math.PI / 2);

    // create helper for Z axis
    const material = new THREE.LineBasicMaterial({ color: 0xffffff });
    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints([
      new THREE.Vector3(0, 0, size / 2),
      new THREE.Vector3(0, 0, -(size / 2)),
    ]);
    const zAxis = new THREE.LineSegments(geometry, material);

    // add labels
    const xAxisLabel = createLabel(new THREE.Vector3(size / 2, 0, 0), 'X');
    const yAxisLabel = createLabel(new THREE.Vector3(0, (size / 2), 0), 'Y');
    const zAxisLabel = createLabel(new THREE.Vector3(0, 0, size / 2), 'Z');

    const gridGroup = new THREE.Group();
    gridGroup.add(gridHelper, zAxis, xAxisLabel, yAxisLabel, zAxisLabel);

    sceneRef.current!.add(gridGroup);

    gridRef.current = gridGroup;
  }, [gridSize]);

  // zoom to fit
  //   useEffect(() => {
  //     if (cameraRef.current) {
  //       const combinedBox = new THREE.Box3();

  //       // find maximum absolute scalar value of all vectors
  //       let maxScalar = 0;
  //       console.log('vectors', vectors);
  //       vectors.forEach((vectorObj: ThreeJSMultiVector) => {
  //         combinedBox.union(new THREE.Box3().expandByObject(vectorObj.vector));
  //         maxScalar = Math.max(
  //           maxScalar,
  //           Math.abs(vectorObj.vector.userData.target.x),
  //           Math.abs(vectorObj.vector.userData.target.y),
  //           Math.abs(vectorObj.vector.userData.target.z)
  //         );
  //       });

  //       // adjust camera zoom
  //       cameraRef.current.zoom =
  //         Math.min(
  //           window.innerWidth / (combinedBox.max.x - combinedBox.min.x),
  //           window.innerHeight / (combinedBox.max.y - combinedBox.min.y)
  //         ) * 0.3;
  //       cameraRef.current.updateProjectionMatrix();

  //       // adjust grid size if needed (round up to nearest multiple of 4)
  //       let targetGridSize = Math.ceil((maxScalar * 2) / 4.0) * 4.0;
  //       // make sure grid size is at least 12
  //       if (targetGridSize < 12) targetGridSize = 12;
  //       if (isFinite(targetGridSize)) setGridSize(targetGridSize);
  //     }
  //   }, [vectors]);

  const onSave = (idx: number | null, coords: SelectedVector['coords']) => {
    drawVector(new THREE.Vector3(coords.x, coords.y, coords.z), "", idx);
  };

  const onDelete = (idx: number) => {
    setVectors((vectors) => {
      let existingVectors = vectors;

      // remove target vector
      const targetVector = existingVectors[idx];
      targetVector.vector.remove(...targetVector.vector.children);
      sceneRef.current!.remove(targetVector.vector);
      existingVectors = existingVectors.filter(
        (_vector, index) => index !== idx
      );

      return existingVectors;
    });
  };

  return (
    <StyledApp ref={observed} className={className}>
      <div className="control-board-container">
        <ControlBoard vectors={vectors} onSave={onSave} onDelete={onDelete} />
      </div>
    </StyledApp>
  );
});

ThreeJs3DSpace.displayName = 'ThreeJs3DSpace';

export default ThreeJs3DSpace;