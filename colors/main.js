import {
  cubehelix,
  hsi,
  hsl,
  hsv,
  hwb,
  itp,
  lab,
  lch,
  lchuv,
  lrgb,
  luv,
  okhsl,
  okhsv,
  oklab,
  oklch,
  rgb,
  xyb,
  xyz50,
  yiq,
} from "https://cdn.skypack.dev/culori";

const spaceSelection = document.querySelector("#space-selection");
const tileTemplate = document.querySelector("#tile-template");
const tileContainer = document.querySelector("#tile-container");

const initialColor = { l: 0.64, c: 0.12, h: 0, mode: "oklch" };
const indicatorRadius = 15;

const componentInRange = (c) => 0 <= c && c <= 1;
const rgbInRange = ({ r, g, b }) => {
  return componentInRange(r) && componentInRange(g) && componentInRange(b);
};

const getImageData = ({ width, height }, channel, color) => {
  const arr = new Uint8ClampedArray(width * height * 4);
  const mode = color.mode;
  const channelColor = color[channel.key];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = y * width + x;
      const xyColor = channel.convert({
        x: (2 * x) / width - 1,
        y: 1 - (2 * y) / height,
      });
      xyColor[channel.key] = channelColor;
      xyColor.mode = mode;
      const { r, g, b } = rgb(xyColor);
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

const COORDS = { min: -1, max: 1 };
const RADII = { min: 0, max: 1 };
const COLORS = { min: 0, max: 1, step: 0.01 };
const RADIANS = { min: -Math.PI, max: Math.PI };
const DEGREES = { min: 0, max: 360, step: 1 };

const scaleRange = ({ from, to, value }) =>
  ((value - from.min) / (from.max - from.min)) * (to.max - to.min) + to.min;

const makeRange = ({ min, max }) => ({ min, max });

const makeChannelLinear = ({ x, y, z }) => {
  const xRange = makeRange({ ...COLORS, ...x });
  const yRange = makeRange({ ...COLORS, ...y });
  const zRange = makeRange({ ...COLORS, ...z });
  return {
    get: (color) => color[z.key],
    set: (value) => ({ [z.key]: value }),
    convert: (coords) => ({
      [x.key]: scaleRange({
        from: COORDS,
        to: xRange,
        value: coords.x,
      }),
      [y.key]: scaleRange({
        from: COORDS,
        to: yRange,
        value: coords.y,
      }),
      ...(coords.z !== undefined
        ? {
            [z.key]: scaleRange({
              from: COORDS,
              to: zRange,
              value: coords.z,
            }),
          }
        : {}),
    }),
    unconvert: (color) => ({
      x: scaleRange({
        from: xRange,
        to: COORDS,
        value: color[x.key],
      }),
      y: scaleRange({
        from: yRange,
        to: COORDS,
        value: color[y.key],
      }),
      z: scaleRange({
        from: zRange,
        to: COORDS,
        value: color[z.key],
      }),
    }),
    drawCrosshairs: {
      [x.key]: drawLine,
      [y.key]: drawLine,
      [z.key]: ({}) => {},
    },
    ...COLORS,
    ...z,
  };
};

const makeChannelsRectangular = ({ x, y, z }) => ({
  [x.key]: makeChannelLinear({ x: y, y: z, z: x }),
  [y.key]: makeChannelLinear({ x: x, y: z, z: y }),
  [z.key]: makeChannelLinear({ x: x, y: y, z: z }),
});

const makeChannelRadial = ({ r, z, theta }) => {
  const rRange = makeRange({ ...COLORS, ...r });
  const zRange = makeRange({ ...COLORS, ...z });
  return {
    get: (color) => color[z.key],
    set: (value) => ({ [z.key]: value }),
    convert: (coords) => ({
      [r.key]: scaleRange({
        from: RADII,
        to: rRange,
        value: Math.hypot(coords.x, coords.y),
      }),
      [theta.key]: scaleRange({
        from: RADIANS,
        to: DEGREES,
        value: Math.atan2(coords.y, coords.x),
      }),
      ...(coords.z !== undefined
        ? {
            [z.key]: scaleRange({
              from: COORDS,
              to: zRange,
              value: coords.z,
            }),
          }
        : {}),
    }),
    unconvert: (color) => {
      const thetaRad = scaleRange({
        from: DEGREES,
        to: RADIANS,
        value: color[theta.key],
      });
      const radius = scaleRange({
        from: rRange,
        to: RADII,
        value: color[r.key],
      });
      return {
        x: radius * Math.cos(thetaRad),
        y: radius * Math.sin(thetaRad),
        z: scaleRange({
          from: zRange,
          to: COORDS,
          value: color[z.key],
        }),
      };
    },
    drawCrosshairs: {
      [z.key]: ({}) => {},
      [r.key]: drawLine,
      [theta.key]: drawCircle,
    },
    ...COLORS,
    ...z,
  };
};

const makeChannelsCylindrical = ({ r, z, theta }) => ({
  [r.key]: makeChannelRadial({ z: r, r: z, theta }),
  [z.key]: makeChannelRadial({ z: z, r: r, theta }),
  [theta.key]: makeChannelLinear({
    x: r,
    y: z,
    z: { ...theta, ...DEGREES },
  }),
});

const drawLine = ({ ctx, width, height, start, end }) => {
  const midX = width / 2;
  const midY = height / 2;
  ctx.beginPath();
  ctx.moveTo(midX * (1 + start.x), midY * (1 - start.y));
  ctx.lineTo(midX * (1 + end.x), midY * (1 - end.y));
  ctx.stroke();
};

const drawCircle = ({ ctx, width, height, start, end }) => {
  const midX = width / 2;
  const midY = height / 2;
  const r = Math.hypot(end.x, end.y);
  ctx.beginPath();
  ctx.ellipse(midX, midY, r * midX, r * midY, 0, 0, 2 * Math.PI);
  ctx.stroke();
};

const createTile = ({ initialColor, channels, key }) => {
  const template = tileTemplate.content.cloneNode(true);
  const tile = template.querySelector(".tile");
  const chart = template.querySelector(".chart");
  const rangeInput = template.querySelector(".range-input");
  const numberInput = template.querySelector(".number-input");
  const label = template.querySelector(".label");

  const width = chart.width;
  const height = chart.width;
  const ctx = chart.getContext("2d");

  const channel = channels[key];

  label.textContent = channel.name;

  rangeInput.step = channel.step;
  rangeInput.min = channel.min;
  rangeInput.max = channel.max;
  rangeInput.value = channel.get(initialColor);

  numberInput.step = channel.step;
  numberInput.min = channel.min;
  numberInput.max = channel.max;
  numberInput.value = channel.get(initialColor);

  tileContainer.appendChild(tile);

  let imageData = getImageData({ width, height }, channel, initialColor);

  return {
    setEventHandlers: (updateCharts) => {
      const inputHandler = (event) => {
        const value = Number(event.target.value);
        updateCharts(channel.set(value));
      };
      rangeInput.addEventListener("input", inputHandler);
      numberInput.addEventListener("change", inputHandler);

      const mouseHandler = (event) => {
        if (event.buttons & 1) {
          const newColor = channel.convert({
            x: (2 * event.offsetX) / width - 1,
            y: 1 - (2 * event.offsetY) / height,
          });
          updateCharts(newColor);
        }
      };
      chart.addEventListener("mousemove", mouseHandler);
      chart.addEventListener("mousedown", mouseHandler);
    },
    redraw: (oldColor, newColor) => {
      const color = { ...oldColor, ...newColor };
      rangeInput.value = channel.get(color);
      numberInput.value = channel.get(color);
      ctx.clearRect(0, 0, width, height);
      if (channel.get(color) != channel.get(oldColor)) {
        imageData = getImageData({ width, height }, channel, color);
      }
      ctx.putImageData(imageData, 0, 0);
      for (const drawKey in channels) {
        channel.drawCrosshairs[drawKey]({
          ctx,
          width,
          height,
          start: channel.unconvert({
            ...color,
            [drawKey]: channels[drawKey].min,
          }),
          end: channel.unconvert({
            ...color,
            [drawKey]: channels[drawKey].max,
          }),
        });
      }
      let { x, y } = channel.unconvert(color);
      let rgbColor = rgb(color);
      ctx.stroke();
      ctx.beginPath();
      ctx.fillStyle = `rgb(${rgbColor.r * 256} ${rgbColor.g * 256} ${
        rgbColor.b * 256
      })`;
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
    tile,
  };
};

const spaces = {
  oklch: {
    convert: oklch,
    channels: makeChannelsCylindrical({
      r: { name: "chroma", key: "c", max: 0.35 },
      z: { name: "lightness", key: "l" },
      theta: { name: "hue", key: "h" },
    }),
  },
  okhsl: {
    convert: okhsl,
    channels: makeChannelsCylindrical({
      r: { name: "saturation", key: "s" },
      z: { name: "lightness", key: "l" },
      theta: { name: "hue", key: "h" },
    }),
  },
  okhsv: {
    convert: okhsv,
    channels: makeChannelsCylindrical({
      r: { name: "saturation", key: "s" },
      z: { name: "value", key: "v" },
      theta: { name: "hue", key: "h" },
    }),
  },
  oklab: {
    convert: oklab,
    channels: makeChannelsRectangular({
      x: { name: "green-red", key: "a", min: -0.4, max: 0.4 },
      y: { name: "blue-yellow", key: "b", min: -0.4, max: 0.4 },
      z: { name: "lightness", key: "l" },
    }),
  },
  cielch: {
    convert: lch,
    channels: makeChannelsCylindrical({
      r: { name: "chroma", key: "c", max: 150 },
      z: { name: "lightness", key: "l", max: 100 },
      theta: { name: "hue", key: "h" },
    }),
  },
  cielab: {
    convert: lab,
    channels: makeChannelsRectangular({
      x: { name: "green-red", key: "a", min: -100, max: 100 },
      y: { name: "blue-yellow", key: "b", min: -100, max: 100 },
      z: { name: "lightness", key: "l", max: 100 },
    }),
  },
  cielchuv: {
    convert: lchuv,
    channels: makeChannelsCylindrical({
      r: { name: "chroma", key: "c", max: 176.956 },
      z: { name: "lightness", key: "l", max: 100 },
      theta: { name: "hue", key: "h" },
    }),
  },
  cieluv: {
    convert: luv,
    channels: makeChannelsRectangular({
      x: { name: "green-red", key: "u", min: -84.936, max: 175.042 },
      y: { name: "blue-yellow", key: "v", min: -125.882, max: 87.243 },
      z: { name: "lightness", key: "l", max: 100 },
    }),
  },
  rgb: {
    convert: rgb,
    channels: makeChannelsRectangular({
      x: { name: "red", key: "r" },
      y: { name: "green", key: "g" },
      z: { name: "blue", key: "b" },
    }),
  },
  lrgb: {
    convert: lrgb,
    channels: makeChannelsRectangular({
      x: { name: "red", key: "r" },
      y: { name: "green", key: "g" },
      z: { name: "blue", key: "b" },
    }),
  },
  hsl: {
    convert: hsl,
    channels: makeChannelsCylindrical({
      r: { name: "saturation", key: "s" },
      z: { name: "lightness", key: "l" },
      theta: { name: "hue", key: "h" },
    }),
  },
  hsv: {
    convert: hsv,
    channels: makeChannelsCylindrical({
      r: { name: "saturation", key: "s" },
      z: { name: "value", key: "v" },
      theta: { name: "hue", key: "h" },
    }),
  },
  hsi: {
    convert: hsi,
    channels: makeChannelsCylindrical({
      r: { name: "saturation", key: "s" },
      z: { name: "intensity", key: "i" },
      theta: { name: "hue", key: "h" },
    }),
  },
  hwb: {
    convert: hwb,
    channels: makeChannelsCylindrical({
      r: { name: "whiteness", key: "w" },
      z: { name: "blackness", key: "b" },
      theta: { name: "hue", key: "h" },
    }),
  },
  yiq: {
    convert: yiq,
    channels: makeChannelsRectangular({
      x: { name: "in-phase (orange-blue)", key: "i", min: -0.595, max: 0.595 },
      y: {
        name: "quadrature (green-purple)",
        key: "q",
        min: -0.522,
        max: 0.522,
      },
      z: { name: "luma", key: "y" },
    }),
  },
  xyz: {
    convert: xyz50,
    channels: makeChannelsRectangular({
      x: { name: "x", key: "x", max: 0.964 },
      y: { name: "y", key: "y", max: 0.999 },
      z: { name: "z", key: "z", max: 0.825 },
    }),
  },
  xyb: {
    convert: xyb,
    channels: makeChannelsRectangular({
      x: { name: "cyan-red", key: "x", min: -0.0154, max: 0.0281 },
      y: { name: "blue-yellow", key: "b", min: -0.2778, max: 0.388 },
      z: { name: "luma", key: "y", max: 0.8453 },
    }),
  },
  ICtCp: {
    convert: itp,
    channels: makeChannelsRectangular({
      x: {
        name: "blue-yellow (tritanopia)",
        key: "t",
        min: -0.282,
        max: 0.278,
      },
      y: { name: "green-red (protanopia)", key: "p", min: -0.162, max: 0.279 },
      z: { name: "intensity", key: "i", max: 0.581 },
    }),
  },
  cubehelix: {
    convert: cubehelix,
    channels: makeChannelsCylindrical({
      r: { name: "saturation", key: "s", max: 4.614 },
      z: { name: "lightness", key: "l" },
      theta: { name: "hue", key: "h" },
    }),
  },
};

for (const key in spaces) {
  const option = document.createElement("option");
  option.value = key;
  option.text = key;
  spaceSelection.add(option);
}

let charts = [];
let color = initialColor;
const spaceChange = (key) => {
  for (const { tile } of charts) {
    tileContainer.removeChild(tile);
  }
  const { convert, channels } = spaces[key];
  document.title = key;
  const initialColor = convert(color);
  charts = Object.keys(channels).map((key) =>
    createTile({
      initialColor,
      channels,
      key,
    })
  );
  color = initialColor;
  const updateCharts = (newColor) => {
    for (const { redraw } of charts) {
      redraw(color, newColor);
    }
    color = { ...color, ...newColor };
  };
  for (const { setEventHandlers } of charts) {
    setEventHandlers(updateCharts);
  }
  updateCharts(initialColor);
};
spaceSelection.addEventListener("change", (event) =>
  spaceChange(event.target.value)
);
spaceChange("oklch");
