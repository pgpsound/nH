/* Copyright 2019 Paul G. Pontious */

var nmbrSrcs = 5;
var mutateSpeed = 15;
var oneOffSpeed = 10;
var oneOffDensity = 3;
var oneOffDistance = 3;
var oneOffGain = 0.7;
var oneOffMaxSpd = 0.2;
var oneOffWidth = 45; // in degrees

function resetBasic() {
  nmbrSrcs = Math.ceil(Math.random() * 7) + 2; // 3-9
  mutateSpeed = Math.ceil(Math.random() * 20) + 10; // 11-30
  oneOffSpeed = Math.ceil(Math.random() * 15) + 7; // 8-22
  oneOffDensity = Math.ceil(Math.random() * 3) + 2; // 3-5
  loopCtrlRndm();
  oneOffRndm();
  // following sets variables for particle.js - see visual.js
  // var particleNumber = (nmbrSrcs + oneOffDensity) * 150;
  // var particleSpeed = (mutateSpeed + oneOffSpeed + Math.abs(loopCtrl) + Math.abs(audioOneOff.pos.spd)) / 16;
};

//------------------
// AudioLoop Object
//------------------
var audioLoop = {
    buffer: {},
    compatibility: {},
    files: [
      'https://dl.dropboxusercontent.com/s/tw8giqci0ysyfnr/SomethingUseful_b.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/jsa8kce75fg23ij/SomethingUseful_a.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/yejdgk4pqketoru/SeaWaves3_b.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/8wvv59g6nhbs95t/SeaWaves3_a.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/pju0x8edvuozxw3/SeaWaves2_b.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/s5y0c9x75qrj91i/SeaWaves2_a.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/aggk3ki8v9h4dv5/SeaWaves1_b.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/vv6w1hil2tgxa14/SeaWaves1_a.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/br4bdzmgnnhy3yh/RainClouds_b.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/r7bgc7a1j2dgmgz/RainClouds_a.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/ysdrpk0nzb9e19k/MonsterBass_b.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/70swqqedxp8hull/MonsterBass_a.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/2ea1i4j1k1h3ps1/GhostVoices_b.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/z1ht3gkoz4j2d41/GhostVoices_a.m4a?dl=0'
    ],
    proceed: true,
    source_loop: {},
    source_once: {},
    globalPlaying: false,
    rndmOrder: [],
};
// REPLACE www.dropbox.com WITH dl.dropboxusercontent.com

for (i = 0; i < audioLoop.files.length; i++) {
   audioLoop.rndmOrder[i] = i;
};


//---------------------
// AudioLoop Mutations
//---------------------
var loopPlaying = {
  track: [],
  nextUp: nmbrSrcs,
  push: function() {
          this.track.push(this.nextUp);
          if (this.nextUp == 13) {
            this.nextUp = 0;
            } else {
              this.nextUp++;
            }
          }
};

for (i = 0; i < nmbrSrcs; i++) {
  loopPlaying.track[i] = i;
};


//-----------------------------
// Check Web Audio API Support
//-----------------------------
try {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new window.AudioContext({sampleRate: 44100, latencyHint: "playback"});
} catch(e) {
    audioLoop.proceed = false;
    alert('Web Audio API not supported in this browser.');
};


//---------------
// Compatibility
//---------------
(function() {
    var start = 'start',
        stop = 'stop',
        buffer = audioContext.createBufferSource();

    if (typeof buffer.start !== 'function') {
        start = 'noteOn';
    }
    audioLoop.compatibility.start = start;
    if (typeof buffer.stop !== 'function') {
        stop = 'noteOff';
    }
    audioLoop.compatibility.stop = stop;
})();


//-------------------
// Setup Audio Files
//-------------------
for (var a in audioLoop.files) {
    (function() {
        var i = parseInt(a);
        var req = new XMLHttpRequest();
        req.open('GET', audioLoop.files[i], true);
        req.responseType = 'arraybuffer';
        req.onload = function() {
            audioContext.decodeAudioData(
                req.response,
                function(buffer) {
                    audioLoop.buffer[i] = buffer;
                },
                function() {
                    console.log('Error decoding audio "' + audioLoop.files[i] + '".');
                }
            );
        };
        req.send();
    })();
};



//-------------------------------------
// Setting up Master, Loop Connections
//-------------------------------------
var loopMixer = {
  gain: [],
  src: [],
  eq: [],
};

var globalEQ_Low = audioContext.createBiquadFilter();
var globalEQ_High = audioContext.createBiquadFilter();
globalEQ_Low.type = 'lowshelf';
globalEQ_Low.frequency.value = 200;
globalEQ_Low.gain.value = 3;
globalEQ_High.type = 'highshelf';
globalEQ_High.frequency.value = 12000;
globalEQ_High.gain.value = -1.5;

var masterGain = audioContext.createGain();
var resonanceAudioScene = new ResonanceAudio(audioContext);
resonanceAudioScene.output.connect(masterGain);
masterGain.connect(globalEQ_Low);
globalEQ_Low.connect(globalEQ_High);
globalEQ_High.connect(audioContext.destination);
resonanceAudioScene.setAmbisonicOrder(3);
resonanceAudioScene.setListenerPosition(0, 0, 0);
var offset = 0;

