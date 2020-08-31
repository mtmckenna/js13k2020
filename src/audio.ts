const EPSILON = 0.0001;
const RAMP_TIME = 0.5;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

const compressor = audioContext.createDynamicsCompressor();
compressor.connect(audioContext.destination);

const gain = audioContext.createGain();
gain.connect(audioContext.destination);
gain.gain.value = 0.01;

const groundEngineHz = [50, 70];
const airEngineHz = [60, 80];
const groundEngine = createEngine(groundEngineHz);
const airEngine = createEngine(airEngineHz);

let enginesStarted = false;
export const playHitWall = () => createSound([80, 40], [0.3, 0.2], "triangle");
export const playHitMailbox = () =>
  createSound([200, 220], [0.2, 0.3], "triangle");
export const playHitGold = () =>
  createSound([250, 250], [0.2, 0.3], "triangle");

// https://blog.j-labs.pl/2017/02/Creating-game-for-android-using-JavaScript-4-Sounds-Web-Audio-Api
function createSound(notes: number[], times: number[], type: OscillatorType) {
  let oscillators = [];
  notes.forEach((note, index) => {
    const noteGain = audioContext.createGain();
    noteGain.connect(gain);
    let oscillator = audioContext.createOscillator();
    oscillator.connect(gain);
    oscillator.type = type || "triangle";
    oscillator.frequency.value = note;
    oscillator.onended = () => playNote(index + 1, oscillators, times);
    oscillators.push(oscillator);
  });

  playNote(0, oscillators, times);
}

function playNote(
  index: number,
  oscillators: OscillatorNode[],
  times: number[]
) {
  if (index < oscillators.length) {
    oscillators[index].start();
    oscillators[index].stop(audioContext.currentTime + times[index]);
  }
}

function createEngine(frequencies: number[]): EngineSound {
  const engineGain = audioContext.createGain();
  engineGain.connect(gain);
  const oscillatorNodes = frequencies.map(hz => {
    const oscillator = audioContext.createOscillator();
    oscillator.type = "triangle";
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
  groundEngine.gainNode.gain.setValueAtTime(
    groundEngine.gainNode.gain.value,
    audioContext.currentTime
  );
  groundEngine.gainNode.gain.exponentialRampToValueAtTime(
    1.0,
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

export function playAirEngine() {
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
    1.0,
    audioContext.currentTime + RAMP_TIME
  );
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
  airEngine.oscillatorNodes.forEach(node => node.start());
  groundEngine.oscillatorNodes.forEach(node => node.start());
  enginesStarted = true;
}

interface EngineSound {
  oscillatorNodes: OscillatorNode[];
  gainNode: GainNode;
}
