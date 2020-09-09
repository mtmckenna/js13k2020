import "./index.css";

import { drawText } from "./font";

import {
  engineAlreadyStarted,
  startEngines,
  playHitWall,
  playHitMailbox,
  playHitGold,
  playAirEngine,
  playGroundEngine,
  quietAllEngines,
  playElectionDay,
  playNoFunds,
  countdownBeeps
} from "./audio";

import carImageData from "../assets/mailtruck-sheet-big.png";
import brickWallImageData from "../assets/brick-wall.png";
import goldImageData from "../assets/gold.png";
import mailboxImageData from "../assets/mailbox-big.png";
import wh1ImageData from "../assets/whitehouse1-big.png";
import wh2ImageData from "../assets/whitehouse2-big.png";
import wh3ImageData from "../assets/whitehouse3-big.png";
import city1ImageData from "../assets/city1-big.png";
import city2ImageData from "../assets/city2-big.png";
import city3ImageData from "../assets/city3-big.png";
import envelopeImageData from "../assets/envelope2.png";
import cloudsImageData from "../assets/clouds-big.png";
import treeImageData from "../assets/tree-big.png";

const { random, floor, round, min, max, sin } = Math;

const canvasWrapper: HTMLElement = document.querySelector("#canvas-wrapper");
const canvas: HTMLCanvasElement = document.querySelector(
  "#game"
) as HTMLCanvasElement;
const ctx: CanvasRenderingContext2D = canvas.getContext("2d");

let width = 320;
let height = 240;
let aspectRatio = width / height;

canvas.height = height;
canvas.width = width;

const SPRITE_DIMENSIONS = 32;
const BIG_SPRITE_DIMENSIONS = 64;
const JUMP_VELOCITY = -10;
const GRAVITY = 0.3;
const MAX_NEGATIVE_VEL = JUMP_VELOCITY;
const MAX_POSITIVE_VEL = -JUMP_VELOCITY;
const GROUND_PERCENT = 0.5;
const ROAD_WIDTH_PERCENT = 1.1;
const ZERO_POS = { x: 0, y: 0, z: 0 };
const UI_PADDING = 4;
const FONT_SIZE = 20;
const WALL_PARTICLES = 55;
const WALL_DIMENSIONS = 4;
const WALL_PARTICLE_Y_VEL = -2;
const WALL_PARTICLE_X_VEL = 1;
const WALL_PARTICLE_DELAY = 5;
const TRUCK_SPARKS = 25;
const TRUCK_SPARKS_DIMENSIONS = 2;
const TRUCK_SPARK_Y_VEL = -1;
const TRUCK_SPARK_X_VEL = 1;
const TRUCK_SPARK_DELAY = 5;
const SECOND_ROW_Y = UI_PADDING * 2 + FONT_SIZE;
const MAX_FUNDING_BAR = width - UI_PADDING * 2;
const HIT_TIME = 1.5;
const FLASH_TIME = 0.25;
const ANIMATION_TIME = 0.25;
const INSTRUCTIONS_FLASH_TIME = 5;
const FUNDING_HIT_AMOUNT = 20;
const MAILBOX_HIT_AMOUNT = 5;
const GOLD_HIT_AMOUNT = 5;
const PLAYER_EDGE = width / 2;
const GAME_UPDATE_TIME = 5;
const MAX_ROAD_WIDTH = width * ROAD_WIDTH_PERCENT;
const SHAKE_CLASS_NAME = "shake";
const LAND_CLASS_NAME = "land";
const ALPHA_INCREASE_AMOUNT = 0.09;
const COLLECTABLE_DIMENSION = 16;
const ENVELOPE_TIME = 5;
const ENVELOPE_DELAY = 100;
const GAME_OVER_FUNDING_TEXT = "RAN OUT OF FUNDS!";
const GAME_OVER_TIME_TEXT = "IT IS ELECTION DAY!";
const ROAD_SPRITE_SPAWN_X = width / 4;
const RESTART_TIMEOUT_TIME = 1000;
const START_TIME = 90;
const START_FUNDING = 100;
const TOUCH_TIME = 300;
const SHADOW_COLOR = "#EEE";
const SPARK_COLOR = "#fc9003";
const MAILBOX_CHANCE_SPAWN = 0.02;
const MAILBOX_TIME_OFFSCREEN = 1;
const INITIAL_WALLS = 2;
const INTRO_TIME = 2;
const GAME_START_DELAY = 18;
const CURVE_AMPLITUDE = .002;
const CURVE_FREQUENCY = 10;
const NUM_TREES = 30;
const TREE_CHANCE_SPAWN = .05;
const TREE_TIME_OFFSCREEN = 1;

let dx = 0;
let ddx = 0;
let gameOverText = "";
let ballotText = "";
let instructionsAlpha = 1.0;
let restartTimeout: number = null;

let gameVars: GameVars = {
  started: false,
  funding: START_FUNDING,
  timeLeft: START_TIME,
  ballots: 0,
  countdownBeepsPlayed: [],
  gameOver: false,
  readyToRestart: false,
  playedGameOverSound: false,
  startedAt: null,
  lastHitAt: null,
  lastFlashedAt: null,
  lastTimeDecrementedAt: null,
  lastFlashedInstructionsAt: null
};

const OVLERLAP_MAP = {
  wall: handleWallOverlap,
  gold: handleGoldOverlap,
  mailbox: handleMailboxOverlap
};

const TIME_WALLS: Array<{ time: number; walls: number }> = [
  { time: START_TIME, walls: 2 },
  { time: 60, walls: 3 },
  { time: 30, walls: 4 },
  { time: 10, walls: 5 }
];

const carImage = new Image();
carImage.src = carImageData;

const rightMailboxImage = new Image();
rightMailboxImage.src = mailboxImageData;

const leftMailboxImage = new Image();
leftMailboxImage.src = mailboxImageData;

const goldImage = new Image();
goldImage.src = goldImageData;

const wallImage = new Image();
wallImage.src = brickWallImageData;

const envelopeImage = new Image();
envelopeImage.src = envelopeImageData;

const cloudsImage = new Image();
cloudsImage.src = cloudsImageData;

const treeImage = new Image();
treeImage.src = treeImageData;

const wh1 = new Image();
const wh2 = new Image();
const wh3 = new Image();
wh1.src = wh1ImageData;
wh2.src = wh2ImageData;
wh3.src = wh3ImageData;

const city1 = new Image();
const city2 = new Image();
const city3 = new Image();
city1.src = city1ImageData;
city2.src = city2ImageData;
city3.src = city3ImageData;