for (i = 0; i < audioLoop.files.length; i++) {
  loopMixer.gain[i] = audioContext.createGain();
  loopMixer.src[i] = resonanceAudioScene.createSource();
  loopMixer.eq[i] = audioContext.createBiquadFilter();
  loopMixer.gain[i].connect(loopMixer.eq[i]);
  loopMixer.eq[i].connect(loopMixer.src[i].input);
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
};
audioLoop.rndmOrder = shuffle(audioLoop.rndmOrder);


function eqRandomize () {
  for (i = 0; i < loopMixer.eq.length; i++) {
    var eqFreqMax = 0;
    var eqFreqMin = 0;
    var eqGainMax = 6;
    var eqGainMin = -6;
    var eqType = '';
    var eqSwitch = Math.round(Math.random());
    if (eqSwitch == 0) {
      eqType = 'lowshelf';
      eqFreqMax = 500;
      eqFreqMin = 100;
    } else {
      eqType = 'highshelf';
      eqFreqMax = 10000;
      eqFreqMin = 1000;
    }
    var eqFreq = Math.random() * (eqFreqMax - eqFreqMin) + eqFreqMin;
    var eqGain = Math.random() * (eqGainMax - eqGainMin) + eqGainMin;
    loopMixer.eq[i].type = eqType;
    loopMixer.eq[i].frequency.value = eqFreq;
    loopMixer.eq[i].gain.value = eqGain;
  }
};


//--------------------------------
// Setting up LOOP 3D Positioning
//--------------------------------
var chPos = {
  idealX: [],
  idealY: [],
  idealZ: [],
  tempX: [],
  tempY: [],
  realX: [],
  realY: [],
  realZ: [],
  poleSwitchX: [],
  poleSwitchY: [],
};

var mstrPosX = 0;
var mstrPosY = 90;
var mstrPosZ = 90;
var loopCtrl = 0.1;
var zMax = 0.7;
var loopDistance = 2;
// so far 2 with marble sounds good


function loopCtrlRndm() {
  loopCtrl = (Math.random() * 0.5) + 0.5;
  var pole = Math.round(Math.random());
  if (pole == 0) {
    pole = -1;
  } else {
    pole = 1;
  }
  loopCtrl = loopCtrl * pole;
};


(function rotatorTrigger() {
  setInterval(masterRotator, 50);
})();


function masterRotator() {
  mstrPosX = mstrPosX + loopCtrl;
  mstrPosY = mstrPosY + loopCtrl;
  mstrPosZ = mstrPosZ + loopCtrl;
  var srcCoef = 360 / nmbrSrcs;
  // FOR LOOPS
  for (i = 0; i < audioLoop.rndmOrder.length; i++) {
    chPos.idealX[i] = mstrPosX + (srcCoef * i);
	  chPos.idealY[i] = mstrPosY + (srcCoef * i);
	  chPos.idealZ[i] = mstrPosZ + (srcCoef * i);
  	chPos.tempX[i] = Math.sin(chPos.idealX[i] * Math.PI / 180);
  	chPos.tempY[i] = Math.sin(chPos.idealY[i] * Math.PI / 180);
  	chPos.realZ[i] = zMax * (Math.sin(chPos.idealZ[i] * Math.PI / 180));
  	if (chPos.tempX[i] < 0){
	    chPos.poleSwitchX[i] = -1;
        } else {
  	  chPos.poleSwitchX[i] = 1;
      }
    if (chPos.tempY[i] < 0){
	    chPos.poleSwitchY[i] = -1;
      } else {
	    chPos.poleSwitchY[i] = 1;
    }
	  chPos.realX[i] = chPos.poleSwitchX[i] * Math.pow(Math.abs(chPos.tempX[i]), 3);
    chPos.realY[i] = chPos.poleSwitchY[i] * (Math.sqrt(Math.abs(chPos.tempY[i])));
  	loopMixer.src[i].setPosition(loopDistance * chPos.realX[i], loopDistance * chPos.realY[i], loopDistance * chPos.realZ[i]);
	};
  for (i = 0; i < audioOneOff.active.length; i++) {
    var x = audioOneOff.active[i];
    var xPole;
    var yPole;
    audioOneOff.pos.ang.x[x] = audioOneOff.pos.ang.x[x] + audioOneOff.pos.spd;
    audioOneOff.pos.ang.y[x] = audioOneOff.pos.ang.y[x] + audioOneOff.pos.spd;
    audioOneOff.pos.ang.z[x] = audioOneOff.pos.ang.z[x] + audioOneOff.pos.spd;
    audioOneOff.pos.temp.x[x] = Math.sin(audioOneOff.pos.ang.x[x] * Math.PI / 180);
    audioOneOff.pos.temp.y[x] = Math.sin(audioOneOff.pos.ang.y[x] * Math.PI / 180);
    audioOneOff.pos.z[x] = (zMax * 1.2) * Math.sin(audioOneOff.pos.ang.z[x] * Math.PI / 180);
    if (audioOneOff.pos.temp.x[x] < 0){
  	  xPole = -1;
      } else {
  	  xPole = 1;
    }
    if (audioOneOff.pos.temp.y[x] < 0){
      yPole = -1;
      } else {
      yPole = 1;
    }
    audioOneOff.pos.x[x] = xPole * Math.pow(Math.abs(audioOneOff.pos.temp.x[x]), 3);
    audioOneOff.pos.y[x] = yPole * Math.sqrt(Math.abs(audioOneOff.pos.temp.y[x]));
    oneOffMixer.src[x].setPosition(oneOffDistance * audioOneOff.pos.x[x], oneOffDistance * audioOneOff.pos.y[i], oneOffDistance * audioOneOff.pos.z[i]);
  }
};


