import * as THREE from 'three';
import { createCheeseWedgeTexture, createWebTexture } from './textures';

/**
 * Procedural 3D Composite Models for Magic Cheese: Arcane Fromage.
 * Strictly adheres to 3-12 part procedural composite groups with grounded bottom-center pivots,
 * varied PBR roughness/metalness, and zero external file dependencies.
 */

// Shared reusable materials & geometries
const sharedMaterials = {
  robe: new THREE.MeshStandardMaterial({ color: 0x312e81, roughness: 0.85, metalness: 0.05 }), // Arcane indigo wool
  goldTrim: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.25, metalness: 0.85 }), // Gleaming gold
  hat: new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.75, metalness: 0.1 }),
  mouseFur: new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9, metalness: 0.0 }),
  mouseEarInner: new THREE.MeshStandardMaterial({ color: 0xfca5a5, roughness: 0.7, metalness: 0.0 }),
  staffWood: new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.85, metalness: 0.1 }),
  cheeseGlow: new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 0.8,
    roughness: 0.35,
    metalness: 0.1,
  }),
  contactShadow: new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  }),
  ratLeather: new THREE.MeshStandardMaterial({ color: 0x3f2f21, roughness: 0.8, metalness: 0.1 }),
  ratFur: new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.9, metalness: 0.0 }),
  ratRedEye: new THREE.MeshBasicMaterial({ color: 0xef4444 }),
  rustMetal: new THREE.MeshStandardMaterial({ color: 0x713f12, roughness: 0.6, metalness: 0.7 }),
  moldSlime: new THREE.MeshPhysicalMaterial({
    color: 0x10b981,
    transmission: 0.6,
    opacity: 0.85,
    transparent: true,
    roughness: 0.2,
    ior: 1.4,
  }),
  golemRock: new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.9, metalness: 0.1 }),
  golemGouda: new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4, metalness: 0.15 }),
  fondueCore: new THREE.MeshBasicMaterial({ color: 0xffaa00 }),
};

/** Creates a procedural 3D cheese wedge mesh (triangular prism with rounded corners) */
export function createCheeseWedgeGeometry(size = 1.0): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const r = size * 0.7;
  // Arcane cheese wedge slice profile
  shape.moveTo(0, 0);
  shape.lineTo(r, 0);
  // Curved rind edge
  shape.absarc(0, 0, r, 0, Math.PI / 3, false);
  shape.closePath();

  const extrudeSettings = {
    steps: 1,
    depth: size * 0.45,
    bevelEnabled: true,
    bevelThickness: size * 0.06,
    bevelSize: size * 0.05,
    bevelSegments: 3,
  };

  return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

/** Cheddalf the Whiskered: 12-part composite procedural mouse wizard */
export function createCheddalfWizard(): THREE.Group {
  const root = new THREE.Group();

  // 1. Contact shadow plane (bottom-center grounded)
  const shadowGeo = new THREE.PlaneGeometry(1.2, 1.2);
  const shadowMesh = new THREE.Mesh(shadowGeo, sharedMaterials.contactShadow);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  root.add(shadowMesh);

  // 2. Wizard Robe (cone with flared bottom)
  const robeGeo = new THREE.CylinderGeometry(0.22, 0.45, 0.9, 12);
  const robe = new THREE.Mesh(robeGeo, sharedMaterials.robe);
  robe.position.y = 0.5;
  robe.castShadow = true;
  robe.receiveShadow = true;
  root.add(robe);

  // 3. Robe Gold Hem & Collar
  const collarGeo = new THREE.TorusGeometry(0.24, 0.04, 8, 16);
  const collar = new THREE.Mesh(collarGeo, sharedMaterials.goldTrim);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.95;
  root.add(collar);

  // 4. Mouse Head
  const headGeo = new THREE.SphereGeometry(0.28, 12, 10);
  headGeo.scale(1, 0.9, 1.2);
  const head = new THREE.Mesh(headGeo, sharedMaterials.mouseFur);
  head.position.set(0, 1.15, 0.08);
  head.castShadow = true;
  root.add(head);

  // 5. Snout & Nose
  const noseGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const nose = new THREE.Mesh(noseGeo, new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.3 }));
  nose.position.set(0, 1.12, 0.42);
  root.add(nose);

  // 6. Left Ear (outer + inner)
  const earGeo = new THREE.SphereGeometry(0.18, 10, 8);
  earGeo.scale(0.9, 1, 0.3);
  const leftEar = new THREE.Mesh(earGeo, sharedMaterials.mouseFur);
  leftEar.position.set(-0.25, 1.35, 0.05);
  leftEar.rotation.set(0.2, -0.3, -0.4);
  root.add(leftEar);

  const leftInner = new THREE.Mesh(earGeo, sharedMaterials.mouseEarInner);
  leftInner.position.set(-0.25, 1.35, 0.07);
  leftInner.scale.set(0.7, 0.7, 0.3);
  leftInner.rotation.set(0.2, -0.3, -0.4);
  root.add(leftInner);

  // 7. Right Ear (outer + inner)
  const rightEar = new THREE.Mesh(earGeo, sharedMaterials.mouseFur);
  rightEar.position.set(0.25, 1.35, 0.05);
  rightEar.rotation.set(0.2, 0.3, 0.4);
  root.add(rightEar);

  const rightInner = new THREE.Mesh(earGeo, sharedMaterials.mouseEarInner);
  rightInner.position.set(0.25, 1.35, 0.07);
  rightInner.scale.set(0.7, 0.7, 0.3);
  rightInner.rotation.set(0.2, 0.3, 0.4);
  root.add(rightInner);

  // 8. Wizard Hat Brim
  const hatBrimGeo = new THREE.CylinderGeometry(0.48, 0.5, 0.04, 16);
  const hatBrim = new THREE.Mesh(hatBrimGeo, sharedMaterials.hat);
  hatBrim.position.set(0, 1.32, 0.04);
  hatBrim.rotation.x = -0.12;
  root.add(hatBrim);

  // 9. Wizard Hat Cone (jaunty curve)
  const hatConeGeo = new THREE.ConeGeometry(0.3, 0.7, 12);
  const hatCone = new THREE.Mesh(hatConeGeo, sharedMaterials.hat);
  hatCone.position.set(0, 1.62, -0.05);
  hatCone.rotation.x = -0.25;
  hatCone.castShadow = true;
  root.add(hatCone);

  // 10. Golden Cheese Hat Buckle
  const buckleGeo = new THREE.BoxGeometry(0.12, 0.08, 0.05);
  const buckle = new THREE.Mesh(buckleGeo, sharedMaterials.goldTrim);
  buckle.position.set(0, 1.38, 0.3);
  root.add(buckle);

  // 11. Wizard Cheese Staff
  const staffGroup = new THREE.Group();
  const woodShaftGeo = new THREE.CylinderGeometry(0.035, 0.045, 1.5, 8);
  const woodShaft = new THREE.Mesh(woodShaftGeo, sharedMaterials.staffWood);
  woodShaft.position.y = 0.75;
  woodShaft.castShadow = true;
  staffGroup.add(woodShaft);

  // 12. Staff Crystal Cheese Headpiece (Glowing magical Brie wedge!)
  const staffCheeseGeo = createCheeseWedgeGeometry(0.4);
  const staffCheese = new THREE.Mesh(staffCheeseGeo, sharedMaterials.cheeseGlow);
  staffCheese.position.set(-0.1, 1.45, 0);
  staffCheese.rotation.set(0, 0, Math.PI / 4);
  staffGroup.add(staffCheese);

  // Tiny light orbiting the cheese staff head
  const staffPointLight = new THREE.PointLight(0xfbbf24, 1.2, 3.5);
  staffPointLight.position.set(0, 1.55, 0.1);
  staffGroup.add(staffPointLight);

  staffGroup.position.set(0.45, 0, 0.25);
  root.add(staffGroup);

  // Make unique materials for Cheddalf so custom colors don't alter shared globals
  robe.material = sharedMaterials.robe.clone();
  hatBrim.material = sharedMaterials.hat.clone();
  hatCone.material = sharedMaterials.hat.clone();
  staffCheese.material = sharedMaterials.cheeseGlow.clone();

  // Tag components for procedural animations and color customizer
  root.userData = {
    staffGroup,
    staffCheese,
    head,
    hatBrim,
    hatCone,
    robe,
  };

  return root;
}

