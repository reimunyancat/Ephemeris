import { Body, vec } from "../core/body";
import { G, kgToSolar } from "../constants";

interface PlanetSpec {
  name: string;
  massKg: number;
  a: number;
  e: number;
}

const SPECS: PlanetSpec[] = [
  { name: "수성", massKg: 3.301e23, a: 0.387, e: 0.206 },
  { name: "금성", massKg: 4.867e24, a: 0.723, e: 0.007 },
  { name: "지구", massKg: 5.972e24, a: 1.0, e: 0.017 },
  { name: "화성", massKg: 6.417e23, a: 1.524, e: 0.093 },
  { name: "목성", massKg: 1.898e27, a: 5.203, e: 0.048 },
  { name: "토성", massKg: 5.683e26, a: 9.537, e: 0.054 },
  { name: "천왕성", massKg: 8.681e25, a: 19.19, e: 0.047 },
  { name: "해왕성", massKg: 1.024e26, a: 30.07, e: 0.009 },
];

export function makeSun(): Body {
  return new Body("태양", 1, vec(0, 0, 0), vec(0, 0, 0));
}

function makePlanet(spec: PlanetSpec): Body {
  const { name, massKg, a, e } = spec;
  const mass = kgToSolar(massKg);

  const rPeri = a * (1 - e);
  const vPeri = Math.sqrt((G * (1 + e)) / (a * (1 - e)));

  return new Body(name, mass, vec(rPeri, 0, 0), vec(0, vPeri, 0));
}

export function makeSolarSystem(): Body[] {
  return [makeSun(), ...SPECS.map(makePlanet)];
}