//----------------------
// Room Characteristics
//----------------------

var roomDimensions = {
  width: 500,
  height: 500,
  depth: 500,
};

var roomMaterials = {
/* Room wall materials
  'transparent' 'acoustic-ceiling-tiles' 'brick-bare'
  'brick-painted' 'concrete-block-coarse' 'concrete-block-painted' 'curtain-heavy'
  'fiber-glass-insulation' 'glass-thin' 'glass-thick' 'grass' 'linoleum-on-concrete'
  'marble' 'metal' 'parquet-on-concrete' 'plaster-smooth' 'plywood-panel'
  'polished-concrete-or-tile' 'sheetrock' 'water-or-ice-surface' 'wood-ceiling'
  'wood-panel' 'uniform'
*/
  left: 'marble',
  right: 'marble',
  front: 'marble',
  back: 'marble',
  down: 'marble',
  up: 'marble',
};

resonanceAudioScene.setRoomProperties(roomDimensions, roomMaterials);

//----------------------------
// Audio Sequencing Functions
//----------------------------


function audioLoopPlay() {
  // rebuild play check to reference all tracks (or just the first)
  // and trigger stop for all.
    if (audioLoop.globalPlaying == false){
      resetBasic();
      mutateTimer = setInterval(mutate, mutateSpeed * 1000);
      oneOffTimer();
      audioLoop.rndmOrder = shuffle(audioLoop.rndmOrder);
      eqRandomize();
      for (i = 0; i < nmbrSrcs; i++) {
        loopPlaying.track[i] = i;
        loopPlaying.nextUp = i + 1;
        // testing to see if stereo files useful:
        // var oddCheck = (audioLoop.rndmOrder[i] / 2) % 1 !== 0;
        // if (oddCheck == true) {
        //  var oddBall = -1;
        // } else {
        //  var oddBall = 0;
        // } ** and be sure to add oddBall to rndmOrder below, if re-implementing
        audioLoop.source_loop[i] = audioContext.createBufferSource();
        audioLoop.source_loop[i].buffer = audioLoop.buffer[audioLoop.rndmOrder[i]];
        audioLoop.source_loop[i].loop = true;
	    	audioLoop.source_loop[i].connect(loopMixer.gain[i]);
        var offset = Math.random() * audioLoop.buffer[i].duration;
        if (audioLoop.compatibility.start === 'noteOn') {
            /*
            The depreciated noteOn() function does not support offsets.
            Compensate by using noteGrainOn() with an offset to play once and then schedule a noteOn() call to loop after that.
            */
          audioLoop.source_once[i] = audioContext.createBufferSource();
          audioLoop.source_once[i].buffer = audioLoop.buffer[audioLoop.rndmOrder[i]];
          audioLoop.source_once[i].connect(loopMixer.gain[i]);
          audioLoop.source_once[i].noteOn(audioContext.currentTime, offset); //
            // Now queue up our looping sound to start immediatly after the source_once audio plays.
          audioLoop.source_loop[i][audioLoop.compatibility.start](audioContext.currentTime + (audioLoop.buffer[i].duration - offset));
        } else {
          audioLoop.source_loop[i][audioLoop.compatibility.start](audioContext.currentTime, offset);
        }
        loopMixer.gain[i].gain.setValueAtTime(0, audioContext.currentTime);
        masterGain.gain.setValueAtTime(1, audioContext.currentTime);
        loopMixer.gain[i].gain.linearRampToValueAtTime(1, audioContext.currentTime + (3 + (i * 0.5)));
        audioLoop.globalPlaying = true;
      }
    } else {
      audioLoopStop();
    }
};


var fadeOut = 0.25;

function audioLoopStop() {
  masterGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + fadeOut);
  if (audioLoop.globalPlaying == true) {
    for (var i in loopMixer.gain) {
      loopMixer.gain[i].gain.linearRampToValueAtTime(0, audioContext.currentTime + fadeOut);
      if (typeof audioLoop.source_loop[i] !== 'undefined') {
        audioLoop.source_loop[i][audioLoop.compatibility.stop](audioContext.currentTime + fadeOut);
      } else {
        continue;
      }
      if (audioLoop.compatibility.start === 'noteOn') {
        if (typeof audioLoop.source_loop[i] !== 'undefined') {
          audioLoop.source_once[i][audioLoop.compatibility.stop](audioContext.currentTime + fadeOut);
        } else {
          continue;
        }
      }
      audioLoop.source_loop[i]._startTime = 0;
      audioLoop.globalPlaying = false;
    }
  }
  clearInterval(mutateTimer);
  for (i = 0; i < mutateShift.length; i++) {
    clearTimeout(mutateShift[i]);
  }
  var mutateCount = 0;
  oneOffStop();
};