/** Rat Skirmisher: 6-part procedural sneaky rat enemy */
export function createRatEnemy(): THREE.Group {
  const root = new THREE.Group();

  // Contact shadow
  const shadowGeo = new THREE.PlaneGeometry(1.0, 1.0);
  const shadowMesh = new THREE.Mesh(shadowGeo, sharedMaterials.contactShadow);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  root.add(shadowMesh);

  // Body / Vest
  const bodyGeo = new THREE.CylinderGeometry(0.25, 0.38, 0.75, 8);
  const body = new THREE.Mesh(bodyGeo, sharedMaterials.ratLeather);
  body.position.y = 0.42;
  body.castShadow = true;
  root.add(body);

  // Head with snout
  const headGeo = new THREE.ConeGeometry(0.22, 0.5, 8);
  const head = new THREE.Mesh(headGeo, sharedMaterials.ratFur);
  head.rotation.x = Math.PI / 2 + 0.2;
  head.position.set(0, 0.8, 0.2);
  head.castShadow = true;
  root.add(head);

  // Red glowing eyes
  const eyeGeo = new THREE.SphereGeometry(0.04, 6, 6);
  const leftEye = new THREE.Mesh(eyeGeo, sharedMaterials.ratRedEye);
  leftEye.position.set(-0.1, 0.88, 0.35);
  root.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, sharedMaterials.ratRedEye);
  rightEye.position.set(0.1, 0.88, 0.35);
  root.add(rightEye);

  // Large spiky rat ears
  const earGeo = new THREE.ConeGeometry(0.1, 0.25, 6);
  const leftEar = new THREE.Mesh(earGeo, sharedMaterials.ratFur);
  leftEar.position.set(-0.18, 0.98, 0.05);
  leftEar.rotation.z = -0.4;
  root.add(leftEar);

  const rightEar = new THREE.Mesh(earGeo, sharedMaterials.ratFur);
  rightEar.position.set(0.18, 0.98, 0.05);
  rightEar.rotation.z = 0.4;
  root.add(rightEar);

  // Weapon: Rusty Cheese Grater Dagger
  const weaponGroup = new THREE.Group();
  const bladeGeo = new THREE.BoxGeometry(0.08, 0.38, 0.02);
  const blade = new THREE.Mesh(bladeGeo, sharedMaterials.rustMetal);
  blade.position.y = 0.2;
  weaponGroup.add(blade);
  weaponGroup.position.set(0.35, 0.35, 0.3);
  root.add(weaponGroup);

  // Sinuous tail
  const tailGeo = new THREE.CylinderGeometry(0.025, 0.04, 0.6, 6);
  const tail = new THREE.Mesh(tailGeo, sharedMaterials.mouseEarInner);
  tail.position.set(0, 0.25, -0.35);
  tail.rotation.x = -0.7;
  root.add(tail);

  root.userData = { head, weaponGroup, tail, body };
  return root;
}

/** Mold Wisp / Slime: 5-part undulating magical slime */
export function createWispEnemy(): THREE.Group {
  const root = new THREE.Group();

  const shadowGeo = new THREE.PlaneGeometry(0.8, 0.8);
  const shadowMesh = new THREE.Mesh(shadowGeo, sharedMaterials.contactShadow);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  root.add(shadowMesh);

  // Outer translucent slime body
  const bodyGeo = new THREE.SphereGeometry(0.42, 12, 10);
  bodyGeo.scale(1, 0.8, 1);
  const body = new THREE.Mesh(bodyGeo, sharedMaterials.moldSlime);
  body.position.y = 0.45;
  body.castShadow = true;
  root.add(body);

  // Inner pulsing spore nucleus
  const coreGeo = new THREE.SphereGeometry(0.2, 8, 8);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.y = 0.45;
  root.add(core);

  // Glowing yellow eyes
  const eyeGeo = new THREE.SphereGeometry(0.05, 6, 6);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
  eye1.position.set(-0.12, 0.48, 0.34);
  root.add(eye1);

  const eye2 = new THREE.Mesh(eyeGeo, eyeMat);
  eye2.position.set(0.12, 0.48, 0.34);
  root.add(eye2);

  // Orbiting spore droplets
  const orbiterGroup = new THREE.Group();
  orbiterGroup.position.y = 0.45;
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), sharedMaterials.moldSlime);
    drop.position.set(Math.cos(angle) * 0.55, Math.sin(angle * 2) * 0.1, Math.sin(angle) * 0.55);
    orbiterGroup.add(drop);
  }
  root.add(orbiterGroup);

  root.userData = { body, core, orbiterGroup };
  return root;
}

/** Mold Spitter: 6-part fungal artillery creature */
export function createSpitterEnemy(): THREE.Group {
  const root = new THREE.Group();

  const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), sharedMaterials.contactShadow);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  root.add(shadowMesh);

  // Bulbous blue-cheese pustule body
  const bodyGeo = new THREE.DodecahedronGeometry(0.55, 1);
  const spitterMat = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.65, metalness: 0.2 });
  const body = new THREE.Mesh(bodyGeo, spitterMat);
  body.position.y = 0.55;
  body.castShadow = true;
  root.add(body);

  // Cannon mouth
  const mouthGeo = new THREE.TorusGeometry(0.2, 0.08, 8, 12);
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
  const mouth = new THREE.Mesh(mouthGeo, mouthMat);
  mouth.position.set(0, 0.65, 0.45);
  root.add(mouth);

  // Back mushrooms
  const shroomGroup = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.15, 8), new THREE.MeshStandardMaterial({ color: 0x3b82f6 }));
    cap.position.set((i - 1) * 0.2, 0.95 + i * 0.05, -0.15);
    shroomGroup.add(cap);
  }
  root.add(shroomGroup);

  root.userData = { body, mouth, shroomGroup };
  return root;
}

