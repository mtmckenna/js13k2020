import carImageData from "../assets/car.png";
import treeImageData from "../assets/tree.png";

const { abs, floor, round } = Math;

const canvas: HTMLCanvasElement = document.querySelector(
  "#game"
) as HTMLCanvasElement;
const log = document.querySelector("#log") as HTMLElement;
const ctx: CanvasRenderingContext2D = canvas.getContext("2d");
let width = 320;
let height = 240;
const aspectRatio = width / height;
const SPRITE_DIMENSIONS = 32;
const GROUND_HEIGHT = height;
const JUMP_VELOCITY = -7;
const GRAVITY = 0.02;
canvas.height = height;
canvas.width = width;

const carImage = new Image();
carImage.src = carImageData;

const treeImage = new Image();
treeImage.src = treeImageData;

resize();
requestAnimationFrame(tick);

//const night1 = "#162433";
const night1 = "#000";
const grass1 = "#000";
const road1 = "#000";
const road2 = "#e2ebda";
const groundPercent = 0.4;
const maxWhiteLineWidthPercent = 0.009;
const maxRoadWidthPercent = 0.95;
const sideLineWidth = 5;

let maxRoadWidth = width * maxRoadWidthPercent;
let maxWhiteLineWidth = width * maxWhiteLineWidthPercent;
let skyHeight = height * (1.0 - groundPercent);
let groundHeight = floor(height * groundPercent);
let roadStartX = (width - width * maxRoadWidthPercent) / 2;
let realTime = null;
let gameTime = 0;



const sprites: Sprite[] = [];

const whiteLineWidths: Array<{ x1: number; x2: number }> = [];
for (let i = 0; i < height; i++) {
  const percent = i / height;
  const width = maxWhiteLineWidth * percent;
  const startX = roadStartX + (maxRoadWidth - width) / 2;
  whiteLineWidths.push({ x1: startX, x2: startX + width });
}

const roadWidths: Array<{ x1: number; x2: number }> = [];
for (let i = 0; i < height; i++) {
  const percent = i / height;
  const width = maxRoadWidth * percent;
  const startX = roadStartX + (maxRoadWidth - width) / 2;
  roadWidths.push({ x1: startX, x2: startX + width });
}

const spriteScales: number[] = [];
for (let i = 0; i < height; i++) {
  const percent = i / height;
  const width = percent;
  spriteScales.push(width);
}

const cameraY = -10;
const zMap: number[] = [];
for (let i = 0; i < height; i++) {
  const worldY = cameraY;
  const d = i - (height - groundHeight);
  const z = d === 0 ? 0 : worldY / d;
  zMap.push(z);
}

const horizonI = zMap.indexOf(0);
const xCenter = floor(width / 2);

console.log(zMap);

const player: Sprite = {
  pos: { x: 0, y: 0, z: zMap[200] },
  vel: { x: 0, y: 0, z: 0 },
  zIndex: 200
};

const treePos: Vector = {
  x: 0,
  y: 0,
  z: 0
};

const tree: Sprite = {
  pos: treePos,
  vel: { x: 0, y: 0, z: 0.01 },
  zIndex: -1
};
const rowDistances: number[] = [];
for (let i = 0; i < zMap.length; i++) {
  rowDistances.push(abs(1 / zMap[i]));
}

//console.log(zMap);

sprites.push(tree);

const MAX_TEX = 1;
const TEX_DEN = 40;
const TURNING_SPEED = 2;