//----------------------
// Loop Mutation System
//----------------------

var mutateLevel = Math.round(nmbrSrcs * 0.33);
if (mutateLevel < 1) {
  mutateLevel = 1;
};
var mutateTimer;
var mutateShift = [];

function mutate() {
  for (i = 0; i < mutateLevel; i++) {
    // lowering volume for first playing track
    loopMixer.gain[loopPlaying.track[i]].gain.linearRampToValueAtTime(0, audioContext.currentTime + mutateSpeed);
    loopMixer.gain[loopPlaying.track[i]].gain.setValueAtTime(0, audioContext.currentTime + mutateSpeed);
    audioLoop.source_loop[loopPlaying.track[i]][audioLoop.compatibility.stop](audioContext.currentTime + mutateSpeed);
    if (audioLoop.compatibility.start === 'noteOn') {
        audioLoop.source_once[loopPlaying.track[i]][audioLoop.compatibility.stop](audioContext.currentTime + mutateSpeed);
      }
    mutateShift[i] = setTimeout(function() {
      loopPlaying.track.shift();
    }, audioContext.currentTime + mutateSpeed * 1000);
    // connecting and raising volume for new track
    audioLoop.source_loop[loopPlaying.nextUp] = audioContext.createBufferSource();
    audioLoop.source_loop[loopPlaying.nextUp].buffer = audioLoop.buffer[audioLoop.rndmOrder[loopPlaying.nextUp]];
    audioLoop.source_loop[loopPlaying.nextUp].loop = true;
    audioLoop.source_loop[loopPlaying.nextUp].connect(loopMixer.gain[loopPlaying.nextUp]);
    var offset = Math.random() * audioLoop.buffer[loopPlaying.nextUp].duration;
    if (audioLoop.compatibility.start === 'noteOn') {
      audioLoop.source_once[loopPlaying.nextUp] = audioContext.createBufferSource();
      audioLoop.source_once[loopPlaying.nextUp].buffer = audioLoop.buffer[audioLoop.rndmOrder[loopPlaying.nextUp]];
      audioLoop.source_once[loopPlaying.nextUp].connect(loopMixer.gain[loopPlaying.nextUp]);
      audioLoop.source_once[loopPlaying.nextUp].noteOn(audioContext.currentTime, offset);
      audioLoop.source_loop[loopPlaying.nextUp][audioLoop.compatibility.start](audioContext.currentTime + (audioLoop.buffer[loopPlaying.nextUp].duration - offset));
    } else {
      audioLoop.source_loop[loopPlaying.nextUp][audioLoop.compatibility.start](audioContext.currentTime, offset);
    }
  loopMixer.gain[loopPlaying.nextUp].gain.setValueAtTime(0, audioContext.currentTime);
  loopMixer.gain[loopPlaying.nextUp].gain.linearRampToValueAtTime(1, audioContext.currentTime + mutateSpeed);
  var newFreq = Math.random() * (10000 - 100) + 100;
  var newGain = Math.random() * (12) - 6;
  loopMixer.eq[loopPlaying.nextUp].gain.linearRampToValueAtTime(newGain, audioContext.currentTime + mutateSpeed);
  loopMixer.eq[loopPlaying.nextUp].frequency.linearRampToValueAtTime(newFreq, audioContext.currentTime + mutateSpeed);
  loopPlaying.push();
  }
  // document.getElementById('crawl').innerHTML = loopPlaying.track + loopPlaying.nextUp;
};




//----------------
// One Off System
//----------------


var audioOneOff = {
    files: [
      'https://dl.dropboxusercontent.com/s/1oywfwepkmamm83/Curved%20Air_1_a.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/9gdubhy9kqay9ch/Curved%20Air_1_b.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/jz5uvmkouzsi12j/Curved%20Air_2_a.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/heo9oval2srjcmg/Curved%20Air_2_b.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/11c303cjybvg7iv/Curved%20Air_3_a.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/rsjmgcfvhuvaday/Curved%20Air_3_b.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/ew82cw5g8ojxnrv/Curved%20Air_4_a.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/4cnwl3e4e5hfnki/Curved%20Air_4_b.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/3ysuj7em42rcvly/Curved%20Air_5_a.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/levax21r1iglze1/Curved%20Air_5_b.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/9lspzqfxdoqovh5/Curved%20Air_6_a.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/hgt3g53kiuoyydg/Curved%20Air_6_b.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/k15encoxsj4d9nl/Scale_01.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/3yt5bj3bpwn7b68/Scale_02.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/terb748zh17bgk6/Scale_03.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/wd63wxibet3kc1m/Scale_04.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/bf8wab4c5csk0o2/Scale_05.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/tuwbr5h1ffachzl/Scale_06.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/in9xbgmciptmfiz/Scale_07.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/z52il5f9iytkhig/Scale_08.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/uo5agawcvakj00l/Scale_09.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/katf11cfjyhou82/Scale_10.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/2i6e5ei7sgx9ntm/Scale_11.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/t0b3krj4n7lq3ce/Scale_12.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/cifvclgd4hjauqv/Scale_13.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/ra1h2l0d6i73x4s/Scale_14.m4a?dl=0',
      'https://dl.dropboxusercontent.com/s/fe943srtgcfyjhn/Scale_15.m4a?dl=0'
    ],
    buffer: {},
    compatibility: {},
    proceed: true,
    source: {},
    noteSource: {},
    instance: [],
    count: 0,
    active: [],
    rndmOrder: [],
    pos: {
      x: [],
      y: [],
      z: [],
      spd: 0,
      ang: {
        x: [],
        y: [],
        z: [],
      },
      temp:{
        x: [],
        y: [],
      },
    },
    timer: [],
};