const whStartPos =
  width / 2 - (BIG_SPRITE_DIMENSIONS * 3) / 2 + BIG_SPRITE_DIMENSIONS / 2;

resize();

const sky = "#6c82a6";
const grass1 = "#37946e";
const grass2 = "#306b40";
const GOOD_FUNDING_COLOR = grass2;
const BAD_FUNDING_COLOR = "#852217";
const road1 = "#8c8e91";
const road2 = "#e2ebda";
const maxWhiteLineWidthPercent = 0.009;
const sideLineWidth = 1;

let maxWhiteLineWidth = width * maxWhiteLineWidthPercent;
let skyHeight = height * (1.0 - GROUND_PERCENT);
let groundHeight = floor(height * GROUND_PERCENT);
let roadStartX = (width - width * ROAD_WIDTH_PERCENT) / 2;
let realTime = null;
let gameTime = 0;
let gameTimeAbsolute = 0;

const curveOffsets: number[] = [];
const cameraY = 30;
const zMap: number[] = [];
for (let i = 0; i < height; i++) {
  const worldY = cameraY;
  const d = i - (height - groundHeight);
  const z = d === 0 ? 0 : worldY / d;
  zMap.push(z);
}

for (let i = 0; i < floor(height - skyHeight); i++) {
  curveOffsets[i] = 0;
}

const roadSegments: RoadSegment[] = range(zMap.length * 1).map((i) => {
  return {
    id: i,
    i: i % zMap.length,
    dx: dxForI(i),
  };
});

let movingSegment: RoadSegment = {
  id: roadSegments[0].i,
  i: roadSegments[0].i,
  dx: roadSegments[0].dx,
};

let bottomSegment: RoadSegment = {
  id: roadSegments[zMap.length - 1].i,
  i: roadSegments[zMap.length - 1].i,
  dx: roadSegments[zMap.length - 1].dx,
};

const roadWidths: Array<{ x1: number; x2: number }> = [];
for (let i = 0; i < zMap.length; i++) {
  const percent = i / height;
  const width = MAX_ROAD_WIDTH * percent;
  const startX = roadStartX + (MAX_ROAD_WIDTH - width) / 2;
  roadWidths.push({ x1: startX, x2: startX + width });
}

const whiteLineWidths: Array<{ x1: number; x2: number }> = [];
for (let i = 0; i < zMap.length; i++) {
  const percent = i / height;
  const width = maxWhiteLineWidth * percent;
  const startX = roadStartX + (MAX_ROAD_WIDTH - width) / 2;
  whiteLineWidths.push({ x1: startX, x2: startX + width });
}

const horizonI = skyHeight;
const xCenter = floor(width / 2);

let playerIForGround50 = 50;
const playerI = playerIForGround50 + horizonI;
const player: Sprite = {
  image: carImage,
  pos: { x: 0, y: 0, z: zMap[playerI] },
  vel: { x: 0, y: 0, z: 0 },
  alpha: 1,
  active: true,
  activatedAt: 1,
  animatedAt: 1,
  frame: 0,
  dimensions: BIG_SPRITE_DIMENSIONS
};

const envelopes: Sprite[] = range(MAILBOX_HIT_AMOUNT * 20).map(_ => {
  return {
    image: envelopeImage,
    pos: {
      x: randomIntBetween(0, width),
      y: randomIntBetween(-height, 0),
      z: 0
    },
    vel: { x: randomFloatBetween(-1, 1), y: 1, z: 0 },
    alpha: 1,
    active: false,
    activatedAt: 0,
    animatedAt: 0,
    frame: 0,
    dimensions: SPRITE_DIMENSIONS
  };
});

const clouds: Sprite[] = range(10).map(_ => {
  return {
    image: cloudsImage,
    pos: {
      x: randomIntBetween(-width, width + BIG_SPRITE_DIMENSIONS),
      y: randomIntBetween(0, skyHeight - BIG_SPRITE_DIMENSIONS),
      z: 0
    },
    vel: { x: randomFloatBetween(-0.6, -0.2), y: 0, z: 0 },
    alpha: 1,
    active: true,
    activatedAt: 0,
    animatedAt: 0,
    frame: randomIntBetween(0, 1),
    dimensions: BIG_SPRITE_DIMENSIONS
  };
});

// These golds are the ones that are for the UI, not for picking up in the road
const golds2: Sprite[] = range(GOLD_HIT_AMOUNT * 20).map(_ => {
  return {
    image: goldImage,
    pos: {
      x: randomIntBetween(0, width),
      y: randomIntBetween(-height, 0),
      z: 0
    },
    vel: { x: randomFloatBetween(-1, 1), y: 1, z: 0 },
    alpha: 1,
    active: false,
    activatedAt: 0,
    animatedAt: 0,
    frame: 0,
    dimensions: SPRITE_DIMENSIONS
  };
});

const wallParts: Sprite[] = range(WALL_PARTICLES * 20).map(() => {
  return {
    image: null,
    pos: {
      x: 0,
      y: 0,
      z: 0
    },
    vel: {
      x: randomFloatBetween(-WALL_PARTICLE_X_VEL, WALL_PARTICLE_X_VEL),
      y: WALL_PARTICLE_Y_VEL,
      z: 0
    },
    alpha: 1,
    active: false,
    activatedAt: 0,
    animatedAt: 0,
    frame: 0,
    dimensions: WALL_DIMENSIONS
  };
});

const truckSparks: Sprite[] = range(TRUCK_SPARKS * 20).map(() => {
  return {
    image: null,
    pos: {
      x: 0,
      y: 0,
      z: 0
    },
    vel: {
      x: randomFloatBetween(-TRUCK_SPARK_X_VEL, TRUCK_SPARK_X_VEL),
      y: TRUCK_SPARK_Y_VEL,
      z: 0
    },
    alpha: 1,
    active: false,
    activatedAt: 0,
    animatedAt: 0,
    frame: 0,
    dimensions: TRUCK_SPARKS_DIMENSIONS
  };
});

const trees: RoadSprite[] = range(NUM_TREES).map(() => {
  const i = randomIntBetween(skyHeight, height);
  return {
    image: treeImage,
    pos: {
      x: randomIntBetween(-width, -ROAD_SPRITE_SPAWN_X),
      y: 0,
      z: 0
    },
    rect: { x: -1, y: -1, width: -1, height: -1 },
    i: i,
    iCoord: i,
    alpha: 1,
    name: "tree",
    percentChanceOfSpawning: TREE_CHANCE_SPAWN,
    minTimeOffScreen: TREE_TIME_OFFSCREEN,
    lastOnScreenAt: null,
    roadPercent: random(),
    active: random() > .5 ? true : false,
    dimensions: BIG_SPRITE_DIMENSIONS,
    debug: false
  };
});