/** The Great Gouda Golem (Colossal Boss): 11-part procedural powerhouse */
export function createGoudaGolemBoss(): THREE.Group {
  const root = new THREE.Group();

  // Massive shadow
  const shadowGeo = new THREE.PlaneGeometry(3.8, 3.8);
  const shadowMesh = new THREE.Mesh(shadowGeo, sharedMaterials.contactShadow);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.03;
  root.add(shadowMesh);

  // 1. Massive aged Gouda Torso (large cylinder wheel)
  const torsoGeo = new THREE.CylinderGeometry(1.2, 1.4, 1.6, 14);
  const torso = new THREE.Mesh(torsoGeo, sharedMaterials.golemGouda);
  torso.position.y = 1.6;
  torso.castShadow = true;
  torso.receiveShadow = true;
  root.add(torso);

  // 2. Molten Fondue Core (glowing intensely in chest)
  const coreGeo = new THREE.SphereGeometry(0.55, 10, 10);
  const core = new THREE.Mesh(coreGeo, sharedMaterials.fondueCore);
  core.position.set(0, 1.7, 0.7);
  root.add(core);

  // Core point light
  const bossLight = new THREE.PointLight(0xffaa00, 2.0, 8);
  bossLight.position.set(0, 1.7, 1.1);
  root.add(bossLight);

  // 3. Colossal Head with Gouda Rind Crown
  const headGeo = new THREE.DodecahedronGeometry(0.65, 1);
  const head = new THREE.Mesh(headGeo, sharedMaterials.golemRock);
  head.position.set(0, 2.7, 0.2);
  head.castShadow = true;
  root.add(head);

  // Horns / Crown
  const hornGeo = new THREE.ConeGeometry(0.18, 0.6, 6);
  const leftHorn = new THREE.Mesh(hornGeo, sharedMaterials.golemGouda);
  leftHorn.position.set(-0.45, 3.2, 0.1);
  leftHorn.rotation.z = 0.4;
  root.add(leftHorn);

  const rightHorn = new THREE.Mesh(hornGeo, sharedMaterials.golemGouda);
  rightHorn.position.set(0.45, 3.2, 0.1);
  rightHorn.rotation.z = -0.4;
  root.add(rightHorn);

  // Glowing molten eyes
  const eyeGeo = new THREE.SphereGeometry(0.09, 6, 6);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff3b00 });
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.22, 2.75, 0.72);
  root.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.22, 2.75, 0.72);
  root.add(rightEye);

  // 4. Shoulder Pauldrons (stone cheese wheels)
  const pauldronGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 10);
  const leftPaul = new THREE.Mesh(pauldronGeo, sharedMaterials.golemRock);
  leftPaul.rotation.z = Math.PI / 2;
  leftPaul.position.set(-1.6, 2.1, 0.1);
  root.add(leftPaul);

  const rightPaul = new THREE.Mesh(pauldronGeo, sharedMaterials.golemRock);
  rightPaul.rotation.z = Math.PI / 2;
  rightPaul.position.set(1.6, 2.1, 0.1);
  root.add(rightPaul);

  // 5. Giant Left & Right Boulder Fists
  const fistGeo = new THREE.DodecahedronGeometry(0.55, 1);
  const leftFist = new THREE.Mesh(fistGeo, sharedMaterials.golemGouda);
  leftFist.position.set(-1.7, 1.2, 0.5);
  leftFist.castShadow = true;
  root.add(leftFist);

  const rightFist = new THREE.Mesh(fistGeo, sharedMaterials.golemGouda);
  rightFist.position.set(1.7, 1.2, 0.5);
  rightFist.castShadow = true;
  root.add(rightFist);

  // 6. Sturdy legs
  const legGeo = new THREE.CylinderGeometry(0.4, 0.45, 0.9, 8);
  const leftLeg = new THREE.Mesh(legGeo, sharedMaterials.golemRock);
  leftLeg.position.set(-0.65, 0.45, 0);
  root.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, sharedMaterials.golemRock);
  rightLeg.position.set(0.65, 0.45, 0);
  root.add(rightLeg);

  root.userData = { torso, head, leftFist, rightFist, core, bossLight };
  return root;
}

/** Floating Collectible Cheese Wedge with magical halo ring */
export function createCheeseDropMesh(type: 'mana_curd' | 'brie_heart' | 'golden_parmesan' | 'mega_wheel' | 'rainbow_star'): THREE.Group {
  const root = new THREE.Group();

  let color = 0xf59e0b;
  let haloColor = 0xfbbf24;
  let scale = 0.5;

  if (type === 'mana_curd') {
    color = 0x38bdf8; // Sky blue mana curd
    haloColor = 0x67e8f9;
    scale = 0.42;
  } else if (type === 'brie_heart') {
    color = 0xf43f5e; // Radiant red brie heart
    haloColor = 0xfb7185;
    scale = 0.48;
  } else if (type === 'golden_parmesan') {
    color = 0xfacc15; // Golden starlight cheese
    haloColor = 0xfef08a;
    scale = 0.65;
  } else if (type === 'mega_wheel') {
    color = 0xf97316; // Radiant ancient fondue wheel (+250 collector)
    haloColor = 0xfbbf24;
    scale = 0.95;
  } else if (type === 'rainbow_star') {
    color = 0xec4899; // Prismatic 10,000 Colors Star (+1000 collector)
    haloColor = 0x38bdf8;
    scale = 1.1;
  }

  // Shadow
  const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.6 * (scale / 0.5), 0.6 * (scale / 0.5)), sharedMaterials.contactShadow);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  root.add(shadowMesh);

  // Cheese wedge or star
  const wedgeGeo = createCheeseWedgeGeometry(scale);
  const wedgeMat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: type === 'rainbow_star' ? 1.0 : 0.5,
    roughness: 0.3,
    metalness: 0.2,
  });
  const wedge = new THREE.Mesh(wedgeGeo, wedgeMat);
  wedge.position.set(-scale * 0.3, 0.4, -scale * 0.2);
  root.add(wedge);

  // Orbiting magical halo ring
  const haloGeo = new THREE.TorusGeometry(scale * 0.8, 0.025 * (scale / 0.5), 8, 16);
  const haloMat = new THREE.MeshBasicMaterial({ color: haloColor });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 0.4;
  root.add(halo);

  root.userData = { wedge, halo, type, color };
  return root;
}

/** Update Cheddalf's colors dynamically from 10,000 color atelier */
export function updateCheddalfColors(
  root: THREE.Group,
  robeHex: string,
  hatHex: string,
  staffHex: string
) {
  const robe = root.userData.robe as THREE.Mesh | undefined;
  if (robe && robe.material) {
    (robe.material as THREE.MeshStandardMaterial).color.set(robeHex);
  }

  const hatBrim = root.userData.hatBrim as THREE.Mesh | undefined;
  if (hatBrim && hatBrim.material) {
    (hatBrim.material as THREE.MeshStandardMaterial).color.set(hatHex);
  }

  const hatCone = root.userData.hatCone as THREE.Mesh | undefined;
  if (hatCone && hatCone.material) {
    (hatCone.material as THREE.MeshStandardMaterial).color.set(hatHex);
  }

  const staffCheese = root.userData.staffCheese as THREE.Mesh | undefined;
  if (staffCheese && staffCheese.material) {
    (staffCheese.material as THREE.MeshStandardMaterial).color.set(staffHex);
    (staffCheese.material as THREE.MeshStandardMaterial).emissive.set(staffHex);
  }

  const staffGroup = root.userData.staffGroup as THREE.Group | undefined;
  if (staffGroup) {
    staffGroup.traverse((child) => {
      if (child instanceof THREE.PointLight) {
        child.color.set(staffHex);
      }
    });
  }
}

/** Update any hero's colors dynamically across 10,000+ chromatic shades (10,000 Color Atelier) */
export function updateHeroColors(
  root: THREE.Group,
  charId: 'baldan' | 'nomio' | 'cheddalf',
  primaryHex: string,
  secondaryHex: string,
  glowHex: string
) {
  if (charId === 'cheddalf') {
    updateCheddalfColors(root, primaryHex, secondaryHex, glowHex);
    return;
  }

  if (charId === 'baldan') {
    const tunicMat = root.userData.tunicMat as THREE.MeshStandardMaterial | undefined;
    if (tunicMat) tunicMat.color.set(primaryHex);

    const bowMat = root.userData.bowMat as THREE.MeshStandardMaterial | undefined;
    if (bowMat) bowMat.color.set(secondaryHex);

    const goldCheeseMat = root.userData.goldCheeseMat as THREE.MeshStandardMaterial | undefined;
    if (goldCheeseMat) {
      goldCheeseMat.color.set(glowHex);
      goldCheeseMat.emissive.set(glowHex);
    }

    const rangerLight = root.userData.rangerLight as THREE.PointLight | undefined;
    if (rangerLight) rangerLight.color.set(glowHex);
    return;
  }

  if (charId === 'nomio') {
    const giMat = root.userData.giMat as THREE.MeshStandardMaterial | undefined;
    if (giMat) giMat.color.set(primaryHex);

    const headbandMat = root.userData.headbandMat as THREE.MeshBasicMaterial | undefined;
    if (headbandMat) headbandMat.color.set(secondaryHex);

    const wrapMat = root.userData.wrapMat as THREE.MeshStandardMaterial | undefined;
    if (wrapMat) wrapMat.color.set(secondaryHex);

    const gauntletMat = root.userData.gauntletMat as THREE.MeshStandardMaterial | undefined;
    if (gauntletMat) {
      gauntletMat.color.set(glowHex);
      gauntletMat.emissive.set(glowHex);
    }

    const warriorLight = root.userData.warriorLight as THREE.PointLight | undefined;
    if (warriorLight) warriorLight.color.set(glowHex);
    return;
  }
}

