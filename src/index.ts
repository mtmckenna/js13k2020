import { drawText } from "./font";

import carImageData from "../assets/mailtruck-big.png";
import brickWallImageData from "../assets/brick-wall.png";
import goldImageData from "../assets/gold.png";
import mailboxImageData from "../assets/mailbox-big.png";
import whitehouse1ImageData from "../assets/whitehouse1-big.png";
import whitehouse2ImageData from "../assets/whitehouse2-big.png";
import whitehouse3ImageData from "../assets/whitehouse3-big.png";
import city1ImageData from "../assets/city1-big.png";
import city2ImageData from "../assets/city2-big.png";
import city3ImageData from "../assets/city3-big.png";

let gameVars: GameVars = {
  funding: 100,
  timeLeft: 90,
  ballots: 0,
  lastHitAt: null,
  lastFlashedAt: null,
  lastTimeDecrementedAt: null

};

const { abs, random, floor, round, min, max, sin, sign } = Math;

const canvas: HTMLCanvasElement = document.querySelector(
  "#game"
) as HTMLCanvasElement;
const ctx: CanvasRenderingContext2D = canvas.getContext("2d");
let width = 320;
let height = 240;
const EPSILON = .01;
const aspectRatio = width / height;
const SPRITE_DIMENSIONS = 32;
const BIG_SPRITE_DIMENSIONS = 64;
const JUMP_VELOCITY = -5;
const GRAVITY = 0.15;
const MAX_NEGATIVE_VEL = JUMP_VELOCITY;
const MAX_POSITIVE_VEL = -JUMP_VELOCITY;
const GROUND_PERCENT = 0.5;
const ROAD_WIDTH_PERCENT = 1.1;
const ZERO_POS = { x: 0, y: 0, z: 0 };
const UI_PADDING = 4;
const FONT_SIZE = 20;
const SECOND_ROW_Y = UI_PADDING * 2 + FONT_SIZE;
const MAX_FUNDING_BAR = width - UI_PADDING * 2;
const HIT_TIME = 7;
const FLASH_TIME = 1.5;
const FUNDING_HIT_AMOUNT = 5;
const MAILBOX_HIT_AMOUNT = 5;
const PLAYER_EDGE = width / 4;
const GAME_UPDATE_TIME = 10;
const SCREEN_SHAKE_AMOUNT = 50;
const SCREEN_SHAKE_DAMPEN = .9;
//const d = 1/tan(60/2);

const OVLERLAP_MAP = {
  wall: handleWallOverlap,
  gold: handleGoldOverlap,
  mailbox: handleMailboxOverlap
};

const screenShake = {
  x: 0,
  y: 0
};

canvas.height = height;
canvas.width = width;

const carImage = new Image();
carImage.src = carImageData;

const rightMailboxImage = new Image();
rightMailboxImage.src = mailboxImageData;

const goldImage = new Image();
goldImage.src = goldImageData;

const wallImage = new Image();
wallImage.src = brickWallImageData;

const wh1 = new Image();
const wh2 = new Image();
const wh3 = new Image();
wh1.src = city1ImageData;
wh2.src = city2ImageData;
wh3.src = city3ImageData;

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

//const roadSegments: number[] = [];
//let count = 0;
//let sign = 1;
//for (let i = 0; i < zMap.length; i++) {
  //if (count === 10) {
    //sign *= -1;
    //count = 0;
  //}

  //count++;
  //const val = 0.01 * sign;
  //roadSegments.push(val);
//}

const horizonI = skyHeight;
const xCenter = floor(width / 2);

//const logBox: HTMLElement = document.querySelector("#log");
console.log(zMap);

let playerIForGround50 = 50;
const playerI = playerIForGround50 + horizonI;
const player: Sprite = {
  image: carImage,
  pos: { x: 0, y: 0, z: zMap[playerI] },
  vel: { x: 0, y: 0, z: 0 },
  i: playerI,
  iCoord: playerI,
  alpha: 1,
  rect: {
    x: -1,
    y: -1,
    width: BIG_SPRITE_DIMENSIONS,
    height: BIG_SPRITE_DIMENSIONS
  }
};

