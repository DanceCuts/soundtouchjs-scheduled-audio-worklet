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

/**
 * @param {AudioContext} audioCtx - an AudioContext instance
 * @param {AudioBuffer} audioBuffer - an AudioBuffer
 * @param {Function(ScheduledSoundTouchNode)} onInitialized - (optional) a function to be called when the internal Soundtouch processor is ready. 
 */
export function createScheduledSoundTouchNode(audioCtx, audioBuffer, onInitialized = null) {
  class ScheduledSoundTouchNode extends AudioWorkletNode {
    /**
     * @param {AudioContext} context - an AudioContext instance
     * @param {AudioBuffer} audioBuffer - an AudioBuffer
     * @param {Function(ScheduledSoundTouchNode)} onInitialized - (optional) a function to be called when the internal Soundtouch processor is ready. 
     */
    constructor(context, audioBuffer, onInitialized = null) {
      super(context, 'scheduled-soundtouch-worklet', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [2], //forces output to stereo, even if input is mono
      });
      
      this.port.onmessage = this._messageProcessor.bind(this);

      // Copy the passed AudioBuffer, so it doesn't become detached and can be reused
      this._audioBuffer = audioBuffer;
      this._playing = false;
      this._ready = false;
      this._onInitialized = onInitialized;
    }

    /** (Readonly) Returns true if the node is currently playing */
    get playing() {
      return this._playing;
    }

    /** (Readonly) Returns true if the internal Soundtouch processor is ready. 
     * Use the `onInitialized` param if you need a callback when it's ready. */
    get ready() {
      return this._ready;
    }

    /** (Readonly) Returns the sample rate of the audio buffer. */
    get sampleRate() {
      if (!this.audioBuffer) return undefined;
      return this.audioBuffer.sampleRate;
    }

    /** (Readonly) Returns the duration of the audio buffer. */
    get duration() {
      if (!this.audioBuffer) return undefined;
      return this.audioBuffer.duration;
    }

    /** (Readonly) Returns the length of the audio buffer. */
    get bufferLength() {
      if (!this.audioBuffer) return undefined;
      return this.audioBuffer.length;
    }

    /** (Readonly) Returns the number of channels of the audio buffer. */
    get numberOfChannels() {
      if (!this.audioBuffer) return undefined;
      return this.audioBuffer.numberOfChannels;
    }

    /**
     * @param {Function(ScheduledSoundTouchNode)} func - The function to be called when the internal Soundtouch processor is ready.
     */
    set onInitialized(func) {
      this._onInitialized = func;
    }

    /** Returns the currently set pitch of the node. */
    get pitch() { 
      return this.parameters.get("pitch");
    }
    /**
     * @param {Number} pitch - The pitch to change to. A value of 1 means no pitch change. Default is 1.
     *                         NOTE: The `pitch` parameter takes precedence over the `pitchSemitones` parameter.
     */
    set pitch(pitch) {
      this.parameters.get("pitch").value = pitch;
    }

    /** Returns the currently set pitch of the node, in semitones. */
    get pitchSemitones() { 
      return this.parameters.get("pitchSemitones");
    }
    /**
     * @param {Number} semitone - The semitone to change to. A value of 0 means no pitch change. Default is 0.
     *                            NOTE: The `pitch` parameter takes precedence over the `pitchSemitones` parameter.
     */
    set pitchSemitones(semitone) {
      this.parameters.get("pitchSemitones").value = semitone;
    }

    /** The currently set rate of the node. */
    get rate() { 
      return this.parameters.get("rate");
    }
    /**
     * Changes the rate of the node. Careful changing this during playback, as it will also change how much of the audio source is played!
     * @param {Number} rate - The rate to change to. A value of 1 means no change, a value of 2 would playback at double the speed with affected pitch, a value of 0.5 would playback at half the speed
     *                        with affected pitch. Default is 1.
     *                        NOTE: The `rate` parameter takes precedence over the `tempo` parameter.
     */
    set rate(rate) {
      this.parameters.get("rate").value = rate;
    }

    /** The currently set tempo of the node. */
    get tempo() { 
      return this.parameters.get("tempo");
    }
    /**
     * Changes the tempo of the node. Careful changing this during playback, as it will also change how much of the audio source is played!
     * @param {Number} tempo - The tempo to change to. A value of 1 means no tempo change, a value of 2 would playback at double the speed, a value of 0.5 would playback at half the speed. Default is 1.
     *                         NOTE: The `rate` parameter takes precedence over the `tempo` parameter.
     */
    set tempo(tempo) {
      this.parameters.get("tempo").value = tempo;
    }

    /**
     * Plays the audio source starting at `offset` for `duration` seconds, scheduled to start at `when`.
     * @param {Number} when - (optional) Used to schedule playback of this node. Provide a value in seconds relative to your AudioContext's `currentTime`. Defaults to `this.context.currentTime`.
     * @param {Number} offset - (optional) Where in the audio source to start at, in seconds. Defaults to 0.
     * @param {Number} duration - (optional) How long to play the node, in seconds. Note that the `rate` and `tempo` parameters will affect how much of the audio source is played; for example, if `tempo`   
     *                            is set to "2" and the `duration` is "6", the node will play 12 seconds of the audio source at double speed, effectively playing for 6 seconds. Defaults to the duration of the audio buffer.
     */
    start(when = null, offset = null, duration = null) {
      when = when || this.context.currentTime;
      offset = offset || 0;
      duration = duration || this.duration;
      if (!this.ready) {
        throw new Error('[ERROR] ScheduledSoundTouchWorklet is not ready yet!');
      }

      this.parameters.get("when").value = when;
      this.parameters.get("offsetSamples").value = Math.floor(offset * this.sampleRate);
      this.parameters.get("playbackDurationSamples").value = Math.floor(duration * this.sampleRate);

      this._playing = true;
      
      this.bufferNode = this.context.createBufferSource();
      this.bufferNode.buffer = this.audioBuffer;
      this.bufferNode.connect(this);
    }

    /** Stops playback of the node. */
    stop() {
      this._playing = false;

      this.port.postMessage({
        message: "STOP",
      });
      
      if (this.bufferNode) {
        this.bufferNode.disconnect(); //disconnecting bufferNode stops the worklet
      }
      this.bufferNode = null;

      if (this.onended && typeof(this.onended) === "function") {
        this.onended();
      }
    }

    _messageProcessor(eventFromWorker) {
      const { message } = eventFromWorker.data;

      if (message === 'PROCESSOR_CONSTRUCTOR') {
        //processor ready for audio buffer, send it over!
        this.audioBuffer = audioBuffer;
        return this.port.postMessage({
          message: 'INITIALIZE_PROCESSOR',
          detail: [
            {
              sampleRate: this.sampleRate,
              duration: this.duration,
              bufferLength: this.bufferLength,
              numberOfChannels: this.numberOfChannels,
            },
            audioBuffer.getChannelData(0),
            this.numberOfChannels > 1
              ? audioBuffer.getChannelData(1)
              : audioBuffer.getChannelData(0),
          ],
        });
      }

      if (message === 'PROCESSOR_READY') {
        this._ready = true;
        if (this._onInitialized && typeof(this._onInitialized) === "function") {
          this._onInitialized(this);
        }
        return;
      }

      if (message === 'PROCESSOR_END') {
        return this.stop();
      }
    }
  }

  return new ScheduledSoundTouchNode(audioCtx, audioBuffer, onInitialized);
}