import { oklab, oklch, rgb } from "https://cdn.skypack.dev/culori";

const tileTemplate = document.querySelector("#tile-template");
const tileContainer = document.querySelector("#tile-container");

const initialLch = { l: 0.64, c: 0.12, h: 0 };
const indicatorRadius = 15;

const componentInRange = (c) => 0 <= c && c <= 1;
const rgbInRange = ({ r, g, b }) => {
  return componentInRange(r) && componentInRange(g) && componentInRange(b);
};

const getImageData = ({ width, height }, channel, lch) => {
  const arr = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = y * width + x;
      const { r, g, b } = rgb(
        channel.convert({
          x: (2 * x) / width - 1,
          y: 1 - (2 * y) / height,
          z: channel.get(lch),
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
  return new ImageData(arr, width, height);
};

const drawLine = ({ ctx, width, height, center, edge }) => {
  const midX = width / 2;
  const midY = height / 2;
  ctx.beginPath();
  ctx.moveTo(midX * (1 + center.x), midY * (1 - center.y));
  ctx.lineTo(midX * (1 + edge.x), midY * (1 - edge.y));
  ctx.stroke();
};

const drawCircle = ({ ctx, width, height, center, edge }) => {
  const midX = width / 2;
  const midY = height / 2;
  const r = Math.hypot(edge.x, edge.y);
  ctx.beginPath();
  ctx.ellipse(midX, midY, r * midX, r * midY, 0, 0, 2 * Math.PI);
  ctx.stroke();
};

const LchChannel = {
  L: {
    name: "L",
    get: ({ l }) => l,
    set: (l) => ({ l }),
    convert: ({ x, y, z }) => ({
      l: z,
      c: LchChannel.C.max * Math.hypot(x, y),
      h: (Math.atan2(y, x) * 180) / Math.PI,
      mode: "oklch",
    }),
    unconvert: ({ l, c, h }) => {
      const cRel = c / LchChannel.C.max;
      const hRad = (h * Math.PI) / 180;
      return {
        x: cRel * Math.cos(hRad),
        y: cRel * Math.sin(hRad),
        z: l,
      };
    },
    drawCrosshairs: {
      l: ({}) => {},
      c: drawLine,
      h: drawCircle,
    },
    max: 1.0,
    step: 0.01,
  },
  C: {
    name: "c",
    get: ({ c }) => c,
    set: (c) => ({ c }),
    convert: ({ x, y, z }) => ({
      l: Math.hypot(x, y),
      c: z,
      h: (Math.atan2(y, x) * 180) / Math.PI,
      mode: "oklch",
    }),
    unconvert: ({ l, c, h }) => {
      const hRad = (h * Math.PI) / 180;
      return {
        x: l * Math.cos(hRad),
        y: l * Math.sin(hRad),
        z: c,
      };
    },
    drawCrosshairs: {
      l: drawLine,
      c: ({}) => {},
      h: drawCircle,
    },
    max: 0.35,
    step: 0.01,
  },
  H: {
    name: "h",
    get: ({ h }) => h,
    set: (h) => ({ h }),
    convert: ({ x, y, z }) => ({
      l: (y + 1) / 2,
      c: (LchChannel.C.max * (x + 1)) / 2,
      h: z,
      mode: "oklch",
    }),
    unconvert: ({ l, c, h }) => ({
      x: (2 * c) / LchChannel.C.max - 1,
      y: 2 * l - 1,
      z: h,
    }),
    drawCrosshairs: {
      l: drawLine,
      c: drawLine,
      h: ({}) => {},
    },
    max: 360,
    step: 1,
  },
};

const createTile = ({ initialLch, channel }) => {
  const tile = tileTemplate.content.cloneNode(true);
  const chart = tile.querySelector(".chart");
  const rangeInput = tile.querySelector(".range-input");
  const numberInput = tile.querySelector(".number-input");

  const width = chart.width;
  const height = chart.width;
  const ctx = chart.getContext("2d");

  rangeInput.step = channel.step;
  rangeInput.value = channel.get(initialLch);
  rangeInput.max = channel.max;
  numberInput.step = channel.step;
  numberInput.value = channel.get(initialLch);
  numberInput.max = channel.max;

  rangeInput.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    updateCharts(channel.set(value));
  });
  numberInput.addEventListener("change", (event) => {
    const value = Number(event.target.value);
    updateCharts(channel.set(value));
  });

  let lch = initialLch;
  const mouseHandler = (event) => {
    if (event.buttons & 1) {
      const newLch = channel.convert({
        x: (2 * event.offsetX) / width - 1,
        y: 1 - (2 * event.offsetY) / height,
        z: channel.get(lch),
      });
      updateCharts(newLch);
    }
  };
  chart.addEventListener("mousemove", mouseHandler);
  chart.addEventListener("mousedown", mouseHandler);

  tileContainer.appendChild(tile);

  let imageData = getImageData({ width, height }, channel, lch);
  const tileData = {
    redraw: (newLch) => {
      rangeInput.value = channel.get(newLch);
      numberInput.value = channel.get(newLch);
      ctx.clearRect(0, 0, width, height);
      if (channel.get(newLch) != channel.get(lch)) {
        imageData = getImageData({ width, height }, channel, newLch);
      }
      lch = newLch;
      ctx.putImageData(imageData, 0, 0);
      channel.drawCrosshairs.l({
        ctx,
        width,
        height,
        center: channel.unconvert({ ...lch, l: 0 }),
        edge: channel.unconvert({ ...lch, l: LchChannel.L.max }),
      });
      channel.drawCrosshairs.c({
        ctx,
        width,
        height,
        center: channel.unconvert({ ...lch, c: 0 }),
        edge: channel.unconvert({ ...lch, c: LchChannel.C.max }),
      });
      channel.drawCrosshairs.h({
        ctx,
        width,
        height,
        center: channel.unconvert({ ...lch, h: 0 }),
        edge: channel.unconvert({ ...lch, h: LchChannel.H.max }),
      });
      let { x, y } = channel.unconvert(lch);
      ctx.stroke();
      ctx.beginPath();
      ctx.fillStyle = `oklch(${lch.l} ${lch.c} ${lch.h})`;
      ctx.arc(
        ((x + 1) * width) / 2,
        ((1 - y) * height) / 2,
        indicatorRadius,
        0,
        2 * Math.PI
      );
      ctx.fill();
      ctx.stroke();
    },
  };

  return tileData;
};

const initInputs = ({
  rangeInput,
  numberInput,
  chart,
  initialLch,
  channel,
}) => {};

const charts = [
  createTile({
    initialLch,
    channel: LchChannel.L,
  }),
  createTile({
    initialLch,
    channel: LchChannel.C,
  }),
  createTile({
    initialLch,
    channel: LchChannel.H,
  }),
];

let lch = initialLch;
const updateCharts = (newLch) => {
  lch = { ...lch, ...newLch };
  for (const chart of charts) {
    chart.redraw(lch);
  }
};
updateCharts(initialLch);