const leftMailboxes: RoadSprite[] = range(1).map(() => {
  return {
    image: leftMailboxImage,
    pos: {
      x: randomIntBetween(-ROAD_SPRITE_SPAWN_X, ROAD_SPRITE_SPAWN_X),
      y: 0,
      z: 0
    },
    rect: { x: -1, y: -1, width: -1, height: -1 },
    i: floor(skyHeight),
    iCoord: skyHeight,
    alpha: 1,
    name: "mailbox",
    percentChanceOfSpawning: MAILBOX_CHANCE_SPAWN,
    minTimeOffScreen: MAILBOX_TIME_OFFSCREEN,
    lastOnScreenAt: null,
    roadPercent: random(),
    active: false,
    dimensions: BIG_SPRITE_DIMENSIONS,
    debug: false
  };
});

const rightMailboxes: RoadSprite[] = range(1).map(() => {
  return {
    image: rightMailboxImage,
    pos: {
      x: randomIntBetween(-ROAD_SPRITE_SPAWN_X, ROAD_SPRITE_SPAWN_X),
      y: 0,
      z: 0
    },
    rect: { x: -1, y: -1, width: -1, height: -1 },
    i: floor(skyHeight),
    iCoord: skyHeight,
    alpha: 1,
    name: "mailbox",
    percentChanceOfSpawning: MAILBOX_CHANCE_SPAWN,
    minTimeOffScreen: MAILBOX_TIME_OFFSCREEN,
    lastOnScreenAt: null,
    roadPercent: random(),
    active: false,
    dimensions: BIG_SPRITE_DIMENSIONS,
    debug: false
  };
});

const golds: RoadSprite[] = range(2).map(() => {
  return {
    image: goldImage,
    pos: {
      x: randomIntBetween(-ROAD_SPRITE_SPAWN_X, ROAD_SPRITE_SPAWN_X),
      y: 0,
      z: 0
    },
    rect: { x: -1, y: -1, width: -1, height: -1 },
    i: floor(skyHeight),
    iCoord: skyHeight,
    alpha: 1,
    name: "gold",
    percentChanceOfSpawning: 0.01,
    minTimeOffScreen: 10,
    lastOnScreenAt: null,
    roadPercent: random(),
    active: false,
    dimensions: SPRITE_DIMENSIONS,
    debug: false
  };
});

function createWall(): RoadSprite {
  return {
    image: wallImage,
    pos: {
      x: randomIntBetween(-ROAD_SPRITE_SPAWN_X, ROAD_SPRITE_SPAWN_X),
      y: 0,
      z: 0
    },
    rect: { x: -1, y: -1, width: -1, height: -1 },
    i: floor(skyHeight),
    iCoord: skyHeight,
    alpha: 1,
    name: "wall",
    percentChanceOfSpawning: 0.05,
    minTimeOffScreen: 5,
    roadPercent: random(),
    lastOnScreenAt: null,
    active: false,
    dimensions: BIG_SPRITE_DIMENSIONS,
    debug: false,
  };
}

const walls: RoadSprite[] = range(INITIAL_WALLS).map(() => createWall());

const roadSprites: RoadSprite[] = [];

const MAX_TEX = 2;
const TEX_DEN = MAX_TEX * 10;
const TURNING_SPEED = 4.8;

const SLOW_MULTIPLIER = 4;
const normalTime = 70;
const SIDE_SPRITE_INCREASE = 1.4;
const slowTime = normalTime * SLOW_MULTIPLIER;
let turningSpeed = TURNING_SPEED;
let spriteIncrease = SIDE_SPRITE_INCREASE;
let xOffset = 0;
let graceMultiplier = 1;

function tick(t: number) {
  ctx.globalAlpha = 1.0;
  requestAnimationFrame(tick);

  const divisor = inGracePeriod() ? slowTime : normalTime;
  gameTime += 10 / divisor;
  gameTimeAbsolute += 10 / normalTime;
  graceMultiplier = inGracePeriod() ? 1 / SLOW_MULTIPLIER : 1;

  turningSpeed = TURNING_SPEED * graceMultiplier;
  spriteIncrease = SIDE_SPRITE_INCREASE * graceMultiplier;

  if (gameVars.started) {
    runGame(t);
  } else {
    runTitleScreen();
  }

  if (!instructionsFlashedRecently()) {
    gameVars.lastFlashedInstructionsAt = gameTime;
    instructionsAlpha = instructionsAlpha === 1.0 ? 0.0 : 1.0;
  }
}

function isButtonPressed() {
  const touchPressed =
    pointerState.upAt && gameTime - pointerState.upAt < TOUCH_TIME;
  return inputState.left || inputState.right || inputState.jump || touchPressed;
}

function runTitleScreen() {
  if (isButtonPressed()) {
    if (!engineAlreadyStarted()) startEngines();
    playElectionDay();
    gameVars.startedAt = gameTime;
    gameVars.started = true;
  }

  drawSky();

  xOffset = xCenter;
  let textureCoord = 0;
  drawGround(road1);
  for (let i = zMap.length - 1; i > skyHeight; i--) {
    textureCoord += MAX_TEX / TEX_DEN;
    drawRoad(i, textureCoord);
  }

  drawWhiteHouse();

  envelopes.forEach(envelope => {
    if (envelope.pos.y > height) {
      envelope.pos.x = randomIntBetween(0, width);
      envelope.pos.y = randomIntBetween(-height, 0);
    }

    envelope.pos.x += envelope.vel.x;
    envelope.pos.y += envelope.vel.y;

    const { x, y } = envelope.pos;
    ctx.globalAlpha = 1.0;
    ctx.drawImage(
      envelope.image,
      x,
      y,
      COLLECTABLE_DIMENSION,
      COLLECTABLE_DIMENSION
    );
  });

  drawText(
    canvas,
    "VOTE BY MAIL:",
    UI_PADDING + 10 * UI_PADDING,
    UI_PADDING,
    FONT_SIZE
  );
  drawText(
    canvas,
    "FUNDING NOT FOUND",
    UI_PADDING + 4 * UI_PADDING,
    SECOND_ROW_Y,
    FONT_SIZE
  );

  drawText(
    canvas,
    "TAP OR PRESS KEY",
    8 * UI_PADDING,
    UI_PADDING * 40,
    FONT_SIZE,
    "#000",
    SHADOW_COLOR,
    instructionsAlpha
  );
  drawText(
    canvas,
    "TO PLAY",
    24 * UI_PADDING,
    UI_PADDING * 40 + SECOND_ROW_Y,
    FONT_SIZE,
    "#000",
    SHADOW_COLOR,
    instructionsAlpha
  );
}

