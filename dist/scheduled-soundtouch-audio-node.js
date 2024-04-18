/*
* SoundTouch Audio Worklet v0.1.26 AudioWorklet using the
* SoundTouch audio processing library
* 
* Copyright (c) Olli Parviainen
* Copyright (c) Ryan Berdeen
* Copyright (c) Jakub Fiala
* Copyright (c) Steve 'Cutter' Blades
* Copyright (c) Dance Cuts LLC
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

'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _toPrimitive(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == typeof i ? i : String(i);
}
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", {
    writable: false
  });
  return Constructor;
}
function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  Object.defineProperty(subClass, "prototype", {
    writable: false
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}
function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}
function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };
  return _setPrototypeOf(o, p);
}
function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;
  try {
    Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}
function _construct(Parent, args, Class) {
  if (_isNativeReflectConstruct()) {
    _construct = Reflect.construct.bind();
  } else {
    _construct = function _construct(Parent, args, Class) {
      var a = [null];
      a.push.apply(a, args);
      var Constructor = Function.bind.apply(Parent, a);
      var instance = new Constructor();
      if (Class) _setPrototypeOf(instance, Class.prototype);
      return instance;
    };
  }
  return _construct.apply(null, arguments);
}
function _isNativeFunction(fn) {
  try {
    return Function.toString.call(fn).indexOf("[native code]") !== -1;
  } catch (e) {
    return typeof fn === "function";
  }
}
function _wrapNativeSuper(Class) {
  var _cache = typeof Map === "function" ? new Map() : undefined;
  _wrapNativeSuper = function _wrapNativeSuper(Class) {
    if (Class === null || !_isNativeFunction(Class)) return Class;
    if (typeof Class !== "function") {
      throw new TypeError("Super expression must either be null or a function");
    }
    if (typeof _cache !== "undefined") {
      if (_cache.has(Class)) return _cache.get(Class);
      _cache.set(Class, Wrapper);
    }
    function Wrapper() {
      return _construct(Class, arguments, _getPrototypeOf(this).constructor);
    }
    Wrapper.prototype = Object.create(Class.prototype, {
      constructor: {
        value: Wrapper,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    return _setPrototypeOf(Wrapper, Class);
  };
  return _wrapNativeSuper(Class);
}
function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }
  return self;
}
function _possibleConstructorReturn(self, call) {
  if (call && (typeof call === "object" || typeof call === "function")) {
    return call;
  } else if (call !== void 0) {
    throw new TypeError("Derived constructors may only return object or undefined");
  }
  return _assertThisInitialized(self);
}
function _createSuper(Derived) {
  var hasNativeReflectConstruct = _isNativeReflectConstruct();
  return function _createSuperInternal() {
    var Super = _getPrototypeOf(Derived),
      result;
    if (hasNativeReflectConstruct) {
      var NewTarget = _getPrototypeOf(this).constructor;
      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }
    return _possibleConstructorReturn(this, result);
  };
}

function createScheduledSoundTouchNode(audioCtx, audioBuffer) {
  var onInitialized = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  var ScheduledSoundTouchNode = function (_AudioWorkletNode) {
    _inherits(ScheduledSoundTouchNode, _AudioWorkletNode);
    var _super = _createSuper(ScheduledSoundTouchNode);
    function ScheduledSoundTouchNode(context, audioBuffer) {
      var _this;
      var onInitialized = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      _classCallCheck(this, ScheduledSoundTouchNode);
      _this = _super.call(this, context, 'scheduled-soundtouch-worklet', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [2]
      });
      _this.port.onmessage = _this._messageProcessor.bind(_assertThisInitialized(_this));
      _this._audioBuffer = audioBuffer;
      _this._playing = false;
      _this._ready = false;
      _this._onInitialized = onInitialized;
      return _this;
    }
    _createClass(ScheduledSoundTouchNode, [{
      key: "playing",
      get: function get() {
        return this._playing;
      }
    }, {
      key: "ready",
      get: function get() {
        return this._ready;
      }
    }, {
      key: "sampleRate",
      get: function get() {
        if (!this.audioBuffer) return undefined;
        return this.audioBuffer.sampleRate;
      }
    }, {
      key: "duration",
      get: function get() {
        if (!this.audioBuffer) return undefined;
        return this.audioBuffer.duration;
      }
    }, {
      key: "bufferLength",
      get: function get() {
        if (!this.audioBuffer) return undefined;
        return this.audioBuffer.length;
      }
    }, {
      key: "numberOfChannels",
      get: function get() {
        if (!this.audioBuffer) return undefined;
        return this.audioBuffer.numberOfChannels;
      }
    }, {
      key: "onInitialized",
      set: function set(func) {
        this._onInitialized = func;
      }
    }, {
      key: "pitch",
      get: function get() {
        return this.parameters.get("pitch");
      }
,
      set: function set(pitch) {
        this.parameters.get("pitch").value = pitch;
      }
    }, {
      key: "pitchSemitones",
      get: function get() {
        return this.parameters.get("pitchSemitones");
      }
,
      set: function set(semitone) {
        this.parameters.get("pitchSemitones").value = semitone;
      }
    }, {
      key: "rate",
      get: function get() {
        return this.parameters.get("rate");
      }
,
      set: function set(rate) {
        this.parameters.get("rate").value = rate;
      }
    }, {
      key: "tempo",
      get: function get() {
        return this.parameters.get("tempo");
      }
,
      set: function set(tempo) {
        this.parameters.get("tempo").value = tempo;
      }
    }, {
      key: "start",
      value: function start() {
        var when = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
        var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
        var duration = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
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
    }, {
      key: "stop",
      value: function stop() {
        this._playing = false;
        this.port.postMessage({
          message: "STOP"
        });
        if (this.bufferNode) {
          this.bufferNode.disconnect();
        }
        this.bufferNode = null;
        if (this.onended && typeof this.onended === "function") {
          this.onended();
        }
      }
    }, {
      key: "_messageProcessor",
      value: function _messageProcessor(eventFromWorker) {
        var message = eventFromWorker.data.message;
        if (message === 'PROCESSOR_CONSTRUCTOR') {
          this.audioBuffer = audioBuffer;
          return this.port.postMessage({
            message: 'INITIALIZE_PROCESSOR',
            detail: [{
              sampleRate: this.sampleRate,
              duration: this.duration,
              bufferLength: this.bufferLength,
              numberOfChannels: this.numberOfChannels
            }, audioBuffer.getChannelData(0), this.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : audioBuffer.getChannelData(0)]
          });
        }
        if (message === 'PROCESSOR_READY') {
          this._ready = true;
          if (this._onInitialized && typeof this._onInitialized === "function") {
            this._onInitialized(this);
          }
          return;
        }
        if (message === 'PROCESSOR_END') {
          return this.stop();
        }
      }
    }]);
    return ScheduledSoundTouchNode;
  }( _wrapNativeSuper(AudioWorkletNode));
  return new ScheduledSoundTouchNode(audioCtx, audioBuffer, onInitialized);
}

exports.createScheduledSoundTouchNode = createScheduledSoundTouchNode;