/** Giant Rolling Parmesan Wheel for the Wheel of Destiny Ultimate */
export function createDestinyWheelMesh(): THREE.Group {
  const root = new THREE.Group();

  // 2.2m diameter ancient parmesan wheel
  const wheelGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.6, 20);
  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.4,
    metalness: 0.1,
    emissive: 0xd97706,
    emissiveIntensity: 0.4,
  });
  const wheel = new THREE.Mesh(wheelGeo, wheelMat);
  wheel.rotation.z = Math.PI / 2;
  wheel.position.y = 1.2;
  wheel.castShadow = true;
  root.add(wheel);

  // Flaming rim
  const rimGeo = new THREE.TorusGeometry(1.22, 0.08, 8, 24);
  const rimMat = new THREE.MeshBasicMaterial({ color: 0xff4500 });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.y = Math.PI / 2;
  rim.position.y = 1.2;
  root.add(rim);

  const light = new THREE.PointLight(0xff5500, 2.5, 9);
  light.position.y = 1.2;
  root.add(light);

  root.userData = { wheel, rim };
  return root;
}

/** Wave 5 Boss: Dark of King (Fighting Style: Arrow) */
export function createDarkOfKingBoss(): THREE.Group {
  const root = new THREE.Group();

  // Contact shadow
  const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.0), sharedMaterials.contactShadow);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.03;
  root.add(shadowMesh);

  // Materials for Dark of King
  const darkObsidianMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    roughness: 0.35,
    metalness: 0.8,
  });
  const shadowCloakMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.85,
    metalness: 0.1,
  });
  const purpleGlowMat = new THREE.MeshStandardMaterial({
    color: 0xa855f7,
    emissive: 0x7e22ce,
    emissiveIntensity: 1.0,
    roughness: 0.3,
  });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xd946ef });

  // 1. Shadow Cloak / Body
  const cloakGeo = new THREE.CylinderGeometry(0.5, 1.1, 2.2, 12);
  const cloak = new THREE.Mesh(cloakGeo, shadowCloakMat);
  cloak.position.y = 1.1;
  cloak.castShadow = true;
  root.add(cloak);

  // 2. Armored Torso with dark chevron ribs
  const torsoGeo = new THREE.CylinderGeometry(0.52, 0.62, 1.1, 8);
  const torso = new THREE.Mesh(torsoGeo, darkObsidianMat);
  torso.position.y = 1.6;
  torso.castShadow = true;
  root.add(torso);

  // 3. Hooded Head
  const headGeo = new THREE.SphereGeometry(0.42, 10, 8);
  headGeo.scale(1, 1.1, 1.2);
  const head = new THREE.Mesh(headGeo, shadowCloakMat);
  head.position.set(0, 2.35, 0);
  head.castShadow = true;
  root.add(head);

  // 4. Glowing Dark Eyes
  const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), eyeMat);
  eyeLeft.position.set(-0.16, 2.4, 0.45);
  root.add(eyeLeft);

  const eyeRight = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), eyeMat);
  eyeRight.position.set(0.16, 2.4, 0.45);
  root.add(eyeRight);

  // 5. Crown of the Dark King (spiked obsidian coronet)
  const crownGroup = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 4), darkObsidianMat);
    spike.position.set(Math.cos(angle) * 0.38, 2.85, Math.sin(angle) * 0.38);
    crownGroup.add(spike);
  }
  // Central dark jewel
  const jewel = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12, 0), purpleGlowMat);
  jewel.position.set(0, 2.8, 0.38);
  crownGroup.add(jewel);
  root.add(crownGroup);

  // 6. Recurve Greatbow (Fighting Style: Arrow)
  const bowGroup = new THREE.Group();
  // Bow curve using curved tube or segments
  const bowCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -1.2, 0.2),
    new THREE.Vector3(0.1, -0.6, 0.5),
    new THREE.Vector3(0.15, 0, 0.6),
    new THREE.Vector3(0.1, 0.6, 0.5),
    new THREE.Vector3(0, 1.2, 0.2),
  ]);
  const bowMesh = new THREE.Mesh(new THREE.TubeGeometry(bowCurve, 16, 0.05, 8, false), darkObsidianMat);
  bowMesh.castShadow = true;
  bowGroup.add(bowMesh);

  // Bowstring
  const stringGeo = new THREE.CylinderGeometry(0.01, 0.01, 2.38, 4);
  const stringMesh = new THREE.Mesh(stringGeo, new THREE.MeshBasicMaterial({ color: 0xa855f7 }));
  stringMesh.position.set(0, 0, 0.2);
  bowGroup.add(stringMesh);

  // Bow crystal
  const bowCrystal = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14, 0), purpleGlowMat);
  bowCrystal.position.set(0.15, 0, 0.6);
  bowGroup.add(bowCrystal);

  bowGroup.position.set(-0.75, 1.5, 0.4);
  bowGroup.rotation.y = -0.3;
  root.add(bowGroup);

  // 7. Quiver on back with fletched arrows
  const quiverGeo = new THREE.CylinderGeometry(0.14, 0.1, 1.0, 8);
  const quiver = new THREE.Mesh(quiverGeo, darkObsidianMat);
  quiver.position.set(0.35, 1.6, -0.4);
  quiver.rotation.z = -0.4;
  root.add(quiver);

  // Arrows sticking out
  for (let k = 0; k < 3; k++) {
    const arrowShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.7, 4), darkObsidianMat);
    arrowShaft.position.set(0.35 + (k - 1) * 0.06, 2.0 + k * 0.05, -0.4);
    arrowShaft.rotation.z = -0.4;
    root.add(arrowShaft);

    const fletch = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.15, 4), purpleGlowMat);
    fletch.position.set(0.35 + (k - 1) * 0.06, 2.3 + k * 0.05, -0.4);
    fletch.rotation.z = -0.4;
    root.add(fletch);
  }

  // Soft purple boss ambient glow light
  const darkLight = new THREE.PointLight(0xa855f7, 2.2, 9);
  darkLight.position.set(0, 2.0, 0.5);
  root.add(darkLight);

  root.userData = { body: cloak, head, bowGroup, darkLight };
  return root;
}

