/*
 * SoundTouch JS audio processing library
 * Copyright (c) DanceCuts LLC
 * Copyright (c) Olli Parviainen
 * Copyright (c) Ryan Berdeen
 * Copyright (c) Jakub Fiala
 * Copyright (c) Steve 'Cutter' Blades
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 */

import { SoundTouch, SimpleFilter } from 'soundtouchjs';
import ProcessAudioBufferSource from './ProcessAudioBufferSource';

class ScheduledSoundTouchWorklet extends AudioWorkletProcessor {
  constructor(nodeOptions) {
    super();

    this._initialized = false;
    this.port.onmessage = this._messageProcessor.bind(this);
    this.port.postMessage({
      message: 'PROCESSOR_CONSTRUCTOR',
      detail: nodeOptions,
    });
  }

  /**
   * Called when message received from AudioWorkletNode
   * @param {Map} eventFromWorker - a map containing the keys `message` and `detail`
   * @returns null
   */
  _messageProcessor(eventFromWorker) {
    const { message, detail } = eventFromWorker.data;

    if (message === 'INITIALIZE_PROCESSOR') {
      const [bufferProps, leftChannel, rightChannel] = detail;
      this.bufferSource = new ProcessAudioBufferSource(
        bufferProps,
        leftChannel,
        rightChannel
      );
      this._pipe = new SoundTouch();
      this._filter = new SimpleFilter(this.bufferSource, this._pipe);
      this._filterPositionAtStart = 0;

      // Notify the AudioWorkletNode (ScheduledSoundTouchNode) that the processor is now ready
      this._initialized = true;
      return this.port.postMessage({
        message: 'PROCESSOR_READY',
      });
    }
    else if (message === "STOP") {
      return this.resetAndEnd();
    }
  }

  /**
   * Sends message to the AudioWorkletNode (ScheduledSoundTouchNode)
   * @param {any} message 
   * @param {any} detail 
   * @returns 
   */
  _sendMessage(message, detail = null) {
    if (!message) {
      return;
    }
    this.port.postMessage({ message, detail });
  }

  static get parameterDescriptors() {
    return [
      {
        name: "pitch",
        defaultValue: 1,
      },
      {
        name: "pitchSemitones",
        defaultValue: 0,
      },
      {
        name: "tempo",
        defaultValue: 1,
      },
      {
        name: "rate",
        defaultValue: 1,
      },
      {
        name: "when",
        defaultValue: 0,
      },
      {
        name: "offsetSamples",
        defaultValue: 0,
      },
      {
        name: "playbackDurationSamples",
        defaultValue: 0,
      },
    ];
  }

  reset() {
    if (this._filter) {
      this._filter.sourcePosition = 0; //reset the sourcePosition so if playback is started again, it doesn't continue where it left off.
      this._filterPositionAtStart = this._filter.position;
    }
  }

  resetAndEnd() {
    this.reset();
    this._justEnded = true;
  }
   
  process(inputs, outputs, parameters) {
    if (!this._initialized || !inputs[0].length) {
      this.reset();
      return true;
    }
    
    const {pitch, pitchSemitones, tempo, rate, when, offsetSamples, playbackDurationSamples} = Object.fromEntries(Object.entries(parameters).map(([key, val]) => [key, val[0]]));
    const bufferSize = inputs[0][0].length;
    const sampleRate = this.bufferSource.sampleRate;
    // eslint-disable-next-line no-undef
    const _currentTime = currentTime;

    //pitch takes precedence over pitchSemitones
    if (pitch !== 1) {
      this._pipe.pitch = pitch;
      this._pipe.pitchSemitones = 1;
    }
    else {  
      this._pipe.pitchSemitones = pitchSemitones;
    }
    //rate takes precedence over tempo
    if (rate !== 1) {
      this._pipe.rate = rate;
      this._pipe.tempo = 1;
    } else {
      this._pipe.tempo = tempo;
    }
    if (!this._filter.sourcePosition || Number.isNaN(this._filter.sourcePosition) || this._filter.sourcePosition < offsetSamples) { 
      //seek to playback start point
      this._filter.sourcePosition = offsetSamples;
    }

    const playbackPosition = this._filter.position - this._filterPositionAtStart;
    if (playbackPosition > playbackDurationSamples) { 
      //playbackDurationSamples reached, stop playing
      this.resetAndEnd();
      this._sendMessage('PROCESSOR_END');
      return true;
    }

    if (_currentTime < when) { 
      //not playing yet!
      this.reset();
      return true;
    }

    const left = outputs[0][0];
    const right = outputs[0].length > 1 ? outputs[0][1] : outputs[0][0];

    if (!left || (left && !left.length)) {
      this.resetAndEnd();
      this._sendMessage('PROCESSOR_END');
      return false; // no output?! guess it's time to die!
    }

    const startFrame = Math.round(Math.max(0, (when - _currentTime) * sampleRate));
    const totalFrames = Math.min(bufferSize - startFrame, playbackDurationSamples - playbackPosition);
    let samples = new Float32Array(totalFrames * 2);
    const trueFramesExtracted = Math.min(totalFrames, playbackDurationSamples - playbackPosition); // for some reason, the "frames extracted" returned by soundtouch extract() is > 0 even after the audio has ended?!? this should get the "true" number of frames extracted.
    const framesExtracted = this._filter.extract(samples, totalFrames);

    if ((isNaN(samples[0]) && trueFramesExtracted <= 0) //sometimes right after starting playback, the first few extract() calls return NaN samples. This check prevents it from immediately stopping after start
      || !framesExtracted) {
      //no more audio left to process, stop playing
      this.resetAndEnd();
      this._sendMessage('PROCESSOR_END');
      return true;
    }

    //sometimes after the PROCESSOR_END message is sent, process gets accidently called an extra time, resulting in garbage output. this _justEnded variable fixes that. 
    if (this._justEnded) {
      this._justEnded = false;
      return true;
    }

    // The sampleBuffer is an interleavered Float32Array (LRLRLRLRLR...), so we pull the bits from their corresponding location
    for (let i = startFrame; i < startFrame + framesExtracted; i++) {
      left[i] = samples[i * 2];
      right[i] = samples[i * 2 + 1];
      if (isNaN(left[i]) || isNaN(right[i])) {
        left[i] = 0;
        right[i] = 0;
      }
    }
    return true;
  }
}

registerProcessor('scheduled-soundtouch-worklet', ScheduledSoundTouchWorklet);
