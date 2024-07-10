"use strict";

const angleSlider = document.querySelector("#angle-slider");
const angleText = document.querySelector("#angle-text");
const arcDiv = document.querySelector("#arcs");
const tileTemplate = document.querySelector("#curve-tile-template");

const SVG_SIZE = 200;
const createArc = (name) => {
  const tile = tileTemplate.content.cloneNode(true);
  const header = tile.querySelector(".tile-name");
  header.appendChild(document.createTextNode(name));
  const svg = tile.querySelector("svg");
  svg.setAttribute("width", SVG_SIZE);
  svg.setAttribute("height", SVG_SIZE);
  const arc = tile.querySelector("path.arc");
  const guide = tile.querySelector("path.guide");
  const radii = tile.querySelector("path.radii");
  const data = tile.querySelector("form");
  arcDiv.appendChild(tile);
  return {arc, guide, radii, data};
};

const arcs = {
  standard: createArc("Control"),
  fixedR: createArc("Fixed radius"),
  fixedL: createArc("Fixed tangent"),
  fixedRTheta: createArc("Fixed arc length"),
  fixedRL: createArc("Fixed kite area"),
  fixedRRTheta: createArc("Fixed sector area"),
};

const degToRad = (degrees) => degrees * Math.PI / 180;

const trig = (theta) => {
  const Trig = ({cos, sin}) => {
    return { cos, sin, halfTan: (1-cos)/sin};
  };
  const SQRT3_4 = Math.sqrt(3)/2;
  const SQRT1_2 = Math.SQRT1_2;
  // normalize to range [0, 360)
  theta = ((theta % 360) + 360) % 360;
  const quadrant = Math.floor(theta / 90);
  const firstQuadrant = (theta) => {
    switch (theta % 90) {
      case 0:
        return {cos: 1, sin: 0};
      case 30:
        return {cos: SQRT3_4, sin: 1/2};
      case 45:
        return {cos: SQRT1_2, sin: SQRT1_2};
      case 60:
        return {cos: 1/2, sin: SQRT3_4};
      default:
        const thetaRad = degToRad(theta % 90);
        return {cos: Math.cos(thetaRad), sin: Math.sin(thetaRad)};
    }
  };
  const fq = firstQuadrant(theta % 90);
  switch (quadrant) {
    case 0:
      return Trig(fq);
    case 1:
      return Trig({cos: -fq.sin, sin: fq.cos});
    case 2:
      return Trig({cos: -fq.cos, sin: -fq.sin});
    case 3:
      return Trig({cos: fq.sin, sin: -fq.cos});
  }
};

const APPROACH = SVG_SIZE;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;

const arcPath = ({r, l, cos, sin}) => {
  if (!Number.isFinite(l)) {
    return `M ${CX - APPROACH},${CY} h ${APPROACH * 2}`;
  }
  const dx = l * (1 - cos);
  const dy = l * sin;
  const remainder = APPROACH - l;
  return `\
M ${CX - APPROACH},${CY}
h ${remainder}
a ${r},${r} 0 0 1 ${dx},${dy}
l ${-remainder * cos},${remainder * sin}`;
};

const guidePath = ({cos, sin}) => {
  return `\
M ${CX - APPROACH},${CY}
h ${APPROACH}
l ${-APPROACH * cos},${APPROACH * sin}`;
}

const radiiPath = ({r, l, cos, sin}) => {
  return `\
M ${CX - l},${CY}
v ${r}
l ${r * sin},${r * cos}`;
}

const BASE_R = APPROACH / 8;

const roundN = (x, n=0) => Math.round(x * 10**n) / 10**n;

const updateArc = ({arc, guide, radii, data, r, theta}) => {
  const {cos, sin, halfTan} = trig(theta);
  const l = r / halfTan;
  const arcRad = degToRad(180 - theta);
  arc.setAttribute("d", arcPath({r, l, cos, sin}));
  guide.setAttribute("d", guidePath({cos, sin}));
  radii.setAttribute("d", radiiPath({r, l, cos, sin}));
  data.elements["radius"].value = roundN(r, 2);
  data.elements["tangent"].value = roundN(l, 2);
  data.elements["arc"].value = roundN(r * arcRad, 2);
  data.elements["kite"].value = roundN(r * l, 2);
  data.elements["sector"].value = roundN(r * r * arcRad / 2, 2);
};

const updateArcs = (theta) => {
  const {cos, sin, halfTan} = trig(theta);
  const arcFactor = 90 / (180 - theta);
  updateArc({...arcs.fixedR,       r: BASE_R,                        theta});
  updateArc({...arcs.fixedL,       r: BASE_R * halfTan,              theta});
  updateArc({...arcs.fixedRTheta,  r: BASE_R * arcFactor,            theta});
  updateArc({...arcs.fixedRL,      r: BASE_R * Math.sqrt(halfTan),   theta});
  updateArc({...arcs.fixedRRTheta, r: BASE_R * Math.sqrt(arcFactor), theta});
};

angleSlider.addEventListener("input", (event) => {
  const theta = event.target.value;
  angleText.value = theta;
  updateArcs(theta);
});

angleText.addEventListener("change", (event) => {
  const theta = event.target.value;
  angleSlider.value = theta;
  updateArcs(theta);
});

updateArc({...arcs.standard, r: BASE_R, theta: 90});
updateArcs(angleSlider.value);