/** Wave 7 Final Boss: Last of King (Fighting Style: Fighter) */
export function createLastOfKingBoss(): THREE.Group {
  const root = new THREE.Group();

  // Contact shadow
  const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), sharedMaterials.contactShadow);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.03;
  root.add(shadowMesh);

  // Materials for Last of King
  const goldArmorMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.25,
    metalness: 0.85,
  });
  const ironTrimMat = new THREE.MeshStandardMaterial({
    color: 0x451a03,
    roughness: 0.5,
    metalness: 0.5,
  });
  const moltenCoreMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xd97706,
    emissiveIntensity: 1.2,
    roughness: 0.3,
  });
  const redCapeMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b,
    roughness: 0.8,
    metalness: 0.1,
  });
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.9,
    roughness: 0.2,
    metalness: 0.8,
  });

  // 1. Royal Cape
  const capeGeo = new THREE.PlaneGeometry(1.8, 2.4);
  const cape = new THREE.Mesh(capeGeo, redCapeMat);
  cape.position.set(0, 1.4, -0.6);
  cape.rotation.x = 0.15;
  root.add(cape);

  // 2. Colossal Armored Torso with Lion/Dragon Crest
  const torsoGeo = new THREE.CylinderGeometry(0.75, 0.85, 1.5, 10);
  const torso = new THREE.Mesh(torsoGeo, goldArmorMat);
  torso.position.y = 1.6;
  torso.castShadow = true;
  root.add(torso);

  // Glowing molten chest emblem
  const emblem = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 0), moltenCoreMat);
  emblem.position.set(0, 1.7, 0.75);
  root.add(emblem);

  // 3. Spiked Horned Battle Helm / Head
  const helmGeo = new THREE.DodecahedronGeometry(0.55, 1);
  const helm = new THREE.Mesh(helmGeo, goldArmorMat);
  helm.position.set(0, 2.7, 0.1);
  helm.castShadow = true;
  root.add(helm);

  // Blazing battle eyes
  const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff3b00 }));
  eyeLeft.position.set(-0.2, 2.75, 0.6);
  root.add(eyeLeft);

  const eyeRight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff3b00 }));
  eyeRight.position.set(0.2, 2.75, 0.6);
  root.add(eyeRight);

  // Horns of the Last King
  const hornLeft = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.7, 6), ironTrimMat);
  hornLeft.position.set(-0.48, 3.2, 0.1);
  hornLeft.rotation.z = 0.5;
  root.add(hornLeft);

  const hornRight = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.7, 6), ironTrimMat);
  hornRight.position.set(0.48, 3.2, 0.1);
  hornRight.rotation.z = -0.5;
  root.add(hornRight);

  // 4. Massive Pauldrons
  const leftPaul = new THREE.Mesh(new THREE.DodecahedronGeometry(0.48, 0), goldArmorMat);
  leftPaul.position.set(-1.25, 2.2, 0.1);
  root.add(leftPaul);

  const rightPaul = new THREE.Mesh(new THREE.DodecahedronGeometry(0.48, 0), goldArmorMat);
  rightPaul.position.set(1.25, 2.2, 0.1);
  root.add(rightPaul);

  // 5. Dual Blazing Cleavers (Fighting Style: Fighter)
  const leftWeapon = new THREE.Group();
  const axeHandleL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6), ironTrimMat);
  axeHandleL.position.y = 0.5;
  leftWeapon.add(axeHandleL);

  const bladeL = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.06), bladeMat);
  bladeL.position.set(0.35, 0.8, 0);
  leftWeapon.add(bladeL);

  leftWeapon.position.set(-1.3, 1.1, 0.4);
  leftWeapon.rotation.x = 0.4;
  root.add(leftWeapon);

  const rightWeapon = new THREE.Group();
  const axeHandleR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6), ironTrimMat);
  axeHandleR.position.y = 0.5;
  rightWeapon.add(axeHandleR);

  const bladeR = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.06), bladeMat);
  bladeR.position.set(0.35, 0.8, 0);
  rightWeapon.add(bladeR);

  rightWeapon.position.set(1.3, 1.1, 0.4);
  rightWeapon.rotation.x = 0.4;
  root.add(rightWeapon);

  // Sturdy greaves
  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.9, 8), ironTrimMat);
  legL.position.set(-0.55, 0.45, 0);
  root.add(legL);

  const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.9, 8), ironTrimMat);
  legR.position.set(0.55, 0.45, 0);
  root.add(legR);

  // Molten warrior light
  const warLight = new THREE.PointLight(0xff5500, 2.6, 9);
  warLight.position.set(0, 1.8, 0.9);
  root.add(warLight);

  root.userData = { body: torso, head: helm, leftWeapon, rightWeapon, warLight };
  return root;
}

/** Dark of King's Dark Shadow Arrow Projectile */
export function createDarkArrowMesh(): THREE.Group {
  const root = new THREE.Group();
  const shaftGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6);
  const shaftMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4 });
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  shaft.rotation.x = Math.PI / 2;
  root.add(shaft);

  const headGeo = new THREE.ConeGeometry(0.12, 0.35, 5);
  const headMat = new THREE.MeshBasicMaterial({ color: 0xc084fc });
  const head = new THREE.Mesh(headGeo, headMat);
  head.rotation.x = -Math.PI / 2;
  head.position.z = 0.65;
  root.add(head);

  const light = new THREE.PointLight(0xa855f7, 1.5, 4);
  light.position.z = 0.5;
  root.add(light);

  return root;
}

/** Last of King's Fighter Slash Wave Projectile */
export function createFighterSlashMesh(): THREE.Group {
  const root = new THREE.Group();
  const curveGeo = new THREE.TorusGeometry(1.2, 0.1, 8, 20, Math.PI * 0.8);
  const curveMat = new THREE.MeshBasicMaterial({ color: 0xff3b00, side: THREE.DoubleSide });
  const slash = new THREE.Mesh(curveGeo, curveMat);
  slash.rotation.x = Math.PI / 2;
  root.add(slash);

  const light = new THREE.PointLight(0xff4500, 2.0, 5);
  root.add(light);

  return root;
}

/** Wave 9 Boss: Phantom King of Brie (Spectral Mage Style) */
export function createPhantomKingBoss(): THREE.Group {
  const root = new THREE.Group();
  const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.0), sharedMaterials.contactShadow);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.03;
  root.add(shadowMesh);

  const phantomMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.8,
    roughness: 0.2,
    transparent: true,
    opacity: 0.9,
  });
  const spectralCrownMat = new THREE.MeshStandardMaterial({
    color: 0xa855f7,
    emissive: 0x9333ea,
    emissiveIntensity: 1.2,
    roughness: 0.1,
  });

  // Floating ghostly shroud
  const bodyGeo = new THREE.ConeGeometry(0.8, 2.2, 10, 1, true);
  const body = new THREE.Mesh(bodyGeo, phantomMat);
  body.position.y = 1.6;
  root.add(body);

  // Levitating skull / core
  const headGeo = new THREE.DodecahedronGeometry(0.5, 1);
  const head = new THREE.Mesh(headGeo, phantomMat);
  head.position.set(0, 2.7, 0);
  root.add(head);

  // Floating Spired Crown
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 4), spectralCrownMat);
    spike.position.set(Math.cos(angle) * 0.45, 3.25, Math.sin(angle) * 0.45);
    root.add(spike);
  }

  // Floating spectral spirit orbs rotating
  const orbsGroup = new THREE.Group();
  for (let j = 0; j < 3; j++) {
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), spectralCrownMat);
    const angle = (j * Math.PI * 2) / 3;
    orb.position.set(Math.cos(angle) * 1.5, 2.0, Math.sin(angle) * 1.5);
    orbsGroup.add(orb);
  }
  root.add(orbsGroup);

  const light = new THREE.PointLight(0x38bdf8, 2.5, 10);
  light.position.set(0, 2.2, 0.4);
  root.add(light);

  root.userData = { body, head, orbsGroup, light };
  return root;
}

/** Wave 11 Boss: Iron Cheddar King (Juggernaut Fighter) */
export function createIronKingBoss(): THREE.Group {
  const root = new THREE.Group();
  const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), sharedMaterials.contactShadow);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.03;
  root.add(shadowMesh);

  const ironMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.3 });
  const copperTrim = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.7, roughness: 0.4 });
  const glowingCoreMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

  // Heavy armored cylinder body
  const bodyGeo = new THREE.CylinderGeometry(0.9, 1.1, 1.8, 8);
  const body = new THREE.Mesh(bodyGeo, ironMat);
  body.position.y = 1.7;
  body.castShadow = true;
  root.add(body);

  // Helm with heavy iron horns
  const helmGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
  const helm = new THREE.Mesh(helmGeo, ironMat);
  helm.position.set(0, 2.85, 0.1);
  root.add(helm);

  // Iron horns
  const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.8, 6), copperTrim);
  hornL.position.set(-0.65, 3.3, 0);
  hornL.rotation.z = 0.6;
  root.add(hornL);

  const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.8, 6), copperTrim);
  hornR.position.set(0.65, 3.3, 0);
  hornR.rotation.z = -0.6;
  root.add(hornR);

  // Visor slit
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.1), glowingCoreMat);
  visor.position.set(0, 2.85, 0.58);
  root.add(visor);

  // Giant Tower Shield on left
  const shieldGeo = new THREE.BoxGeometry(0.3, 1.8, 1.0);
  const shield = new THREE.Mesh(shieldGeo, ironMat);
  shield.position.set(-1.3, 1.6, 0.4);
  root.add(shield);

  // Heavy Iron Mace on right
  const maceGroup = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.6, 6), copperTrim);
  shaft.position.y = 0.5;
  maceGroup.add(shaft);
  const maceHead = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4, 0), ironMat);
  maceHead.position.y = 1.3;
  maceGroup.add(maceHead);
  maceGroup.position.set(1.3, 1.1, 0.3);
  root.add(maceGroup);

  const light = new THREE.PointLight(0xf59e0b, 2.2, 8);
  light.position.set(0, 2.0, 0.7);
  root.add(light);

  root.userData = { body, head: helm, shield, maceGroup, light };
  return root;
}