audioOneOff.pos.spd = 1;

for (i = 0; i < 15; i++) {
   audioOneOff.rndmOrder[i] = i + 12;
};
audioOneOff.rndmOrder = shuffle(audioOneOff.rndmOrder);

function oneOffRndm() {
  audioOneOff.pos.spd = (Math.random() * 3) + 0.5;
  var pole = Math.round(Math.random());
  if (pole == 0) {
    pole = -1;
  } else {
    pole = 1;
  }
  audioOneOff.pos.spd = audioOneOff.pos.spd * pole;
  audioOneOff.rndmOrder = shuffle(audioOneOff.rndmOrder);
};

(function() {
    var start = 'start',
        stop = 'stop',
        buffer = audioContext.createBufferSource();

    if (typeof buffer.start !== 'function') {
        start = 'noteOn';
    }
    audioOneOff.compatibility.start = start;
    if (typeof buffer.stop !== 'function') {
        stop = 'noteOff';
    }
    audioOneOff.compatibility.stop = stop;
})();

oneOffLoadTimer = setTimeout(oneOffLoad, 3000);

function oneOffLoad() {
  for (var a in audioOneOff.files) {
      (function() {
          var i = parseInt(a);
          var req = new XMLHttpRequest();
          req.open('GET', audioOneOff.files[i], true);
          req.responseType = 'arraybuffer';
          req.onload = function() {
              audioContext.decodeAudioData(
                  req.response,
                  function(buffer) {
                      audioOneOff.buffer[i] = buffer;
                  },
                  function() {
                      console.log('Error decoding audio "' + audioOneOff.files[i] + '".');
                  }
              );
          };
          req.send();
      })();
  }
};


var oneOffMixer = {
  gain: [],
  src: [],
  eq: [],
};

var oneOffFirst = true;
var oneOffTrigger;

function oneOffTimer() {
  if (oneOffFirst == true) {
    oneOffTrigger = setTimeout(oneOff, oneOffSpeed * 1000 * 2);
    oneOffFirst = false;
  } else {
    oneOffTrigger = setTimeout(oneOff, oneOffSpeed * 1000);
  }
};

var oneOffSide = "left";
var noteNmbr = 0;
var phraseLength;
var finalLength;
var noteChoice = [];