function drawInstructions() {
  if (gameVars.timeLeft < START_TIME) return;
  const yOffset = 50;
  const yOffset2 = 70;
  drawText(
    canvas,
    "COLLECT BALLOTS",
    UI_PADDING + 10 * UI_PADDING,
    UI_PADDING + yOffset,
    FONT_SIZE
  );
  drawText(
    canvas,
    "BEFORE ELECTION DAY!",
    UI_PADDING,
    SECOND_ROW_Y + yOffset,
    FONT_SIZE
  );
  drawText(
    canvas,
    "KEEP DEMOCRACY",
    UI_PADDING + 10 * UI_PADDING,
    UI_PADDING + yOffset + yOffset2,
    FONT_SIZE
  );
  drawText(
    canvas,
    "ROLLING ALONG!",
    UI_PADDING + 10 * UI_PADDING,
    SECOND_ROW_Y + yOffset + yOffset2,
    FONT_SIZE
  );
}


function advanceRoadSprites(sprites: RoadSprite[]) {
  if (gameVars.timeLeft >= START_TIME) return;
  sprites.forEach(sprite => {
    const increase = spriteIncrease;
    sprite.iCoord = clamp(
      sprite.iCoord + increase,
      skyHeight - sprite.dimensions * scaleForI(skyHeight),
      height - 1
    );
    sprite.i = round(sprite.iCoord);
  });
}

function dxForI(i: number) {
  return CURVE_AMPLITUDE * sin(CURVE_FREQUENCY * i);
}

function runGame(t: number) {
  if (readyToDecrementTime()) updateTimeLeft();
  realTime = t;
  const { timeLeft } = gameVars;

  if (gameVars.gameOver) {
    if (gameVars.readyToRestart && isButtonPressed()) restartGame();
  } else {
    handlePlayerInput(turningSpeed);
    advanceRoadSprites(roadSprites);
    addWall();
  }

  if (timeLeft <= 10) {
    if (!gameVars.countdownBeepsPlayed.includes(timeLeft)) {
      gameVars.countdownBeepsPlayed.push(timeLeft);
      const sound = countdownBeeps[timeLeft];
      if (sound) sound();
    }
  }

  drawSky();
  drawGround(road1);
  drawClouds();
  drawCity();
  let textureCoord = 0;
  movingSegment.i -= spriteIncrease;

  if (!inGracePeriod()) unsetShake();

  xOffset = xCenter + player.pos.x;
  dx = 0;
  ddx = 0;

  for (let i = zMap.length - 1; i > skyHeight; i--) {
    textureCoord += MAX_TEX / TEX_DEN;
    //Handle curves
    if (i < movingSegment.i) {
      dx = bottomSegment.dx;
    } else if (i >= movingSegment.i) {
      dx = movingSegment.dx;
    }

    ddx += dx
    curveOffsets[i - skyHeight] += ddx;

    drawRoad(i, textureCoord);
  }

  //Moving segment reached horizon
  if (movingSegment.i <= 0) {
    bottomSegment.dx = movingSegment.dx;
    bottomSegment.i = movingSegment.i;

    movingSegment.i = zMap.length - 1;
    const movingSegmentIndex = roadSegments.indexOf(roadSegments.find(segment => segment.id === movingSegment.id));
    let segmentIndex = movingSegmentIndex + 1;
    if (segmentIndex > roadSegments.length - 1) segmentIndex = 0;

    movingSegment.dx = roadSegments[segmentIndex].dx;
    movingSegment.id = roadSegments[segmentIndex].id;
  }

  drawRoadSprites();
  drawTrees();
  drawUi();
  drawWallParticles();
  drawEnvelopes();
  drawGolds();
  drawTruck();
  drawTruckSparks();
  drawInstructions();

  if (gameVars.funding <= 0) {
    gameOverFundingZero();
    return;
  }

  if (gameVars.timeLeft <= 0) {
    gameOverTimeZero();
    return;
  }
}

function drawRoadSprites() {
  if (gameVars.timeLeft >= START_TIME) return;
  roadSprites.forEach(sprite => {
    if (sprite.i === -1) return;
    if (!sprite.active && !gameVars.gameOver) {
      if (!spriteReadyToBeOnScreen(sprite)) return;
      if (!isLucky(sprite.percentChanceOfSpawning)) return;
      activateSprite(sprite);
    }

    if (sprite.alpha < 1) sprite.alpha += ALPHA_INCREASE_AMOUNT;
    if (overlaps(sprite) && !gameVars.gameOver) handleOverlap(sprite);

    drawImage(
      sprite.image,
      ZERO_POS,
      spriteOffset(sprite),
      sprite.i,
      sprite.dimensions,
      false,
      sprite.alpha,
      0,
      0,
      sprite.debug
    );

    if (sprite.i > zMap.length - 2) deactivateSprite(sprite);
  });
}

function roadWidthForI(i: number) {
  const totalPercent = i / height;
  const currentRoadWidth = MAX_ROAD_WIDTH * totalPercent;
  return currentRoadWidth;
}

function drawRoad(i: number, textureCoord: number) {
  const zWorld = zMap[i];
  const index = (textureCoord + gameTime + zWorld) % MAX_TEX;

  const whiteLineWidth = whiteLineWidths[i];
  const roadWidth = roadWidths[i];
  const percent = max(i / groundHeight, 0.3);
  const curve = curveOffsets[i - skyHeight];

  const currentRoadWidth = roadWidthForI(i);
  ctx.strokeStyle = index < MAX_TEX / 2 ? grass1 : grass2;
  ctx.beginPath();
  ctx.moveTo(round(0), i);
  const x1 = floor((width - currentRoadWidth) / 2 - xOffset + xCenter + curve);
  ctx.lineTo(x1, i);
  ctx.closePath();
  ctx.stroke();

  const x2 = floor(currentRoadWidth + x1);
  ctx.beginPath();
  ctx.moveTo(x2, i);
  ctx.lineTo(width, i);
  ctx.closePath();
  ctx.stroke();

  ctx.strokeStyle = road2;
  ctx.beginPath();
  ctx.moveTo(round(roadWidth.x1 - xOffset + xCenter + curve), i);
  ctx.lineTo(
    round(roadWidth.x1 + sideLineWidth * percent - xOffset + xCenter + curve),
    i
  );
  ctx.closePath();
  ctx.stroke();

  ctx.strokeStyle = road2;
  ctx.beginPath();
  ctx.moveTo(round(roadWidth.x2 - xOffset + xCenter + curve), i);
  ctx.lineTo(
    round(roadWidth.x2 - sideLineWidth * percent - xOffset + xCenter + curve),
    i
  );
  ctx.closePath();
  ctx.stroke();

  ctx.strokeStyle = index < MAX_TEX / 2 ? road1 : road2;
  ctx.beginPath();
  ctx.moveTo(round(whiteLineWidth.x1 - xOffset + xCenter + curve), i);
  ctx.lineTo(round(whiteLineWidth.x2 - xOffset + xCenter + curve), i);
  ctx.closePath();
  ctx.stroke();

  textureCoord %= MAX_TEX;
}

