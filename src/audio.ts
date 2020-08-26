const audioContext = new (AudioContext || window.webkitAudioContext)();

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

let notes = [300, 150,  100,]; // hertz
let times = [0.3, 0.3,  0.4]; // seconds
//const sound = createSound(notes, times);    

export const playTheThing = () => createSound(notes, times, "triangle");    


function createSound(notes: number[], times: number[], type: OscillatorType) {
  console.log("CATS");
	let oscillators = [];
	notes.forEach((note, index) => {
		let oscillator = audioContext.createOscillator();
		oscillator.connect(gain);
		oscillator.type = type || "triangle";
		oscillator.frequency.value = note;
		//oscillator.onended = playNote.bind(this, index + 1, oscillators, times);
		oscillator.onended = () => playNote(index + 1, oscillators, times);
		oscillators.push(oscillator);
	});
	playNote (0, oscillators, times);
}

function playNote (index: number, oscillators: OscillatorNode[], times: number[]) {
	if(index < oscillators.length ) {
		oscillators[index].start();
		oscillators[index].stop(audioContext.currentTime + times[index]);
	}
}

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