const normalTime = 120;
const jumpTime = 1000;
let lastTime = -1;
let xOffset = -1;
function tick(t: number) {
  if (lastTime === -1) {
    lastTime = t;
    requestAnimationFrame(tick);
    return;
  }

  const divisor = player.pos.y < 0 ? jumpTime : normalTime;
  gameTime += 10.1 / divisor;

  realTime = t;
  requestAnimationFrame(tick);

  if (inputState.left) player.pos.x -= TURNING_SPEED;
  if (inputState.right) player.pos.x += TURNING_SPEED;

  if (inputState.jump) jump();

  player.pos.x = clamp(player.pos.x, -width / 2, width / 2);
  xOffset = xCenter - player.pos.x;

  if (player.pos.y < 0) player.vel.y = clamp(player.vel.y + GRAVITY, -1, 1);

  if (player.pos.y > 0) {
    player.vel.y = 0;
    player.pos.y = 0;
  }

  player.pos.y += player.vel.y;

  const startI = horizonI + 1;
  const maxI = zMap.length - startI;
  const nI = startI + floor((TEX_DEN * gameTime) % maxI);
  const z = zMap[nI];

  tree.pos.z = z;

  // Ground
  ctx.fillStyle = grass1;
  ctx.fillRect(0, skyHeight, width, groundHeight);

  // Road
  ctx.strokeStyle = road1;

  ctx.fillStyle = road1;
  ctx.fillRect(0, 0, width, skyHeight);

  // White lines
  let textureCoord = 0;
  let spriteIndex = 0;
  for (let i = 0; i < height; i++) {
    textureCoord += MAX_TEX / TEX_DEN;
    const zWorld = zMap[i];
    const index =
      (((textureCoord - gameTime + zWorld) % MAX_TEX) + MAX_TEX) % MAX_TEX;
    const whiteLineWidth = whiteLineWidths[i];
    const roadWidth = roadWidths[i];
    const percent = i / height;

    if (i > skyHeight) {
      // Set zIndex on sprites
      const currentSprite = sprites[spriteIndex];
      while (spriteIndex < sprites.length) {
        if (currentSprite.pos.z <= zWorld) {
          //console.log(currentSprite.zIndex, currentSprite.pos.z, tn);
          currentSprite.zIndex = i;
          spriteIndex++;
        } else {
          break;
        }
      }

      ctx.strokeStyle = funColor(index);
      ctx.beginPath();
      ctx.moveTo(round(0), i);
      ctx.lineTo(round(roadWidth.x1 - xOffset + xCenter), i);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(round(roadWidth.x2 - sideLineWidth * percent - xOffset + xCenter), i);
      ctx.lineTo(width + xOffset, i);
      ctx.closePath();
      ctx.stroke();

      // Draw road
      ctx.strokeStyle = road2;
      ctx.beginPath();
      ctx.moveTo(round(roadWidth.x1 - xOffset + xCenter), i);
      ctx.lineTo(round(roadWidth.x1 + sideLineWidth * percent - xOffset + xCenter), i);
      ctx.closePath();
      ctx.stroke();

      ctx.strokeStyle = road2;
      ctx.beginPath();
      ctx.moveTo(round(roadWidth.x2 - xOffset + xCenter), i);
      ctx.lineTo(round(roadWidth.x2 - sideLineWidth * percent - xOffset + xCenter), i);
      ctx.closePath();
      ctx.stroke();

      ctx.strokeStyle = index < MAX_TEX / 2 ? road1 : road2;
      ctx.beginPath();
      ctx.moveTo(round(whiteLineWidth.x1 - xOffset + xCenter), i);
      ctx.lineTo(round(whiteLineWidth.x2 - xOffset + xCenter), i);
      ctx.closePath();
      ctx.stroke();
    }

    textureCoord %= MAX_TEX;
  }

  sprites.forEach(sprite => {
    if (sprite.zIndex === -1) return;
    //drawImage(treeImage, sprite.pos, sprite.zIndex);
  });

  drawImage(treeImage, tree.pos, 0, tree.zIndex);
  drawImage(carImage, player.pos, xOffset, player.zIndex);
}

function drawImage(image: HTMLImageElement, pos: Vector, xOffset = 0, yOffset = 0) {
  const scale = yOffset / height || 1;
  ctx.drawImage(
    image,
    floor(xOffset + pos.x - scale * SPRITE_DIMENSIONS / 2),
    floor(yOffset + pos.y + pos.z + (scale * SPRITE_DIMENSIONS) / 2),
    floor(SPRITE_DIMENSIONS * scale),
    floor(SPRITE_DIMENSIONS * scale)
  );
}

function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

function jump() {
  if (player.pos.y !== 0) return;
  player.vel.y = JUMP_VELOCITY;
}

