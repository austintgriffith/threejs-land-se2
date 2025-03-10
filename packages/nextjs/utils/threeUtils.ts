import * as THREE from "three";

// Easing function for smoother animation
export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

// Calculate distance between two touch points
export const getPinchDistance = (e: TouchEvent): number => {
  const dx = e.touches[0].clientX - e.touches[1].clientX;
  const dy = e.touches[0].clientY - e.touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

// Convert touch event to mouse event
export const touchToMouseEvent = (touch: Touch): MouseEvent => {
  return new MouseEvent("click", {
    clientX: touch.clientX,
    clientY: touch.clientY,
  });
};

// Create hexagon points for tile shape
export const createHexagonPoints = (size: number): THREE.Vector2[] => {
  const hexPoints = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const x = size * Math.cos(angle);
    const y = size * Math.sin(angle);
    hexPoints.push(new THREE.Vector2(x, y));
  }
  return hexPoints;
};