function oneOff() {
  oneOffTimer();
  var oneOffPick;
  var oneOffSwitch;
  var oneOffOdds =  100 - (audioOneOff.instance.length * (100 / oneOffDensity));
  var diceRoll = Math.random() * 100;
  if (diceRoll < oneOffOdds) {
    oneOffSwitch = true;
  } else {
    oneOffSwitch = false;
  }
  if (oneOffSwitch == true) {
    var padOrNote = Math.round(Math.random());
    if (padOrNote == 1) {
      audioOneOff.rndmOrder = shuffle(audioOneOff.rndmOrder);
      var time = [];
      phraseLength = Math.ceil(Math.random() * 5) + 2;
      for (i = 0; i < phraseLength; i++) {
        time[i] = Math.round((Math.random() * 3) + (3 * i)); //  <<< HERE IS THE TIMING FOR THE NOTES!!!
      }
      noteChoice[0] = audioOneOff.rndmOrder[0];
      for (i = 1; i < audioOneOff.rndmOrder.length; i++) {
        if ((Math.abs(audioOneOff.rndmOrder[i] - noteChoice[noteChoice.length - 1]) <= 6) && noteChoice.length < phraseLength) {
          noteChoice.push(audioOneOff.rndmOrder[i]);
        }
      }
      audioOneOff.instance.push(audioOneOff.rndmOrder[0]);
      audioOneOff.active.push(audioOneOff.count);
      // CREATE & ASSIGN MIXER NODES
      oneOffMixer.gain[audioOneOff.count] = audioContext.createGain();
      oneOffMixer.src[audioOneOff.count] = resonanceAudioScene.createSource();
      oneOffMixer.eq[audioOneOff.count] = audioContext.createBiquadFilter();
      oneOffMixer.gain[audioOneOff.count].connect(oneOffMixer.eq[audioOneOff.count]);
      oneOffMixer.eq[audioOneOff.count].connect(oneOffMixer.src[audioOneOff.count].input);
      // EQ SETTINGS
      var eqFreqMax = 0;
      var eqFreqMin = 0;
      var eqGainMax = 6;
      var eqGainMin = -6;
      var eqType = '';
      var eqSwitch = Math.round(Math.random());
      if (eqSwitch == 0) {
        eqType = 'lowshelf';
        eqFreqMax = 500;
        eqFreqMin = 100;
      } else {
        eqType = 'highshelf';
        eqFreqMax = 10000;
        eqFreqMin = 1000;
      }
      var eqFreq = Math.random() * (eqFreqMax - eqFreqMin) + eqFreqMin;
      var eqGain = Math.random() * (eqGainMax - eqGainMin) + eqGainMin;
      oneOffMixer.eq[audioOneOff.count].type = eqType;
      oneOffMixer.eq[audioOneOff.count].frequency.value = eqFreq;
      oneOffMixer.eq[audioOneOff.count].gain.value = eqGain;
      var newFreq = Math.random() * (10000 - 100) + 100;
      var newGain = Math.random() * (12) - 6;
      // 3D POSITIONING
      audioOneOff.pos.ang.x[audioOneOff.count] = Math.random() * 360;
      audioOneOff.pos.ang.y[audioOneOff.count] = Math.random() * 360;
      audioOneOff.pos.ang.z[audioOneOff.count] = Math.random() * 360;
      // AUDIO PLAYBACK
      for (i = 0; i < phraseLength; i++) {
        oneOffMixer.gain[audioOneOff.count].gain.setValueAtTime(oneOffGain, audioContext.currentTime);
        audioOneOff.noteSource[noteNmbr] = audioContext.createBufferSource();
        audioOneOff.noteSource[noteNmbr].buffer = audioOneOff.buffer[audioOneOff.rndmOrder[i]];
        audioOneOff.noteSource[noteNmbr].loop = false;
        audioOneOff.noteSource[noteNmbr].connect(oneOffMixer.gain[audioOneOff.count]);
        if (audioOneOff.compatibility.start === 'noteOn') {
          audioOneOff.noteSource[noteNmbr] = audioContext.createBufferSource();
          audioOneOff.noteSource[noteNmbr].buffer = audioOneOff.buffer[audioOneOff.rndmOrder[i]];
          audioOneOff.noteSource[noteNmbr].connect(oneOffMixer.gain[audioOneOff.count]);
          audioOneOff.noteSource[noteNmbr].noteOn(audioContext.currentTime + time[i]);
        } else {
          audioOneOff.noteSource[noteNmbr][audioOneOff.compatibility.start](audioContext.currentTime + time[i]);
        }
        finalLength = audioOneOff.buffer[audioOneOff.rndmOrder[i]].duration + time[i];
        noteNmbr++;
      }
      audioOneOff.timer[audioOneOff.count] = setTimeout(function() {
        audioOneOff.instance.shift();
        audioOneOff.active.shift();
        if (typeof oneOffMixer.gain[audioOneOff.count] !== 'undefined') {
          oneOffMixer.gain[audioOneOff.count];
        }
        if (typeof oneOffMixer.eq[audioOneOff.count] !== 'undefined') {
          oneOffMixer.eq[audioOneOff.count];
        }
        if (typeof oneOffMixer.src[audioOneOff.count] !== 'undefined') {
          oneOffMixer.src[audioOneOff.count];
        }
      }, finalLength * 1010);
      oneOffMixer.eq[audioOneOff.count].gain.linearRampToValueAtTime(newGain, audioContext.currentTime + finalLength);
      oneOffMixer.eq[audioOneOff.count].frequency.linearRampToValueAtTime(newFreq, audioContext.currentTime + finalLength);
      audioOneOff.count++;
    } else {
      oneOffPick = Math.ceil(Math.random() * 6);
      var stereoTrack = [(oneOffPick + oneOffPick ) - 1, (oneOffPick + oneOffPick ) - 2]
      audioOneOff.instance.push(oneOffPick);
      for (i = 0; i < stereoTrack.length; i++) {
        audioOneOff.active.push(audioOneOff.count)
        // CREATE & ASSIGN MIXER NODES
        oneOffMixer.gain[audioOneOff.count] = audioContext.createGain();
        oneOffMixer.src[audioOneOff.count] = resonanceAudioScene.createSource();
        oneOffMixer.eq[audioOneOff.count] = audioContext.createBiquadFilter();
        oneOffMixer.gain[audioOneOff.count].connect(oneOffMixer.eq[audioOneOff.count]);
        oneOffMixer.eq[audioOneOff.count].connect(oneOffMixer.src[audioOneOff.count].input);
        // EQ SETTINGS
        var eqFreqMax = 0;
        var eqFreqMin = 0;
        var eqGainMax = 6;
        var eqGainMin = -6;
        var eqType = '';
        var eqSwitch = Math.round(Math.random());
        if (eqSwitch == 0) {
          eqType = 'lowshelf';
          eqFreqMax = 500;
          eqFreqMin = 100;
        } else {
          eqType = 'highshelf';
          eqFreqMax = 10000;
          eqFreqMin = 1000;
        }
        var eqFreq = Math.random() * (eqFreqMax - eqFreqMin) + eqFreqMin;
        var eqGain = Math.random() * (eqGainMax - eqGainMin) + eqGainMin;
        oneOffMixer.eq[audioOneOff.count].type = eqType;
        oneOffMixer.eq[audioOneOff.count].frequency.value = eqFreq;
        oneOffMixer.eq[audioOneOff.count].gain.value = eqGain;
        var newFreq = Math.random() * (10000 - 100) + 100;
        var newGain = Math.random() * (12) - 6;
        oneOffMixer.eq[audioOneOff.count].gain.linearRampToValueAtTime(newGain, audioContext.currentTime + audioOneOff.buffer[stereoTrack[i]].duration);
        oneOffMixer.eq[audioOneOff.count].frequency.linearRampToValueAtTime(newFreq, audioContext.currentTime + audioOneOff.buffer[stereoTrack[i]].duration);
        // AUDIO PLAYBACK
        oneOffMixer.gain[audioOneOff.count].gain.setValueAtTime(oneOffGain, audioContext.currentTime);
        audioOneOff.source[audioOneOff.count] = audioContext.createBufferSource();
        audioOneOff.source[audioOneOff.count].buffer = audioOneOff.buffer[stereoTrack[i]];
        audioOneOff.source[audioOneOff.count].loop = false;
        audioOneOff.source[audioOneOff.count].connect(oneOffMixer.gain[audioOneOff.count]);
        if (audioOneOff.compatibility.start === 'noteOn') {
          audioOneOff.source[audioOneOff.count] = audioContext.createBufferSource();
          audioOneOff.source[audioOneOff.count].buffer = audioOneOff.buffer[stereoTrack[i]];
          audioOneOff.source[audioOneOff.count].connect(oneOffMixer.gain[audioOneOff.count]);
          audioOneOff.source[audioOneOff.count].noteOn(0);
        } else {
          audioOneOff.source[audioOneOff.count][audioOneOff.compatibility.start](0);
        }
        // 3D POSITIONING
        if (oneOffSide == "left") {
          audioOneOff.pos.ang.x[audioOneOff.count] = Math.random() * 360;
          audioOneOff.pos.ang.y[audioOneOff.count] = Math.random() * 360;
          audioOneOff.pos.ang.z[audioOneOff.count] = Math.random() * 360;
          oneOffSide = "right";
        } else {
          audioOneOff.pos.ang.x[audioOneOff.count] = audioOneOff.pos.ang.x[audioOneOff.count - 1] + oneOffWidth;
          audioOneOff.pos.ang.y[audioOneOff.count] = audioOneOff.pos.ang.y[audioOneOff.count - 1] + oneOffWidth;
          audioOneOff.pos.ang.z[audioOneOff.count] = audioOneOff.pos.ang.z[audioOneOff.count - 1] + oneOffWidth;
          oneOffSide = "left";
        }
        audioOneOff.timer[audioOneOff.count] = setTimeout(function() {
          audioOneOff.instance.shift();
          audioOneOff.active.shift();
          if (typeof oneOffMixer.gain[audioOneOff.count] !== 'undefined') {
            oneOffMixer.gain[audioOneOff.count];
          }
          if (typeof oneOffMixer.eq[audioOneOff.count] !== 'undefined') {
            oneOffMixer.eq[audioOneOff.count];
          }
          if (typeof oneOffMixer.src[audioOneOff.count] !== 'undefined') {
            oneOffMixer.src[audioOneOff.count];
          }
        }, audioOneOff.buffer[oneOffPick + oneOffPick].duration * 1000);
        // document.getElementById('deBug1').innerHTML = "One-Off " + Math.ceil(audioOneOff.count / 2) + " Called";
        audioOneOff.count++; // keep this as the last thing
    } // end FOR LOOP
  }
  } // end IF TRUE
}; // end ONEOFFs