function curveOffsetForSprite(sprite: RoadSprite) {
  let i = floor(sprite.i + sprite.dimensions * scaleForI(sprite.i));
  i = clamp(i, height - 1, skyHeight + 1);

  let curveOffset = curveOffsets[i - skyHeight];
  return curveOffset;
}

function spriteOffset(sprite: RoadSprite) {
  const roadWidth = roadWidths[sprite.i];
  let curveOffset = curveOffsetForSprite(sprite);

  return (
    roadWidth.x1 +
    (roadWidth.x2 - roadWidth.x1) * sprite.roadPercent - player.pos.x + curveOffset
  );
}

function restartGame() {
  playElectionDay();
  gameVars.gameOver = false;
  gameVars = {
    started: true,
    funding: START_FUNDING,
    timeLeft: START_TIME,
    ballots: 0,
    gameOver: false,
    playedGameOverSound: false,
    readyToRestart: false,
    countdownBeepsPlayed: [],
    startedAt: gameTime,
    lastHitAt: null,
    lastFlashedAt: null,
    lastTimeDecrementedAt: null,
    lastFlashedInstructionsAt: null
  };

  restartTimeout = null;
  golds.forEach(s => resetRoadSprite(s));
  rightMailboxes.forEach(s => resetRoadSprite(s));
  leftMailboxes.forEach(s => resetRoadSprite(s));
  clearArray(walls);
  range(INITIAL_WALLS).forEach(() => walls.push(createWall()));
  buildUpRoadSprites();
}

function gameOver() {
  gameVars.gameOver = true;
  player.alpha = 1;
  unsetShake();
  quietAllEngines();

  if (!restartTimeout) {
    restartTimeout = window.setTimeout(() => {
      gameVars.readyToRestart = true;
    }, RESTART_TIMEOUT_TIME);
  }

  drawText(canvas, gameOverText, 2 * UI_PADDING, UI_PADDING, FONT_SIZE);
  drawText(canvas, ballotText, 2 * UI_PADDING, 2 * SECOND_ROW_Y, FONT_SIZE);

  const votingText = "VOTING IS GOOD!";
  drawText(canvas, votingText, 2 * UI_PADDING, 4 * SECOND_ROW_Y, FONT_SIZE);

  if (gameVars.readyToRestart) {
    const tapText = "TAP OR PRESS KEY";
    drawText(
      canvas,
      tapText,
      8 * UI_PADDING,
      UI_PADDING * 40,
      FONT_SIZE,
      "#000",
      SHADOW_COLOR,
      instructionsAlpha
    );

    const playAgainText = "TO PLAY AGAIN";
    drawText(
      canvas,
      playAgainText,
      12 * UI_PADDING,
      UI_PADDING * 40 + SECOND_ROW_Y,
      FONT_SIZE,
      "#000",
      SHADOW_COLOR,
      instructionsAlpha
    );
  }
}

function gameOverFundingZero() {
  gameOverText = GAME_OVER_FUNDING_TEXT;
  ballotText = `TRY AGAIN PLEASE!`;
  if (!gameVars.playedGameOverSound) {
    playNoFunds();
    gameVars.playedGameOverSound = true;
  }
  gameOver();
}

function gameOverTimeZero() {
  gameOverText = GAME_OVER_TIME_TEXT;
  ballotText = `YOU GOT ${gameVars.ballots} BALLOTS!`;
  if (!gameVars.playedGameOverSound) {
    playElectionDay();
    gameVars.playedGameOverSound = true;
  }
  gameOver();
}

function updateTimeLeft() {
  gameVars.timeLeft = max(gameVars.timeLeft - 1, 0);
  gameVars.lastTimeDecrementedAt = gameTimeAbsolute;
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
      graceMultiplier * (player.vel.y + GRAVITY),
      MAX_NEGATIVE_VEL,
      MAX_POSITIVE_VEL
    );

  if (player.pos.y > 0) {
    player.vel.y = 0;
    player.pos.y = 0;
    playGroundEngine();
    unsetLand();
    window.setTimeout(() => setLand(), 0);
    activateTruckSparks();
  }

  player.pos.y += clamp(player.vel.y, MAX_NEGATIVE_VEL, MAX_POSITIVE_VEL);
  player.pos.x = clamp(player.pos.x, -PLAYER_EDGE, PLAYER_EDGE);

  updatePlayerPos(player.pos.x, player.pos.y);
}

function activateTruckSparks() {
  const halfWidth = floor(player.dimensions / 2);
  const inactive = truckSparks.filter(spark => spark.active !== true);
  const toActivate = truckSparks.slice(
    Math.max(inactive.length - TRUCK_SPARKS, 0)
  );
  toActivate.forEach((spark, i) => {
    const left = random() > 0.5 ? -1 : 1;
    setTimeout(() => {
      spark.active = true;
      spark.activatedAt = gameTime;
      spark.pos.y = playerI + player.dimensions;
      spark.pos.x = xCenter + left * halfWidth;
    }, TRUCK_SPARK_DELAY * i);
  });
}

function handleOverlap(sprite: RoadSprite) {
  if (OVLERLAP_MAP[sprite.name]) OVLERLAP_MAP[sprite.name](sprite);
  deactivateSprite(sprite);
}

function handleWallOverlap(sprite: RoadSprite) {
  if (inGracePeriod()) return;
  const halfWidth = player.dimensions / 3;
  gameVars.lastHitAt = gameTime;
  gameVars.funding = max(gameVars.funding - FUNDING_HIT_AMOUNT, 0);
  setShake();
  playHitWall();
  const inactive = wallParts.filter(part => part.active !== true);
  const toActivate = wallParts.slice(
    Math.max(inactive.length - WALL_PARTICLES, 0)
  );
  toActivate.forEach((part, i) => {
    setTimeout(() => {
      part.active = true;
      part.activatedAt = gameTime;
      part.pos.y = playerI + randomFloatBetween(-halfWidth, halfWidth);
      part.pos.x =
        spriteOffset(sprite) + randomFloatBetween(-halfWidth, halfWidth);
    }, WALL_PARTICLE_DELAY * i);
  });
}

