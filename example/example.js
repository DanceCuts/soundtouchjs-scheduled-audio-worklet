/**
 * Loosely based on an example from:
 * http://onlinetonegenerator.com/pitch-shifter.html
 */

import {createScheduledSoundTouchNode} from "../src/createScheduledSoundTouchNode.js";
import {audioBufferToWav} from "./audiobuffer-to-wav.js";

/**
 * https://github.com/chrisguttandin/standardized-audio-context
 * To see this working with the standaridized-audio-context ponyfill,
 * uncomment these two lines
 */
//import sac from 'https://jspm.dev/standardized-audio-context';
//const { AudioContext, AudioWorkletNode } = sac;

const fileInput = document.getElementById('fileinput');
const playBtn = document.getElementById('play');
const stopBtn = document.getElementById('stop');
const restartBtn = document.getElementById('restart');
const exportBtn = document.getElementById('export');
const exportLoading = document.getElementById('exportLoading');
const whenSlider = document.getElementById('whenSlider');
const whenOutput = document.getElementById('when');
whenOutput.innerHTML = whenSlider.value;
const startSlider = document.getElementById('startSlider');
const startOutput = document.getElementById('start');
startOutput.innerHTML = startSlider.value;
const endSlider = document.getElementById('endSlider');
const endOutput = document.getElementById('end');
endOutput.innerHTML = endSlider.value;
const tempoSlider = document.getElementById('tempoSlider');
const tempoOutput = document.getElementById('tempo');
tempoOutput.innerHTML = tempoSlider.value;
const pitchSlider = document.getElementById('pitchSlider');
const pitchOutput = document.getElementById('pitch');
pitchOutput.innerHTML = pitchSlider.value;
const keySlider = document.getElementById('keySlider');
const keyOutput = document.getElementById('key');
keyOutput.innerHTML = keySlider.value;
const volumeSlider = document.getElementById('volumeSlider');
const volumeOutput = document.getElementById('volume');
volumeOutput.innerHTML = volumeSlider.value;
const duration = document.getElementById('duration');

let audioCtx = new AudioContext();
let gainNode;
let soundtouch;
let buffer;

const resetControls = () => {
  playBtn.setAttribute('disabled', 'disabled');
  stopBtn.setAttribute('disabled', 'disabled');
  restartBtn.setAttribute('disabled', 'disabled');
};

const onEnd = () => {
  //if we don't disconnect the gainNode here, we'll keep adding more and more 
  //and the volume will get louder and louder until your speakers blow up!
  gainNode.disconnect(); // disconnect the DestinationNode
  soundtouch.disconnect(); // disconnect the AudioGainNode

  resetControls();
  playBtn.removeAttribute('disabled');
  restartBtn.removeAttribute('disabled');
};

const onInitialized = (_duration) => {
  resetControls();
  playBtn.removeAttribute('disabled');
  restartBtn.removeAttribute('disabled');
  exportBtn.removeAttribute('disabled');
  duration.innerHTML = `Song is ${_duration} seconds long`;
  startSlider.max = _duration;
  endSlider.max = _duration;
  endSlider.value = _duration;
  endOutput.innerHTML = endSlider.value;
};

const loadSource = async (file) => {
  if (soundtouch && soundtouch.playing) {
    stop();
  }
  try {
    playBtn.setAttribute('disabled', 'disabled');
    restartBtn.setAttribute('disabled', 'disabled');

    audioCtx.resume();
    const data = await audioCtx.decodeAudioData(await file.arrayBuffer());
    buffer = data;
    await createNode();
    onInitialized(data.duration);
  } catch (err) {
    console.error('[loadSource] ', err);
  }
};

const createNode = async () => {
  await audioCtx.audioWorklet.addModule("../dist/scheduled-soundtouch-worklet.js");
  soundtouch = createScheduledSoundTouchNode(audioCtx, buffer);
};