const rightMailboxes: SideSprite[] = range(2).map(n => {
  const iCoord = n + skyHeight + ((n * 40) % groundHeight);
  return {
    image: rightMailboxImage,
    pos: { x: randomIntBetween(-80, 80), y: 0, z: 0 },
    rect: { x: -1, y: -1, width: -1, height: -1 },
    i: floor(iCoord),
    iCoord: iCoord,
    alpha: 1,
    name: "mailbox",
    percentChanceOfSpawning: .02,
    minTimeOffScreen: 1,
    lastOnScreenAt: null, 
    active: false
  };
});

const golds: SideSprite[] = range(0).map(n => {
  const iCoord = n + skyHeight + ((n * 40) % groundHeight);
  return {
    image: goldImage,
    pos: { x: randomIntBetween(-80, 80), y: 0, z: 0 },
    rect: { x: -1, y: -1, width: -1, height: -1 },
    i: floor(iCoord),
    iCoord: iCoord,
    alpha: 1,
    name: "gold",
    percentChanceOfSpawning: .01,
    minTimeOffScreen: 10,
    lastOnScreenAt: null,
    active: false
  };
});

const walls: SideSprite[] = range(1).map(n => {
  const iCoord = n + skyHeight + ((n * 40) % groundHeight);
  return {
    image: wallImage,
    pos: { x: randomIntBetween(-80, 80), y: 0, z: 0 },
    rect: { x: -1, y: -1, width: -1, height: -1 },
    i: floor(iCoord),
    iCoord: iCoord,
    alpha: 1,
    name: "wall",
    percentChanceOfSpawning: .05,
    minTimeOffScreen: 5,
    lastOnScreenAt: null,
    active: false
  };
});

const sideSprites: SideSprite[] = [];

const MAX_TEX = 2;
//const MAX_TEX = 5;
const TEX_DEN = MAX_TEX * 10;
//const TURNING_SPEED = 1.9;
const TURNING_SPEED = 1.4;

