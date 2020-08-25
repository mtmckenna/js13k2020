const audioContext = new AudioContext();

const compressor = audioContext.createDynamicsCompressor();
compressor.connect(audioContext.destination);

const gain = audioContext.createGain();
gain.connect(audioContext.destination);
gain.gain.value = -.85;

const audioCache: AudioCache = {};

const groundEngineHz = [50, 70];
const airEngineHz = [60, 80];
const createGroundEngine = () => createEngine(groundEngineHz);
const createAirEngine = () => createEngine(airEngineHz);

function createEngine(frequencies: number[]): OscillatorNode[] {
  return frequencies.map(hz => {
    const oscillator = audioContext.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(hz, audioContext.currentTime);
    oscillator.connect(audioContext.destination);
    oscillator.connect(gain);
    return oscillator;
  });
}

export function startGroundEngine() {
  const groundEngine = createGroundEngine()
  audioCache.groundEngine = groundEngine;
  audioCache.groundEngine.forEach(node => node.start());
}

export function stopGroundEngine() {
  audioCache.groundEngine.forEach(node => node.stop());
  audioCache.groundEngine = null;
}


export function startAirEngine() {
  const airEngine = createAirEngine()
  audioCache.airEngine = airEngine;
  audioCache.airEngine.forEach(node => node.start());
}

export function stopAirEngine() {
  audioCache.airEngine.forEach(node => node.stop());
  audioCache.airEngine = null;
}

interface AudioCache {
  groundEngine?: OscillatorNode[];
  airEngine?: OscillatorNode[];
}