const play = function () {
  if (buffer) {
    soundtouch.tempo = tempoSlider.value;
    soundtouch.pitch = pitchSlider.value;
    soundtouch.onended = onEnd;

    gainNode = audioCtx.createGain();
    soundtouch.connect(gainNode); // SoundTouch goes to the GainNode
    gainNode.connect(audioCtx.destination); // GainNode goes to the AudioDestinationNode

    soundtouch.start(audioCtx.currentTime + Number(whenSlider.value), 
      Number(startSlider.value), 
      Number(endSlider.value) - Number(startSlider.value));

    playBtn.setAttribute('disabled', 'disabled');
    stopBtn.removeAttribute('disabled');
    restartBtn.removeAttribute('disabled');
  }
};

const stop = () => {
  gainNode.disconnect(); // disconnect the DestinationNode
  soundtouch.disconnect(); // disconnect the AudioGainNode

  soundtouch.stop();

  stopBtn.setAttribute('disabled', 'disabled');
  restartBtn.removeAttribute('disabled');
  playBtn.removeAttribute('disabled');
};

fileInput.onchange = (e) => {
  loadSource(e.target.files[0]);
};

playBtn.onclick = play;
stopBtn.onclick = stop;
restartBtn.onclick = () => {
  stop();
  play();
};
exportBtn.onclick = async () => {
  if (!buffer) return;

  playBtn.setAttribute('disabled', 'disabled');
  restartBtn.setAttribute('disabled', 'disabled');
  exportBtn.setAttribute('disabled', 'disabled');
  exportLoading.style.display = "block";
  audioCtx = new OfflineAudioContext({
    numberOfChannels: 2,
    length: buffer.sampleRate * (Number(whenSlider.value) + (Number(endSlider.value) - Number(startSlider.value)) + 1),
    sampleRate: buffer.sampleRate,
  });
  await createNode();
  soundtouch.onInitialized = async () => {
    play();
    try {
      const exportBuffer = await audioCtx.startRendering();
      const wavArray = audioBufferToWav(exportBuffer);
      const wavBlob = new Blob([wavArray], {type: "audio/wav"});
      const el = document.createElement("a");
      el.href = URL.createObjectURL(wavBlob);
      el.setAttribute("download", "export.wav");
      document.body.appendChild(el);
      el.click();
      document.body.removeChild(el);
      audioCtx = new AudioContext();
      await createNode();
    }
    catch (err) {
      console.error(`ERROR whilst exporting: ${err}`);
    }
    playBtn.removeAttribute('disabled');
    restartBtn.removeAttribute('disabled');
    exportBtn.removeAttribute('disabled');
    exportLoading.style.display = "none";
  };
};

whenSlider.addEventListener('input', function () {
  whenOutput.innerHTML = this.value;
});

startSlider.addEventListener('input', function () {
  startOutput.innerHTML = this.value;
  endSlider.min = this.value;
  endOutput.innerHTML = endSlider.value;
});

endSlider.addEventListener('input', function () {
  endOutput.innerHTML = this.value;
  startSlider.max = this.value;
  startOutput.innerHTML = startSlider.value;
});

tempoSlider.addEventListener('input', function (e) {
  if (!soundtouch) {
    return e.preventDefault();
  }
  tempoOutput.innerHTML = soundtouch.tempo = this.value;
});

pitchSlider.addEventListener('input', function (e) {
  if (!soundtouch) {
    return e.preventDefault();
  }
  pitchOutput.innerHTML = soundtouch.pitch = this.value;
  soundtouch.tempo = tempoSlider.value;
});

keySlider.addEventListener('input', function (e) {
  if (!soundtouch) {
    return e.preventDefault();
  }
  soundtouch.pitchSemitones = this.value;
  keyOutput.innerHTML = this.value / 2;
  soundtouch.tempo = tempoSlider.value;
});

volumeSlider.addEventListener('input', function () {
  volumeOutput.innerHTML = gainNode.gain.value = this.value;
});
