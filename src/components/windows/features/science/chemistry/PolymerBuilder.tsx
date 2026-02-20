import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Beaker, Play, Pause, RotateCcw, Info, Plus, Undo2, Trash2, FlaskConical, Box } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

type PolymerizationType = 'addition' | 'condensation';

interface PolymerData {
  name: string;
  abbreviation: string;
  type: PolymerizationType;
  monomerName: string;
  monomerFormula: string;
  repeatUnitFormula: string;
  monomerMW: number;
  color: string;
  colorLight: string;
  colorBorder: string;
  textColor: string;
  recyclingCode: string;
  meltingPoint: string;
  crystallinity: string;
  classification: string;
  uses: string[];
  properties: string[];
  typeExplanation: string;
  // Additional scientific data
  Tg: string;
  density: string;
  tensileStrength: string;
  bondType: string;
  discoveryYear: number;
  discoveredBy: string;
  annualProduction: string;
  environmentalNote: string;
  // For condensation polymers
  secondMonomer?: string;
  secondMonomerFormula?: string;
  byproduct?: string;
}

// ── Polymer Data ─────────────────────────────────────────────────────────────

const polymers: PolymerData[] = [
  {
    name: 'Polyethylene',
    abbreviation: 'PE',
    type: 'addition',
    monomerName: 'Ethylene',
    monomerFormula: 'CH\u2082=CH\u2082',
    repeatUnitFormula: '-(CH\u2082-CH\u2082)-',
    monomerMW: 28.05,
    color: '#3b82f6',
    colorLight: '#dbeafe',
    colorBorder: '#93c5fd',
    textColor: '#1d4ed8',
    recyclingCode: '\u26722 HDPE / \u26724 LDPE',
    meltingPoint: '115\u2013135 \u00b0C',
    crystallinity: 'Semi-crystalline (45\u201395%)',
    classification: 'Thermoplastic',
    uses: ['Plastic bags', 'Bottles', 'Pipes', 'Food packaging', 'Toys'],
    properties: ['Chemically resistant', 'Lightweight', 'Flexible', 'Low cost'],
    typeExplanation: 'The C=C double bond in ethylene opens up; each carbon forms a new single bond to the next monomer, creating a long saturated chain.',
    Tg: '-125 \u00b0C',
    density: '0.91\u20130.97 g/cm\u00b3',
    tensileStrength: '8\u201333 MPa',
    bondType: 'C\u2013C single bonds',
    discoveryYear: 1933,
    discoveredBy: 'Eric Fawcett & Reginald Gibson',
    annualProduction: '~100 million tonnes',
    environmentalNote: 'HDPE/LDPE recyclable but often ends up in oceans.',
  },
  {
    name: 'Polypropylene',
    abbreviation: 'PP',
    type: 'addition',
    monomerName: 'Propylene',
    monomerFormula: 'CH\u2082=CHCH\u2083',
    repeatUnitFormula: '-(CH\u2082-CH(CH\u2083))-',
    monomerMW: 42.08,
    color: '#22c55e',
    colorLight: '#dcfce7',
    colorBorder: '#86efac',
    textColor: '#15803d',
    recyclingCode: '\u26725 PP',
    meltingPoint: '130\u2013171 \u00b0C',
    crystallinity: 'Semi-crystalline (40\u201370%)',
    classification: 'Thermoplastic',
    uses: ['Food containers', 'Automotive parts', 'Textiles', 'Medical devices', 'Carpeting'],
    properties: ['Heat resistant', 'Fatigue resistant', 'Tough', 'Lightweight'],
    typeExplanation: 'Similar to PE, the double bond opens for chain growth. The pendant CH\u2083 group gives PP higher melting point and stiffness than PE.',
    Tg: '-10 \u00b0C',
    density: '0.90\u20130.91 g/cm\u00b3',
    tensileStrength: '31\u201341 MPa',
    bondType: 'C\u2013C single bonds',
    discoveryYear: 1954,
    discoveredBy: 'Giulio Natta',
    annualProduction: '~75 million tonnes',
    environmentalNote: 'Recyclable (#5), lower environmental impact than PS.',
  },
  {
    name: 'Polyvinyl Chloride',
    abbreviation: 'PVC',
    type: 'addition',
    monomerName: 'Vinyl Chloride',
    monomerFormula: 'CH\u2082=CHCl',
    repeatUnitFormula: '-(CH\u2082-CHCl)-',
    monomerMW: 62.50,
    color: '#8b5cf6',
    colorLight: '#ede9fe',
    colorBorder: '#c4b5fd',
    textColor: '#6d28d9',
    recyclingCode: '\u26723 PVC',
    meltingPoint: '100\u2013260 \u00b0C',
    crystallinity: 'Amorphous to semi-crystalline (5\u201315%)',
    classification: 'Thermoplastic',
    uses: ['Pipes & fittings', 'Window frames', 'Flooring', 'Cable insulation', 'Medical tubing'],
    properties: ['Durable', 'Fire resistant', 'Chemical resistant', 'Versatile'],
    typeExplanation: 'Vinyl chloride undergoes free-radical addition polymerization. The Cl atom on every other carbon provides fire resistance and rigidity.',
    Tg: '80 \u00b0C',
    density: '1.30\u20131.45 g/cm\u00b3',
    tensileStrength: '40\u201360 MPa',
    bondType: 'C\u2013C, C\u2013Cl bonds',
    discoveryYear: 1872,
    discoveredBy: 'Eugen Baumann',
    annualProduction: '~45 million tonnes',
    environmentalNote: 'Releases HCl when burned; plasticizers raise health concerns.',
  },
  {
    name: 'Polystyrene',
    abbreviation: 'PS',
    type: 'addition',
    monomerName: 'Styrene',
    monomerFormula: 'CH\u2082=CHC\u2086H\u2085',
    repeatUnitFormula: '-(CH\u2082-CH(C\u2086H\u2085))-',
    monomerMW: 104.15,
    color: '#f97316',
    colorLight: '#fff7ed',
    colorBorder: '#fdba74',
    textColor: '#c2410c',
    recyclingCode: '\u26726 PS',
    meltingPoint: '210\u2013249 \u00b0C (general purpose)',
    crystallinity: 'Amorphous',
    classification: 'Thermoplastic',
    uses: ['Styrofoam cups', 'Packaging peanuts', 'CD cases', 'Disposable cutlery', 'Insulation'],
    properties: ['Rigid', 'Transparent', 'Easy to mold', 'Good insulator'],
    typeExplanation: 'Styrene polymerizes via addition; the bulky phenyl (C\u2086H\u2085) side group makes the polymer rigid and amorphous, hence transparent.',
    Tg: '100 \u00b0C',
    density: '1.04\u20131.09 g/cm\u00b3',
    tensileStrength: '30\u201360 MPa',
    bondType: 'C\u2013C backbone, C\u2013Ph pendant',
    discoveryYear: 1839,
    discoveredBy: 'Eduard Simon',
    annualProduction: '~25 million tonnes',
    environmentalNote: 'Difficult to recycle (#6); EPS (Styrofoam) persists in environment.',
  },
  {
    name: 'Nylon-6,6',
    abbreviation: 'Nylon',
    type: 'condensation',
    monomerName: 'Hexamethylenediamine',
    monomerFormula: 'H\u2082N(CH\u2082)\u2086NH\u2082',
    repeatUnitFormula: '-(NH(CH\u2082)\u2086NHCO(CH\u2082)\u2084CO)-',
    monomerMW: 226.32,
    color: '#14b8a6',
    colorLight: '#ccfbf1',
    colorBorder: '#5eead4',
    textColor: '#0f766e',
    secondMonomer: 'Adipic Acid',
    secondMonomerFormula: 'HOOC(CH\u2082)\u2084COOH',
    byproduct: 'H\u2082O',
    recyclingCode: 'Not commonly recycled',
    meltingPoint: '255\u2013265 \u00b0C',
    crystallinity: 'Semi-crystalline (35\u201345%)',
    classification: 'Thermoplastic',
    uses: ['Stockings & fabrics', 'Gears & bearings', 'Carpet fibers', 'Parachutes', 'Toothbrush bristles'],
    properties: ['Very strong', 'Abrasion resistant', 'Good elasticity', 'High melting point'],
    typeExplanation: 'An amine group (-NH\u2082) reacts with a carboxylic acid group (-COOH), forming an amide bond (-CONH-) and releasing one water molecule per linkage.',
    Tg: '47 \u00b0C',
    density: '1.13\u20131.15 g/cm\u00b3',
    tensileStrength: '70\u201385 MPa',
    bondType: 'Amide bonds (\u2013CONH\u2013)',
    discoveryYear: 1935,
    discoveredBy: 'Wallace Carothers (DuPont)',
    annualProduction: '~8 million tonnes',
    environmentalNote: 'Not commonly recycled; microfiber shedding in wash.',
  },
  {
    name: 'PET (Polyester)',
    abbreviation: 'PET',
    type: 'condensation',
    monomerName: 'Ethylene Glycol',
    monomerFormula: 'HOCH\u2082CH\u2082OH',
    repeatUnitFormula: '-(OCH\u2082CH\u2082OOC-C\u2086H\u2084-CO)-',
    monomerMW: 192.17,
    color: '#ef4444',
    colorLight: '#fef2f2',
    colorBorder: '#fca5a5',
    textColor: '#b91c1c',
    secondMonomer: 'Terephthalic Acid',
    secondMonomerFormula: 'HOOC-C\u2086H\u2084-COOH',
    byproduct: 'H\u2082O',
    recyclingCode: '\u26721 PET / PETE',
    meltingPoint: '250\u2013260 \u00b0C',
    crystallinity: 'Semi-crystalline (30\u201340%)',
    classification: 'Thermoplastic',
    uses: ['Water bottles', 'Polyester clothing', 'Food containers', 'Photographic film', 'Mylar balloons'],
    properties: ['Transparent', 'Strong', 'Barrier to gases', 'Recyclable'],
    typeExplanation: 'A hydroxyl group (-OH) from the glycol reacts with a carboxylic acid (-COOH) from terephthalic acid, forming an ester bond (-COO-) and releasing water.',
    Tg: '67\u201381 \u00b0C',
    density: '1.33\u20131.45 g/cm\u00b3',
    tensileStrength: '55\u201375 MPa',
    bondType: 'Ester bonds (\u2013COO\u2013)',
    discoveryYear: 1941,
    discoveredBy: 'John Rex Whinfield & James Tennant Dickson',
    annualProduction: '~30 million tonnes',
    environmentalNote: 'Most recycled plastic (#1); can be recycled into fiber.',
  },
];

