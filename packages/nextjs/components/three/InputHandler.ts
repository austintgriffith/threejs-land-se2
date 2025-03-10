import { getPinchDistance, touchToMouseEvent } from "../../utils/threeUtils";
import { CameraController } from "./CameraController";
import { TileManager } from "./TileManager";
import * as THREE from "three";

export class InputHandler {
  isDragging = false;
  previousMousePosition = { x: 0, y: 0 };
  previousTouchPosition = { x: 0, y: 0 };
  dragStartTime = 0;
  initialPinchDistance = 0;
  dragStartPosition = { x: 0, y: 0 };
  readonly DRAG_THRESHOLD = 200; // ms
  readonly DRAG_DISTANCE_THRESHOLD = 20; // pixels
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  constructor(
    private renderer: THREE.WebGLRenderer,
    private camera: THREE.PerspectiveCamera,
    private tileManager: TileManager,
    private cameraController: CameraController,
  ) {
    this.setupEventListeners();
  }

  setupEventListeners(): void {
    // Add mouse event listeners
    this.renderer.domElement.addEventListener("mousedown", this.onMouseDown);
    this.renderer.domElement.addEventListener("mousemove", this.onMouseMove);
    this.renderer.domElement.addEventListener("mouseup", this.onMouseUp);
    this.renderer.domElement.addEventListener("mouseleave", this.onMouseUp);

    // Add touch event listeners for mobile devices
    this.renderer.domElement.addEventListener("touchstart", this.onTouchStart);
    this.renderer.domElement.addEventListener("touchmove", this.onTouchMove, { passive: false });
    this.renderer.domElement.addEventListener("touchend", this.onTouchEnd);
    this.renderer.domElement.addEventListener("touchcancel", this.onTouchEnd);

    // Add zoom functionality with mouse wheel
    this.renderer.domElement.addEventListener("wheel", this.onWheel);
  }

  removeEventListeners(): void {
    this.renderer.domElement.removeEventListener("mousedown", this.onMouseDown);
    this.renderer.domElement.removeEventListener("mousemove", this.onMouseMove);
    this.renderer.domElement.removeEventListener("mouseup", this.onMouseUp);
    this.renderer.domElement.removeEventListener("mouseleave", this.onMouseUp);
    this.renderer.domElement.removeEventListener("wheel", this.onWheel);

    // Remove touch event listeners
    this.renderer.domElement.removeEventListener("touchstart", this.onTouchStart);
    this.renderer.domElement.removeEventListener("touchmove", this.onTouchMove);
    this.renderer.domElement.removeEventListener("touchend", this.onTouchEnd);
    this.renderer.domElement.removeEventListener("touchcancel", this.onTouchEnd);
  }

  onClick = (event: MouseEvent): void => {
    // Calculate mouse position in normalized device coordinates
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObjects(this.tileManager.tiles);

    if (intersects.length > 0) {
      // Select the first intersected tile
      const tile = intersects[0].object as THREE.Mesh;
      this.tileManager.selectTile(tile);
      this.cameraController.startSmoothPanToTile(tile);
    } else {
      // Deselect if clicking on empty space
      this.tileManager.deselectTile();
    }
  };

  onMouseDown = (e: MouseEvent): void => {
    this.isDragging = true;
    this.dragStartTime = Date.now();
    this.dragStartPosition = { x: e.clientX, y: e.clientY };
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  };

  onMouseMove = (e: MouseEvent): void => {
    if (!this.isDragging) return;

    const deltaMove = {
      x: e.clientX - this.previousMousePosition.x,
      y: e.clientY - this.previousMousePosition.y,
    };

    // Calculate total distance moved from start position
    const totalDragDistance = Math.sqrt(
      Math.pow(e.clientX - this.dragStartPosition.x, 2) + Math.pow(e.clientY - this.dragStartPosition.y, 2),
    );

    // Only pan if we've moved beyond the distance threshold
    if (totalDragDistance > this.DRAG_DISTANCE_THRESHOLD) {
      // Pan the camera based on mouse movement
      this.cameraController.handlePan(deltaMove);
    }

    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  };

  onMouseUp = (e: MouseEvent): void => {
    if (this.isDragging) {
      const dragDuration = Date.now() - this.dragStartTime;
      // Calculate total distance moved
      const totalDragDistance = Math.sqrt(
        Math.pow(e.clientX - this.dragStartPosition.x, 2) + Math.pow(e.clientY - this.dragStartPosition.y, 2),
      );

      // If it was a short drag AND small movement, handle it as a click
      if (dragDuration < this.DRAG_THRESHOLD && totalDragDistance < this.DRAG_DISTANCE_THRESHOLD) {
        this.onClick(e);
      }
      this.isDragging = false;
    }
  };

  onTouchStart = (e: TouchEvent): void => {
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.dragStartTime = Date.now();
      this.dragStartPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      this.previousTouchPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      // It's a pinch gesture - calculate initial distance
      this.isDragging = false;
      this.initialPinchDistance = getPinchDistance(e);
    }
  };

  onTouchMove = (e: TouchEvent): void => {
    // Prevent default to avoid scrolling the page while interacting
    e.preventDefault();

    if (e.touches.length === 1 && this.isDragging) {
      const deltaMove = {
        x: e.touches[0].clientX - this.previousTouchPosition.x,
        y: e.touches[0].clientY - this.previousTouchPosition.y,
      };

      // Calculate total distance moved from start position
      const totalDragDistance = Math.sqrt(
        Math.pow(e.touches[0].clientX - this.dragStartPosition.x, 2) +
          Math.pow(e.touches[0].clientY - this.dragStartPosition.y, 2),
      );

      // Only pan if we've moved beyond the distance threshold
      if (totalDragDistance > this.DRAG_DISTANCE_THRESHOLD) {
        // Pan the camera based on touch movement
        this.cameraController.handlePan(deltaMove);
      }

      this.previousTouchPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      // Handle pinch zoom
      const currentDistance = getPinchDistance(e);
      const pinchDelta = currentDistance - this.initialPinchDistance;

      // Apply zoom based on pinch delta
      this.cameraController.handlePinchZoom(pinchDelta);

      // Update initial distance for next move event
      this.initialPinchDistance = currentDistance;
    }
  };

  onTouchEnd = (e: TouchEvent): void => {
    if (this.isDragging && e.changedTouches.length > 0) {
      const dragDuration = Date.now() - this.dragStartTime;
      const touch = e.changedTouches[0];

      // Calculate total distance moved
      const totalDragDistance = Math.sqrt(
        Math.pow(touch.clientX - this.dragStartPosition.x, 2) + Math.pow(touch.clientY - this.dragStartPosition.y, 2),
      );

      // If it was a short drag AND small movement, handle it as a click
      if (dragDuration < this.DRAG_THRESHOLD && totalDragDistance < this.DRAG_DISTANCE_THRESHOLD) {
        // Convert touch to mouse event for onClick handler
        const mouseEvent = touchToMouseEvent(touch);
        this.onClick(mouseEvent);
      }
      this.isDragging = false;
    }
  };

  onWheel = (e: WheelEvent): void => {
    e.preventDefault();

    // Get zoom direction
    const delta = e.deltaY > 0 ? 1 : -1;

    // Handle zoom
    this.cameraController.handleZoom(delta);
  };
}