/** Wave 13 Boss: Shadow Gorgonzola King (Shadow Assassin Arrow Style) */
export function createShadowGorgonzolaKingBoss(): THREE.Group {
  const root = new THREE.Group();
  const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), sharedMaterials.contactShadow);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.03;
  root.add(shadowMesh);

  const venomMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.5 });
  const toxinMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
  const darkLeather = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });

  // Assassin cloak
  const cloak = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.0, 8), venomMat);
  cloak.position.y = 1.4;
  cloak.castShadow = true;
  root.add(cloak);

  // Masked head with glowing green eyes
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), darkLeather);
  head.position.set(0, 2.45, 0.1);
  root.add(head);

  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), toxinMat);
  eyeL.position.set(-0.16, 2.5, 0.48);
  root.add(eyeL);

  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), toxinMat);
  eyeR.position.set(0.16, 2.5, 0.48);
  root.add(eyeR);

  // Twin Poisoned Greatbows
  const bowGroup = new THREE.Group();
  const bowMesh = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.05, 6, 16, Math.PI), venomMat);
  bowMesh.rotation.z = Math.PI / 2;
  bowGroup.add(bowMesh);
  bowGroup.position.set(-0.9, 1.6, 0.4);
  root.add(bowGroup);

  const light = new THREE.PointLight(0x10b981, 2.4, 9);
  light.position.set(0, 2.0, 0.5);
  root.add(light);

  root.userData = { body: cloak, head, bowGroup, light };
  return root;
}

/** Wave 15 Boss: Emperor Roquefort (Plague Spore Sovereign) */
export function createRoquefortEmperorBoss(): THREE.Group {
  const root = new THREE.Group();
  const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 3.5), sharedMaterials.contactShadow);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.03;
  root.add(shadowMesh);

  const roquefortMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a5f,
    emissive: 0x1d4ed8,
    emissiveIntensity: 0.5,
    roughness: 0.6,
  });
  const veinMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
  const crownMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.8, roughness: 0.2 });

  // Regal layered bell robe
  const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.2, 1.8, 10), roquefortMat);
  robe.position.y = 1.45;
  robe.castShadow = true;
  root.add(robe);

  // Marbled blue cheese veins
  for (let v = 0; v < 4; v++) {
    const angle = (v * Math.PI) / 2;
    const vein = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 4), veinMat);
    vein.position.set(Math.cos(angle) * 0.75, 1.4, Math.sin(angle) * 0.75);
    vein.rotation.z = 0.2 * (v % 2 === 0 ? 1 : -1);
    root.add(vein);
  }

  // Fungal King Crown
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), roquefortMat);
  head.position.set(0, 2.55, 0);
  root.add(head);

  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.45, 0.35, 6), crownMat);
  crown.position.set(0, 2.9, 0);
  root.add(crown);

  // Pestilence Scepter
  const scepterGroup = new THREE.Group();
  const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6), crownMat);
  scepterGroup.add(staff);
  const sporeOrb = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 0), veinMat);
  sporeOrb.position.y = 1.1;
  scepterGroup.add(sporeOrb);
  scepterGroup.position.set(1.1, 1.4, 0.4);
  root.add(scepterGroup);

  const light = new THREE.PointLight(0x06b6d4, 2.6, 9);
  light.position.set(0, 2.2, 0.6);
  root.add(light);

  root.userData = { body: robe, head, scepterGroup, light };
  return root;
}

/** Wave 17 Boss: Parmesan Warlord King (Seismic Titan) */
export function createParmesanWarlordBoss(): THREE.Group {
  const root = new THREE.Group();
  const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 4.0), sharedMaterials.contactShadow);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.03;
  root.add(shadowMesh);

  const rockParmesanMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.9,
    metalness: 0.1,
  });
  const magmaMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
  const goldSpikeMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.6, roughness: 0.3 });

  // Titanic rugged torso
  const torso = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 0), rockParmesanMat);
  torso.position.y = 1.8;
  torso.castShadow = true;
  root.add(torso);

  // Magma fissures
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 6), magmaMat);
  core.position.set(0, 1.8, 0.8);
  root.add(core);

  // Head with giant jagged crown horn
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), rockParmesanMat);
  head.position.set(0, 3.0, 0);
  root.add(head);

  const crownHorn = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.9, 5), goldSpikeMat);
  crownHorn.position.set(0, 3.7, 0);
  root.add(crownHorn);

  // Dual Seismic War Hammers
  const leftHammer = new THREE.Group();
  const hShaftL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 6), rockParmesanMat);
  leftHammer.add(hShaftL);
  const hHeadL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.5), magmaMat);
  hHeadL.position.y = 0.8;
  leftHammer.add(hHeadL);
  leftHammer.position.set(-1.5, 1.4, 0.4);
  root.add(leftHammer);

  const rightHammer = leftHammer.clone();
  rightHammer.position.set(1.5, 1.4, 0.4);
  root.add(rightHammer);

  const light = new THREE.PointLight(0xf97316, 2.8, 10);
  light.position.set(0, 2.2, 0.8);
  root.add(light);

  root.userData = { body: torso, head, leftHammer, rightHammer, light };
  return root;
}

/** Wave 20 Final Boss: Supreme Sovereign King (Omni King of All Cheeses) */
export function createSupremeOverlordKingBoss(): THREE.Group {
  const root = new THREE.Group();
  const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 4.8), sharedMaterials.contactShadow);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.03;
  root.add(shadowMesh);

  // Brilliant Celestial Materials
  const supremeGoldMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.9,
    metalness: 0.9,
    roughness: 0.15,
  });
  const iridescentCapeMat = new THREE.MeshStandardMaterial({
    color: 0x7c3aed,
    emissive: 0x4f46e5,
    emissiveIntensity: 0.7,
    roughness: 0.4,
  });
  const starCoreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  // Royal Emperor Cape
  const cape = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.2), iridescentCapeMat);
  cape.position.set(0, 1.8, -0.8);
  cape.rotation.x = 0.2;
  root.add(cape);

  // Supreme Gilded Plate Armor Torso
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.15, 2.0, 12), supremeGoldMat);
  torso.position.y = 1.9;
  torso.castShadow = true;
  root.add(torso);

  // Star Emblem Heart
  const starHeart = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 0), starCoreMat);
  starHeart.position.set(0, 2.1, 0.95);
  root.add(starHeart);

  // Crowned Head
  const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65, 1), supremeGoldMat);
  head.position.set(0, 3.2, 0.1);
  root.add(head);

  // Quadruple Floating Solar Arcane Halo Ring
  const haloGroup = new THREE.Group();
  const haloRing = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.08, 8, 32), supremeGoldMat);
  haloGroup.add(haloRing);
  for (let k = 0; k < 8; k++) {
    const angle = (k * Math.PI * 2) / 8;
    const ray = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.5, 4), supremeGoldMat);
    ray.position.set(Math.cos(angle) * 1.8, Math.sin(angle) * 1.8, 0);
    ray.rotation.z = angle - Math.PI / 2;
    haloGroup.add(ray);
  }
  haloGroup.position.set(0, 3.4, -0.2);
  root.add(haloGroup);

  // Dual Sovereign Weapons: Greatblade + Scepter
  const bladeGroup = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.4, 0.08), supremeGoldMat);
  blade.position.y = 1.0;
  bladeGroup.add(blade);
  bladeGroup.position.set(-1.6, 1.5, 0.5);
  bladeGroup.rotation.z = -0.3;
  root.add(bladeGroup);

  const scepterGroup = new THREE.Group();
  const scH = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8), supremeGoldMat);
  scepterGroup.add(scH);
  const scStar = new THREE.Mesh(new THREE.OctahedronGeometry(0.4, 0), starCoreMat);
  scStar.position.y = 1.2;
  scepterGroup.add(scStar);
  scepterGroup.position.set(1.6, 1.5, 0.5);
  scepterGroup.rotation.z = 0.3;
  root.add(scepterGroup);

  // Radiant Supreme Light
  const supremeLight = new THREE.PointLight(0xfef08a, 3.5, 14);
  supremeLight.position.set(0, 2.5, 1.0);
  root.add(supremeLight);

  root.userData = { body: torso, head, haloGroup, bladeGroup, scepterGroup, supremeLight };
  return root;
}

