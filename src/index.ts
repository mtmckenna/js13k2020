import carImageData from "../assets/mailtruck-big.png";
import treeImageData from "../assets/tree.png";
import mailboxImageData from "../assets/mailbox-big.png";
import whitehouse1ImageData from "../assets/whitehouse1-big.png";
import whitehouse2ImageData from "../assets/whitehouse2-big.png";
import whitehouse3ImageData from "../assets/whitehouse3-big.png";

const { abs, ceil, floor, round, max, tan } = Math;

const canvas: HTMLCanvasElement = document.querySelector(
  "#game"
) as HTMLCanvasElement;
const ctx: CanvasRenderingContext2D = canvas.getContext("2d");
let width = 320;
let height = 240;
const aspectRatio = width / height;
const SPRITE_DIMENSIONS = 32;
const BIG_SPRITE_DIMENSIONS = 64;
const JUMP_VELOCITY = -30;
const GRAVITY = 0.02;
const GROUND_PERCENT = 0.5;
const ROAD_WIDTH_PERCENT = 1.1;
const ZERO_POS = { x: 0, y: 0, z: 0 };
//const d = 1/tan(60/2);

canvas.height = height;
canvas.width = width;

const carImage = new Image();
carImage.src = carImageData;

const leftMailboxImage = new Image();
leftMailboxImage.src = mailboxImageData;

const rightMailboxImage = new Image();
rightMailboxImage.src = mailboxImageData;

const wh1 = new Image();
const wh2 = new Image();
const wh3 = new Image();
wh1.src = whitehouse1ImageData;
wh2.src = whitehouse2ImageData;
wh3.src = whitehouse3ImageData;

const whStartPos =
  width / 2 - (BIG_SPRITE_DIMENSIONS * 3) / 2 + BIG_SPRITE_DIMENSIONS / 2;

resize();

const sky = "#6c82a6";
const grass1 = "#37946e";
const grass2 = "#306b40";
const road1 = "#8c8e91";
const road2 = "#e2ebda";
const maxWhiteLineWidthPercent = 0.009;
const sideLineWidth = 1;

let maxRoadWidth = width * ROAD_WIDTH_PERCENT;
//console.log("ROAD", maxRoadWidth / 2);
let maxWhiteLineWidth = width * maxWhiteLineWidthPercent;
let skyHeight = height * (1.0 - GROUND_PERCENT);
let groundHeight = floor(height * GROUND_PERCENT);
let roadStartX = (width - width * ROAD_WIDTH_PERCENT) / 2;
let realTime = null;
let gameTime = 0;

const sprites: Sprite[] = [];

const cameraY = 30;
const zMap: number[] = [];
for (let i = 0; i < height; i++) {
  const worldY = cameraY;
  //const d = i - (height - groundHeight);
  const d = i - (height - groundHeight);
  const z = d === 0 ? 0 : worldY / d;
  zMap.push(z);
}

const roadWidths: Array<{ x1: number; x2: number }> = [];
for (let i = 0; i < zMap.length; i++) {
  const percent = i / height;
  const width = maxRoadWidth * percent;
  const startX = roadStartX + (maxRoadWidth - width) / 2;
  roadWidths.push({ x1: startX, x2: startX + width });
}

const whiteLineWidths: Array<{ x1: number; x2: number }> = [];
for (let i = 0; i < zMap.length; i++) {
  const percent = i / height;
  const width = maxWhiteLineWidth * percent;
  const startX = roadStartX + (maxRoadWidth - width) / 2;
  whiteLineWidths.push({ x1: startX, x2: startX + width });
}

const roadSegments: number[] = [];
let count = 0;
let sign = 1;
for (let i = 0; i < zMap.length; i++) {
  if (count === 10) {
    sign *= -1;
    count = 0;
  }

  count++;
  const val = 0.01 * sign;
  roadSegments.push(val);
}

const horizonI = skyHeight;
const xCenter = floor(width / 2);

//const segmentSize = (abs(zMap[zMap.length - 1]) / zMap.length) * 10;

const logBox: HTMLElement = document.querySelector("#log");
console.log(zMap);

let playerIForGround30 = 40;
let playerIForGround45 = 70;
let playerIForGround50 = 50;
let playerIForGround90 = 170;
const playerI = playerIForGround50;
const player: Sprite = {
  image: carImage,
  pos: { x: 0, y: 0, z: zMap[playerI] },
  vel: { x: 0, y: 0, z: 0 },
  i: playerI,
  iCoord: playerI
};

const rightMailboxes: SideSprite[] = range(3).map(n => {
  const iCoord = n + skyHeight + ((n * 40) % groundHeight);
  return {
    image: rightMailboxImage,
    side: "right",
    i: floor(iCoord),
    iCoord: iCoord
  };
});

