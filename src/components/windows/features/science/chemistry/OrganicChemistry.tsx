import React, { useState, useEffect, useRef } from 'react';
import { Atom, Info, ArrowRight } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

type ReactionCategory = 'alkane' | 'alkene' | 'alcohol' | 'substitution' | 'carbonyl' | 'carboxylic';

interface AtomPos {
  x: number;
  y: number;
  label: string;
  color: string;
  textColor?: string;
  size?: number;
}

interface BondDef {
  from: number;
  to: number;
  order: 1 | 2 | 3;
}

interface MoleculeDef {
  name: string;
  iupac: string;
  atoms: AtomPos[];
  bonds: BondDef[];
}

interface Reaction {
  name: string;
  category: ReactionCategory;
  type: string;
  reactant: MoleculeDef;
  product: MoleculeDef;
  reagent: string;
  conditions: string;
  mechanism: string;
  equation: string;
  description: string;
  keyPoints: string[];
}

interface FunctionalGroup {
  name: string;
  formula: string;
  className: string;
  atoms: AtomPos[];
  bonds: BondDef[];
}

// ── Atom colors ────────────────────────────────────────────────────────────────

const ATOM_COLORS: Record<string, string> = {
  C: '#374151',
  H: '#d1d5db',
  O: '#dc2626',
  N: '#2563eb',
  Cl: '#16a34a',
  Br: '#92400e',
  Na: '#7c3aed',
  S: '#eab308',
  F: '#06b6d4',
};

const ATOM_TEXT: Record<string, string> = {
  C: '#ffffff',
  H: '#374151',
  O: '#ffffff',
  N: '#ffffff',
  Cl: '#ffffff',
  Br: '#ffffff',
  Na: '#ffffff',
  S: '#ffffff',
  F: '#ffffff',
};

// ── Helper: build simple molecules ─────────────────────────────────────────────