const SLOW_MULTIPLIER = 4;
const normalTime = 50;
const SIDE_SPRITE_INCREASE = 1.8;
const SIDE_SPRIDE_SLOW_INCREASE = 1.8 / SLOW_MULTIPLIER;
const jumpTime = normalTime * SLOW_MULTIPLIER;
let lastTime = -1;
let xOffset = 0;
//const movingSegment: RoadSegment = { dx: roadSegments[0], i: zMap.length + 1 };
//const bottomSegment: RoadSegment = { dx: 0, i: zMap.length };
//const zHorizon = zMap[skyHeight + 2];
//const zBottom = zMap[zMap.length - 1];
function tick(t: number) {
  ctx.globalAlpha = 1.0;
  if (lastTime === -1) {
    lastTime = t;
    requestAnimationFrame(tick);
    return;
  }

  //const divisor = jumping ? jumpTime : normalTime;
  const divisor = normalTime;
  const turningSpeed = TURNING_SPEED;

  /*const turningSpeed = jumping
    ? TURNING_SPEED / SLOW_MULTIPLIER
    : TURNING_SPEED;*/

  gameTime += 10 / divisor;

  if (readyToDecrementTime()) updateTimeLeft();

  realTime = t;
  requestAnimationFrame(tick);

  handlePlayerInput(turningSpeed);

  //updateScreenShake();
  drawSky();
  drawGround();
  drawCity();
  let textureCoord = 0;
  let spriteIndex = 0;
  //let dx = 0;
  //let ddx = 0;
  //movingSegment.i -= .5;

  sideSprites.forEach(sprite => {
    //const increase = jumping ? SIDE_SPRIDE_SLOW_INCREASE : SIDE_SPRITE_INCREASE;
    const increase = SIDE_SPRITE_INCREASE;
    sprite.iCoord = clamp(
      sprite.iCoord + increase,
      skyHeight - SPRITE_DIMENSIONS * 1.5,
      height - 1
    );
    sprite.i = round(sprite.iCoord);
  });

  for (let i = zMap.length - 1; i > skyHeight; i--) {
    textureCoord += MAX_TEX / TEX_DEN;

    drawRoad(i);

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

}

function drawRoad(i: number) {
    const zWorld = zMap[i];
    const index = (textureCoord + gameTime + zWorld) % MAX_TEX;
    //const index = (((textureCoord + gameTime + zWorld) % MAX_TEX) + MAX_TEX) % MAX_TEX;

    const whiteLineWidth = whiteLineWidths[i];
    const roadWidth = roadWidths[i];
    const percent = max(i / groundHeight, 0.3);
    const totalPercent = i / height;

 
    const currentRoadWidth = maxRoadWidth * totalPercent;
    ctx.strokeStyle = index < MAX_TEX / 2 ? grass1 : grass2;
    ctx.beginPath();
    ctx.moveTo(round(0), i);
    const x1 = floor((width - currentRoadWidth) / 2 - xOffset + xCenter);
    ctx.lineTo(x1, i);
    ctx.closePath();
    ctx.stroke();

    const x2 = floor(currentRoadWidth + x1);
    ctx.beginPath();
    ctx.moveTo(x2, i);
    ctx.lineTo(width, i);
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

  sideSprites.forEach(sprite => {
    if (sprite.i === -1) return;
    if (!sprite.active) {
      if (!spriteReadyToBeOnScreen(sprite)) return;
      if (!isLucky(sprite.percentChanceOfSpawning)) return;
      activateSprite(sprite);
    }

    if (overlaps(sprite)) handleOverlap(sprite);

    drawImage(
      sprite.image,
      sprite.pos,
      xCenter - player.pos.x,
      sprite.i,
      BIG_SPRITE_DIMENSIONS,
      false
    );

    if (sprite.i > zMap.length - 2) {
      deactivateSprite(sprite);
    }
  });

  drawTruck();
  drawUi();
}

function updateTimeLeft() {
  gameVars.timeLeft = max(gameVars.timeLeft - 1, 0);
  gameVars.lastTimeDecrementedAt = gameTime;
}

function handlePlayerInput(turningSpeed: number) {
  if (inputState.left) {
    player.pos.x -= turningSpeed;
  }

  if (inputState.right) {
    player.pos.x += turningSpeed;
  }

  if (inputState.jump) jump();

  if (player.pos.y < 0)
    player.vel.y = clamp(
      player.vel.y + GRAVITY,
      MAX_NEGATIVE_VEL,
      MAX_POSITIVE_VEL
    );

  if (player.pos.y > 0) {
    player.vel.y = 0;
    player.pos.y = 0;
  }

  player.pos.y += clamp(player.vel.y, MAX_NEGATIVE_VEL, MAX_POSITIVE_VEL);
  player.pos.x = clamp(player.pos.x, -PLAYER_EDGE, PLAYER_EDGE);
  xOffset = xCenter + player.pos.x;
  
  updatePlayerPos(player.pos.x, player.pos.y);
}

function handleOverlap(sprite: SideSprite) {
  if (inGracePeriod()) return;
  if (OVLERLAP_MAP[sprite.name]) OVLERLAP_MAP[sprite.name]();
  deactivateSprite(sprite);
}

function handleWallOverlap() {
  gameVars.lastHitAt = gameTime;
  gameVars.funding = max(gameVars.funding - FUNDING_HIT_AMOUNT, 0);
}

function handleGoldOverlap() {
  gameVars.funding = min(gameVars.funding + FUNDING_HIT_AMOUNT, 100);
}

function handleMailboxOverlap() {
  gameVars.ballots += min(MAILBOX_HIT_AMOUNT, 999);
}

function isLucky(percentChance: number) {
  return random() < percentChance;
}

function flashTruck() {
  if (!inGracePeriod()) {
    player.alpha = 1;
    return;
  }

  if (flashedRecently()) return;
  const alpha = player.alpha === 1 ? 0.5 : 1;
  gameVars.lastFlashedAt = gameTime;
  player.alpha = alpha;
}

function deactivateSprite(sprite: SideSprite) {
  sprite.active = false;
  sprite.lastOnScreenAt = gameTime;
}

function activateSprite(sprite: SideSprite) {
  sprite.active = true;
  sprite.i = skyHeight - BIG_SPRITE_DIMENSIONS;
  sprite.iCoord = sprite.i;
  const m = 2.2;
  sprite.pos.x = randomIntBetween(-PLAYER_EDGE * m, PLAYER_EDGE * m);
  //sprite.pos.x = 0
  screenShake.x = randomFloatBetween(-SCREEN_SHAKE_AMOUNT, SCREEN_SHAKE_AMOUNT);
  //screenShake.y = randomFloatBetween(-SCREEN_SHAKE_AMOUNT, SCREEN_SHAKE_AMOUNT);
}

function readyToDecrementTime() {
 return timeSinceLastTimeDecrement() > GAME_UPDATE_TIME;
}

function inGracePeriod() {
  return timeSinceLastHit() < HIT_TIME;
}

function flashedRecently() {
  return timeSinceLastFlash() < FLASH_TIME;
}

function timeSinceLastTimeDecrement() {
  return gameTime - gameVars.lastTimeDecrementedAt;
}

function timeSinceLastHit() {
  return gameTime - gameVars.lastHitAt;
}

function timeSinceLastFlash() {
  return gameTime - gameVars.lastFlashedAt;
}

function spriteReadyToBeOnScreen(sprite: SideSprite) {
  return timeSinceSpriteOnScreen(sprite) > sprite.minTimeOffScreen;
}

function timeSinceSpriteOnScreen(sprite: SideSprite)  {
  return gameTime - sprite.lastOnScreenAt;
}

function drawTruck() {
  flashTruck();

  drawImage(
    player.image,
    player.pos,
    xOffset,
    player.i,
    BIG_SPRITE_DIMENSIONS,
    true,
    player.alpha
  );

  /*drawImage(
    player.image,
    player.pos,
    xOffset,
    player.i,
    BIG_SPRITE_DIMENSIONS,
    true,
    player.alpha
  );*/
}

function drawSky() {
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
}

function drawGround() {
  ctx.fillStyle = road1;
  ctx.fillRect(0, skyHeight, width, groundHeight);
}

function drawCity() {
  const whOffset = xCenter - xOffset;
  drawImage(
    wh1,
    ZERO_POS,
    whOffset + whStartPos,
    horizonI - BIG_SPRITE_DIMENSIONS,
    BIG_SPRITE_DIMENSIONS
  );
  drawImage(
    wh2,
    ZERO_POS,
    whOffset + whStartPos + BIG_SPRITE_DIMENSIONS,
    horizonI - BIG_SPRITE_DIMENSIONS,
    BIG_SPRITE_DIMENSIONS
  );
  drawImage(
    wh3,
    ZERO_POS,
    whOffset + whStartPos + 2 * BIG_SPRITE_DIMENSIONS,
    horizonI - BIG_SPRITE_DIMENSIONS,
    BIG_SPRITE_DIMENSIONS
  );
}

function drawUi() {
  drawText(canvas, pad(gameVars.ballots), UI_PADDING, UI_PADDING, FONT_SIZE);
  drawText(canvas, pad(gameVars.timeLeft), width - 3 * (FONT_SIZE * 0.8), UI_PADDING, FONT_SIZE);
  drawFundingMeter();
}

function pad(num: number) {
  return `000${num}`.slice(-3);
}

function drawFundingMeter() {
  ctx.fillStyle = grass2;
  const width = floor((MAX_FUNDING_BAR * gameVars.funding) / 100);
  ctx.fillRect(UI_PADDING, SECOND_ROW_Y, width, FONT_SIZE);
  drawText(canvas, "FUNDING", UI_PADDING, SECOND_ROW_Y, FONT_SIZE);
}

function drawImage(
  image: HTMLImageElement,
  pos: Vector,
  xOffset = 0,
  yOffset = 0,
  dimensions = SPRITE_DIMENSIONS,
  dontScale = true,
  alpha = 1
) {
  let scale = min(yOffset / height, 1) || 1;
  scale = dontScale ? 1 : scale;
  let xScaleOffset = dimensions / 2;
  if (!dontScale) xScaleOffset = (scale * dimensions) / 2;
  const yScaleOffset = dontScale ? 0 : scale * dimensions;

  const oldAlpha = ctx.globalAlpha;
  ctx.globalAlpha = alpha;
  ctx.drawImage(
    image,
    0,
    0,
    dimensions,
    dimensions,
    floor(xOffset + pos.x - xScaleOffset),
    floor(yOffset + pos.y + pos.z + yScaleOffset),
    floor(dimensions * scale),
    floor(dimensions * scale)
  );

  ctx.globalAlpha = oldAlpha;
}

async function load() {
  console.log("loading");
  const imageData = await flipImage(mailboxImageData);
  requestAnimationFrame(tick);
  const image = new Image();
  image.src = imageData;
  rightMailboxes.forEach(mb => (mb.image = image));
  sideSprites.push(...rightMailboxes, ...golds, ...walls);
  console.log(sideSprites);
  console.log("loaded");
}

function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

function jump() {
  if (player.pos.y !== 0) return;
  player.vel.y = JUMP_VELOCITY;
}

function updatePlayerPos(x: number, y: number) {
  player.pos.x = x;
  player.pos.y = y;
  player.rect.x = x;
  player.rect.y = y;
}

function updateScreenShake() {
  const xAmp = abs(screenShake.x);
  const yAmp = abs(screenShake.y);
  const xSign = sign(screenShake.x);
  const x = sin(gameTime / 100) * xAmp * xSign;
  console.log(x);
  screenShake.x = x;
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
  //player.pos.x = x;
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
  //jump();
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
  rect: Rect;
  i: number;
  iCoord: number;
  alpha: number;
}

interface SideSprite {
  image: HTMLImageElement;
  pos: Vector;
  rect: Rect;
  i: number;
  iCoord: number;
  alpha: number;
  name: string;
  lastOnScreenAt: number;
  minTimeOffScreen: number;
  percentChanceOfSpawning: number;
  active: boolean;
}

interface Vector {
  x: number;
  y: number;
  z: number;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PointerState {
  down: boolean;
  downAt: number;
  playerX: number;
  x: number;
  y: number;
}

interface GameVars {
  ballots: number;
  funding: number;
  timeLeft: number;
  lastHitAt: number;
  lastFlashedAt: number;
  lastTimeDecrementedAt: number;
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

function overlaps(sprite: SideSprite) {
  const scale = min(sprite.i / height, 1);
  const r2y = sprite.i + scale * BIG_SPRITE_DIMENSIONS;

  const past = r2y >= player.i;
  if (!past) return;

  const playerOffset = xCenter + player.pos.x;
  const spriteOffset = xCenter - player.pos.x;

  const r1x = player.pos.x + playerOffset - BIG_SPRITE_DIMENSIONS / 2;
  const r2x = sprite.pos.x + spriteOffset - (scale * BIG_SPRITE_DIMENSIONS) / 2;
  const r1w = BIG_SPRITE_DIMENSIONS;
  const r2w = BIG_SPRITE_DIMENSIONS * scale;

  const r1y = player.i + player.pos.y;
  const r1h = BIG_SPRITE_DIMENSIONS;
  const r2h = BIG_SPRITE_DIMENSIONS * scale;

  const h = r1y < r2y + r2h && r1y + r1h > r2y ? true : false;
  const w = r1x < r2x + r2w && r1x + r1w > r2x ? true : false;

  ctx.fillStyle = "green";
  ctx.fillRect(r2x, r2y, r2w, r2h);

  ctx.fillStyle = "red";
  ctx.fillRect(r1x, r1y, r1w, r1h);

  if (h && w) {
    //ctx.fillStyle = "red";
    //ctx.fillRect(r1x, r1y, r1w, r1h);
    return true;
  } else {
    return false;
  }
}

function range(number: number) {
  return Array.from(Array(number).keys());
}

function randomFloatBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomIntBetween(min: number, max: number) {
  return Math.floor(randomFloatBetween(min, max + 1));
}

// TODO:
// parrallax
// brick walls
// screen shake
// lights on truck
// more usa stuff?
// particles
// clouds
// title screen
// sounds
// meter
// collisions
// points
// wheels moving
// invincibility thing ?
// put zero back in the middle, collissions happen in screen space,  convert
// stars on top/bottom
