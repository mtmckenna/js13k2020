const EPSILON = 0.0001;
const RAMP_TIME = 0.1;
const AUDIO_TIME_CONSTANT = .01;
const MAX_ENGINE = 0.2;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

const compressor = audioContext.createDynamicsCompressor();
compressor.connect(audioContext.destination);

const gain = audioContext.createGain();
gain.connect(compressor);
gain.gain.value = 0.05;
//gain.gain.value = 0.00;

const groundEngineHz = [50, 70];
const airEngineHz = [80, 100];
const groundEngine = createEngine(groundEngineHz);
const airEngine = createEngine(airEngineHz);
const triangle = "triangle";

let enginesStarted = false;
export const playHitWall = () =>
  createSound([120, 100], [0.2, 0.4], triangle);
export const playHitMailbox = () =>
  createSound([200, 220], [0.2, 0.3], triangle);
export const playHitGold = () =>
  createSound([250, 250], [0.2, 0.3], triangle);

const Al = 233.08;
const Bf = 246.94;
const C = 261.63;
const D = 293.66;
const E = 329.63;
const F = 349.23;
const G = 392.00;
const A = 440.00;
const R = 1.00;

// https://www.youtube.com/watch?v=PjwsAWomTFI
// https://pages.mtu.edu/~suits/notefreqs.html
//                      glo ry   glo   ry   ha   le  lu  ja   x    glo  ry   glo  ry   ha   le   lu  ja    x    glo ry   glo  ry  ha  le  lu   ja   x   his  tr  is    ma   chn  on
// prettier-ignore
const battleNotes   = [ C,  Bf,  Al,   C,   F,   G,   A,  F,  R,   D,   E,   F,   E,   F,   D,   C,  Al,   R,   C,  Bf,  Al,  C,  F,  G,   A,   F,  R,   F,  G,   G,   F,   E,   F];
// prettier-ignore
const notesDuration = [.4,  .1,  .1,  .1,  .1,  .1,  .4, .2, .03, .2,  .1,  .1,  .1,  .1,  .1,  .4,  .2,  .03, .1,  .1,  .1, .1, .1, .1,  .1,  .1,  .1, .2, .2,  .2,  .2,  .2,  .2];

export const playElectionDay = () =>
  createSound(battleNotes, notesDuration, triangle);

export const playNoFunds = () =>
  createSound([250, 200, 150, 100], [0.4, 0.4, .4, 2.5], triangle);

// https://blog.j-labs.pl/2017/02/Creating-game-for-android-using-JavaScript-4-Sounds-Web-Audio-Api
function createSound(notes: number[], times: number[], type: OscillatorType) {
  const noteGain = audioContext.createGain();
  noteGain.connect(gain);

  let sound: Sound = {
    oscillatorNodes: [],
    gainNode: noteGain
  };

  let oscillators: OscillatorNode[] = [];
  notes.forEach((note, index) => {
    let oscillator = audioContext.createOscillator();
    oscillator.connect(noteGain);
    oscillator.type = type || triangle;
    oscillator.frequency.value = note;
    oscillator.onended = () => playNote(index + 1, sound, times);
    oscillators.push(oscillator);
  });

  sound.oscillatorNodes = oscillators;

  playNote(0, sound, times);
}


function playNote(index: number, sound: Sound, times: number[]) {
  const oscillators = sound.oscillatorNodes;
  const gainNode = sound.gainNode;
  if (index < oscillators.length) {
    const o = oscillators[index];
    const startTime = audioContext.currentTime;
    const endTime = audioContext.currentTime + times[index];

    gainNode.gain.setValueAtTime(EPSILON, startTime);
    o.start(startTime);
    gainNode.gain.setTargetAtTime(1, startTime + EPSILON, AUDIO_TIME_CONSTANT);
    gainNode.gain.setTargetAtTime(0, endTime, AUDIO_TIME_CONSTANT);
    o.stop(endTime + RAMP_TIME);
  }
}

function createEngine(frequencies: number[]): Sound {
  const engineGain = audioContext.createGain();
  engineGain.connect(gain);
  const oscillatorNodes = frequencies.map(hz => {
    const oscillator = audioContext.createOscillator();
    oscillator.type = triangle;
    oscillator.frequency.value = hz;
    oscillator.connect(engineGain);
    return oscillator;
  });

  return {
    oscillatorNodes,
    gainNode: engineGain
  };
}

export function playGroundEngine() {
  const t = audioContext.currentTime;
  groundEngine.gainNode.gain.setValueAtTime(groundEngine.gainNode.gain.value, t);
  groundEngine.gainNode.gain.setTargetAtTime(MAX_ENGINE, t, AUDIO_TIME_CONSTANT);
  airEngine.gainNode.gain.setValueAtTime(airEngine.gainNode.gain.value, t);
  airEngine.gainNode.gain.setTargetAtTime(0, t, AUDIO_TIME_CONSTANT);
}

export function playAirEngine() {
  const t =  audioContext.currentTime;
  groundEngine.gainNode.gain.setValueAtTime(groundEngine.gainNode.gain.value, t);
  groundEngine.gainNode.gain.setTargetAtTime(0, t, AUDIO_TIME_CONSTANT);
  airEngine.gainNode.gain.setValueAtTime(airEngine.gainNode.gain.value, t);
  airEngine.gainNode.gain.setTargetAtTime(MAX_ENGINE, t, AUDIO_TIME_CONSTANT);
}


export function quietAllEngines() {
  groundEngine.gainNode.gain.setValueAtTime(
    groundEngine.gainNode.gain.value,
    audioContext.currentTime
  );
  groundEngine.gainNode.gain.exponentialRampToValueAtTime(
    EPSILON,
    audioContext.currentTime + RAMP_TIME
  );

  airEngine.gainNode.gain.setValueAtTime(
    airEngine.gainNode.gain.value,
    audioContext.currentTime
  );
  airEngine.gainNode.gain.exponentialRampToValueAtTime(
    EPSILON,
    audioContext.currentTime + RAMP_TIME
  );
}

export function startEngines() {
  if (enginesStarted) return;
  airEngine.gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  groundEngine.gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  airEngine.oscillatorNodes.forEach(node => node.start());
  groundEngine.oscillatorNodes.forEach(node => node.start());
  enginesStarted = true;
}

export function engineAlreadyStarted() {
  return enginesStarted;
}

interface Sound {
  oscillatorNodes: OscillatorNode[];
  gainNode: GainNode;
}