const MAX_MONOMERS = 20;
const CHAIN_SVG_W = 580;
const CHAIN_SVG_H = 280;
const MONOMER_W = 44;
const MONOMER_H = 28;
const ZIGZAG_DY = 16;
const BOND_LEN = 12;
const MONOMERS_PER_ROW = 8;

// ── 3D Monomer Data ─────────────────────────────────────────────────────────

interface Atom3D { pos: [number, number, number]; element: string }

const CPK_COLORS: Record<string, number> = {
  C: 0x555555, H: 0xffffff, O: 0xff2200, N: 0x3050f8, Cl: 0x1ff01f,
};
const ATOM_RADII: Record<string, number> = {
  C: 0.3, H: 0.2, O: 0.28, N: 0.28, Cl: 0.35,
};

const monomer3DData: Record<string, { atoms: Atom3D[]; bonds: [number, number][] }> = {
  PE: {
    atoms: [
      { pos: [0, 0, 0], element: 'C' }, { pos: [1.5, 0, 0], element: 'C' },
      { pos: [-0.5, 0.9, 0.3], element: 'H' }, { pos: [-0.5, -0.9, 0.3], element: 'H' },
      { pos: [2.0, 0.9, -0.3], element: 'H' }, { pos: [2.0, -0.9, -0.3], element: 'H' },
    ],
    bonds: [[0, 1], [0, 2], [0, 3], [1, 4], [1, 5]],
  },
  PP: {
    atoms: [
      { pos: [0, 0, 0], element: 'C' }, { pos: [1.5, 0, 0], element: 'C' },
      { pos: [2.3, 0, 1.3], element: 'C' },
      { pos: [-0.5, 0.9, 0.3], element: 'H' }, { pos: [-0.5, -0.9, 0.3], element: 'H' },
      { pos: [2.0, 0.9, -0.5], element: 'H' },
      { pos: [1.7, -0.5, 1.8], element: 'H' }, { pos: [3.3, 0.2, 1.3], element: 'H' }, { pos: [2.3, 0.9, 1.9], element: 'H' },
    ],
    bonds: [[0, 1], [1, 2], [0, 3], [0, 4], [1, 5], [2, 6], [2, 7], [2, 8]],
  },
  PVC: {
    atoms: [
      { pos: [0, 0, 0], element: 'C' }, { pos: [1.5, 0, 0], element: 'C' },
      { pos: [2.3, 0, 1.5], element: 'Cl' },
      { pos: [-0.5, 0.9, 0.3], element: 'H' }, { pos: [-0.5, -0.9, 0.3], element: 'H' },
      { pos: [2.0, 0.9, -0.5], element: 'H' },
    ],
    bonds: [[0, 1], [1, 2], [0, 3], [0, 4], [1, 5]],
  },
  PS: {
    atoms: [
      { pos: [0, 0, 0], element: 'C' }, { pos: [1.5, 0, 0], element: 'C' },
      { pos: [2.3, 1.2, 0], element: 'C' }, { pos: [3.6, 1.2, 0], element: 'C' },
      { pos: [4.3, 0, 0], element: 'C' }, { pos: [3.6, -1.2, 0], element: 'C' },
      { pos: [2.3, -1.2, 0], element: 'C' },
      { pos: [-0.5, 0.9, 0.4], element: 'H' }, { pos: [-0.5, -0.9, 0.4], element: 'H' },
      { pos: [2.0, 0.5, -0.9], element: 'H' },
      { pos: [1.8, 2.1, 0], element: 'H' }, { pos: [4.1, 2.1, 0], element: 'H' },
      { pos: [5.3, 0, 0], element: 'H' }, { pos: [4.1, -2.1, 0], element: 'H' },
      { pos: [1.8, -2.1, 0], element: 'H' },
    ],
    bonds: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 2], [0, 7], [0, 8], [1, 9], [2, 10], [3, 11], [4, 12], [5, 13], [6, 14]],
  },
  Nylon: {
    atoms: [
      { pos: [0, 0, 0], element: 'C' }, { pos: [1.3, 0, 0], element: 'N' },
      { pos: [1.3, 0.9, 0.4], element: 'H' },
      { pos: [2.4, 0, 0], element: 'C' }, { pos: [2.4, 1.2, 0], element: 'O' },
      { pos: [3.7, 0, 0], element: 'C' },
      { pos: [3.7, 0.9, 0.4], element: 'H' }, { pos: [3.7, -0.9, 0.4], element: 'H' },
      { pos: [0, 0.9, 0.4], element: 'H' }, { pos: [0, -0.9, 0.4], element: 'H' },
    ],
    bonds: [[0, 1], [1, 2], [1, 3], [3, 4], [3, 5], [5, 6], [5, 7], [0, 8], [0, 9]],
  },
  PET: {
    atoms: [
      { pos: [0, 0, 0], element: 'C' }, { pos: [1.2, 0, 0], element: 'O' },
      { pos: [2.0, 1.0, 0], element: 'C' }, { pos: [2.0, 2.1, 0], element: 'O' },
      { pos: [3.3, 0.5, 0], element: 'C' }, { pos: [3.3, -0.9, 0], element: 'C' },
      { pos: [4.5, -1.4, 0], element: 'C' }, { pos: [5.7, -0.5, 0], element: 'C' },
      { pos: [5.7, 0.9, 0], element: 'C' }, { pos: [4.5, 1.4, 0], element: 'C' },
      { pos: [0, 0.9, 0.4], element: 'H' }, { pos: [0, -0.9, 0.4], element: 'H' },
      { pos: [3.3, -1.6, -0.7], element: 'H' }, { pos: [4.5, -2.4, 0], element: 'H' },
      { pos: [6.6, -0.9, 0], element: 'H' }, { pos: [6.6, 1.3, 0], element: 'H' },
      { pos: [4.5, 2.4, 0], element: 'H' },
    ],
    bonds: [[0, 1], [1, 2], [2, 3], [2, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 4], [0, 10], [0, 11], [5, 12], [6, 13], [7, 14], [8, 15], [9, 16]],
  },
};