const leftMailboxes: SideSprite[] = range(3).map(n => {
  const iCoord = n + skyHeight + ((n * 40) % groundHeight);
  return {
    image: leftMailboxImage,
    side: "left",
    i: floor(iCoord),
    iCoord: iCoord
  };
});

console.log(rightMailboxes);

const sideSprites: SideSprite[] = [];

const MAX_TEX = 2;
//const MAX_TEX = 5;
const TEX_DEN = MAX_TEX * 10;
const TURNING_SPEED = 1;

const SLOW_MULTIPLIER = 8;
const normalTime = 50;
const SIDE_SPRITE_INCREASE = 1.8;
const SIDE_SPRIDE_SLOW_INCREASE = 1.8 / SLOW_MULTIPLIER;
const jumpTime = normalTime * SLOW_MULTIPLIER;
const sloMoRatio = normalTime / jumpTime;
let lastTime = -1;
let xOffset = 0;
//const movingSegment: RoadSegment = { dx: roadSegments[0], i: zMap.length + 1 };
//const bottomSegment: RoadSegment = { dx: 0, i: zMap.length };
//const zHorizon = zMap[skyHeight + 2];
//const zBottom = zMap[zMap.length - 1];
function tick(t: number) {
  if (lastTime === -1) {
    lastTime = t;
    requestAnimationFrame(tick);
    return;
  }

  const jumping = player.pos.y < 0 && player.vel.y > 0;
  const divisor = jumping ? jumpTime : normalTime;
  gameTime += 10 / divisor;

  realTime = t;
  requestAnimationFrame(tick);

  if (inputState.left) player.pos.x -= TURNING_SPEED;
  if (inputState.right) player.pos.x += TURNING_SPEED;
  if (inputState.jump) jump();

  player.pos.x = clamp(player.pos.x, -width / 4, width / 4);
  xOffset = xCenter + player.pos.x;

  if (player.pos.y < 0) player.vel.y = clamp(player.vel.y + GRAVITY, -1, 1);

  if (player.pos.y > 0) {
    player.vel.y = 0;
    player.pos.y = 0;
  }

  player.pos.y += player.vel.y;

  // Sky
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // Ground
  ctx.fillStyle = road1;
  ctx.fillRect(0, skyHeight, width, groundHeight);

  // Draw White House
  const whOffset = xCenter - xOffset;
  drawImage2(
    wh1,
    ZERO_POS,
    whOffset + whStartPos,
    horizonI - BIG_SPRITE_DIMENSIONS,
    BIG_SPRITE_DIMENSIONS
  );
  drawImage2(
    wh2,
    ZERO_POS,
    whOffset + whStartPos + BIG_SPRITE_DIMENSIONS,
    horizonI - BIG_SPRITE_DIMENSIONS,
    BIG_SPRITE_DIMENSIONS
  );
  drawImage2(
    wh3,
    ZERO_POS,
    whOffset + whStartPos + 2 * BIG_SPRITE_DIMENSIONS,
    horizonI - BIG_SPRITE_DIMENSIONS,
    BIG_SPRITE_DIMENSIONS
  );

  let textureCoord = 0;
  let spriteIndex = 0;
  //let dx = 0;
  //let ddx = 0;
  //movingSegment.i -= .5;

  sideSprites.forEach(sprite => {
    const increase = jumping ? SIDE_SPRIDE_SLOW_INCREASE : SIDE_SPRITE_INCREASE;
    sprite.iCoord = clamp(
      sprite.iCoord + increase,
      skyHeight - SPRITE_DIMENSIONS * 1.5,
      height - 1
    );
    sprite.i = round(sprite.iCoord);
  });

  for (let i = zMap.length - 1; i > skyHeight; i--) {
    textureCoord += MAX_TEX / TEX_DEN;
    const zWorld = zMap[i];
    const index = (textureCoord + gameTime + zWorld) % MAX_TEX;
    //const index = (((textureCoord + gameTime + zWorld) % MAX_TEX) + MAX_TEX) % MAX_TEX;

    const whiteLineWidth = whiteLineWidths[i];
    const roadWidth = roadWidths[i];
    const percent = max(i / groundHeight, 0.3);

    // Set i on sprites
    const currentSprite = sprites[spriteIndex];
    while (spriteIndex < sprites.length) {
      if (currentSprite.pos.z <= zWorld) {
        //console.log(currentSprite.zIndex, currentSprite.pos.z, gameTime);
        currentSprite.i = i;
        //currentSprite.zIndex = skyHeight + i;
        spriteIndex++;
      } else {
        break;
      }
    }

    //const currentSideSprite = sideSprites[sideSpriteIndex];
    //while (sideSpriteIndex < sideSprites.length) {
    //if (currentSideSprite.pos.z <= zWorld) {
    //console.log(currentSideSprite.zIndex, currentSideSprite.pos.z, gameTime);
    //currentSideSprite.zIndex = i;
    ////currentSprite.zIndex = skyHeight + i;
    //sideSpriteIndex++;
    //} else {
    //break;
    //}
    /*}*/
    /*
    // Handle curves
    if (i < movingSegment.i) {
      dx = bottomSegment.dx;
    } else if (i > movingSegment.i) {
      dx = movingSegment.dx;
    }

    // Moving segment reached horizon
    if (movingSegment.i <= 0) {
      bottomSegment.dx = movingSegment.dx;
      bottomSegment.i = movingSegment.i;
      movingSegment.i = zMap.length - 1;
      const segmentIndex = floor(gameTime % (roadSegments.length - 1));
      movingSegment.dx = roadSegments[segmentIndex];
    }*/

    //ddx += dx;
    //xOffset += ddx;

    //ctx.strokeStyle = funColor(index);
    ctx.strokeStyle = index < MAX_TEX / 2 ? grass1 : grass2;
    ctx.beginPath();
    ctx.moveTo(round(0), i);
    ctx.lineTo(round(roadWidth.x1 - xOffset + xCenter), i);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(
      round(roadWidth.x2 - sideLineWidth * percent - xOffset + xCenter),
      i
    );
    ctx.lineTo(width + xOffset, i);
    ctx.closePath();
    ctx.stroke();

    // Draw road
    ctx.strokeStyle = road2;
    ctx.beginPath();
    ctx.moveTo(round(roadWidth.x1 - xOffset + xCenter), i);
    ctx.lineTo(
      round(roadWidth.x1 + sideLineWidth * percent - xOffset + xCenter),
      i
    );
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = road2;
    ctx.beginPath();
    ctx.moveTo(round(roadWidth.x2 - xOffset + xCenter), i);
    ctx.lineTo(
      round(roadWidth.x2 - sideLineWidth * percent - xOffset + xCenter),
      i
    );
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = index < MAX_TEX / 2 ? road1 : road2;
    ctx.beginPath();
    ctx.moveTo(round(whiteLineWidth.x1 - xOffset + xCenter), i);
    ctx.lineTo(round(whiteLineWidth.x2 - xOffset + xCenter), i);
    ctx.closePath();
    ctx.stroke();

    textureCoord %= MAX_TEX;
  }

  //sprites.forEach(sprite => {
  //if (sprite.zIndex === -1) return;
  ////console.log(sprite.zIndex);
  //drawImage(treeImage, sprite.pos, 0, sprite.zIndex);
  //});

  sideSprites.forEach(sprite => {
    if (sprite.i === -1) return;

    const roadWidth = roadWidths[sprite.i];
    const percent = max(sprite.i / groundHeight, 0.3);
    //let x = round(roadWidth.x1 - xOffset + xCenter);
    let x = round(roadWidth.x1 + player.pos.x - BIG_SPRITE_DIMENSIONS);

  //xOffset = xCenter + player.pos.x;
    let sign = -1;
    //if (sprite.side === "right") x = round(roadWidth.x2 - sideLineWidth * percent - xOffset + xCenter);
    if (sprite.side === "right") x = round(roadWidth.x2 - sideLineWidth * percent - xOffset + xCenter + BIG_SPRITE_DIMENSIONS / 2);
    if (sprite.side === "right") sign = 1;

    drawImage2(
      sprite.image,
      ZERO_POS,
      x,
      sprite.i,
      BIG_SPRITE_DIMENSIONS,
      false
    );

    if (sprite.i > zMap.length - 2) {
      sprite.i = skyHeight - BIG_SPRITE_DIMENSIONS;
      sprite.iCoord = sprite.i;
    }
  });

  drawImage2(
    player.image,
    player.pos,
    xOffset,
    player.i + horizonI,
    BIG_SPRITE_DIMENSIONS
  );
}