/** Projectile: Phantom Spirit Orb */
export function createPhantomOrbMesh(): THREE.Group {
  const root = new THREE.Group();
  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 10, 10),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.4,
    })
  );
  root.add(orb);
  const light = new THREE.PointLight(0x38bdf8, 2.0, 5);
  root.add(light);
  return root;
}

/** Projectile: Sovereign Solar Beam Orb */
export function createSovereignBeamMesh(): THREE.Group {
  const root = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.45, 0),
    new THREE.MeshStandardMaterial({
      color: 0xfde047,
      emissive: 0xf59e0b,
      emissiveIntensity: 2.0,
    })
  );
  root.add(core);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.65, 0.05, 6, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  ring.rotation.x = Math.PI / 2;
  root.add(ring);
  const light = new THREE.PointLight(0xfacc15, 2.8, 6);
  root.add(light);
  return root;
}

/** Playable Character 1: Baldan (Fighting Style: Arrow) */
export function createBaldanHero(): THREE.Group {
  const root = new THREE.Group();

  // Contact shadow
  const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), sharedMaterials.contactShadow);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  root.add(shadowMesh);

  // Materials
  const tunicMat = new THREE.MeshStandardMaterial({
    color: 0x166534, // Forest ranger green
    roughness: 0.6,
  });
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.7,
  });
  const furMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d8,
    roughness: 0.9,
  });
  const earInnerMat = new THREE.MeshBasicMaterial({ color: 0xfda4af });
  const goldCheeseMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.5,
    roughness: 0.3,
  });
  const bowMat = new THREE.MeshStandardMaterial({
    color: 0x92400e,
    roughness: 0.4,
  });

  // 1. Tunic Body
  const bodyGeo = new THREE.ConeGeometry(0.5, 1.15, 8);
  const tunic = new THREE.Mesh(bodyGeo, tunicMat);
  tunic.position.y = 0.6;
  tunic.castShadow = true;
  root.add(tunic);

  // Leather belt
  const beltGeo = new THREE.CylinderGeometry(0.42, 0.45, 0.12, 8);
  const belt = new THREE.Mesh(beltGeo, leatherMat);
  belt.position.y = 0.45;
  root.add(belt);

  // Golden cheese buckle
  const buckleGeo = new THREE.BoxGeometry(0.12, 0.12, 0.08);
  const buckle = new THREE.Mesh(buckleGeo, goldCheeseMat);
  buckle.position.set(0, 0.45, 0.43);
  root.add(buckle);

  // 2. Head with ranger hood
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.25, 0);

  const headGeo = new THREE.SphereGeometry(0.35, 10, 8);
  headGeo.scale(1, 1, 1.15);
  const head = new THREE.Mesh(headGeo, furMat);
  head.castShadow = true;
  headGroup.add(head);

  // Ranger cap / hood
  const capGeo = new THREE.ConeGeometry(0.38, 0.5, 8);
  const cap = new THREE.Mesh(capGeo, tunicMat);
  cap.rotation.x = -0.3;
  cap.position.set(0, 0.25, -0.05);
  headGroup.add(cap);

  // Archer's golden feather
  const featherGeo = new THREE.ConeGeometry(0.06, 0.4, 4);
  const feather = new THREE.Mesh(featherGeo, goldCheeseMat);
  feather.position.set(-0.25, 0.45, -0.1);
  feather.rotation.z = -0.5;
  headGroup.add(feather);

  // Mouse ears
  const earGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.04, 12);
  const earL = new THREE.Mesh(earGeo, furMat);
  earL.rotation.z = Math.PI / 2;
  earL.position.set(-0.35, 0.22, 0.05);
  headGroup.add(earL);

  const earInnerL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.045, 10), earInnerMat);
  earInnerL.rotation.z = Math.PI / 2;
  earInnerL.position.set(-0.355, 0.22, 0.05);
  headGroup.add(earInnerL);

  const earR = new THREE.Mesh(earGeo, furMat);
  earR.rotation.z = Math.PI / 2;
  earR.position.set(0.35, 0.22, 0.05);
  headGroup.add(earR);

  const earInnerR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.045, 10), earInnerMat);
  earInnerR.rotation.z = Math.PI / 2;
  earInnerR.position.set(0.355, 0.22, 0.05);
  headGroup.add(earInnerR);

  // Eyes
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), new THREE.MeshBasicMaterial({ color: 0x15803d }));
  eyeL.position.set(-0.14, 0.08, 0.36);
  headGroup.add(eyeL);

  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), new THREE.MeshBasicMaterial({ color: 0x15803d }));
  eyeR.position.set(0.14, 0.08, 0.36);
  headGroup.add(eyeR);

  // Whiskers
  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 6), furMat);
  snout.rotation.x = Math.PI / 2;
  snout.position.set(0, -0.02, 0.42);
  headGroup.add(snout);

  root.add(headGroup);

  // 3. Recurve Bow in left hand
  const bowGroup = new THREE.Group();
  const bowCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.6, 0.1),
    new THREE.Vector3(0.05, -0.3, 0.25),
    new THREE.Vector3(0.08, 0, 0.3),
    new THREE.Vector3(0.05, 0.3, 0.25),
    new THREE.Vector3(0, 0.6, 0.1),
  ]);
  const bowMesh = new THREE.Mesh(new THREE.TubeGeometry(bowCurve, 12, 0.035, 6, false), bowMat);
  bowMesh.castShadow = true;
  bowGroup.add(bowMesh);

  // Bowstring
  const stringMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 1.2, 4),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  stringMesh.position.set(0, 0, 0.1);
  bowGroup.add(stringMesh);

  // Bow crystal
  const bowGem = new THREE.Mesh(new THREE.DodecahedronGeometry(0.08, 0), goldCheeseMat);
  bowGem.position.set(0.08, 0, 0.3);
  bowGroup.add(bowGem);

  bowGroup.position.set(-0.45, 0.85, 0.3);
  bowGroup.rotation.y = -0.2;
  root.add(bowGroup);

  // 4. Back Quiver with arrows
  const quiverGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.7, 8);
  const quiver = new THREE.Mesh(quiverGeo, leatherMat);
  quiver.position.set(0.25, 0.85, -0.3);
  quiver.rotation.z = -0.35;
  root.add(quiver);

  for (let a = 0; a < 3; a++) {
    const fletch = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 4), goldCheeseMat);
    fletch.position.set(0.25 + (a - 1) * 0.05, 1.25, -0.3);
    fletch.rotation.z = -0.35;
    root.add(fletch);
  }

  // Soft emerald / gold glow
  const rangerLight = new THREE.PointLight(0x22c55e, 1.5, 5);
  rangerLight.position.set(0, 1.0, 0.4);
  root.add(rangerLight);

  root.userData = { body: tunic, head: headGroup, bowGroup, tunicMat, bowMat, goldCheeseMat, rangerLight };
  return root;
}

