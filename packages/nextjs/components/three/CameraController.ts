import { easeInOutCubic } from "../../utils/threeUtils";
import * as THREE from "three";

export class CameraController {
  isAnimatingCamera = false;
  cameraAnimationStartTime = 0;
  readonly CAMERA_ANIMATION_DURATION = 1000; // 1 second duration
  startCameraPosition = new THREE.Vector3();
  targetCameraPosition = new THREE.Vector3();
  startCameraLookAt = new THREE.Vector3();
  targetCameraLookAt = new THREE.Vector3();

  constructor(private camera: THREE.PerspectiveCamera) {}

  startSmoothPanToTile(tile: THREE.Mesh): void {
    // Save current camera position and lookAt point
    this.startCameraPosition.copy(this.camera.position);

    // Calculate where camera is currently looking
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    this.startCameraLookAt.copy(this.camera.position).add(direction.multiplyScalar(10));

    // Calculate target position (above and slightly offset from the tile)
    this.targetCameraLookAt.copy(tile.position);

    // Calculate new camera position that's at the same distance but looking at the tile
    const cameraOffset = new THREE.Vector3(3, 3, 3); // Offset from directly above
    this.targetCameraPosition.copy(tile.position).add(cameraOffset);

    // Start the animation
    this.isAnimatingCamera = true;
    this.cameraAnimationStartTime = Date.now();
  }

  updateCameraAnimation(): void {
    if (!this.isAnimatingCamera) return;

    const currentTime = Date.now();
    const elapsedTime = currentTime - this.cameraAnimationStartTime;

    if (elapsedTime >= this.CAMERA_ANIMATION_DURATION) {
      // Animation complete
      this.camera.position.copy(this.targetCameraPosition);
      this.camera.lookAt(this.targetCameraLookAt);
      this.isAnimatingCamera = false;
      return;
    }

    // Calculate interpolation factor (0 to 1) with easing
    const t = elapsedTime / this.CAMERA_ANIMATION_DURATION;
    const easedT = easeInOutCubic(t);

    // Interpolate camera position and lookAt point
    const newPosition = new THREE.Vector3().lerpVectors(this.startCameraPosition, this.targetCameraPosition, easedT);
    const newLookAt = new THREE.Vector3().lerpVectors(this.startCameraLookAt, this.targetCameraLookAt, easedT);

    // Update camera
    this.camera.position.copy(newPosition);
    this.camera.lookAt(newLookAt);
  }

  handlePan(deltaMove: { x: number; y: number }): void {
    // Pan speed factor
    const panSpeed = 0.01;

    // Calculate movement vectors based on camera orientation
    const rightVector = new THREE.Vector3();
    this.camera.getWorldDirection(rightVector);
    rightVector.cross(this.camera.up).normalize();

    // For vertical movement, we use a vector perpendicular to both the right vector and world up
    const forwardVector = new THREE.Vector3();
    forwardVector.crossVectors(this.camera.up, rightVector).normalize();

    // Move the camera position
    this.camera.position.addScaledVector(rightVector, -deltaMove.x * panSpeed);
    this.camera.position.addScaledVector(forwardVector, deltaMove.y * panSpeed);

    // Update the camera's target point to maintain the same viewing angle
    const target = new THREE.Vector3();
    target.copy(this.camera.position);
    target.addScaledVector(this.camera.getWorldDirection(new THREE.Vector3()), 10);
    this.camera.lookAt(target);
  }

  handleZoom(delta: number): void {
    // Zoom speed factor
    const zoomSpeed = 0.3;

    // Get camera direction vector
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);

    // Move camera along its direction vector
    this.camera.position.addScaledVector(direction, delta * zoomSpeed);

    // Update the camera's target point
    const target = new THREE.Vector3();
    target.copy(this.camera.position);
    target.addScaledVector(direction, 10);
    this.camera.lookAt(target);
  }

  handlePinchZoom(pinchDelta: number): void {
    // Zoom speed factor
    const zoomSpeed = 0.05;

    // Get camera direction vector
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);

    // Determine zoom direction based on pinch
    const zoomDirection = pinchDelta > 0 ? 1 : -1;

    // Scale the movement based on pinch magnitude
    const scaledDelta = Math.abs(pinchDelta) * zoomSpeed * zoomDirection;

    // Move camera along its direction vector
    this.camera.position.addScaledVector(direction, scaledDelta);

    // Update the camera's target point
    const target = new THREE.Vector3();
    target.copy(this.camera.position);
    target.addScaledVector(direction, 10);
    this.camera.lookAt(target);
  }
}