function drawImage2(
  image: HTMLImageElement,
  pos: Vector,
  xOffset = 0,
  yOffset = 0,
  dimensions = SPRITE_DIMENSIONS,
  dontScale = true
) {
  let scale = (yOffset) / height || 1;
  scale = dontScale ? 1 : scale;
  const xScaleOffset = dontScale ? 0 : (scale * dimensions);
  const yScaleOffset = dontScale ? 0 : (scale * dimensions);

  ctx.drawImage(
    image,
    0,
    0,
    dimensions,
    dimensions,
    floor(xOffset + pos.x - dimensions / 2 + xScaleOffset),
    floor(yOffset + pos.y + pos.z + yScaleOffset),
    floor(dimensions * scale),
    floor(dimensions * scale)
  );
}

function drawImage(
  image: HTMLImageElement,
  pos: Vector,
  xOffset = 0,
  yOffset = 0
) {
  const scale = yOffset / height || 1;

  ctx.drawImage(
    image,
    floor(xOffset + pos.x - SPRITE_DIMENSIONS / 2),
    floor(yOffset + pos.y + pos.z),
    floor(SPRITE_DIMENSIONS),
    floor(SPRITE_DIMENSIONS)
  );

  /*  ctx.drawImage(*/
  //image,
  //floor(xOffset + pos.x - scale * SPRITE_DIMENSIONS / 2),
  //floor(yOffset + pos.y + pos.z + (scale * SPRITE_DIMENSIONS) / 2),
  //floor(SPRITE_DIMENSIONS * scale),
  //floor(SPRITE_DIMENSIONS * scale)
  /*);*/
}

