"use client";

import { useEffect, useRef } from "react";
import { CameraController } from "./three/CameraController";
import { InputHandler } from "./three/InputHandler";
import { TileManager } from "./three/TileManager";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

const ThreeScene = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Store the current mount ref in a variable to use in cleanup
    const currentMount = mountRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);

    // Set camera position for a closer isometric view
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    currentMount.appendChild(renderer.domElement);

    // Add simple lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Add a second directional light from another angle for more brightness
    const secondaryLight = new THREE.DirectionalLight(0xffffff, 1.0);
    secondaryLight.position.set(-5, 8, -7.5);
    scene.add(secondaryLight);

    // Initialize our managers and controllers
    const tileManager = new TileManager(scene);
    const cameraController = new CameraController(camera);
    const inputHandler = new InputHandler(renderer, camera, tileManager, cameraController);

    // Create the grid of tiles
    const gridSize = 64; // Reduced from 256 to 64 for better performance
    tileManager.createTiles(gridSize);

    // Position camera to look at the center of the grid
    const centerTile = tileManager.getCenterTile(gridSize);
    if (centerTile) {
      camera.position.set(centerTile.position.x + 5, 5, centerTile.position.z + 5);
      camera.lookAt(centerTile.position);

      // Select the center tile initially
      tileManager.selectTile(centerTile);
    }

    // Simple post-processing setup
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Add a very subtle bloom effect
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(currentMount.clientWidth, currentMount.clientHeight),
      0.05, // Reduced from 0.1 - minimal strength
      0.7, // Increased from 0.5 - wider radius for more diffusion
      0.4, // Increased from 0.2 - much higher threshold so only the brightest pixels glow
    );
    composer.addPass(bloomPass);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Update camera animation if active
      if (cameraController.isAnimatingCamera) {
        cameraController.updateCameraAnimation();
      }

      // Render using the composer
      composer.render();
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return;

      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);

      // Update composer size
      composer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      inputHandler.removeEventListeners();
      tileManager.dispose();

      if (currentMount) {
        currentMount.removeChild(renderer.domElement);
      }

      renderer.dispose();

      // Dispose of post-processing resources
      composer.dispose();
      bloomPass.dispose();
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default ThreeScene;
