import { oklab, oklch, rgb } from "https://cdn.skypack.dev/culori";

const tileTemplate = document.querySelector("#tile-template");
const tileContainer = document.querySelector("#tile-container");

const maxChroma = 0.35;

const LCH = {};

const componentInRange = (c) => 0 <= c && c <= 1;
const rgbInRange = ({ r, g, b }) => {
  return componentInRange(r) && componentInRange(g) && componentInRange(b);
};

const updateChart = (chart, convert) => {
  console.log(convert);
  const ctx = chart.getContext("2d");
  const width = chart.width;
  const height = chart.height;
  const arr = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = y * width + x;
      const { r, g, b } = rgb(
        convert({
          x: (2 * x) / width - 1,
          y: 1 - (2 * y) / height,
        })
      );
      if (rgbInRange({ r, g, b })) {
        arr[px * 4 + 0] = r * 256;
        arr[px * 4 + 1] = g * 256;
        arr[px * 4 + 2] = b * 256;
        arr[px * 4 + 3] = 255;
      }
    }
  }
  const imageData = new ImageData(arr, width, height);
  ctx.putImageData(imageData, 0, 0);
};

const createTile = ({ maxValue, initialValue, stepValue, convert, setFn }) => {
  const tile = tileTemplate.content.cloneNode(true);
  const chart = tile.querySelector(".chart");
  const rangeInput = tile.querySelector(".range-input");
  const numberInput = tile.querySelector(".number-input");

  setFn(initialValue);

  rangeInput.step = stepValue;
  rangeInput.value = initialValue;
  rangeInput.max = maxValue;

  numberInput.step = stepValue;
  numberInput.value = initialValue;
  numberInput.max = maxValue;

  rangeInput.addEventListener("input", (event) => {
    const value = event.target.value;
    numberInput.value = value;
    setFn(value);
    updateChart(chart, convert);
  });

  numberInput.addEventListener("input", (event) => {
    const value = event.target.value;
    rangeInput.value = value;
    setFn(value);
    updateChart(chart, convert);
  });

  updateChart(chart, convert);

  tileContainer.appendChild(tile);
};

createTile({
  maxValue: 1,
  initialValue: 0.64,
  stepValue: 0.01,
  convert: ({ x, y }) => ({
    l: LCH.l,
    a: maxChroma * x,
    b: maxChroma * y,
    mode: "oklab",
  }),
  setFn: (value) => (LCH.l = value),
});
createTile({
  maxValue: maxChroma,
  initialValue: 0.12,
  stepValue: 0.01,
  convert: ({ x, y }) => ({
    l: Math.hypot(x, y),
    c: LCH.c,
    h: (Math.atan2(y, x) * 180) / Math.PI,
    mode: "oklch",
  }),
  setFn: (value) => (LCH.c = value),
});
createTile({
  maxValue: 360,
  initialValue: 0,
  stepValue: 1,
  convert: ({ x, y }) => ({
    l: (y + 1) / 2,
    c: (maxChroma * (x + 1)) / 2,
    h: LCH.h,
    mode: "oklch",
  }),
  setFn: (value) => (LCH.h = value),
});