async function load() {
  console.log("loading");
  const imageData = await flipImage(mailboxImageData);
  requestAnimationFrame(tick);
  const image = new Image();
  image.src = imageData;
  //rightMailbox.image = image;
  rightMailboxes.forEach(mb => (mb.image = image));
  sideSprites.push(...rightMailboxes, ...leftMailboxes);
  console.log(sideSprites);
  //sideSprites.push(rightMailbox);
  console.log("loaded");
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
    case "ArrowUp":
      inputState.jump = true;
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
    case "ArrowUp":
      inputState.jump = false;
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

window.addEventListener("touchend", (e: TouchEvent) => {
  pointerState.down = false;
  if (realTime - pointerState.downAt < 500) jump();
  pointerState.downAt = null;
});

window.addEventListener("mousedown", () => {
  pointerState.down = true;
  pointerState.downAt = realTime;
});

window.addEventListener("mousemove", (e: MouseEvent) => {
  if (!pointerState.down) return;
  const xPercentage = e.offsetX / window.innerWidth;
  const x = width * xPercentage;
  player.pos.x = x;
});

window.addEventListener("touchmove", (e: TouchEvent) => {
  const xPercentage = e.touches[0].clientX / window.innerWidth;
  const x = width * xPercentage;

  const diff = (x - pointerState.x) / 4;
  player.pos.x = pointerState.playerX + diff;
});

window.addEventListener("mouseup", () => {
  pointerState.down = false;
});

window.addEventListener("click", () => {
  jump();
});

window.addEventListener("resize", resize);

window.addEventListener("load", load);

async function flipImage(imageData: any): Promise<string> {
  const imgCanvas = document.createElement("canvas") as HTMLCanvasElement;
  const imgCtx = imgCanvas.getContext("2d");

  const image = new Image();
  image.src = imageData;

  return new Promise(resolve => {
    image.onload = () => {
      console.log(image.width);
      imgCtx.translate(image.width, 0);
      imgCtx.scale(-1, 1);
      imgCtx.drawImage(image, 0, 0);
      resolve(imgCanvas.toDataURL());
    };
  });
}

interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
}

interface Sprite {
  image: HTMLImageElement;
  pos: Vector;
  vel: Vector;
  i: number;
  iCoord: number;
}

interface SideSprite {
  image: HTMLImageElement;
  side: "left" | "right";
  i: number;
  iCoord: number;
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

//interface RoadChunk {
//pos: Vector;
//i: number;
//}

//interface RoadSegment {
//i: number;
//dx: number;
//}

function iForZPos(t: number) {
  let l = 0;
  let r = zMap.length - 1;

  let i = -1;
  while (l <= r) {
    i = floor((l + r) / 2);
    const z = zMap[i];
    if (z < t) {
      r = i - 1;
    } else if (z > t) {
      l = i + 1;
    } else {
      return i;
    }
  }

  return i;
}

// https://www.iquilezles.org/www/articles/palettes/palettes.htm
const cpa = { x: 0.3, y: 0.3, z: 0.3 };
const cpb = { x: 0.5, y: 0.3, z: 3 };
const cpc = { x: 0.5, y: 1.0, z: 0 };
const cpd = { x: 0.4, y: 0.9, z: 0.2 };

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

function range(number: number) {
  return Array.from(Array(number).keys());
}

// TODO:
// add money
// add donkey/elephants
// lights on truck
// lazer tractor beams
// more usa stuff?
// particles
// clouds
// flag
// meter
// collisions
// points
// wheels moving
// invincibility thing during an amazon strike?