function resize() {
  const wHeight = window.innerHeight;
  const wWidth = window.innerWidth;
  const wAspectRatio = wWidth / wHeight;

  if (wAspectRatio > aspectRatio) {
    canvas.style.height = `${wHeight}px`;
    const w = floor(wHeight * aspectRatio);
    canvas.style.width = `${w}px`;
  } else {
    canvas.style.width = `${wWidth}px`;
    const h = wWidth / aspectRatio;
    canvas.style.height = `${h}px`;
  }
}

const inputState: InputState = {
  left: false,
  right: false,
  jump: false
};

const pointerState: PointerState = {
  down: false,
  downAt: null,
  playerX: null,
  x: null,
  y: null
};

window.addEventListener("keydown", (e: KeyboardEvent) => {
  switch (e.key) {
    case "ArrowLeft":
      inputState.left = true;
      break;
    case "ArrowRight":
      inputState.right = true;
      break;
    case " ":
      inputState.jump = true;
      break;
  }
});

window.addEventListener("keyup", (e: KeyboardEvent) => {
  switch (e.key) {
    case "ArrowLeft":
      inputState.left = false;
      break;
    case "ArrowRight":
      inputState.right = false;
      break;
    case " ":
      inputState.jump = false;
      break;
  }
});

window.addEventListener("touchstart", (e: TouchEvent) => {
  pointerState.down = true;
  pointerState.downAt = realTime;
  const xPercentage = e.touches[0].clientX / window.innerWidth;
  const x = width * xPercentage;
  pointerState.x = x;
  pointerState.playerX = player.pos.x;
});

window.addEventListener("touchend", () => {
  pointerState.down = false;
  if (realTime - pointerState.downAt < 500) jump();
  pointerState.downAt = null;
});

window.addEventListener("mousedown", () => {
  pointerState.down = true;
  pointerState.downAt = realTime;
});

window.addEventListener("mousemove", (e: MouseEvent) => {
  const xPercentage = e.offsetX / window.innerWidth;
  const x = width * xPercentage;
  player.pos.x = x;
});

window.addEventListener("touchmove", (e: TouchEvent) => {
  const xPercentage = e.touches[0].clientX / window.innerWidth;
  const x = width * xPercentage;

  const diff = x - pointerState.x;
  player.pos.x = pointerState.playerX + diff;
});

window.addEventListener("mouseup", () => {
  pointerState.down = false;
});

window.addEventListener("click", () => {
  jump();
  //log.innerText += "click!\n";
});

window.addEventListener("resize", resize);

interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
}

interface Sprite {
  pos: Vector;
  vel: Vector;
  zIndex: number;
}

interface Vector {
  x: number;
  y: number;
  z: number;
}

interface PointerState {
  down: boolean;
  downAt: number;
  playerX: number;
  x: number;
  y: number;
}

function iForZPos(t: number) {
  let l = horizonI + 1;
  let r = zMap.length - 1;

  let i = -1;
  while (l <= r) {
    i = floor((l + r) / 2);
    const z = zMap[i];
    if (z < t) {
      l = i + 1;
    } else if (z > t) {
      r = i - 1;
    } else {
      return i;
    }
  }

  return i - 1;
}

// https://www.iquilezles.org/www/articles/palettes/palettes.htm
const cpa = { x:.3, y: .3, z: .3 };
const cpb = { x:.5, y: .3, z: 3 };
const cpc = { x: .5, y: 1.0, z: 0 };
const cpd = { x: .4, y: .9, z: .2 };

function funColor(t: number): string {
  const color = cosPalette(t, cpa, cpb, cpc, cpd);

  color.x *= 256;
  color.y *= 256;
  color.z *= 256;

  return `rgb(${color.x}, ${color.y}, ${color.z})`;
}

function cosPalette(
  t: number,
  a: Vector,
  b: Vector,
  c: Vector,
  d: Vector
): Vector {
  const tc: Vector = { x: t * c.x, y: t * c.y, z: t * c.z };
  const six: number = 6.28318;
  const { cos } = Math;
  const cosctpd6: Vector = {
    x: cos((tc.x + d.x) * six),
    y: cos((tc.y + d.y) * six),
    z: cos((tc.z + d.z) * six)
  };
  const apbcos: Vector = {
    x: a.x + b.x * cosctpd6.x,
    y: a.y + b.y * cosctpd6.y,
    z: a.z + b.z * cosctpd6.z
  };

  return apbcos;
}