/** Playable Character 2: Nomio (Fighting Style: Fighter) */
export function createNomioHero(): THREE.Group {
  const root = new THREE.Group();

  // Contact shadow
  const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), sharedMaterials.contactShadow);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  root.add(shadowMesh);

  // Materials
  const giMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b, // Crimson warrior gi
    roughness: 0.6,
  });
  const skinFurMat = new THREE.MeshStandardMaterial({
    color: 0xca8a04, // Golden buff cheese fur
    roughness: 0.8,
  });
  const wrapMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a, // Combat hand wraps
    roughness: 0.5,
  });
  const gauntletMat = new THREE.MeshStandardMaterial({
    color: 0xf97316, // Spiked sharp cheddar brawler fist
    roughness: 0.35,
    metalness: 0.2,
    emissive: 0xd97706,
    emissiveIntensity: 0.4,
  });
  const blackBeltMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.5,
  });
  const headbandMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

  // 1. Muscular Torso & Vest
  const torsoGeo = new THREE.CylinderGeometry(0.5, 0.42, 0.95, 8);
  const torso = new THREE.Mesh(torsoGeo, skinFurMat);
  torso.position.y = 0.65;
  torso.castShadow = true;
  root.add(torso);

  // Open Gi vest
  const vestGeo = new THREE.CylinderGeometry(0.53, 0.45, 0.9, 8, 1, true, -Math.PI * 0.7, Math.PI * 1.4);
  const vest = new THREE.Mesh(vestGeo, giMat);
  vest.position.y = 0.65;
  vest.material.side = THREE.DoubleSide;
  root.add(vest);

  // Black belt / martial sash
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.14, 8), blackBeltMat);
  belt.position.y = 0.38;
  root.add(belt);

  // 2. Head with red battle headband
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.25, 0);

  const headGeo = new THREE.DodecahedronGeometry(0.38, 1);
  const head = new THREE.Mesh(headGeo, skinFurMat);
  head.castShadow = true;
  headGroup.add(head);

  // Red headband
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.1, 10), headbandMat);
  band.position.y = 0.1;
  headGroup.add(band);

  // Headband tails trailing behind
  const tailGeo = new THREE.BoxGeometry(0.08, 0.4, 0.02);
  const tail = new THREE.Mesh(tailGeo, headbandMat);
  tail.position.set(0, 0.05, -0.42);
  tail.rotation.x = -0.4;
  headGroup.add(tail);

  // Ears with bandages
  const earGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.05, 10);
  const earL = new THREE.Mesh(earGeo, skinFurMat);
  earL.rotation.z = Math.PI / 2;
  earL.position.set(-0.38, 0.25, 0);
  headGroup.add(earL);

  const earR = new THREE.Mesh(earGeo, skinFurMat);
  earR.rotation.z = Math.PI / 2;
  earR.position.set(0.38, 0.25, 0);
  headGroup.add(earR);

  // Fierce eyes
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff3b00 }));
  eyeL.position.set(-0.16, 0.06, 0.35);
  headGroup.add(eyeL);

  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff3b00 }));
  eyeR.position.set(0.16, 0.06, 0.35);
  headGroup.add(eyeR);

  root.add(headGroup);

  // 3. Heavy Boxing / Brawler Cheddar Fists
  const fistGeo = new THREE.DodecahedronGeometry(0.28, 0);
  const spikeGeo = new THREE.ConeGeometry(0.07, 0.18, 4);

  // Left Fist (Raised in boxing guard)
  const leftFistGroup = new THREE.Group();
  const leftFist = new THREE.Mesh(fistGeo, gauntletMat);
  leftFist.castShadow = true;
  leftFistGroup.add(leftFist);

  // Spikes on knuckles
  for (let s = -1; s <= 1; s++) {
    const spike = new THREE.Mesh(spikeGeo, wrapMat);
    spike.position.set(s * 0.12, 0.08, 0.22);
    spike.rotation.x = Math.PI / 2;
    leftFistGroup.add(spike);
  }

  leftFistGroup.position.set(-0.55, 0.85, 0.55);
  root.add(leftFistGroup);

  // Right Fist (Cocked back ready to punch)
  const rightFistGroup = new THREE.Group();
  const rightFist = new THREE.Mesh(fistGeo, gauntletMat);
  rightFist.castShadow = true;
  rightFistGroup.add(rightFist);

  for (let s = -1; s <= 1; s++) {
    const spike = new THREE.Mesh(spikeGeo, wrapMat);
    spike.position.set(s * 0.12, 0.08, 0.22);
    spike.rotation.x = Math.PI / 2;
    rightFistGroup.add(spike);
  }

  rightFistGroup.position.set(0.55, 0.75, 0.45);
  root.add(rightFistGroup);

  // 4. Sturdy Combat Stance Legs
  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.4, 6), giMat);
  legL.position.set(-0.25, 0.2, 0.05);
  root.add(legL);

  const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.4, 6), giMat);
  legR.position.set(0.25, 0.2, -0.05);
  root.add(legR);

  // Fighter's burning passion light
  const warriorLight = new THREE.PointLight(0xff5500, 2.0, 6);
  warriorLight.position.set(0, 0.9, 0.6);
  root.add(warriorLight);

  root.userData = {
    body: torso,
    head: headGroup,
    leftFist: leftFistGroup,
    rightFist: rightFistGroup,
    warriorLight,
    giMat,
    headbandMat,
    wrapMat,
    gauntletMat,
  };
  return root;
}

/** Baldan's Standard Arrow Projectile */
export function createBaldanArrowMesh(): THREE.Group {
  const root = new THREE.Group();
  const shaftGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.1, 4);
  const shaftMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.5 });
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  shaft.rotation.x = Math.PI / 2;
  root.add(shaft);

  const tipGeo = new THREE.ConeGeometry(0.09, 0.28, 4);
  const tipMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  const tip = new THREE.Mesh(tipGeo, tipMat);
  tip.rotation.x = -Math.PI / 2;
  tip.position.z = 0.6;
  root.add(tip);

  const light = new THREE.PointLight(0x22c55e, 1.2, 4);
  light.position.z = 0.4;
  root.add(light);

  return root;
}

/** Baldan's Fire Burn Arrow Projectile */
export function createBaldanFireArrowMesh(): THREE.Group {
  const root = new THREE.Group();
  const shaftGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.2, 4);
  const shaftMat = new THREE.MeshStandardMaterial({ color: 0x451a03 });
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  shaft.rotation.x = Math.PI / 2;
  root.add(shaft);

  // Blazing tip
  const tipGeo = new THREE.ConeGeometry(0.14, 0.38, 5);
  const tipMat = new THREE.MeshBasicMaterial({ color: 0xff3b00 });
  const tip = new THREE.Mesh(tipGeo, tipMat);
  tip.rotation.x = -Math.PI / 2;
  tip.position.z = 0.65;
  root.add(tip);

  const flameOrb = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
  flameOrb.position.z = 0.5;
  root.add(flameOrb);

  const light = new THREE.PointLight(0xff4500, 2.2, 6);
  light.position.z = 0.5;
  root.add(light);

  return root;
}

/** Baldan's Big Big Arrow Projectile (Damage 100) */
export function createBaldanBigArrowMesh(): THREE.Group {
  const root = new THREE.Group();

  // Colossal 2.4m glowing titanic arrow
  const shaftGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.4, 8);
  const shaftMat = new THREE.MeshStandardMaterial({
    color: 0x166534,
    emissive: 0x22c55e,
    emissiveIntensity: 0.8,
  });
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  shaft.rotation.x = Math.PI / 2;
  root.add(shaft);

  // Giant glowing arrowhead
  const tipGeo = new THREE.ConeGeometry(0.35, 0.8, 6);
  const tipMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const tip = new THREE.Mesh(tipGeo, tipMat);
  tip.rotation.x = -Math.PI / 2;
  tip.position.z = 1.4;
  root.add(tip);

  // Energy rings surrounding the big big arrow
  for (let r = 0; r < 3; r++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.3 + r * 0.08, 0.03, 6, 16),
      new THREE.MeshBasicMaterial({ color: 0x4ade80 })
    );
    ring.position.z = 0.3 + r * 0.4;
    root.add(ring);
  }

  const light = new THREE.PointLight(0x22c55e, 3.5, 9);
  light.position.z = 1.0;
  root.add(light);

  return root;
}

/** Nomio's Sonic Punch Wave Projectile */
export function createNomioPunchWaveMesh(): THREE.Group {
  const root = new THREE.Group();

  // Golden glowing fist shockwave arc
  const arcGeo = new THREE.TorusGeometry(0.8, 0.12, 8, 16, Math.PI * 0.7);
  const arcMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide });
  const arc = new THREE.Mesh(arcGeo, arcMat);
  arc.rotation.x = Math.PI / 2;
  root.add(arc);

  const fistCore = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.25, 0),
    new THREE.MeshBasicMaterial({ color: 0xef4444 })
  );
  fistCore.position.z = 0.2;
  root.add(fistCore);

  const light = new THREE.PointLight(0xf59e0b, 2.0, 5);
  root.add(light);

  return root;
}