// ── 3D Monomer Viewer ───────────────────────────────────────────────────────

const MonomerViewer3D: React.FC<{ polymer: PolymerData }> = ({ polymer }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth || 220;
    const h = mount.clientHeight || 180;

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(3, 5, 4);
    scene.add(dirLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = false;

    // Build molecule
    const data = monomer3DData[polymer.abbreviation];
    if (!data) return;

    const group = new THREE.Group();
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];

    // Center the molecule
    const center = new THREE.Vector3();
    data.atoms.forEach(a => center.add(new THREE.Vector3(...a.pos)));
    center.divideScalar(data.atoms.length);

    // Atoms
    data.atoms.forEach(atom => {
      const r = ATOM_RADII[atom.element] || 0.25;
      const geo = new THREE.SphereGeometry(r, 24, 24);
      const mat = new THREE.MeshStandardMaterial({
        color: CPK_COLORS[atom.element] ?? 0xcccccc,
        roughness: 0.3,
        metalness: 0.1,
      });
      geometries.push(geo);
      materials.push(mat);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(atom.pos[0] - center.x, atom.pos[1] - center.y, atom.pos[2] - center.z);
      group.add(mesh);
    });

    // Bonds
    data.bonds.forEach(([i, j]) => {
      const a = data.atoms[i];
      const b = data.atoms[j];
      const start = new THREE.Vector3(a.pos[0] - center.x, a.pos[1] - center.y, a.pos[2] - center.z);
      const end = new THREE.Vector3(b.pos[0] - center.x, b.pos[1] - center.y, b.pos[2] - center.z);
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      const len = start.distanceTo(end);

      const geo = new THREE.CylinderGeometry(0.06, 0.06, len, 8);
      const mat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.1 });
      geometries.push(geo);
      materials.push(mat);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(mid);

      const dir = new THREE.Vector3().subVectors(end, start).normalize();
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      mesh.quaternion.copy(quat);
      group.add(mesh);
    });

    scene.add(group);

    // Position camera
    const bbox = new THREE.Box3().setFromObject(group);
    const size = bbox.getSize(new THREE.Vector3()).length();
    camera.position.set(0, 0, size * 1.8);
    controls.target.set(0, 0, 0);

    // Animate
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      controls.dispose();
      geometries.forEach(g => g.dispose());
      materials.forEach(m => m.dispose());
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [polymer.abbreviation]);

  return <div ref={mountRef} className="w-full h-full" />;
};