function oneOffStop() {
  clearTimeout(oneOffTrigger);
  oneOffTrigger;
  for (var i in oneOffMixer.gain) {
    oneOffMixer.gain[i].gain.linearRampToValueAtTime(0, audioContext.currentTime + fadeOut);
  };
  setTimeout(oneOffZero, fadeOut * 1000);
};

function oneOffZero() {
  oneOffFirst = true;
  oneOffMixer.gain = [];
  oneOffMixer.eq = [];
  oneOffMixer.src = [];
  audioOneOff.pos = {
        x: [],
        y: [],
        z: [],
        spd: {
          x: [],
          y: [],
          z: [],
        },
        ang: {
          x: [],
          y: [],
          z: [],
        },
        temp:{
          x: [],
          y: [],
        },
      };
  audioOneOff.count = 0;
  audioOneOff.active = [];
  audioOneOff.instance = [];
  audioOneOff.rndmOrder = shuffle(audioOneOff.rndmOrder);
};
/*
m4a tags ::
LOOPS
'https://dl.dropboxusercontent.com/s/tw8giqci0ysyfnr/SomethingUseful_b.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/jsa8kce75fg23ij/SomethingUseful_a.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/yejdgk4pqketoru/SeaWaves3_b.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/8wvv59g6nhbs95t/SeaWaves3_a.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/pju0x8edvuozxw3/SeaWaves2_b.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/s5y0c9x75qrj91i/SeaWaves2_a.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/aggk3ki8v9h4dv5/SeaWaves1_b.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/vv6w1hil2tgxa14/SeaWaves1_a.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/br4bdzmgnnhy3yh/RainClouds_b.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/r7bgc7a1j2dgmgz/RainClouds_a.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/ysdrpk0nzb9e19k/MonsterBass_b.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/70swqqedxp8hull/MonsterBass_a.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/2ea1i4j1k1h3ps1/GhostVoices_b.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/z1ht3gkoz4j2d41/GhostVoices_a.m4a?dl=0'


ONE OFFS
'https://dl.dropboxusercontent.com/s/1oywfwepkmamm83/Curved%20Air_1_a.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/9gdubhy9kqay9ch/Curved%20Air_1_b.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/jz5uvmkouzsi12j/Curved%20Air_2_a.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/heo9oval2srjcmg/Curved%20Air_2_b.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/11c303cjybvg7iv/Curved%20Air_3_a.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/rsjmgcfvhuvaday/Curved%20Air_3_b.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/ew82cw5g8ojxnrv/Curved%20Air_4_a.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/4cnwl3e4e5hfnki/Curved%20Air_4_b.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/3ysuj7em42rcvly/Curved%20Air_5_a.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/levax21r1iglze1/Curved%20Air_5_b.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/9lspzqfxdoqovh5/Curved%20Air_6_a.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/hgt3g53kiuoyydg/Curved%20Air_6_b.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/k15encoxsj4d9nl/Scale_01.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/3yt5bj3bpwn7b68/Scale_02.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/terb748zh17bgk6/Scale_03.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/wd63wxibet3kc1m/Scale_04.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/bf8wab4c5csk0o2/Scale_05.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/tuwbr5h1ffachzl/Scale_06.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/in9xbgmciptmfiz/Scale_07.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/z52il5f9iytkhig/Scale_08.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/uo5agawcvakj00l/Scale_09.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/katf11cfjyhou82/Scale_10.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/2i6e5ei7sgx9ntm/Scale_11.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/t0b3krj4n7lq3ce/Scale_12.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/cifvclgd4hjauqv/Scale_13.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/ra1h2l0d6i73x4s/Scale_14.m4a?dl=0',
'https://dl.dropboxusercontent.com/s/fe943srtgcfyjhn/Scale_15.m4a?dl=0'





MP3 Loop Links
'https://dl.dropboxusercontent.com/s/qsmz317j1rupdr6/GhostVoices_a.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/een05hmpnsjxuj8/GhostVoices_b.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/3ysw752vnk9e82l/MonsterBass_a.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/dgthshzdgf24d7x/MonsterBass_b.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/sis0wcyfp5zjsjj/RainClouds_a.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/ootnsm5ns3ghcv7/RainClouds_b.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/arqi2vqz5qxyn3e/SeaWaves1_a.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/n7ou2df4kr6zbjy/SeaWaves1_b.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/8xxbiog38wd96ac/SeaWaves2_a.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/dx54a61zuclkzpn/SeaWaves2_b.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/pt2drpp7ij9rbex/SeaWaves3_a.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/7typx44jue2gfz2/SeaWaves3_b.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/htlgycrlod2ty1q/SomethingUseful_a.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/9ackld2z95pljoj/SomethingUseful_b.mp3?dl=0'


MP3 One-Off Links
'https://dl.dropboxusercontent.com/s/f9bwjoar2rxakyi/Curved%20Air_1_a.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/8ykcah8r6ib7x8q/Curved%20Air_1_b.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/f0wukvgp9ttre6m/Curved%20Air_2_a.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/b9xyztw4bgulrug/Curved%20Air_2_b.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/s4hmjpf8b8zyd3v/Curved%20Air_3_a.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/lexfyvqhxa3tprr/Curved%20Air_3_b.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/alwtauuugjgsm5t/Curved%20Air_4_a.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/umbk5e7f60zj6oj/Curved%20Air_4_b.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/d66vr2cckzg7wo7/Curved%20Air_5_a.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/te05c77gi5qtf5s/Curved%20Air_5_b.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/8rq2lzwyu6espbo/Curved%20Air_6_a.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/vp2812ju01ughbv/Curved%20Air_6_b.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/dqbhd9i4l1sraf8/Scale_01.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/rkzvgno8f7z7nfp/Scale_02.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/zorfn2llm8wcal4/Scale_03.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/0e1eocc8qrs8zqa/Scale_04.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/jcsyd0mpvupkn6b/Scale_05.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/cja5v4l7s9vvmih/Scale_06.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/0zf057clcs6tocr/Scale_07.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/xne1du6sl85v3hm/Scale_08.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/vcnwssrtgjx51lb/Scale_09.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/7m4st7sgfk5z4q2/Scale_10.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/xee0le35sqamnw2/Scale_11.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/rmiwkc5p0wh9vit/Scale_12.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/hxwrm45ppb3sm56/Scale_13.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/wlihecoq5s703kl/Scale_14.mp3?dl=0',
'https://dl.dropboxusercontent.com/s/n1relvywwkrjkp5/Scale_15.mp3?dl=0',








*/
