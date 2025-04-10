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

const LchChannel = {
  L: {
    get: ({ l }) => l,
    set: (l) => ({ l }),
    convert: ({ x, y, z }) => ({
      l: z,
      c: LchChannel.C.max * Math.hypot(x, y),
      h: (Math.atan2(y, x) * 180) / Math.PI,
      mode: "oklch",
    }),
    drawOthers: ({ ctx, width, height, l, c, h }) => {
      const midX = width / 2;
      const midY = height / 2;
      const cMax = LchChannel.C.max;
      const cRel = c / cMax;
      const hRad = (h * Math.PI) / 180;
      const x = midX * (1 + cRel * Math.cos(hRad));
      const y = midY * (1 - cRel * Math.sin(hRad));
      ctx.beginPath();
      ctx.ellipse(midX, midY, cRel * midX, cRel * midY, 0, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.lineTo(midX * (1 + Math.cos(hRad)), midY * (1 - Math.sin(hRad)));
      ctx.stroke();
      ctx.beginPath();
      ctx.fillStyle = `oklch(${l} ${c} ${h})`;
      console.log(ctx.fillStyle);
      ctx.arc(x, y, indicatorRadius, 0, 2* Math.PI);
      ctx.fill();
      ctx.stroke();
    },
    max: 1.0,
    step: 0.01,
  },
  C: {
    get: ({ c }) => c,
    set: (c) => ({ c }),
    convert: ({ x, y, z }) => ({
      l: Math.hypot(x, y),
      c: z,
      h: (Math.atan2(y, x) * 180) / Math.PI,
      mode: "oklch",
    }),
    drawOthers: ({ ctx, width, height, l, c, h }) => {
      const midX = width / 2;
      const midY = height / 2;
      const hRad = (h * Math.PI) / 180;
      const x = midX * (1 + l * Math.cos(hRad));
      const y = midY * (1 - l * Math.sin(hRad));
      ctx.beginPath();
      ctx.ellipse(midX, midY, l * midX, l * midY, 0, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.lineTo(midX * (1 + Math.cos(hRad)), midY * (1 - Math.sin(hRad)));
      ctx.stroke();
      ctx.beginPath();
      ctx.fillStyle = `oklch(${l} ${c} ${h})`;
      console.log(ctx.fillStyle);
      ctx.arc(x, y, indicatorRadius, 0, 2* Math.PI);
      ctx.fill();
      ctx.stroke();
    },
    max: 0.35,
    step: 0.01,
  },
  H: {
    get: ({ h }) => h,
    set: (h) => ({ h }),
    convert: ({ x, y, z }) => ({
      l: (y + 1) / 2,
      c: (LchChannel.C.max * (x + 1)) / 2,
      h: z,
      mode: "oklch",
    }),
    drawOthers: ({ ctx, width, height, l, c, h }) => {
      const cRel = c / LchChannel.C.max;
      ctx.beginPath();
      ctx.moveTo(0, (1 - l) * height);
      ctx.lineTo(width, (1 - l) * height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cRel * width, 0);
      ctx.lineTo(cRel * width, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.fillStyle = `oklch(${l} ${c} ${h})`;
      console.log(ctx.fillStyle);
      ctx.arc(cRel * width, (1 - l) * height, indicatorRadius, 0, 2* Math.PI);
      ctx.fill();
      ctx.stroke();
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
      channel.drawOthers({ ctx, width, height, ...lch });
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