export const PolymerBuilder: React.FC = () => {
  const [selectedPolymer, setSelectedPolymer] = useState<PolymerData>(polymers[0]);
  const [chainLength, setChainLength] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showWater, setShowWater] = useState(false);
  const [newMonomerAnim, setNewMonomerAnim] = useState(false);
  const [mode, setMode] = useState<'learn' | 'sandbox'>('learn');
  const [sandboxChain, setSandboxChain] = useState<string[]>([]);
  const [show3D, setShow3D] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (waterTimeoutRef.current) clearTimeout(waterTimeoutRef.current);
    };
  }, []);

  // Animate the chain growth
  useEffect(() => {
    if (isPlaying && chainLength < MAX_MONOMERS) {
      const delay = 1200 / speed;
      intervalRef.current = setInterval(() => {
        setNewMonomerAnim(true);
        if (selectedPolymer.type === 'condensation') {
          setShowWater(true);
          if (waterTimeoutRef.current) clearTimeout(waterTimeoutRef.current);
          waterTimeoutRef.current = setTimeout(() => setShowWater(false), delay * 0.6);
        }
        setTimeout(() => setNewMonomerAnim(false), delay * 0.5);
        setChainLength(prev => {
          const next = prev + 1;
          if (next >= MAX_MONOMERS) {
            setIsPlaying(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
          }
          return Math.min(next, MAX_MONOMERS);
        });
      }, delay);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, chainLength, selectedPolymer.type]);

  const addMonomer = useCallback(() => {
    if (chainLength >= MAX_MONOMERS) return;
    setNewMonomerAnim(true);
    if (selectedPolymer.type === 'condensation') {
      setShowWater(true);
      if (waterTimeoutRef.current) clearTimeout(waterTimeoutRef.current);
      waterTimeoutRef.current = setTimeout(() => setShowWater(false), 700);
    }
    setTimeout(() => setNewMonomerAnim(false), 500);
    setChainLength(prev => Math.min(prev + 1, MAX_MONOMERS));
  }, [chainLength, selectedPolymer.type]);

  const reset = () => {
    setIsPlaying(false);
    setChainLength(0);
    setShowWater(false);
    setNewMonomerAnim(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (waterTimeoutRef.current) clearTimeout(waterTimeoutRef.current);
  };

  const selectPolymer = (p: PolymerData) => {
    setSelectedPolymer(p);
    reset();
  };

  const molecularWeight = (chainLength * selectedPolymer.monomerMW).toFixed(1);
  const degreeOfPolymerization = chainLength;
  const contourLength = (chainLength * 0.154).toFixed(2);
  const endToEnd = (0.154 * Math.sqrt(chainLength || 1)).toFixed(2);

  // ── Sandbox helpers ────────────────────────────────────────────────────────

  const addToSandbox = (abbr: string) => {
    if (sandboxChain.length >= MAX_MONOMERS) return;
    setSandboxChain(prev => [...prev, abbr]);
  };

  const undoSandbox = () => setSandboxChain(prev => prev.slice(0, -1));
  const clearSandbox = () => setSandboxChain([]);

  const getPolymerByAbbr = (abbr: string) => polymers.find(p => p.abbreviation === abbr)!;

  const sandboxTotalMW = sandboxChain.reduce((sum, abbr) => sum + getPolymerByAbbr(abbr).monomerMW, 0).toFixed(1);

  const sandboxCopolymerType = (() => {
    if (sandboxChain.length === 0) return '';
    const unique = [...new Set(sandboxChain)];
    if (unique.length === 1) return 'Homopolymer';
    // Check alternating: ABABAB
    if (unique.length === 2) {
      const isAlternating = sandboxChain.every((abbr, i) => abbr === unique[i % 2]);
      if (isAlternating && sandboxChain.length >= 4) return 'Alternating Copolymer';
      // Check block: runs of same type
      let runs = 1;
      for (let i = 1; i < sandboxChain.length; i++) {
        if (sandboxChain[i] !== sandboxChain[i - 1]) runs++;
      }
      if (runs <= unique.length + 1 && sandboxChain.length >= 4) return 'Block Copolymer';
    }
    return 'Random Copolymer';
  })();

  const sandboxComposition = (() => {
    const counts: Record<string, number> = {};
    sandboxChain.forEach(abbr => { counts[abbr] = (counts[abbr] || 0) + 1; });
    return counts;
  })();

  // Sandbox chain SVG
  const renderSandboxChain = () => {
    if (sandboxChain.length === 0) {
      return (
        <text x={CHAIN_SVG_W / 2} y={CHAIN_SVG_H / 2} fontSize="14" fill="#d1d5db" textAnchor="middle" fontWeight="500" className="dark:fill-gray-600">
          Click monomers below to build a custom chain
        </text>
      );
    }

    const nodes: React.ReactNode[] = [];
    const links: React.ReactNode[] = [];

    for (let i = 0; i < sandboxChain.length; i++) {
      const pos = getMonomerPosition(i);
      const poly = getPolymerByAbbr(sandboxChain[i]);
      const isLatest = i === sandboxChain.length - 1;

      nodes.push(
        <g key={`s-${i}`}>
          <defs>
            <linearGradient id={`sg-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={poly.color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={poly.color} stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <rect x={pos.x} y={pos.y} width={MONOMER_W} height={MONOMER_H} rx={5}
            fill={`url(#sg-${i})`} stroke={poly.color} strokeWidth={isLatest ? 2.5 : 1.5}
            className={isLatest ? 'animate-pulse' : ''} />
          <text x={pos.x + MONOMER_W / 2} y={pos.y + MONOMER_H / 2 + 4} fontSize="10"
            fontWeight="bold" fill={poly.color} textAnchor="middle">{poly.abbreviation}</text>
          <text x={pos.x + MONOMER_W / 2} y={pos.y - 4} fontSize="7" fill="#9ca3af" textAnchor="middle">{i + 1}</text>
        </g>
      );

      if (i < sandboxChain.length - 1) {
        const nextPos = getMonomerPosition(i + 1);
        const sameRow = Math.floor(i / MONOMERS_PER_ROW) === Math.floor((i + 1) / MONOMERS_PER_ROW);
        if (sameRow) {
          links.push(
            <line key={`sb-${i}`} x1={pos.x + MONOMER_W} y1={pos.y + MONOMER_H / 2}
              x2={nextPos.x} y2={nextPos.y + MONOMER_H / 2} stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
          );
        } else {
          const bx1 = pos.x + MONOMER_W / 2, by1 = pos.y + MONOMER_H;
          const bx2 = nextPos.x + MONOMER_W / 2, by2 = nextPos.y;
          const midY = (by1 + by2) / 2;
          links.push(
            <path key={`sb-${i}`} d={`M${bx1},${by1} C${bx1},${midY} ${bx2},${midY} ${bx2},${by2}`}
              fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeDasharray="4,3" />
          );
        }
      }
    }

    return <>{links}{nodes}</>;
  };

  // ── Build chain coordinates ──────────────────────────────────────────────

  const getMonomerPosition = (index: number): { x: number; y: number } => {
    const row = Math.floor(index / MONOMERS_PER_ROW);
    const col = index % MONOMERS_PER_ROW;
    const x = 30 + col * (MONOMER_W + BOND_LEN);
    const baseY = 30 + row * (MONOMER_H + ZIGZAG_DY + 30);
    const zigzagOffset = col % 2 === 0 ? 0 : ZIGZAG_DY;
    const y = baseY + zigzagOffset;
    return { x, y };
  };

  // ── Monomer structure SVG drawing ────────────────────────────────────────

  const renderMonomerStructure = () => {
    const p = selectedPolymer;
    if (p.type === 'addition') {
      return (
        <svg viewBox="0 0 200 120" className="w-full h-full">
          {/* C=C double bond addition monomer */}
          <text x="40" y="18" fontSize="10" fill="#6b7280" fontWeight="600" className="dark:fill-gray-400">Monomer Structure</text>
          {/* Left carbon */}
          <text x="55" y="62" fontSize="16" fontWeight="bold" fill="#374151" className="dark:fill-gray-200">C</text>
          {/* Right carbon */}
          <text x="110" y="62" fontSize="16" fontWeight="bold" fill="#374151" className="dark:fill-gray-200">C</text>
          {/* Double bond lines */}
          <line x1="70" y1="52" x2="108" y2="52" stroke="#ef4444" strokeWidth="2.5" />
          <line x1="70" y1="58" x2="108" y2="58" stroke="#ef4444" strokeWidth="2.5" />
          {/* Reactive site highlight */}
          <rect x="65" y="42" width="52" height="24" rx="4" fill="rgba(239,68,68,0.1)" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,2" />
          <text x="91" y="40" fontSize="8" fill="#ef4444" textAnchor="middle" fontWeight="600">reactive site</text>
          {/* H atoms on left C */}
          <text x="28" y="46" fontSize="11" fill="#6b7280" className="dark:fill-gray-400">H</text>
          <line x1="53" y1="48" x2="40" y2="44" stroke="#9ca3af" strokeWidth="1.2" />
          <text x="28" y="78" fontSize="11" fill="#6b7280" className="dark:fill-gray-400">H</text>
          <line x1="53" y1="62" x2="40" y2="72" stroke="#9ca3af" strokeWidth="1.2" />
          {/* Substituent on right C */}
          {p.abbreviation === 'PE' && (
            <>
              <text x="130" y="46" fontSize="11" fill="#6b7280" className="dark:fill-gray-400">H</text>
              <line x1="125" y1="48" x2="132" y2="44" stroke="#9ca3af" strokeWidth="1.2" />
              <text x="130" y="78" fontSize="11" fill="#6b7280" className="dark:fill-gray-400">H</text>
              <line x1="125" y1="62" x2="132" y2="72" stroke="#9ca3af" strokeWidth="1.2" />
            </>
          )}
          {p.abbreviation === 'PP' && (
            <>
              <text x="130" y="46" fontSize="11" fill="#6b7280" className="dark:fill-gray-400">H</text>
              <line x1="125" y1="48" x2="132" y2="44" stroke="#9ca3af" strokeWidth="1.2" />
              <text x="127" y="82" fontSize="10" fontWeight="bold" fill="#22c55e">CH&#x2083;</text>
              <line x1="125" y1="62" x2="132" y2="75" stroke="#22c55e" strokeWidth="1.5" />
            </>
          )}
          {p.abbreviation === 'PVC' && (
            <>
              <text x="130" y="46" fontSize="11" fill="#6b7280" className="dark:fill-gray-400">H</text>
              <line x1="125" y1="48" x2="132" y2="44" stroke="#9ca3af" strokeWidth="1.2" />
              <text x="131" y="82" fontSize="11" fontWeight="bold" fill="#8b5cf6">Cl</text>
              <line x1="125" y1="62" x2="137" y2="75" stroke="#8b5cf6" strokeWidth="1.5" />
            </>
          )}
          {p.abbreviation === 'PS' && (
            <>
              <text x="130" y="46" fontSize="11" fill="#6b7280" className="dark:fill-gray-400">H</text>
              <line x1="125" y1="48" x2="132" y2="44" stroke="#9ca3af" strokeWidth="1.2" />
              {/* Benzene ring simplified */}
              <circle cx="145" cy="88" r="12" fill="none" stroke="#f97316" strokeWidth="1.5" />
              <circle cx="145" cy="88" r="7" fill="none" stroke="#f97316" strokeWidth="1" />
              <line x1="125" y1="62" x2="140" y2="77" stroke="#f97316" strokeWidth="1.5" />
              <text x="139" y="92" fontSize="8" fill="#f97316" fontWeight="bold" textAnchor="middle">Ph</text>
            </>
          )}
          {/* Formula label */}
          <text x="100" y="112" fontSize="10" fill="#374151" textAnchor="middle" fontWeight="600" className="dark:fill-gray-300">{p.monomerFormula}</text>
        </svg>
      );
    }

    // Condensation monomer(s)
    return (
      <svg viewBox="0 0 200 120" className="w-full h-full">
        <text x="100" y="14" fontSize="9" fill="#6b7280" fontWeight="600" textAnchor="middle" className="dark:fill-gray-400">Monomer Structures</text>
        {/* Monomer A */}
        <rect x="8" y="22" width="86" height="36" rx="5" fill={p.colorLight} stroke={p.colorBorder} strokeWidth="1.2" />
        <text x="51" y="44" fontSize="9" fill={p.textColor} textAnchor="middle" fontWeight="bold">{p.monomerName.length > 14 ? p.monomerName.slice(0, 12) + '..' : p.monomerName}</text>
        {/* Functional groups highlighted */}
        <rect x="12" y="32" width="18" height="14" rx="3" fill="rgba(239,68,68,0.15)" stroke="#ef4444" strokeWidth="0.8" />
        <text x="21" y="42" fontSize="7" fill="#ef4444" textAnchor="middle" fontWeight="bold">{p.abbreviation === 'Nylon' ? 'NH\u2082' : 'OH'}</text>
        <rect x="72" y="32" width="18" height="14" rx="3" fill="rgba(239,68,68,0.15)" stroke="#ef4444" strokeWidth="0.8" />
        <text x="81" y="42" fontSize="7" fill="#ef4444" textAnchor="middle" fontWeight="bold">{p.abbreviation === 'Nylon' ? 'NH\u2082' : 'OH'}</text>
        <text x="51" y="68" fontSize="8" fill="#374151" textAnchor="middle" className="dark:fill-gray-300">{p.monomerFormula}</text>
        {/* Plus sign */}
        <text x="100" y="44" fontSize="14" fill="#9ca3af" textAnchor="middle" fontWeight="bold">+</text>
        {/* Monomer B */}
        <rect x="108" y="22" width="86" height="36" rx="5" fill={p.colorLight} stroke={p.colorBorder} strokeWidth="1.2" />
        <text x="151" y="44" fontSize="9" fill={p.textColor} textAnchor="middle" fontWeight="bold">{(p.secondMonomer || '').length > 14 ? (p.secondMonomer || '').slice(0, 12) + '..' : p.secondMonomer}</text>
        <rect x="112" y="32" width="22" height="14" rx="3" fill="rgba(239,68,68,0.15)" stroke="#ef4444" strokeWidth="0.8" />
        <text x="123" y="42" fontSize="7" fill="#ef4444" textAnchor="middle" fontWeight="bold">COOH</text>
        <rect x="168" y="32" width="22" height="14" rx="3" fill="rgba(239,68,68,0.15)" stroke="#ef4444" strokeWidth="0.8" />
        <text x="179" y="42" fontSize="7" fill="#ef4444" textAnchor="middle" fontWeight="bold">COOH</text>
        <text x="151" y="68" fontSize="8" fill="#374151" textAnchor="middle" className="dark:fill-gray-300">{p.secondMonomerFormula}</text>
        {/* Arrow to product */}
        <line x1="60" y1="78" x2="100" y2="92" stroke="#6b7280" strokeWidth="1" markerEnd="url(#arrowM)" />
        <line x1="140" y1="78" x2="100" y2="92" stroke="#6b7280" strokeWidth="1" />
        <defs>
          <marker id="arrowM" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#6b7280" />
          </marker>
        </defs>
        {/* Bond type + byproduct */}
        <text x="100" y="102" fontSize="9" fill={p.color} textAnchor="middle" fontWeight="bold">{p.abbreviation === 'Nylon' ? 'Amide bond' : 'Ester bond'}</text>
        <text x="100" y="114" fontSize="8" fill="#ef4444" textAnchor="middle">+ H&#x2082;O released</text>
      </svg>
    );
  };

  // ── Chain visualization ──────────────────────────────────────────────────

  const renderChain = () => {
    const monomers: React.ReactNode[] = [];
    const bonds: React.ReactNode[] = [];

    // Labels for condensation alternating monomers
    const getLabel = (i: number): string => {
      if (selectedPolymer.type === 'condensation') {
        if (selectedPolymer.abbreviation === 'Nylon') return i % 2 === 0 ? 'DA' : 'AA';
        return i % 2 === 0 ? 'EG' : 'TA';
      }
      return selectedPolymer.abbreviation;
    };

    const getMonomerColor = (i: number): string => {
      if (selectedPolymer.type === 'condensation') {
        return i % 2 === 0 ? selectedPolymer.color : adjustColor(selectedPolymer.color, 40);
      }
      return selectedPolymer.color;
    };

    for (let i = 0; i < chainLength; i++) {
      const pos = getMonomerPosition(i);
      const isLatest = i === chainLength - 1;
      const label = getLabel(i);
      const mColor = getMonomerColor(i);

      monomers.push(
        <g key={`m-${i}`}>
          <defs>
            <linearGradient id={`mg-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={mColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={mColor} stopOpacity="0.08" />
            </linearGradient>
          </defs>
          <rect
            x={pos.x}
            y={pos.y}
            width={MONOMER_W}
            height={MONOMER_H}
            rx={5}
            fill={`url(#mg-${i})`}
            stroke={mColor}
            strokeWidth={isLatest && newMonomerAnim ? 2.5 : 1.5}
            className={isLatest && newMonomerAnim ? 'animate-pulse' : ''}
          />
          <text
            x={pos.x + MONOMER_W / 2}
            y={pos.y + MONOMER_H / 2 + 4}
            fontSize="10"
            fontWeight="bold"
            fill={mColor}
            textAnchor="middle"
          >
            {label}
          </text>
          {/* Monomer index */}
          <text
            x={pos.x + MONOMER_W / 2}
            y={pos.y - 4}
            fontSize="7"
            fill="#9ca3af"
            textAnchor="middle"
          >
            {i + 1}
          </text>
        </g>
      );

      // Bond to next monomer
      if (i < chainLength - 1) {
        const nextPos = getMonomerPosition(i + 1);
        const sameRow = Math.floor(i / MONOMERS_PER_ROW) === Math.floor((i + 1) / MONOMERS_PER_ROW);

        if (sameRow) {
          // Horizontal bond with zigzag
          const bx1 = pos.x + MONOMER_W;
          const by1 = pos.y + MONOMER_H / 2;
          const bx2 = nextPos.x;
          const by2 = nextPos.y + MONOMER_H / 2;
          bonds.push(
            <line
              key={`b-${i}`}
              x1={bx1}
              y1={by1}
              x2={bx2}
              y2={by2}
              stroke={mColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
          );
        } else {
          // Wrap to new row: draw a curved connector
          const bx1 = pos.x + MONOMER_W / 2;
          const by1 = pos.y + MONOMER_H;
          const bx2 = nextPos.x + MONOMER_W / 2;
          const by2 = nextPos.y;
          const midY = (by1 + by2) / 2;
          bonds.push(
            <path
              key={`b-${i}`}
              d={`M${bx1},${by1} C${bx1},${midY} ${bx2},${midY} ${bx2},${by2}`}
              fill="none"
              stroke={mColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="4,3"
            />
          );
        }
      }
    }

    // Repeating unit bracket (show when chain >= 3)
    let repeatBracket: React.ReactNode = null;
    if (chainLength >= 3) {
      const firstPos = getMonomerPosition(0);
      const bracketEndIdx = selectedPolymer.type === 'condensation' ? Math.min(1, chainLength - 1) : 0;
      const lastBracketPos = getMonomerPosition(bracketEndIdx);
      const bracketX1 = firstPos.x - 6;
      const bracketX2 = lastBracketPos.x + MONOMER_W + 6;
      const bracketY1 = Math.min(firstPos.y, lastBracketPos.y) - 2;
      const bracketH = MONOMER_H + ZIGZAG_DY + 6;

      repeatBracket = (
        <g>
          {/* Left bracket */}
          <path d={`M${bracketX1 + 4},${bracketY1} L${bracketX1},${bracketY1} L${bracketX1},${bracketY1 + bracketH} L${bracketX1 + 4},${bracketY1 + bracketH}`}
            fill="none" stroke="#9ca3af" strokeWidth="1.5" />
          {/* Right bracket */}
          <path d={`M${bracketX2 - 4},${bracketY1} L${bracketX2},${bracketY1} L${bracketX2},${bracketY1 + bracketH} L${bracketX2 - 4},${bracketY1 + bracketH}`}
            fill="none" stroke="#9ca3af" strokeWidth="1.5" />
          {/* "n" label */}
          <text x={bracketX2 + 8} y={bracketY1 + bracketH + 2} fontSize="12" fontStyle="italic" fill="#6b7280" fontWeight="bold" className="dark:fill-gray-400">n</text>
        </g>
      );
    }

    // Water byproduct animation for condensation
    let waterAnim: React.ReactNode = null;
    if (showWater && selectedPolymer.type === 'condensation' && chainLength > 0) {
      const latestPos = getMonomerPosition(chainLength - 1);
      waterAnim = (
        <g>
          <circle cx={latestPos.x + MONOMER_W / 2} cy={latestPos.y + MONOMER_H + 20}
            r="10" fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth="1">
            <animate attributeName="opacity" from="1" to="0" dur="0.8s" fill="freeze" />
            <animate attributeName="cy" from={latestPos.y + MONOMER_H + 10} to={latestPos.y + MONOMER_H + 40} dur="0.8s" fill="freeze" />
          </circle>
          <text x={latestPos.x + MONOMER_W / 2} y={latestPos.y + MONOMER_H + 24}
            fontSize="8" fill="#3b82f6" textAnchor="middle" fontWeight="bold">
            H&#x2082;O
            <animate attributeName="opacity" from="1" to="0" dur="0.8s" fill="freeze" />
          </text>
        </g>
      );
    }

    // Double bond breaking animation for addition (on the latest monomer)
    let bondBreakAnim: React.ReactNode = null;
    if (newMonomerAnim && selectedPolymer.type === 'addition' && chainLength > 0) {
      const latestPos = getMonomerPosition(chainLength - 1);
      bondBreakAnim = (
        <g>
          {/* "Bond opened" flash */}
          <rect x={latestPos.x - 2} y={latestPos.y - 2}
            width={MONOMER_W + 4} height={MONOMER_H + 4}
            rx={7} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2">
            <animate attributeName="opacity" from="1" to="0" dur="0.6s" fill="freeze" />
          </rect>
          <text x={latestPos.x + MONOMER_W / 2} y={latestPos.y + MONOMER_H + 14}
            fontSize="7" fill="#ef4444" textAnchor="middle" fontWeight="600">
            C=C &#x2192; C-C
            <animate attributeName="opacity" from="1" to="0" dur="0.6s" fill="freeze" />
          </text>
        </g>
      );
    }

    // Starting chain end cap
    let startCap: React.ReactNode = null;
    if (chainLength > 0) {
      const firstPos = getMonomerPosition(0);
      startCap = (
        <g>
          <line x1={firstPos.x - 8} y1={firstPos.y + MONOMER_H / 2} x2={firstPos.x} y2={firstPos.y + MONOMER_H / 2}
            stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
          <text x={firstPos.x - 12} y={firstPos.y + MONOMER_H / 2 + 3} fontSize="7" fill="#9ca3af" textAnchor="end">H</text>
        </g>
      );
    }

    // Ending chain marker (growing end)
    let endCap: React.ReactNode = null;
    if (chainLength > 0 && chainLength < MAX_MONOMERS) {
      const lastPos = getMonomerPosition(chainLength - 1);
      const lastRow = Math.floor((chainLength - 1) / MONOMERS_PER_ROW);
      const lastCol = (chainLength - 1) % MONOMERS_PER_ROW;

      if (lastCol < MONOMERS_PER_ROW - 1) {
        endCap = (
          <g>
            <line x1={lastPos.x + MONOMER_W} y1={lastPos.y + MONOMER_H / 2}
              x2={lastPos.x + MONOMER_W + 10} y2={lastPos.y + MONOMER_H / 2}
              stroke="#d1d5db" strokeWidth="2" strokeDasharray="3,2" strokeLinecap="round" />
            <text x={lastPos.x + MONOMER_W + 16} y={lastPos.y + MONOMER_H / 2 + 3}
              fontSize="9" fill="#d1d5db" fontWeight="bold">...</text>
          </g>
        );
      }
    }

    // Placeholder text when chain is empty
    const placeholder = chainLength === 0 ? (
      <text x={CHAIN_SVG_W / 2} y={CHAIN_SVG_H / 2} fontSize="14" fill="#d1d5db" textAnchor="middle" fontWeight="500" className="dark:fill-gray-600">
        Press Play or + to start building the polymer chain
      </text>
    ) : null;

    return (
      <>
        {placeholder}
        {bonds}
        {monomers}
        {repeatBracket}
        {startCap}
        {endCap}
        {bondBreakAnim}
        {waterAnim}
      </>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-pink-50 to-rose-50 dark:from-gray-900 dark:to-gray-800 p-3 overflow-hidden">
      {/* Keyframes for animations */}
      <style>{`
        @keyframes waterFloat {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-20px); opacity: 0; }
        }
        @keyframes snapIn {
          0% { transform: scale(0.3); opacity: 0; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Beaker className="h-5 w-5 text-pink-600" />
            Polymer Chain Builder
          </h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {mode === 'learn'
              ? <>{selectedPolymer.name} ({selectedPolymer.abbreviation}) &mdash; {selectedPolymer.type === 'addition' ? 'Addition' : 'Condensation'} Polymerization</>
              : <>Sandbox &mdash; Mix monomers to build custom copolymers</>
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
            <button
              onClick={() => setMode('learn')}
              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold transition-all ${
                mode === 'learn'
                  ? 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Beaker className="h-3 w-3" /> Learn
            </button>
            <button
              onClick={() => setMode('sandbox')}
              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold transition-all ${
                mode === 'sandbox'
                  ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <FlaskConical className="h-3 w-3" /> Sandbox
            </button>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <span className="text-lg font-bold font-mono text-gray-800 dark:text-white">{mode === 'learn' ? chainLength : sandboxChain.length}</span>
            <span className="text-[10px] text-gray-400">/ {MAX_MONOMERS}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <span className="text-sm font-bold font-mono text-gray-800 dark:text-white">{mode === 'learn' ? molecularWeight : sandboxTotalMW}</span>
            <span className="text-[10px] text-gray-400">g/mol</span>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex gap-3 min-h-0">

        {/* Left side: chain viz + monomer structure + controls */}
        <div className="flex-1 flex flex-col gap-2.5 min-w-0 min-h-0">

          {mode === 'learn' ? (
            <>
              {/* Chain Visualization */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5 flex flex-col" style={{ flex: '1 1 0', minHeight: 0 }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-800 dark:text-white flex items-center gap-1.5">
                    <Beaker className="h-3.5 w-3.5 text-pink-600 dark:text-pink-400" />
                    Polymer Chain &mdash; {selectedPolymer.name}
                  </span>
                  <span className="text-[9px] text-gray-400 dark:text-gray-500">
                    {selectedPolymer.type === 'condensation' ? 'Condensation: H\u2082O released each step' : 'Addition: C=C double bond opens'}
                  </span>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <svg viewBox={`0 0 ${CHAIN_SVG_W} ${CHAIN_SVG_H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                    {renderChain()}
                  </svg>
                </div>
                {/* Progress bar */}
                <div className="mt-1.5">
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(chainLength / MAX_MONOMERS) * 100}%`,
                        background: `linear-gradient(to right, ${selectedPolymer.color}, ${adjustColor(selectedPolymer.color, -20)})`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-[9px] text-gray-400">0</span>
                    <span className="text-[9px] text-gray-500 dark:text-gray-400 font-medium">{chainLength} monomers added</span>
                    <span className="text-[9px] text-gray-400">{MAX_MONOMERS}</span>
                  </div>
                </div>
              </div>

              {/* Bottom row: Monomer structure + Controls */}
              <div className="flex gap-2.5" style={{ flex: '0 0 auto' }}>
                {/* Monomer Structure Display */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2" style={{ width: 220, height: 140 }}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] text-gray-400 font-medium">Monomer</span>
                    <button
                      onClick={() => setShow3D(!show3D)}
                      className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium transition-all ${
                        show3D
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <Box className="h-2.5 w-2.5" /> {show3D ? '3D' : '2D'}
                    </button>
                  </div>
                  {show3D ? (
                    <div style={{ width: '100%', height: 118 }}>
                      <MonomerViewer3D polymer={selectedPolymer} />
                    </div>
                  ) : (
                    <div style={{ height: 118 }}>
                      {renderMonomerStructure()}
                    </div>
                  )}
                </div>

            {/* Controls */}
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 flex flex-col justify-between">
              {/* Polymer type selector */}
              <div>
                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Select Polymer</span>
                <div className="grid grid-cols-3 gap-1 mt-1.5">
                  {polymers.map(p => (
                    <button
                      key={p.abbreviation}
                      onClick={() => selectPolymer(p)}
                      className={`text-left px-2 py-1.5 rounded-md text-[10px] transition-all ${
                        selectedPolymer.abbreviation === p.abbreviation
                          ? 'border shadow-sm'
                          : 'border border-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                      style={
                        selectedPolymer.abbreviation === p.abbreviation
                          ? { backgroundColor: p.colorLight, borderColor: p.colorBorder, color: p.textColor }
                          : {}
                      }
                    >
                      <div className="font-semibold">{p.abbreviation}</div>
                      <div className="text-[8px] opacity-70 truncate">{p.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Play controls */}
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={addMonomer}
                  disabled={chainLength >= MAX_MONOMERS || isPlaying}
                  className="p-2 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-lg hover:bg-pink-200 dark:hover:bg-pink-900/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Add one monomer"
                >
                  <Plus className="h-4 w-4" />
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={chainLength >= MAX_MONOMERS}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all text-white shadow-sm ${
                    isPlaying
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500'
                  }`}
                >
                  {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </button>

                <button
                  onClick={reset}
                  className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg transition-all"
                  title="Reset"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>

              {/* Speed selector */}
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Speed</span>
                {[0.5, 1, 2].map(s => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`flex-1 text-[11px] py-1 rounded-md font-medium transition-all ${
                      speed === s
                        ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border border-pink-300 dark:border-pink-700 shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Chain Statistics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5" style={{ width: 190 }}>
              <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Chain Statistics</h4>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-500 dark:text-gray-400">Monomers</span>
                  <span className="font-mono font-semibold text-gray-800 dark:text-white">{chainLength}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-500 dark:text-gray-400">MW (est.)</span>
                  <span className="font-mono font-semibold text-gray-800 dark:text-white">{molecularWeight} g/mol</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-500 dark:text-gray-400">Degree (DP)</span>
                  <span className="font-mono font-semibold text-gray-800 dark:text-white">{degreeOfPolymerization}</span>
                </div>
                {selectedPolymer.type === 'condensation' && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500 dark:text-gray-400">H&#x2082;O released</span>
                    <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{Math.max(0, chainLength - 1)}</span>
                  </div>
                )}
                <div className="pt-1 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500 dark:text-gray-400">Contour</span>
                    <span className="font-mono font-semibold text-gray-800 dark:text-white">{contourLength} nm</span>
                  </div>
                  <div className="flex justify-between text-[11px] mt-1">
                    <span className="text-gray-500 dark:text-gray-400">End-to-End</span>
                    <span className="font-mono font-semibold text-gray-800 dark:text-white">{endToEnd} nm</span>
                  </div>
                  <div className="flex justify-between text-[11px] mt-1">
                    <span className="text-gray-500 dark:text-gray-400">Type</span>
                    <span className="font-semibold" style={{ color: selectedPolymer.color }}>
                      {selectedPolymer.type === 'addition' ? 'Addition' : 'Condensation'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
              </div>
            </>
          ) : (
            /* ── SANDBOX MODE ── */
            <>
              {/* Sandbox Chain Visualization */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5 flex flex-col" style={{ flex: '1 1 0', minHeight: 0 }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-800 dark:text-white flex items-center gap-1.5">
                    <FlaskConical className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                    Custom Chain
                    {sandboxCopolymerType && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                        {sandboxCopolymerType}
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={undoSandbox} disabled={sandboxChain.length === 0}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-all text-gray-500 dark:text-gray-400" title="Undo">
                      <Undo2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={clearSandbox} disabled={sandboxChain.length === 0}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-all text-gray-500 dark:text-gray-400" title="Clear">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <svg viewBox={`0 0 ${CHAIN_SVG_W} ${CHAIN_SVG_H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                    {renderSandboxChain()}
                  </svg>
                </div>
                {/* Progress bar */}
                <div className="mt-1.5">
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300 bg-purple-500"
                      style={{ width: `${(sandboxChain.length / MAX_MONOMERS) * 100}%` }} />
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-[9px] text-gray-400">0</span>
                    <span className="text-[9px] text-gray-500 dark:text-gray-400 font-medium">{sandboxChain.length} monomers</span>
                    <span className="text-[9px] text-gray-400">{MAX_MONOMERS}</span>
                  </div>
                </div>
              </div>

              {/* Monomer Palette */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5" style={{ flex: '0 0 auto' }}>
                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Add Monomers</span>
                <div className="grid grid-cols-6 gap-1.5 mt-1.5">
                  {polymers.map(p => (
                    <button
                      key={p.abbreviation}
                      onClick={() => addToSandbox(p.abbreviation)}
                      disabled={sandboxChain.length >= MAX_MONOMERS}
                      className="flex flex-col items-center p-2 rounded-lg border transition-all hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ backgroundColor: p.colorLight, borderColor: p.colorBorder }}
                    >
                      <span className="text-sm font-bold" style={{ color: p.textColor }}>{p.abbreviation}</span>
                      <span className="text-[8px] text-gray-500 dark:text-gray-600 mt-0.5 truncate w-full text-center">{p.monomerName}</span>
                      <span className="text-[8px] font-mono text-gray-400 mt-0.5">{p.monomerMW.toFixed(1)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right side: Info Panel */}
        <div className="w-80 flex flex-col gap-2 flex-shrink-0 overflow-y-auto">

          {mode === 'learn' ? (
            <>
              {/* Polymer info card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3">
                <h4 className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-pink-600 dark:text-pink-400" />
                  {selectedPolymer.name} ({selectedPolymer.abbreviation})
                </h4>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Type</span>
                    <span className="font-semibold" style={{ color: selectedPolymer.color }}>
                      {selectedPolymer.type === 'addition' ? 'Addition' : 'Condensation'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Monomer</span>
                    <span className="font-mono font-semibold text-gray-800 dark:text-white">{selectedPolymer.monomerFormula}</span>
                  </div>
                  {selectedPolymer.secondMonomer && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">2nd Monomer</span>
                      <span className="font-mono font-semibold text-gray-800 dark:text-white text-[10px]">{selectedPolymer.secondMonomerFormula}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Repeat Unit</span>
                    <span className="font-mono text-gray-800 dark:text-white text-[10px]">{selectedPolymer.repeatUnitFormula}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Classification</span>
                    <span className="font-semibold text-gray-800 dark:text-white">{selectedPolymer.classification}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Crystallinity</span>
                    <span className="text-gray-800 dark:text-white text-[10px]">{selectedPolymer.crystallinity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Melting Point</span>
                    <span className="font-mono text-gray-800 dark:text-white">{selectedPolymer.meltingPoint}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Recycling</span>
                    <span className="text-gray-800 dark:text-white text-[10px]">{selectedPolymer.recyclingCode}</span>
                  </div>
                </div>
              </div>

              {/* Physical Properties */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5">
                <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Physical Properties</h4>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                  <div>
                    <span className="text-gray-400 dark:text-gray-500 text-[9px]">Glass Transition</span>
                    <div className="font-mono font-semibold text-gray-800 dark:text-white">{selectedPolymer.Tg}</div>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-500 text-[9px]">Density</span>
                    <div className="font-mono font-semibold text-gray-800 dark:text-white text-[10px]">{selectedPolymer.density}</div>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-500 text-[9px]">Tensile Strength</span>
                    <div className="font-mono font-semibold text-gray-800 dark:text-white">{selectedPolymer.tensileStrength}</div>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-500 text-[9px]">Bond Type</span>
                    <div className="font-semibold text-gray-800 dark:text-white text-[10px]">{selectedPolymer.bondType}</div>
                  </div>
                </div>
              </div>

              {/* Polymerization explanation */}
              <div className="border rounded-lg p-2.5" style={{ backgroundColor: selectedPolymer.colorLight, borderColor: selectedPolymer.colorBorder }}>
                <h4 className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: selectedPolymer.textColor }}>
                  {selectedPolymer.type === 'addition' ? 'Addition' : 'Condensation'} Polymerization
                </h4>
                <p className="text-[10px] text-gray-600 dark:text-gray-700 leading-relaxed">
                  {selectedPolymer.typeExplanation}
                </p>
              </div>

              {/* Real-world uses */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5">
                <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Real-World Uses</h4>
                <div className="space-y-0.5">
                  {selectedPolymer.uses.map((use, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10px] text-gray-600 dark:text-gray-300">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: selectedPolymer.color }} />
                      <span>{use}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Properties */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5">
                <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Properties</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedPolymer.properties.map((prop, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full text-[9px] font-medium"
                      style={{ backgroundColor: selectedPolymer.colorLight, color: selectedPolymer.textColor, border: `1px solid ${selectedPolymer.colorBorder}` }}
                    >
                      {prop}
                    </span>
                  ))}
                </div>
              </div>

              {/* History & Production */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5">
                <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">History & Production</h4>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Discovered</span>
                    <span className="font-semibold text-gray-800 dark:text-white">{selectedPolymer.discoveryYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">By</span>
                    <span className="text-gray-800 dark:text-white text-[10px] text-right max-w-[60%]">{selectedPolymer.discoveredBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Annual Output</span>
                    <span className="font-mono font-semibold text-gray-800 dark:text-white text-[10px]">{selectedPolymer.annualProduction}</span>
                  </div>
                </div>
              </div>

              {/* Environmental Impact */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5">
                <h4 className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-1">Environmental Impact</h4>
                <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
                  {selectedPolymer.environmentalNote}
                </p>
              </div>

              {/* Key Concepts */}
              <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg p-2.5">
                <h4 className="text-[10px] font-semibold text-pink-800 dark:text-pink-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Info className="h-3 w-3" /> Key Concepts
                </h4>
                <div className="space-y-1.5">
                  <div className="text-[9px] text-gray-600 dark:text-gray-300">
                    <span className="font-semibold text-gray-700 dark:text-gray-200">Monomers vs Polymers:</span> Monomers are small repeating molecules; polymers are long chains of bonded monomers. &quot;Poly&quot; = many, &quot;mer&quot; = unit.
                  </div>
                  <div className="text-[9px] text-gray-600 dark:text-gray-300">
                    <span className="font-semibold text-gray-700 dark:text-gray-200">Addition vs Condensation:</span> Addition polymers form by opening double bonds with no byproduct. Condensation polymers release a small molecule (usually H&#x2082;O) each step.
                  </div>
                  <div className="text-[9px] text-gray-600 dark:text-gray-300">
                    <span className="font-semibold text-gray-700 dark:text-gray-200">Cross-linking:</span> Covalent bonds between polymer chains increase rigidity. Vulcanized rubber is a classic cross-linked example.
                  </div>
                  <div className="text-[9px] text-gray-600 dark:text-gray-300">
                    <span className="font-semibold text-gray-700 dark:text-gray-200">Molecular Weight:</span> MW = (monomer MW) x (degree of polymerization). Higher MW typically means stronger, more viscous material.
                  </div>
                  <div className="text-[9px] text-gray-600 dark:text-gray-300">
                    <span className="font-semibold text-gray-700 dark:text-gray-200">Recycling Codes:</span> Polymers are categorized 1-7 for recycling. PET (1) and HDPE (2) are most commonly recycled.
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ── SANDBOX RIGHT PANEL ── */
            <>
              {/* Chain Composition */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3">
                <h4 className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                  <FlaskConical className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  Chain Analysis
                </h4>
                {sandboxChain.length === 0 ? (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 italic">Add monomers to see analysis</p>
                ) : (
                  <div className="space-y-2">
                    {/* Copolymer badge */}
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                        {sandboxCopolymerType}
                      </span>
                      <span className="text-[10px] text-gray-400">{sandboxChain.length} units</span>
                    </div>
                    {/* Composition breakdown */}
                    <div className="space-y-1">
                      {Object.entries(sandboxComposition).map(([abbr, count]) => {
                        const p = getPolymerByAbbr(abbr);
                        const pct = ((count / sandboxChain.length) * 100).toFixed(0);
                        return (
                          <div key={abbr} className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                            <span className="text-[11px] font-semibold" style={{ color: p.color }}>{abbr}</span>
                            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                            </div>
                            <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 w-8 text-right">{pct}%</span>
                            <span className="text-[10px] text-gray-400">({count})</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Sandbox stats */}
              {sandboxChain.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5">
                  <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Chain Statistics</h4>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Total MW</span>
                      <span className="font-mono font-semibold text-gray-800 dark:text-white">{sandboxTotalMW} g/mol</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Monomers</span>
                      <span className="font-mono font-semibold text-gray-800 dark:text-white">{sandboxChain.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Unique Types</span>
                      <span className="font-mono font-semibold text-gray-800 dark:text-white">{new Set(sandboxChain).size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Contour Length</span>
                      <span className="font-mono font-semibold text-gray-800 dark:text-white">{(sandboxChain.length * 0.154).toFixed(2)} nm</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Combined properties */}
              {sandboxChain.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5">
                  <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Combined Properties</h4>
                  <div className="flex flex-wrap gap-1">
                    {[...new Set(sandboxChain.flatMap(abbr => getPolymerByAbbr(abbr).properties))].map((prop, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                        {prop}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Copolymer info */}
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-2.5">
                <h4 className="text-[10px] font-semibold text-purple-800 dark:text-purple-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Info className="h-3 w-3" /> Copolymer Guide
                </h4>
                <div className="space-y-1.5">
                  <div className="text-[9px] text-gray-600 dark:text-gray-300">
                    <span className="font-semibold text-gray-700 dark:text-gray-200">Homopolymer:</span> Chain of identical monomers (e.g., AAAA).
                  </div>
                  <div className="text-[9px] text-gray-600 dark:text-gray-300">
                    <span className="font-semibold text-gray-700 dark:text-gray-200">Alternating:</span> Two monomers in strict alternation (ABAB).
                  </div>
                  <div className="text-[9px] text-gray-600 dark:text-gray-300">
                    <span className="font-semibold text-gray-700 dark:text-gray-200">Block:</span> Long runs of each monomer (AAABBB).
                  </div>
                  <div className="text-[9px] text-gray-600 dark:text-gray-300">
                    <span className="font-semibold text-gray-700 dark:text-gray-200">Random:</span> Monomers in no particular pattern (AABABBA).
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