function makeMethane(): MoleculeDef {
  return {
    name: 'Methane',
    iupac: 'Methane',
    atoms: [
      { x: 250, y: 150, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C },
      { x: 250, y: 90, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 310, y: 150, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 250, y: 210, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 190, y: 150, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
      { from: 0, to: 3, order: 1 },
      { from: 0, to: 4, order: 1 },
    ],
  };
}

function makeCO2(): MoleculeDef {
  return {
    name: 'Carbon Dioxide',
    iupac: 'Carbon dioxide',
    atoms: [
      { x: 170, y: 150, label: 'O', color: ATOM_COLORS.O, textColor: ATOM_TEXT.O },
      { x: 250, y: 150, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C },
      { x: 330, y: 150, label: 'O', color: ATOM_COLORS.O, textColor: ATOM_TEXT.O },
    ],
    bonds: [
      { from: 0, to: 1, order: 2 },
      { from: 1, to: 2, order: 2 },
    ],
  };
}

function makeEthene(): MoleculeDef {
  return {
    name: 'Ethene',
    iupac: 'Ethene (Ethylene)',
    atoms: [
      { x: 200, y: 150, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C },
      { x: 300, y: 150, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C },
      { x: 155, y: 105, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 155, y: 195, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 345, y: 105, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 345, y: 195, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
    ],
    bonds: [
      { from: 0, to: 1, order: 2 },
      { from: 0, to: 2, order: 1 },
      { from: 0, to: 3, order: 1 },
      { from: 1, to: 4, order: 1 },
      { from: 1, to: 5, order: 1 },
    ],
  };
}

function makeEthane(): MoleculeDef {
  return {
    name: 'Ethane',
    iupac: 'Ethane',
    atoms: [
      { x: 200, y: 150, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C },
      { x: 300, y: 150, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C },
      { x: 155, y: 105, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 155, y: 195, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 200, y: 85, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 345, y: 105, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 345, y: 195, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 300, y: 85, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
      { from: 0, to: 3, order: 1 },
      { from: 0, to: 4, order: 1 },
      { from: 1, to: 5, order: 1 },
      { from: 1, to: 6, order: 1 },
      { from: 1, to: 7, order: 1 },
    ],
  };
}

function makeBromoethane(): MoleculeDef {
  return {
    name: 'Bromoethane',
    iupac: 'Bromoethane',
    atoms: [
      { x: 200, y: 150, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C },
      { x: 300, y: 150, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C },
      { x: 155, y: 105, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 155, y: 195, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 200, y: 85, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 345, y: 105, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 345, y: 195, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 300, y: 85, label: 'Br', color: ATOM_COLORS.Br, textColor: ATOM_TEXT.Br },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
      { from: 0, to: 3, order: 1 },
      { from: 0, to: 4, order: 1 },
      { from: 1, to: 5, order: 1 },
      { from: 1, to: 6, order: 1 },
      { from: 1, to: 7, order: 1 },
    ],
  };
}

function makeEthanol(): MoleculeDef {
  return {
    name: 'Ethanol',
    iupac: 'Ethanol',
    atoms: [
      { x: 180, y: 150, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C },
      { x: 270, y: 150, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C },
      { x: 360, y: 150, label: 'O', color: ATOM_COLORS.O, textColor: ATOM_TEXT.O },
      { x: 410, y: 150, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 140, y: 105, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 140, y: 195, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 180, y: 85, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 270, y: 100, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 270, y: 200, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 1, to: 2, order: 1 },
      { from: 2, to: 3, order: 1 },
      { from: 0, to: 4, order: 1 },
      { from: 0, to: 5, order: 1 },
      { from: 0, to: 6, order: 1 },
      { from: 1, to: 7, order: 1 },
      { from: 1, to: 8, order: 1 },
    ],
  };
}

function makeEthanal(): MoleculeDef {
  return {
    name: 'Ethanal',
    iupac: 'Ethanal (Acetaldehyde)',
    atoms: [
      { x: 180, y: 150, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C },
      { x: 280, y: 150, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C },
      { x: 280, y: 85, label: 'O', color: ATOM_COLORS.O, textColor: ATOM_TEXT.O },
      { x: 340, y: 185, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 140, y: 105, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 140, y: 195, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 180, y: 85, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 1, to: 2, order: 2 },
      { from: 1, to: 3, order: 1 },
      { from: 0, to: 4, order: 1 },
      { from: 0, to: 5, order: 1 },
      { from: 0, to: 6, order: 1 },
    ],
  };
}

function makeEthanoicAcid(): MoleculeDef {
  return {
    name: 'Ethanoic Acid',
    iupac: 'Ethanoic acid (Acetic acid)',
    atoms: [
      { x: 160, y: 150, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C },
      { x: 260, y: 150, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C },
      { x: 260, y: 80, label: 'O', color: ATOM_COLORS.O, textColor: ATOM_TEXT.O },
      { x: 350, y: 150, label: 'O', color: ATOM_COLORS.O, textColor: ATOM_TEXT.O },
      { x: 400, y: 150, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 120, y: 105, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 120, y: 195, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 160, y: 85, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 1, to: 2, order: 2 },
      { from: 1, to: 3, order: 1 },
      { from: 3, to: 4, order: 1 },
      { from: 0, to: 5, order: 1 },
      { from: 0, to: 6, order: 1 },
      { from: 0, to: 7, order: 1 },
    ],
  };
}

function makeChloromethane(): MoleculeDef {
  return {
    name: 'Chloromethane',
    iupac: 'Chloromethane',
    atoms: [
      { x: 250, y: 150, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C },
      { x: 250, y: 85, label: 'Cl', color: ATOM_COLORS.Cl, textColor: ATOM_TEXT.Cl },
      { x: 315, y: 185, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 250, y: 215, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 185, y: 185, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
      { from: 0, to: 3, order: 1 },
      { from: 0, to: 4, order: 1 },
    ],
  };
}

function makePolyethylene(): MoleculeDef {
  return {
    name: 'Polyethylene',
    iupac: 'Poly(ethene)',
    atoms: [
      { x: 80, y: 150, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C },
      { x: 160, y: 150, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C },
      { x: 240, y: 150, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C },
      { x: 320, y: 150, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C },
      { x: 400, y: 150, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C },
      { x: 80, y: 100, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 80, y: 200, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 160, y: 100, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 160, y: 200, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 240, y: 100, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 240, y: 200, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 320, y: 100, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 320, y: 200, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 400, y: 100, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 400, y: 200, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 1, to: 2, order: 1 },
      { from: 2, to: 3, order: 1 },
      { from: 3, to: 4, order: 1 },
      { from: 0, to: 5, order: 1 },
      { from: 0, to: 6, order: 1 },
      { from: 1, to: 7, order: 1 },
      { from: 1, to: 8, order: 1 },
      { from: 2, to: 9, order: 1 },
      { from: 2, to: 10, order: 1 },
      { from: 3, to: 11, order: 1 },
      { from: 3, to: 12, order: 1 },
      { from: 4, to: 13, order: 1 },
      { from: 4, to: 14, order: 1 },
    ],
  };
}

function makeEster(): MoleculeDef {
  return {
    name: 'Ethyl Ethanoate',
    iupac: 'Ethyl ethanoate (Ethyl acetate)',
    atoms: [
      { x: 100, y: 150, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C },
      { x: 190, y: 150, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C },
      { x: 190, y: 80, label: 'O', color: ATOM_COLORS.O, textColor: ATOM_TEXT.O },
      { x: 280, y: 150, label: 'O', color: ATOM_COLORS.O, textColor: ATOM_TEXT.O },
      { x: 360, y: 150, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C },
      { x: 430, y: 150, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C },
      { x: 60, y: 110, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 60, y: 190, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 100, y: 85, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 360, y: 100, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 360, y: 200, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 470, y: 110, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 470, y: 190, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 430, y: 85, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 1, to: 2, order: 2 },
      { from: 1, to: 3, order: 1 },
      { from: 3, to: 4, order: 1 },
      { from: 4, to: 5, order: 1 },
      { from: 0, to: 6, order: 1 },
      { from: 0, to: 7, order: 1 },
      { from: 0, to: 8, order: 1 },
      { from: 4, to: 9, order: 1 },
      { from: 4, to: 10, order: 1 },
      { from: 5, to: 11, order: 1 },
      { from: 5, to: 12, order: 1 },
      { from: 5, to: 13, order: 1 },
    ],
  };
}

function makeChloroethane(): MoleculeDef {
  return {
    name: 'Chloroethane',
    iupac: 'Chloroethane',
    atoms: [
      { x: 200, y: 150, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C },
      { x: 300, y: 150, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C },
      { x: 155, y: 105, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 155, y: 195, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 200, y: 85, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 345, y: 105, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 345, y: 195, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 300, y: 85, label: 'Cl', color: ATOM_COLORS.Cl, textColor: ATOM_TEXT.Cl },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
      { from: 0, to: 3, order: 1 },
      { from: 0, to: 4, order: 1 },
      { from: 1, to: 5, order: 1 },
      { from: 1, to: 6, order: 1 },
      { from: 1, to: 7, order: 1 },
    ],
  };
}

function make12Dibromoethane(): MoleculeDef {
  return {
    name: '1,2-Dibromoethane',
    iupac: '1,2-Dibromoethane',
    atoms: [
      { x: 200, y: 150, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C },
      { x: 300, y: 150, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C },
      { x: 155, y: 100, label: 'Br', color: ATOM_COLORS.Br, textColor: ATOM_TEXT.Br },
      { x: 200, y: 85, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 155, y: 200, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 345, y: 100, label: 'Br', color: ATOM_COLORS.Br, textColor: ATOM_TEXT.Br },
      { x: 300, y: 85, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 345, y: 200, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
      { from: 0, to: 3, order: 1 },
      { from: 0, to: 4, order: 1 },
      { from: 1, to: 5, order: 1 },
      { from: 1, to: 6, order: 1 },
      { from: 1, to: 7, order: 1 },
    ],
  };
}

function makeSodiumEthanoate(): MoleculeDef {
  return {
    name: 'Sodium Ethanoate',
    iupac: 'Sodium ethanoate (Sodium acetate)',
    atoms: [
      { x: 150, y: 150, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C },
      { x: 250, y: 150, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C },
      { x: 250, y: 80, label: 'O', color: ATOM_COLORS.O, textColor: ATOM_TEXT.O },
      { x: 340, y: 150, label: 'O', color: ATOM_COLORS.O, textColor: ATOM_TEXT.O },
      { x: 400, y: 150, label: 'Na', color: '#7c3aed', textColor: '#ffffff' },
      { x: 105, y: 105, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 105, y: 195, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
      { x: 150, y: 85, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 14 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 1, to: 2, order: 2 },
      { from: 1, to: 3, order: 1 },
      { from: 3, to: 4, order: 1 },
      { from: 0, to: 5, order: 1 },
      { from: 0, to: 6, order: 1 },
      { from: 0, to: 7, order: 1 },
    ],
  };
}

// ── Reactions ──────────────────────────────────────────────────────────────────

const reactions: Reaction[] = [
  // Alkane reactions
  {
    name: 'Combustion of Methane',
    category: 'alkane',
    type: 'Combustion',
    reactant: makeMethane(),
    product: makeCO2(),
    reagent: 'Excess O\u2082',
    conditions: 'Ignition / Spark',
    mechanism: 'Free radical',
    equation: 'CH\u2084 + 2O\u2082 \u2192 CO\u2082 + 2H\u2082O',
    description: 'Complete combustion of methane in excess oxygen produces carbon dioxide and water. This is a highly exothermic reaction (\u0394H = -890 kJ/mol) and is the basis of natural gas energy.',
    keyPoints: ['Exothermic reaction', 'Requires ignition energy', 'Products: CO\u2082 and H\u2082O', 'Incomplete combustion produces CO'],
  },
  {
    name: 'Halogenation of Methane',
    category: 'alkane',
    type: 'Free Radical Substitution',
    reactant: makeMethane(),
    product: makeChloromethane(),
    reagent: 'Cl\u2082',
    conditions: 'UV light',
    mechanism: 'Free radical substitution',
    equation: 'CH\u2084 + Cl\u2082 \u2192 CH\u2083Cl + HCl',
    description: 'In the presence of UV light, chlorine radicals replace hydrogen atoms on methane via a chain reaction. Initiation produces Cl\u2022 radicals, propagation sustains the chain, and termination forms stable products.',
    keyPoints: ['Three stages: initiation, propagation, termination', 'UV light breaks Cl-Cl bond homolytically', 'Further substitution can occur (CH\u2082Cl\u2082, CHCl\u2083, CCl\u2084)', 'Radical intermediates are highly reactive'],
  },
  // Alkene reactions
  {
    name: 'Hydrogenation of Ethene',
    category: 'alkene',
    type: 'Addition',
    reactant: makeEthene(),
    product: makeEthane(),
    reagent: 'H\u2082',
    conditions: 'Ni catalyst, 150\u00b0C',
    mechanism: 'Electrophilic addition',
    equation: 'C\u2082H\u2084 + H\u2082 \u2192 C\u2082H\u2086',
    description: 'Hydrogen adds across the C=C double bond, converting the alkene to an alkane. The nickel catalyst provides a surface for both H\u2082 and the alkene to adsorb, weakening the bonds.',
    keyPoints: ['C=C double bond broken', 'Single C-C bond formed', 'Used in margarine production (hydrogenating vegetable oils)', 'Catalyst lowers activation energy'],
  },
  {
    name: 'Addition of HBr to Ethene',
    category: 'alkene',
    type: 'Addition',
    reactant: makeEthene(),
    product: makeBromoethane(),
    reagent: 'HBr',
    conditions: 'Room temperature',
    mechanism: 'Electrophilic addition',
    equation: 'C\u2082H\u2084 + HBr \u2192 C\u2082H\u2085Br',
    description: 'HBr adds across the double bond via electrophilic addition. The electron-rich C=C attacks the electrophilic H\u207a of HBr. With unsymmetrical alkenes, Markovnikov\'s rule predicts the major product.',
    keyPoints: ['Electrophilic addition mechanism', 'H\u207a is the electrophile', 'Carbocation intermediate formed', 'Markovnikov\'s rule applies for asymmetric alkenes'],
  },
  {
    name: 'Hydration of Ethene',
    category: 'alkene',
    type: 'Addition',
    reactant: makeEthene(),
    product: makeEthanol(),
    reagent: 'H\u2082O (steam)',
    conditions: 'H\u2083PO\u2084 catalyst, 300\u00b0C, 60 atm',
    mechanism: 'Electrophilic addition',
    equation: 'C\u2082H\u2084 + H\u2082O \u2192 C\u2082H\u2085OH',
    description: 'Steam reacts with ethene in the presence of a phosphoric acid catalyst to produce ethanol. This is an industrial method for producing ethanol, complementing fermentation.',
    keyPoints: ['Industrial production of ethanol', 'High temperature and pressure needed', 'Phosphoric acid catalyst', 'Addition of water across C=C'],
  },
  {
    name: 'Polymerization of Ethene',
    category: 'alkene',
    type: 'Addition Polymerization',
    reactant: makeEthene(),
    product: makePolyethylene(),
    reagent: 'Radical initiator',
    conditions: 'High pressure, 200\u00b0C',
    mechanism: 'Free radical / coordination',
    equation: 'nCH\u2082=CH\u2082 \u2192 -(CH\u2082-CH\u2082)\u2099-',
    description: 'Many ethene monomers join together by opening their double bonds to form long chains of polyethylene. This is addition polymerization \u2014 no atoms are lost in the process.',
    keyPoints: ['Monomer: ethene (CH\u2082=CH\u2082)', 'Double bonds open to form single bonds', 'No by-products (addition polymer)', 'Products: plastic bags, bottles, pipes'],
  },
  // Alcohol reactions
  {
    name: 'Oxidation of Ethanol',
    category: 'alcohol',
    type: 'Oxidation',
    reactant: makeEthanol(),
    product: makeEthanal(),
    reagent: 'K\u2082Cr\u2082O\u2087 / H\u2082SO\u2084',
    conditions: 'Distillation, heat',
    mechanism: 'Oxidation',
    equation: 'CH\u2083CH\u2082OH + [O] \u2192 CH\u2083CHO + H\u2082O',
    description: 'Primary alcohols are oxidized first to aldehydes, then further to carboxylic acids. Distilling the aldehyde immediately prevents further oxidation. The orange dichromate turns green (Cr\u00b3\u207a).',
    keyPoints: ['Primary alcohol \u2192 aldehyde \u2192 carboxylic acid', 'K\u2082Cr\u2082O\u2087 changes from orange to green', 'Distillation collects aldehyde product', 'Secondary alcohols \u2192 ketones (cannot be further oxidized)'],
  },
  {
    name: 'Oxidation to Carboxylic Acid',
    category: 'alcohol',
    type: 'Oxidation',
    reactant: makeEthanol(),
    product: makeEthanoicAcid(),
    reagent: 'K\u2082Cr\u2082O\u2087 / H\u2082SO\u2084',
    conditions: 'Reflux, heat',
    mechanism: 'Oxidation',
    equation: 'CH\u2083CH\u2082OH + 2[O] \u2192 CH\u2083COOH + H\u2082O',
    description: 'Refluxing ethanol with excess acidified potassium dichromate fully oxidizes it to ethanoic acid (acetic acid). Reflux ensures the aldehyde intermediate is not lost and is further oxidized.',
    keyPoints: ['Full oxidation of primary alcohol', 'Reflux prevents aldehyde escaping', 'Orange to green color change', 'Produces carboxylic acid'],
  },
  {
    name: 'Dehydration of Ethanol',
    category: 'alcohol',
    type: 'Elimination',
    reactant: makeEthanol(),
    product: makeEthene(),
    reagent: 'Conc. H\u2082SO\u2084',
    conditions: '170\u00b0C',
    mechanism: 'Elimination (E1)',
    equation: 'C\u2082H\u2085OH \u2192 C\u2082H\u2084 + H\u2082O',
    description: 'Concentrated sulfuric acid acts as a dehydrating agent, removing water from ethanol to form ethene. This is an elimination reaction; the reverse of hydration.',
    keyPoints: ['Loss of H\u2082O (dehydration)', 'C=C double bond formed', 'Reverse of hydration', 'Acid catalyst required'],
  },
  {
    name: 'Esterification',
    category: 'alcohol',
    type: 'Condensation',
    reactant: makeEthanol(),
    product: makeEster(),
    reagent: 'CH\u2083COOH',
    conditions: 'Conc. H\u2082SO\u2084 catalyst, reflux',
    mechanism: 'Nucleophilic acyl substitution',
    equation: 'CH\u2083COOH + C\u2082H\u2085OH \u21cc CH\u2083COOC\u2082H\u2085 + H\u2082O',
    description: 'An alcohol reacts with a carboxylic acid to form an ester and water. This is a reversible condensation reaction catalyzed by concentrated sulfuric acid. Esters have characteristic fruity smells.',
    keyPoints: ['Reversible reaction (equilibrium)', 'Produces ester + water', 'Esters used in flavourings and perfumes', 'Acid catalyst speeds equilibrium'],
  },
  // Substitution
  {
    name: 'SN2 Mechanism',
    category: 'substitution',
    type: 'Nucleophilic Substitution',
    reactant: makeChloroethane(),
    product: makeEthanol(),
    reagent: 'NaOH (aq)',
    conditions: 'Warm, aqueous',
    mechanism: 'SN2 (bimolecular)',
    equation: 'C\u2082H\u2085Cl + NaOH \u2192 C\u2082H\u2085OH + NaCl',
    description: 'The hydroxide nucleophile attacks the carbon bearing the leaving group (Cl) from the opposite side (backside attack). Bond making and bond breaking occur simultaneously in a single concerted step.',
    keyPoints: ['One-step concerted mechanism', 'Backside attack \u2192 inversion of configuration', 'Rate = k[substrate][nucleophile]', 'Favored by primary substrates and strong nucleophiles'],
  },
  {
    name: 'SN1 Mechanism',
    category: 'substitution',
    type: 'Nucleophilic Substitution',
    reactant: makeBromoethane(),
    product: makeEthanol(),
    reagent: 'H\u2082O',
    conditions: 'Warm, aqueous',
    mechanism: 'SN1 (unimolecular)',
    equation: 'C\u2082H\u2085Br + H\u2082O \u2192 C\u2082H\u2085OH + HBr',
    description: 'The leaving group departs first to form a carbocation intermediate, which is then attacked by the nucleophile. This two-step mechanism is favored by tertiary substrates where steric bulk blocks SN2.',
    keyPoints: ['Two-step mechanism via carbocation', 'Rate = k[substrate] only', 'Racemisation at chiral centres', 'Favored by tertiary substrates and weak nucleophiles'],
  },
  // Alkene — Bromination
  {
    name: 'Bromination of Ethene',
    category: 'alkene',
    type: 'Addition',
    reactant: makeEthene(),
    product: make12Dibromoethane(),
    reagent: 'Br\u2082',
    conditions: 'Room temperature',
    mechanism: 'Electrophilic addition',
    equation: 'C\u2082H\u2084 + Br\u2082 \u2192 CH\u2082BrCH\u2082Br',
    description: 'Bromine adds across the C=C double bond. The orange-brown bromine water is decolorized — this is the classic test for unsaturation (C=C double bonds) in organic chemistry.',
    keyPoints: ['Orange bromine water decolorizes (test for C=C)', 'Electrophilic addition mechanism', 'Bromonium ion intermediate formed', 'Anti-addition: Br atoms add to opposite faces'],
  },
  // Alcohol — Combustion
  {
    name: 'Combustion of Ethanol',
    category: 'alcohol',
    type: 'Combustion',
    reactant: makeEthanol(),
    product: makeCO2(),
    reagent: 'Excess O\u2082',
    conditions: 'Ignition / Spark',
    mechanism: 'Free radical',
    equation: 'C\u2082H\u2085OH + 3O\u2082 \u2192 2CO\u2082 + 3H\u2082O',
    description: 'Ethanol burns cleanly in excess oxygen with a blue flame, producing carbon dioxide and water. Ethanol is used as a biofuel and fuel additive because of its renewable production via fermentation.',
    keyPoints: ['Exothermic reaction', 'Burns with clean blue flame', 'Used as biofuel (E10, E85 blends)', 'Renewable: produced by fermentation of sugars'],
  },
  // Carbonyl reactions
  {
    name: 'Reduction of Ethanal',
    category: 'carbonyl',
    type: 'Reduction',
    reactant: makeEthanal(),
    product: makeEthanol(),
    reagent: 'NaBH\u2084',
    conditions: 'Room temperature, aqueous',
    mechanism: 'Nucleophilic addition',
    equation: 'CH\u2083CHO + 2[H] \u2192 CH\u2083CH\u2082OH',
    description: 'Sodium borohydride (NaBH\u2084) donates a hydride ion (H\u207b) which attacks the electrophilic carbon of the C=O group. This is the reverse of alcohol oxidation, converting an aldehyde back to a primary alcohol.',
    keyPoints: ['NaBH\u2084 is a mild reducing agent', 'Hydride (H\u207b) attacks electrophilic C=O carbon', 'Aldehyde \u2192 primary alcohol', 'Reverse of oxidation with K\u2082Cr\u2082O\u2087'],
  },
  {
    name: 'Tollens\u2019 Test (Silver Mirror)',
    category: 'carbonyl',
    type: 'Oxidation',
    reactant: makeEthanal(),
    product: makeEthanoicAcid(),
    reagent: 'Tollens\u2019 reagent [Ag(NH\u2083)\u2082]\u207a',
    conditions: 'Warm water bath',
    mechanism: 'Oxidation',
    equation: 'CH\u2083CHO + 2Ag\u207a + H\u2082O \u2192 CH\u2083COOH + 2Ag',
    description: 'Tollens\u2019 reagent contains silver ions in ammonia solution. Aldehydes reduce Ag\u207a to metallic silver, forming a silver mirror on the test tube. Ketones do NOT react — this distinguishes aldehydes from ketones.',
    keyPoints: ['Silver mirror forms on test tube walls', 'Positive test = aldehyde present', 'Ketones give negative result', 'Ag\u207a is reduced to Ag(s)'],
  },
  // Carboxylic acid reactions
  {
    name: 'Neutralization',
    category: 'carboxylic',
    type: 'Acid-Base',
    reactant: makeEthanoicAcid(),
    product: makeSodiumEthanoate(),
    reagent: 'NaOH (aq)',
    conditions: 'Room temperature',
    mechanism: 'Proton transfer',
    equation: 'CH\u2083COOH + NaOH \u2192 CH\u2083COONa + H\u2082O',
    description: 'Carboxylic acids are weak acids. They react with bases like NaOH in a neutralization reaction to form a salt (sodium ethanoate) and water. The carboxyl group donates its proton (H\u207a) to the hydroxide ion.',
    keyPoints: ['Carboxylic acids are weak acids (partial dissociation)', 'Products: salt + water', 'Also reacts with Na\u2082CO\u2083 (produces CO\u2082 — effervescence test)', 'pKa of ethanoic acid \u2248 4.76'],
  },
  {
    name: 'Reduction to Alcohol',
    category: 'carboxylic',
    type: 'Reduction',
    reactant: makeEthanoicAcid(),
    product: makeEthanol(),
    reagent: 'LiAlH\u2084',
    conditions: 'Dry ether, reflux',
    mechanism: 'Nucleophilic addition',
    equation: 'CH\u2083COOH + 4[H] \u2192 CH\u2083CH\u2082OH + H\u2082O',
    description: 'Lithium aluminium hydride (LiAlH\u2084) is a powerful reducing agent that reduces carboxylic acids all the way to primary alcohols. Unlike NaBH\u2084, LiAlH\u2084 is strong enough to reduce the C=O of a carboxylic acid.',
    keyPoints: ['LiAlH\u2084 is a strong reducing agent', 'Must use dry ether (reacts violently with water)', 'Carboxylic acid \u2192 primary alcohol', 'NaBH\u2084 is too weak for this reduction'],
  },
];

// ── Functional groups ──────────────────────────────────────────────────────────

const functionalGroups: FunctionalGroup[] = [
  {
    name: 'Hydroxyl',
    formula: '-OH',
    className: 'Alcohol',
    atoms: [
      { x: 15, y: 22, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C, size: 10 },
      { x: 42, y: 22, label: 'O', color: ATOM_COLORS.O, textColor: ATOM_TEXT.O, size: 10 },
      { x: 65, y: 22, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 8 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 1, to: 2, order: 1 },
    ],
  },
  {
    name: 'Carbonyl',
    formula: 'C=O',
    className: 'Aldehyde / Ketone',
    atoms: [
      { x: 25, y: 28, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C, size: 10 },
      { x: 55, y: 12, label: 'O', color: ATOM_COLORS.O, textColor: ATOM_TEXT.O, size: 10 },
    ],
    bonds: [
      { from: 0, to: 1, order: 2 },
    ],
  },
  {
    name: 'Carboxyl',
    formula: '-COOH',
    className: 'Carboxylic Acid',
    atoms: [
      { x: 10, y: 22, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C, size: 10 },
      { x: 10, y: 6, label: 'O', color: ATOM_COLORS.O, textColor: ATOM_TEXT.O, size: 8 },
      { x: 38, y: 22, label: 'O', color: ATOM_COLORS.O, textColor: ATOM_TEXT.O, size: 10 },
      { x: 60, y: 22, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 8 },
    ],
    bonds: [
      { from: 0, to: 1, order: 2 },
      { from: 0, to: 2, order: 1 },
      { from: 2, to: 3, order: 1 },
    ],
  },
  {
    name: 'Amine',
    formula: '-NH\u2082',
    className: 'Amine',
    atoms: [
      { x: 12, y: 22, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C, size: 10 },
      { x: 40, y: 22, label: 'N', color: ATOM_COLORS.N, textColor: ATOM_TEXT.N, size: 10 },
      { x: 58, y: 10, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 8 },
      { x: 58, y: 34, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 8 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 1, to: 2, order: 1 },
      { from: 1, to: 3, order: 1 },
    ],
  },
  {
    name: 'Ester',
    formula: '-COO-',
    className: 'Ester',
    atoms: [
      { x: 10, y: 25, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C, size: 10 },
      { x: 10, y: 8, label: 'O', color: ATOM_COLORS.O, textColor: ATOM_TEXT.O, size: 8 },
      { x: 38, y: 25, label: 'O', color: ATOM_COLORS.O, textColor: ATOM_TEXT.O, size: 10 },
      { x: 62, y: 25, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C, size: 10 },
    ],
    bonds: [
      { from: 0, to: 1, order: 2 },
      { from: 0, to: 2, order: 1 },
      { from: 2, to: 3, order: 1 },
    ],
  },
  {
    name: 'Amide',
    formula: '-CONH\u2082',
    className: 'Amide',
    atoms: [
      { x: 8, y: 22, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C, size: 10 },
      { x: 8, y: 6, label: 'O', color: ATOM_COLORS.O, textColor: ATOM_TEXT.O, size: 8 },
      { x: 36, y: 22, label: 'N', color: ATOM_COLORS.N, textColor: ATOM_TEXT.N, size: 10 },
      { x: 54, y: 12, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 8 },
      { x: 54, y: 32, label: 'H', color: ATOM_COLORS.H, textColor: ATOM_TEXT.H, size: 8 },
    ],
    bonds: [
      { from: 0, to: 1, order: 2 },
      { from: 0, to: 2, order: 1 },
      { from: 2, to: 3, order: 1 },
      { from: 2, to: 4, order: 1 },
    ],
  },
  {
    name: 'Halide',
    formula: 'C-X',
    className: 'Haloalkane',
    atoms: [
      { x: 20, y: 22, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C, size: 10 },
      { x: 52, y: 22, label: 'Cl', color: ATOM_COLORS.Cl, textColor: ATOM_TEXT.Cl, size: 10 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
    ],
  },
  {
    name: 'Nitrile',
    formula: '-C\u2261N',
    className: 'Nitrile',
    atoms: [
      { x: 20, y: 22, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C, size: 10 },
      { x: 52, y: 22, label: 'N', color: ATOM_COLORS.N, textColor: ATOM_TEXT.N, size: 10 },
    ],
    bonds: [
      { from: 0, to: 1, order: 3 },
    ],
  },
  {
    name: 'Alkene',
    formula: 'C=C',
    className: 'Alkene',
    atoms: [
      { x: 20, y: 22, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C, size: 10 },
      { x: 52, y: 22, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C, size: 10 },
    ],
    bonds: [
      { from: 0, to: 1, order: 2 },
    ],
  },
  {
    name: 'Ether',
    formula: 'C-O-C',
    className: 'Ether',
    atoms: [
      { x: 8, y: 22, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C, size: 10 },
      { x: 36, y: 22, label: 'O', color: ATOM_COLORS.O, textColor: ATOM_TEXT.O, size: 10 },
      { x: 64, y: 22, label: 'C', color: ATOM_COLORS.C, textColor: ATOM_TEXT.C, size: 10 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 1, to: 2, order: 1 },
    ],
  },
];

// ── Category metadata ──────────────────────────────────────────────────────────

const categories: { key: ReactionCategory; label: string; color: string }[] = [
  { key: 'alkane', label: 'Alkane', color: 'emerald' },
  { key: 'alkene', label: 'Alkene', color: 'green' },
  { key: 'alcohol', label: 'Alcohol', color: 'teal' },
  { key: 'carbonyl', label: 'Carbonyl', color: 'amber' },
  { key: 'carboxylic', label: 'Carboxylic', color: 'rose' },
  { key: 'substitution', label: 'Substitution', color: 'lime' },
];

// ── SVG renderers ──────────────────────────────────────────────────────────────

function renderBond(b: BondDef, atoms: AtomPos[], key: string) {
  const a1 = atoms[b.from];
  const a2 = atoms[b.to];
  const dx = a2.x - a1.x;
  const dy = a2.y - a1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = -dy / len;
  const ny = dx / len;

  if (b.order === 1) {
    return (
      <line
        key={key}
        x1={a1.x} y1={a1.y} x2={a2.x} y2={a2.y}
        stroke="#6b7280"
        strokeWidth="2.5"
        className="dark:stroke-gray-400"
      />
    );
  }
  if (b.order === 2) {
    const offset = 4;
    return (
      <g key={key}>
        <line
          x1={a1.x + nx * offset} y1={a1.y + ny * offset}
          x2={a2.x + nx * offset} y2={a2.y + ny * offset}
          stroke="#6b7280" strokeWidth="2.5" className="dark:stroke-gray-400"
        />
        <line
          x1={a1.x - nx * offset} y1={a1.y - ny * offset}
          x2={a2.x - nx * offset} y2={a2.y - ny * offset}
          stroke="#6b7280" strokeWidth="2.5" className="dark:stroke-gray-400"
        />
      </g>
    );
  }
  // Triple bond
  const offset = 5;
  return (
    <g key={key}>
      <line x1={a1.x} y1={a1.y} x2={a2.x} y2={a2.y}
        stroke="#6b7280" strokeWidth="2.5" className="dark:stroke-gray-400" />
      <line
        x1={a1.x + nx * offset} y1={a1.y + ny * offset}
        x2={a2.x + nx * offset} y2={a2.y + ny * offset}
        stroke="#6b7280" strokeWidth="2.5" className="dark:stroke-gray-400"
      />
      <line
        x1={a1.x - nx * offset} y1={a1.y - ny * offset}
        x2={a2.x - nx * offset} y2={a2.y - ny * offset}
        stroke="#6b7280" strokeWidth="2.5" className="dark:stroke-gray-400"
      />
    </g>
  );
}

function renderAtom(a: AtomPos, key: string) {
  const r = a.size ?? 18;
  return (
    <g key={key}>
      <circle cx={a.x} cy={a.y} r={r} fill={a.color} stroke="#fff" strokeWidth="1.5" />
      <text
        x={a.x}
        y={a.y}
        fill={a.textColor ?? '#fff'}
        fontSize={r > 14 ? 12 : 9}
        fontWeight="bold"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {a.label}
      </text>
    </g>
  );
}

function renderMiniGroup(fg: FunctionalGroup) {
  return (
    <svg width="74" height="42" viewBox="0 0 74 42" className="flex-shrink-0">
      {fg.bonds.map((b, i) => {
        const a1 = fg.atoms[b.from];
        const a2 = fg.atoms[b.to];
        const dx = a2.x - a1.x;
        const dy = a2.y - a1.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const nx = -dy / len;
        const ny = dx / len;
        if (b.order === 2) {
          const off = 2.5;
          return (
            <g key={i}>
              <line x1={a1.x + nx * off} y1={a1.y + ny * off} x2={a2.x + nx * off} y2={a2.y + ny * off} stroke="#6b7280" strokeWidth="1.5" className="dark:stroke-gray-400" />
              <line x1={a1.x - nx * off} y1={a1.y - ny * off} x2={a2.x - nx * off} y2={a2.y - ny * off} stroke="#6b7280" strokeWidth="1.5" className="dark:stroke-gray-400" />
            </g>
          );
        }
        return <line key={i} x1={a1.x} y1={a1.y} x2={a2.x} y2={a2.y} stroke="#6b7280" strokeWidth="1.5" className="dark:stroke-gray-400" />;
      })}
      {fg.atoms.map((a, i) => (
        <g key={i}>
          <circle cx={a.x} cy={a.y} r={a.size ?? 10} fill={a.color} stroke="#fff" strokeWidth="1" />
          <text x={a.x} y={a.y} fill={a.textColor ?? '#fff'} fontSize={7} fontWeight="bold" textAnchor="middle" dominantBaseline="central">
            {a.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export const OrganicChemistry: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<ReactionCategory>('alkane');
  const [selectedReactionIdx, setSelectedReactionIdx] = useState(0);
  const [animProgress, setAnimProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showFunctionalGroups, setShowFunctionalGroups] = useState(false);

  const animFrameRef = useRef<number | null>(null);
  const animStartRef = useRef<number>(0);
  const ANIM_DURATION = 2000; // 2 seconds

  // Cleanup animation on unmount or reaction change
  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, []);

  // Reset animation when reaction changes
  useEffect(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setAnimProgress(0);
    setIsAnimating(false);
  }, [selectedCategory, selectedReactionIdx]);

  const filteredReactions = reactions.filter(r => r.category === selectedCategory);
  const currentReaction = filteredReactions[selectedReactionIdx] ?? filteredReactions[0];

  const handleSelectCategory = (cat: ReactionCategory) => {
    setSelectedCategory(cat);
    setSelectedReactionIdx(0);
  };

  const handleSelectReaction = (idx: number) => {
    setSelectedReactionIdx(idx);
  };

  const startAnimation = () => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setAnimProgress(0);
    setIsAnimating(true);
    animStartRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - animStartRef.current;
      const progress = Math.min(elapsed / ANIM_DURATION, 1);
      setAnimProgress(progress);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        animFrameRef.current = null;
        setIsAnimating(false);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
  };

  const categoryColors: Record<ReactionCategory, string> = {
    alkane: 'bg-emerald-500',
    alkene: 'bg-green-500',
    alcohol: 'bg-teal-500',
    carbonyl: 'bg-amber-500',
    carboxylic: 'bg-rose-500',
    substitution: 'bg-lime-600',
  };

  const categoryColorsLight: Record<ReactionCategory, string> = {
    alkane: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
    alkene: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700',
    alcohol: 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200 border-teal-300 dark:border-teal-700',
    carbonyl: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700',
    carboxylic: 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700',
    substitution: 'bg-lime-100 dark:bg-lime-900/30 text-lime-800 dark:text-lime-200 border-lime-300 dark:border-lime-700',
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 p-3 overflow-hidden">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Atom className="h-5 w-5 text-emerald-600" />
            Organic Chemistry Reaction Pathways
          </h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Explore reaction mechanisms, functional groups, and organic transformations
          </p>
        </div>
        <button
          onClick={() => setShowFunctionalGroups(!showFunctionalGroups)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
            showFunctionalGroups
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          {showFunctionalGroups ? 'Hide' : 'Show'} Functional Groups
        </button>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex gap-3 min-h-0">
        {/* Left side */}
        <div className="flex-1 flex flex-col gap-2.5 min-w-0 min-h-0">
          {/* Category tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => handleSelectCategory(cat.key)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                  selectedCategory === cat.key
                    ? `${categoryColorsLight[cat.key]} border shadow-sm`
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Reaction selector row */}
          <div className="flex gap-1.5 flex-wrap">
            {filteredReactions.map((r, idx) => (
              <button
                key={r.name}
                onClick={() => handleSelectReaction(idx)}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all border ${
                  selectedReactionIdx === idx
                    ? `${categoryColors[selectedCategory]} text-white border-transparent shadow-sm`
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>

          {/* Molecule viewer */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 flex flex-col" style={{ flex: '1 1 0', minHeight: 0 }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-800 dark:text-white flex items-center gap-1.5">
                <Atom className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Structural Formula &mdash; {animProgress > 0.5 ? currentReaction.product.name : currentReaction.reactant.name}
              </span>
              <span className="text-[9px] text-gray-400 dark:text-gray-500 font-mono">
                {animProgress > 0.5 ? currentReaction.product.iupac : currentReaction.reactant.iupac}
              </span>
            </div>
            <div className="flex-1 min-h-0 flex items-center justify-center">
              <svg
                className="w-full h-full"
                viewBox="0 0 500 300"
                preserveAspectRatio="xMidYMid meet"
                style={{ maxHeight: 260 }}
              >
                <defs>
                  <radialGradient id="burstGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#34d399" stopOpacity="0.9" />
                    <stop offset="60%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0" />
                  </radialGradient>
                  <filter id="reagentGlow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Phase 0-0.3: Reactant visible, fading and scaling down */}
                {animProgress <= 0.5 && (
                  <g
                    style={{
                      opacity: animProgress <= 0.3
                        ? 1 - animProgress * 1.5
                        : 0,
                      transform: `translate(250px, 150px) scale(${animProgress <= 0.3 ? 1 - animProgress * 0.3 : 0.91}) translate(-250px, -150px)`,
                      transformOrigin: '250px 150px',
                    }}
                  >
                    {currentReaction.reactant.bonds.map((b, i) =>
                      renderBond(b, currentReaction.reactant.atoms, `rbond-${i}`)
                    )}
                    {currentReaction.reactant.atoms.map((a, i) =>
                      renderAtom(a, `ratom-${i}`)
                    )}
                  </g>
                )}

                {/* Phase 0.3-0.5: Reaction burst/spark effect */}
                {animProgress > 0.2 && animProgress < 0.6 && (() => {
                  const burstProgress = animProgress < 0.3
                    ? (animProgress - 0.2) / 0.1
                    : animProgress > 0.5
                      ? 1 - (animProgress - 0.5) / 0.1
                      : 1;
                  const burstScale = 0.5 + burstProgress * 0.5;
                  const sparkCount = 8;
                  return (
                    <g style={{ opacity: burstProgress }}>
                      {/* Central burst glow */}
                      <circle
                        cx={250} cy={150}
                        r={40 * burstScale}
                        fill="url(#burstGlow)"
                      />
                      <circle
                        cx={250} cy={150}
                        r={20 * burstScale}
                        fill="#34d399"
                        opacity={0.6}
                      />
                      {/* Radiating spark lines */}
                      {Array.from({ length: sparkCount }).map((_, i) => {
                        const angle = (i / sparkCount) * Math.PI * 2;
                        const innerR = 18 * burstScale;
                        const outerR = (35 + Math.sin(animProgress * 20 + i) * 10) * burstScale;
                        return (
                          <line
                            key={`spark-${i}`}
                            x1={250 + Math.cos(angle) * innerR}
                            y1={150 + Math.sin(angle) * innerR}
                            x2={250 + Math.cos(angle) * outerR}
                            y2={150 + Math.sin(angle) * outerR}
                            stroke="#6ee7b7"
                            strokeWidth={2}
                            strokeLinecap="round"
                            opacity={0.7 + Math.sin(animProgress * 15 + i * 0.8) * 0.3}
                          />
                        );
                      })}
                      {/* Expanding ring */}
                      <circle
                        cx={250} cy={150}
                        r={25 + burstProgress * 30}
                        fill="none"
                        stroke="#34d399"
                        strokeWidth={2 - burstProgress * 1.5}
                        opacity={1 - burstProgress * 0.6}
                      />
                    </g>
                  );
                })()}

                {/* Phase 0.5-0.7: Reagent text with glow */}
                {animProgress >= 0.35 && animProgress <= 0.75 && (() => {
                  const textProgress = animProgress < 0.5
                    ? (animProgress - 0.35) / 0.15
                    : animProgress > 0.65
                      ? 1 - (animProgress - 0.65) / 0.1
                      : 1;
                  return (
                    <g style={{ opacity: textProgress }} filter="url(#reagentGlow)">
                      <text
                        x={250} y={140}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#059669"
                        fontSize={18}
                        fontWeight="bold"
                        className="dark:fill-emerald-400"
                      >
                        {currentReaction.reagent}
                      </text>
                      <text
                        x={250} y={165}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#6b7280"
                        fontSize={12}
                        fontStyle="italic"
                        className="dark:fill-gray-400"
                      >
                        {currentReaction.conditions}
                      </text>
                    </g>
                  );
                })()}

                {/* Phase 0.7-1.0: Product fading in and scaling up */}
                {animProgress > 0.5 && (
                  <g
                    style={{
                      opacity: animProgress >= 0.7
                        ? Math.min((animProgress - 0.7) / 0.2, 1)
                        : 0,
                      transform: `translate(250px, 150px) scale(${animProgress >= 0.7 ? 0.9 + Math.min((animProgress - 0.7) / 0.2, 1) * 0.1 : 0.9}) translate(-250px, -150px)`,
                      transformOrigin: '250px 150px',
                    }}
                  >
                    {currentReaction.product.bonds.map((b, i) =>
                      renderBond(b, currentReaction.product.atoms, `pbond-${i}`)
                    )}
                    {currentReaction.product.atoms.map((a, i) =>
                      renderAtom(a, `patom-${i}`)
                    )}
                  </g>
                )}

                {/* Default state (not animating): show reactant or final product */}
                {!isAnimating && animProgress === 0 && (
                  <g>
                    {currentReaction.reactant.bonds.map((b, i) =>
                      renderBond(b, currentReaction.reactant.atoms, `dbond-${i}`)
                    )}
                    {currentReaction.reactant.atoms.map((a, i) =>
                      renderAtom(a, `datom-${i}`)
                    )}
                  </g>
                )}
                {!isAnimating && animProgress === 1 && (
                  <g>
                    {currentReaction.product.bonds.map((b, i) =>
                      renderBond(b, currentReaction.product.atoms, `fbond-${i}`)
                    )}
                    {currentReaction.product.atoms.map((a, i) =>
                      renderAtom(a, `fatom-${i}`)
                    )}
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* Reaction pathway display */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-800 dark:text-white flex items-center gap-1.5">
                <ArrowRight className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Reaction Pathway
              </span>
              <button
                onClick={startAnimation}
                disabled={isAnimating}
                className={`px-3 py-1 text-white text-[11px] font-semibold rounded-md transition-all shadow-sm ${
                  isAnimating
                    ? 'bg-emerald-400 cursor-not-allowed opacity-70'
                    : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
              >
                {isAnimating ? 'Animating...' : 'Animate'}
              </button>
            </div>

            {/* Equation display */}
            <div className="text-center py-1 mb-2 bg-gray-50 dark:bg-gray-700 rounded-md">
              <span className="text-sm font-mono font-semibold text-gray-800 dark:text-white">
                {currentReaction.equation}
              </span>
            </div>

            {/* Flow display: reactant -> reagent -> product */}
            <div className="flex items-center justify-center gap-3">
              {/* Reactant */}
              <div
                className={`flex flex-col items-center px-4 py-2 rounded-lg border-2 transition-all duration-300 ${
                  !isAnimating || animProgress < 0.3
                    ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 scale-105'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
                }`}
              >
                <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Reactant</span>
                <span className="text-sm font-bold font-mono text-gray-800 dark:text-white">
                  {currentReaction.reactant.name}
                </span>
              </div>

              {/* Arrow with reagent */}
              <div className="flex flex-col items-center gap-0.5">
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded transition-all duration-300 ${
                  isAnimating && animProgress >= 0.3 && animProgress <= 0.7
                    ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 shadow-sm shadow-emerald-200 dark:shadow-emerald-900'
                    : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                }`}>
                  {currentReaction.reagent}
                </span>
                <div className="flex items-center">
                  <div className="h-0.5 w-12 relative overflow-hidden bg-gray-300 dark:bg-gray-600 rounded">
                    <div
                      className="absolute inset-y-0 left-0 bg-emerald-500 rounded transition-none"
                      style={{
                        width: isAnimating
                          ? `${Math.min(Math.max((animProgress - 0.3) / 0.4, 0), 1) * 100}%`
                          : animProgress === 1 ? '100%' : '0%',
                      }}
                    />
                  </div>
                  <ArrowRight className={`h-5 w-5 transition-all duration-300 ${
                    (isAnimating && animProgress >= 0.3) || animProgress === 1
                      ? 'text-emerald-500'
                      : 'text-gray-300 dark:text-gray-600'
                  }`} />
                </div>
                <span className="text-[8px] text-gray-400 dark:text-gray-500 italic">
                  {currentReaction.conditions}
                </span>
              </div>

              {/* Product */}
              <div
                className={`flex flex-col items-center px-4 py-2 rounded-lg border-2 transition-all duration-300 ${
                  (isAnimating && animProgress > 0.7) || (!isAnimating && animProgress === 1)
                    ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 scale-105'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
                }`}
              >
                <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Product</span>
                <span className="text-sm font-bold font-mono text-gray-800 dark:text-white">
                  {currentReaction.product.name}
                </span>
              </div>
            </div>
          </div>

          {/* Functional groups panel (toggleable) */}
          {showFunctionalGroups && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2.5">
              <h4 className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                <Atom className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                Functional Group Reference
              </h4>
              <div className="grid grid-cols-5 gap-2">
                {functionalGroups.map(fg => (
                  <div
                    key={fg.name}
                    className="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
                  >
                    {renderMiniGroup(fg)}
                    <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 mt-1">{fg.name}</span>
                    <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400">{fg.formula}</span>
                    <span className="text-[8px] text-gray-400 dark:text-gray-500">{fg.className}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right side info panel */}
        <div className="w-80 flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          {/* Reaction details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3">
            <h4 className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              <Info className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              Reaction Details
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500 dark:text-gray-400">Name</span>
                <span className="font-semibold text-gray-800 dark:text-white text-right">{currentReaction.name}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500 dark:text-gray-400">Type</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">{currentReaction.type}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500 dark:text-gray-400">Reagent</span>
                <span className="font-mono text-gray-800 dark:text-white">{currentReaction.reagent}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500 dark:text-gray-400">Conditions</span>
                <span className="text-gray-700 dark:text-gray-200 text-right">{currentReaction.conditions}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500 dark:text-gray-400">Mechanism</span>
                <span className="font-semibold text-gray-700 dark:text-gray-200">{currentReaction.mechanism}</span>
              </div>
            </div>
          </div>

          {/* IUPAC Names */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3">
            <h4 className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-2">IUPAC Nomenclature</h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[11px]">
                <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                <span className="text-gray-500 dark:text-gray-400">Reactant:</span>
                <span className="font-mono font-semibold text-gray-800 dark:text-white">{currentReaction.reactant.iupac}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                <span className="text-gray-500 dark:text-gray-400">Product:</span>
                <span className="font-mono font-semibold text-gray-800 dark:text-white">{currentReaction.product.iupac}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
            <h4 className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-1.5">Description</h4>
            <p className="text-[10px] text-gray-600 dark:text-gray-300 leading-relaxed">
              {currentReaction.description}
            </p>
          </div>

          {/* Key points */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3">
            <h4 className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-2">Key Points</h4>
            <div className="space-y-1.5">
              {currentReaction.keyPoints.map((point, i) => (
                <div key={i} className="flex items-start gap-2 text-[10px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 mt-1" />
                  <span className="text-gray-600 dark:text-gray-300">{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Atom color legend */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3">
            <h4 className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-2">Atom Legend</h4>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(ATOM_COLORS).map(([symbol, color]) => (
                <div key={symbol} className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: color }} />
                  <span className="text-[10px] text-gray-600 dark:text-gray-400">{symbol}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key concepts */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <h4 className="text-[10px] font-semibold text-green-800 dark:text-green-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Info className="h-3 w-3" /> Key Concepts
            </h4>
            <div className="space-y-1.5">
              <div className="flex items-start gap-1.5 text-[9px] text-gray-600 dark:text-gray-300">
                <div className="w-1 h-1 rounded-full bg-green-400 flex-shrink-0 mt-1.5" />
                <span><strong>Functional groups</strong> determine the chemical reactivity of organic molecules</span>
              </div>
              <div className="flex items-start gap-1.5 text-[9px] text-gray-600 dark:text-gray-300">
                <div className="w-1 h-1 rounded-full bg-green-400 flex-shrink-0 mt-1.5" />
                <span><strong>Homologous series</strong> share the same functional group and general formula</span>
              </div>
              <div className="flex items-start gap-1.5 text-[9px] text-gray-600 dark:text-gray-300">
                <div className="w-1 h-1 rounded-full bg-green-400 flex-shrink-0 mt-1.5" />
                <span><strong>Isomerism:</strong> structural (chain, position, functional group) and stereoisomerism (E/Z, optical)</span>
              </div>
              <div className="flex items-start gap-1.5 text-[9px] text-gray-600 dark:text-gray-300">
                <div className="w-1 h-1 rounded-full bg-green-400 flex-shrink-0 mt-1.5" />
                <span><strong>Reaction types:</strong> addition, substitution, elimination, condensation, oxidation, reduction</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