function handleGoldOverlap(sprite: RoadSprite) {
  gameVars.funding = min(gameVars.funding + GOLD_HIT_AMOUNT, START_FUNDING);
  playHitGold();
  const inactive = golds2.filter(gold => gold.active !== true);
  const toActivate = golds2.slice(
    Math.max(inactive.length - GOLD_HIT_AMOUNT, 0)
  );
  toActivate.forEach((gold, i) => {
    setTimeout(() => {
      gold.active = true;
      gold.activatedAt = gameTime;
      gold.pos.y = playerI;
      gold.pos.x = spriteOffset(sprite);
    }, ENVELOPE_DELAY * i);
  });
}

function handleMailboxOverlap(sprite: RoadSprite) {
  playHitMailbox();
  const inactive = envelopes.filter(envelope => envelope.active !== true);
  const toActivate = inactive.slice(
    Math.max(inactive.length - MAILBOX_HIT_AMOUNT, 0)
  );
  toActivate.forEach((envelope, i) => {
    setTimeout(() => {
      envelope.active = true;
      envelope.activatedAt = gameTime;
      envelope.pos.y = playerI;
      envelope.pos.x = spriteOffset(sprite);
    }, ENVELOPE_DELAY * i);
  });
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

function deactivateSprite(sprite: RoadSprite) {
  sprite.active = false;
  sprite.lastOnScreenAt = gameTime;
}

function activateSprite(sprite: RoadSprite) {
  sprite.active = true;
  let i = round(skyHeight - 1.2 * sprite.dimensions * scaleForI(skyHeight));
  sprite.i = i;
  sprite.iCoord = i;
  sprite.roadPercent = random();
  sprite.alpha = 0;
}

function readyToDecrementTime() {
  return (
    timeSinceLastTimeDecrement() > GAME_UPDATE_TIME && gameStartDelayHasPast()
  );
}

function inGracePeriod() {
  return (
    !!gameVars.lastHitAt && timeSinceLastHit() < HIT_TIME && !gameVars.gameOver
  );
}

function gameStartDelayHasPast() {
  return !!gameVars.startedAt && gameTime > gameVars.startedAt + GAME_START_DELAY;
}

function flashedRecently() {
  return timeSinceLastFlash() < FLASH_TIME;
}

function readyToAnimate(sprite: Sprite) {
  return timeSinceLastAnimated(sprite) > ANIMATION_TIME && !gameVars.gameOver;
}

function instructionsFlashedRecently() {
  return timeSinceLastInstructionFlash() < INSTRUCTIONS_FLASH_TIME;
}

function timeSinceLastAnimated(sprite: Sprite) {
  return gameTime - sprite.animatedAt;
}

function timeSinceLastTimeDecrement() {
  return gameTimeAbsolute - gameVars.lastTimeDecrementedAt;
}

function timeSinceLastHit() {
  return gameTime - gameVars.lastHitAt;
}

function timeSinceLastFlash() {
  return gameTime - gameVars.lastFlashedAt;
}

function timeSinceLastInstructionFlash() {
  return gameTime - gameVars.lastFlashedInstructionsAt;
}

function spriteReadyToBeOnScreen(sprite: RoadSprite) {
  return timeSinceSpriteOnScreen(sprite) > sprite.minTimeOffScreen;
}

function timeSinceSpriteOnScreen(sprite: RoadSprite) {
  return gameTime - sprite.lastOnScreenAt;
}

function drawTruck() {
  flashTruck();

  const { frame } = player;
  let nextFrame = frame;
  if (readyToAnimate(player)) {
    nextFrame = (frame + 1) % 2;
    player.animatedAt = gameTime;
  }

  const frameOffset = nextFrame * player.dimensions;
  player.frame = nextFrame;

  drawImage(
    player.image,
    player.pos,
    // Want car to be at the middle so start there and subtract off the player position
    xCenter - player.pos.x,
    playerI - getIntroOffset(),
    player.dimensions,
    true,
    player.alpha,
    frameOffset,
    0
  );
}

function drawSky() {
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
}

function drawGround(fillStyle: string) {
  ctx.fillStyle = fillStyle;
  ctx.fillRect(0, skyHeight, width, groundHeight);
}

function drawWhiteHouse() {
  drawImage(
    wh1,
    ZERO_POS,
    whStartPos,
    horizonI - BIG_SPRITE_DIMENSIONS,
    BIG_SPRITE_DIMENSIONS
  );
  drawImage(
    wh2,
    ZERO_POS,
    whStartPos + BIG_SPRITE_DIMENSIONS,
    horizonI - BIG_SPRITE_DIMENSIONS,
    BIG_SPRITE_DIMENSIONS
  );
  drawImage(
    wh3,
    ZERO_POS,
    whStartPos + 2 * BIG_SPRITE_DIMENSIONS,
    horizonI - BIG_SPRITE_DIMENSIONS,
    BIG_SPRITE_DIMENSIONS
  );
}

function drawCity() {
  const whOffset = xCenter - xOffset;// + curveOffsets[1];
  drawImage(
    city1,
    ZERO_POS,
    whOffset + whStartPos,
    horizonI - BIG_SPRITE_DIMENSIONS,
    BIG_SPRITE_DIMENSIONS
  );
  drawImage(
    city2,
    ZERO_POS,
    whOffset + whStartPos + BIG_SPRITE_DIMENSIONS,
    horizonI - BIG_SPRITE_DIMENSIONS,
    BIG_SPRITE_DIMENSIONS
  );
  drawImage(
    city3,
    ZERO_POS,
    whOffset + whStartPos + 2 * BIG_SPRITE_DIMENSIONS,
    horizonI - BIG_SPRITE_DIMENSIONS,
    BIG_SPRITE_DIMENSIONS
  );
}

function drawUi() {
  if (gameVars.gameOver) return;
  const introOffset = getIntroOffset();
  drawText(
    canvas,
    `${pad(gameVars.ballots)} BALLOTS`,
    UI_PADDING,
    UI_PADDING + introOffset,
    FONT_SIZE
  );
  drawText(
    canvas,
    pad(gameVars.timeLeft),
    width - 3 * (FONT_SIZE * 0.8),
    UI_PADDING + introOffset,
    FONT_SIZE
  );
  drawFundingMeter();
}

function pad(num: number) {
  return `000${num}`.slice(-3);
}

function addWall() {
  const { timeLeft } = gameVars;
  const timeWalls = TIME_WALLS.filter(tw => timeLeft <= tw.time);
  if (!timeWalls.length) return;
  const timeWall = timeWalls[timeWalls.length - 1];
  if (walls.length < timeWall.walls) {
    const wall = createWall();
    walls.push(wall);
    roadSprites.push(wall);
  }
}

function resetRoadSprite(sprite: RoadSprite) {
  let x = randomIntBetween(-ROAD_SPRITE_SPAWN_X, ROAD_SPRITE_SPAWN_X);
  sprite.pos = {
    x,
    y: 0,
    z: 0
  };
  sprite.roadPercent = random();
  sprite.lastOnScreenAt = null;
  sprite.alpha = 1;
  sprite.active = false;
}

function drawFundingMeter() {
  const introOffset = getIntroOffset();
  ctx.fillStyle =
    gameVars.funding < 20 ? BAD_FUNDING_COLOR : GOOD_FUNDING_COLOR;
  const width = floor((MAX_FUNDING_BAR * gameVars.funding) / 100);
  ctx.fillRect(UI_PADDING, SECOND_ROW_Y + introOffset, width, FONT_SIZE + 1);
  drawText(
    canvas,
    "FUNDING",
    UI_PADDING,
    SECOND_ROW_Y + introOffset,
    FONT_SIZE
  );
}

function getWallParticlePosition(particle: Sprite): { x: number; y: number } {
  particle.pos.x += particle.vel.x;
  particle.pos.y += particle.vel.y;
  particle.vel.y += GRAVITY;
  const { x, y } = particle.pos;
  return { x, y };
}

function getIntroOffset(): number {
  const { startedAt } = gameVars;
  const t = clamp((gameTime - startedAt) / INTRO_TIME, 0, 1);
  const y = lerp(-height / 4, 0, t);
  return y;
}

function getCollectablePosition(
  sprite: Sprite,
  yEndPosition = 0
): { x: number; y: number } {
  const { x, y } = sprite.pos;
  const { activatedAt } = sprite;
  const t = clamp((gameTime - activatedAt) / ENVELOPE_TIME, 0, 1);
  const x2 = lerp(x, 0, t);
  const y2 = lerp(y, yEndPosition, t);
  return { x: x2, y: y2 };
}

function drawTruckSparks() {
  truckSparks
    .filter(sprite => sprite.active)
    .forEach(part => {
      const { x, y } = getWallParticlePosition(part);

      if (y >= height) {
        part.active = false;
        part.vel.y = WALL_PARTICLE_Y_VEL;
        return;
      }

      ctx.fillStyle = SPARK_COLOR;
      ctx.fillRect(x, y, part.dimensions, part.dimensions);
    });
}

function drawWallParticles() {
  wallParts
    .filter(sprite => sprite.active)
    .forEach(part => {
      const { x, y } = getWallParticlePosition(part);

      if (y >= height) {
        part.active = false;
        part.vel.y = WALL_PARTICLE_Y_VEL;
        return;
      }

      ctx.fillStyle = BAD_FUNDING_COLOR;
      ctx.fillRect(x, y, part.dimensions * 2, part.dimensions);
    });
}

function drawGolds() {
  golds2
    .filter(sprite => sprite.active)
    .forEach(gold => {
      const { x, y } = getCollectablePosition(gold, SECOND_ROW_Y);

      if (y === SECOND_ROW_Y) {
        gold.active = false;
        return;
      }

      ctx.drawImage(
        gold.image,
        x,
        y,
        COLLECTABLE_DIMENSION,
        COLLECTABLE_DIMENSION
      );
    });
}

// Copy pasted from drawRoadSprite :grimace:
function drawTrees() {
  if (gameVars.timeLeft >= START_TIME) return;
  advanceRoadSprites(trees);
  trees.forEach(sprite => {
    if (sprite.i === -1) return;
    if (!sprite.active && !gameVars.gameOver) {
      if (!spriteReadyToBeOnScreen(sprite)) return;
      if (!isLucky(sprite.percentChanceOfSpawning)) return;
      activateSprite(sprite);
    }

    if (sprite.alpha < 1) sprite.alpha += ALPHA_INCREASE_AMOUNT;

    const sign = sprite.roadPercent > .5 ? 1 : -1;

    drawImage(
      sprite.image,
      ZERO_POS,
      spriteOffset(sprite) + roadWidthForI(sprite.i) * sign,
      sprite.i,
      sprite.dimensions,
      false,
      sprite.alpha,
      0,
      0,
      sprite.debug
    );

    if (sprite.i > zMap.length - 2) deactivateSprite(sprite);
  });
}


function drawClouds() {
  clouds
    .filter(sprite => sprite.active)
    .forEach(cloud => {
      if (cloud.pos.x < -width) {
        cloud.pos.x = width + cloud.dimensions * 3;
        cloud.pos.y = randomIntBetween(0, skyHeight - BIG_SPRITE_DIMENSIONS);
      } else {
        cloud.pos.x += cloud.vel.x;
      }

      ctx.drawImage(
        cloud.image,
        0,
        (cloud.frame * cloud.dimensions) / 2,
        cloud.dimensions,
        cloud.dimensions / 2,
        cloud.pos.x - player.pos.x,
        cloud.pos.y,
        cloud.dimensions,
        cloud.dimensions / 2
      );
    });
}

function drawEnvelopes() {
  envelopes
    .filter(sprite => sprite.active)
    .forEach(envelope => {
      const { x, y } = getCollectablePosition(envelope);

      if (y === 0) {
        envelope.active = false;
        return;
      }

      ctx.drawImage(
        envelope.image,
        x,
        y,
        COLLECTABLE_DIMENSION,
        COLLECTABLE_DIMENSION
      );
    });
}

function drawImage(
  image: HTMLImageElement,
  pos: Vector,
  xOffset = 0,
  yOffset = 0,
  dimensions = SPRITE_DIMENSIONS,
  dontScale = true,
  alpha = 1,
  srcXOffset = 0,
  srcYOffset = 0,
  debug = false
) {
  let scale = min(yOffset / height, 1) || 1;
  scale = dontScale ? 1 : scale;
  let xScaleOffset = dimensions / 2;
  if (!dontScale) xScaleOffset = (scale * dimensions) / 2;
  const yScaleOffset = dontScale ? 0 : scale * dimensions;

  const oldAlpha = ctx.globalAlpha;

  ctx.globalAlpha = alpha;
  if (debug) {
/*    ctx.fillStyle = "red";*/
    //ctx.fillRect(
      //round(xOffset + pos.x - xScaleOffset),
      //round(yOffset + pos.y + pos.z + yScaleOffset),
      //round(dimensions * scale),
      //round(dimensions * scale)
    /*);*/
  } else {
    ctx.drawImage(
      image,
      srcXOffset,
      srcYOffset,
      dimensions,
      dimensions,
      round(xOffset + pos.x - xScaleOffset),
      round(yOffset + pos.y + pos.z + yScaleOffset),
      round(dimensions * scale),
      round(dimensions * scale)
    );
  }

  ctx.globalAlpha = oldAlpha;
}

async function load() {
  const imageData = await flipImage(mailboxImageData);
  requestAnimationFrame(tick);
  const image = new Image();
  image.src = imageData;
  addFavicon();
  rightMailboxes.forEach(mb => (mb.image = image));
  buildUpRoadSprites();
}

function buildUpRoadSprites() {
  clearArray(roadSprites);
  roadSprites.push(...rightMailboxes, ...leftMailboxes, ...golds, ...walls);
}

function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

function jump() {
  unsetLand();
  if (getIntroOffset() !== 0) return;
  if (player.pos.y !== 0) return;
  player.vel.y = JUMP_VELOCITY;
  playAirEngine();
}

function updatePlayerPos(x: number, y: number) {
  player.pos.x = x;
  player.pos.y = y;
}

function resize() {
  const rect = canvasWrapper.getBoundingClientRect();

  const { width: canvasWidth, height: canvasHeight } = rect;
  const canvasAspectRatio = canvasWidth / canvasHeight;

  if (canvasAspectRatio > aspectRatio) {
    canvas.style.height = `${canvasHeight}px`;
    const w = floor(canvasHeight * aspectRatio);
    canvas.style.width = `${w}px`;
  } else {
    canvas.style.width = `${canvasWidth}px`;
    const h = canvasWidth / aspectRatio;
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
  upAt: null,
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
  pointerState.upAt = null;
  const xPercentage = e.touches[0].clientX / window.innerWidth;
  const x = width * xPercentage;
  pointerState.x = x;
  pointerState.playerX = player.pos.x;
});

window.addEventListener("touchend", () => {
  pointerState.down = false;
  if (realTime - pointerState.downAt < TOUCH_TIME) {
    jump();
    pointerState.upAt = gameTime;
  }

  startEngines();
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

  const diff = x - pointerState.x;

  if (gameVars.gameOver) return;
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

function addFavicon() {
  const link = document.createElement("link");
  link.type = "image/png'";
  link.rel = "icon";
  link.href = envelopeImageData;
  document.getElementsByTagName("head")[0].appendChild(link);
}

async function flipImage(imageData: any): Promise<string> {
  const imgCanvas = document.createElement("canvas") as HTMLCanvasElement;
  const imgCtx = imgCanvas.getContext("2d");

  const image = new Image();
  image.src = imageData;

  return new Promise(resolve => {
    image.onload = () => {
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
  alpha: number;
  active: boolean;
  activatedAt: number;
  animatedAt: number;
  dimensions: number;
  frame: number;
}

interface RoadSprite {
  image: HTMLImageElement;
  pos: Vector;
  rect: Rect;
  i: number;
  iCoord: number;
  roadPercent: number;
  alpha: number;
  name: string;
  lastOnScreenAt: number;
  minTimeOffScreen: number;
  percentChanceOfSpawning: number;
  active: boolean;
  dimensions: number;
  debug: boolean;
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
  upAt: number;
  playerX: number;
  x: number;
  y: number;
}

interface GameVars {
  started: boolean;
  gameOver: boolean;
  readyToRestart: boolean;
  playedGameOverSound: boolean;
  countdownBeepsPlayed: number[];
  ballots: number;
  funding: number;
  startedAt: number;
  timeLeft: number;
  lastHitAt: number;
  lastFlashedAt: number;
  lastTimeDecrementedAt: number;
  lastFlashedInstructionsAt: number;
}

interface RoadSegment {
  id: number;
  i: number;
  dx: number;
}
function scaleForI(i: number) {
  return min(i / height, 1);
}

function overlaps(sprite: RoadSprite) {
  const scale = scaleForI(sprite.i);
  const r2y = sprite.i + scale * sprite.dimensions;

  const past = r2y >= playerI;
  if (!past) return;

  const playerOffset = xCenter;

  const r1x = playerOffset - BIG_SPRITE_DIMENSIONS / 2;
  const r2x = spriteOffset(sprite) - (scale * sprite.dimensions) / 2;
  const r1w = BIG_SPRITE_DIMENSIONS;
  const r2w = sprite.dimensions * scale;

  const r1y = playerI + player.pos.y;
  const r1h = BIG_SPRITE_DIMENSIONS;
  const r2h = sprite.dimensions * scale;

  const h = r1y < r2y + r2h && r1y + r1h > r2y ? true : false;
  const w = r1x < r2x + r2w && r1x + r1w > r2x ? true : false;

  /*ctx.fillStyle = "green";
  ctx.fillRect(r2x, r2y, r2w, r2h);

  ctx.fillStyle = "red";
  ctx.fillRect(r1x, r1y, r1w, r1h);*/

  if (h && w) {
    //ctx.fillStyle = "pink";
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

function lerp(start: number, end: number, t: number): number {
  return start * (1 - t) + end * t;
}

function setShake() {
  if (canvas.classList.contains(SHAKE_CLASS_NAME)) return;
  canvas.classList.add(SHAKE_CLASS_NAME);
}

function unsetShake() {
  if (!canvas.classList.contains(SHAKE_CLASS_NAME)) return;
  canvas.classList.remove(SHAKE_CLASS_NAME);
}

function setLand() {
  if (canvas.classList.contains(LAND_CLASS_NAME)) return;
  canvas.classList.add(LAND_CLASS_NAME);
}

function unsetLand() {
  if (!canvas.classList.contains(LAND_CLASS_NAME)) return;
  canvas.classList.remove(LAND_CLASS_NAME);
}

function clearArray<T>(array: T[]) {
  while (array.length) {
    array.pop();
  }
}

// TODO:
// add mouse controls back in
// make it clearer when running out of time
// time running out visual indicator,
// pan in instructions
// make sure you can see sprites soon enough
// more intense funding running out visual indicator
// trees
// overlapping audio
// landing sound effect
// add flash of color/text when pick up mail
// add flash of color/text when pick up gold
// make truck a little red when it gets hit
// width
