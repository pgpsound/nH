/*
- UNLOCK PARTICLES
- EXPERIMENT WITH VARYING THE FLICKER SPEED OF PARTICLES
*/

var userTrigger;
var btnToggle = false;
var button;
var nasa;

nasa = document.getElementById('title');
nasa.addEventListener('click', function(e) {
  e.preventDefault();
  window.open("https://www.nasa.gov/mission_pages/newhorizons/main/index.html");
});

$(document).ready(function () {
  $("#title").fadeIn(900);
  $("#textBtn").fadeIn(1400);
  $("#crawl").fadeIn(2100);
  particleLoadTrigger = setTimeout(particleLoad, 2200);
  userTrigger = setTimeout(unlockBtn1, 1400);
});

function unlockBtn1() {
  $("#textBtn").fadeOut(1200);
  userTrigger = setTimeout(unlockBtn2, 1200);
};

function unlockBtn2() {
  document.getElementById('textBtn').innerHTML = "Best Experienced with Headphones"
  $("#textBtn").fadeIn(2200);
  userTrigger = setTimeout(unlockBtn3, 2200);
};

function unlockBtn3() {
  $("#textBtn").fadeOut(1000);
  userTrigger = setTimeout(unlockBtn4, 1000);
};


function unlockBtn4() {
  document.getElementById('textBtn').innerHTML = "Begin"
  $("#textBtn").fadeIn(1000);
  button = document.getElementById('textBtn');
  button.addEventListener('click', function(e) {
      e.preventDefault();
      // triggers audio functions:
      audioLoopPlay();
      particleStart();
      if (btnToggle == false){
        $("#textBtn").fadeOut(100);
        userTrigger = setTimeout(btnStop, 500);
      }
      if (btnToggle == true) {
        $("#textBtn").fadeOut(100);
        userTrigger = setTimeout(btnRestart, 500);
      }
  });
};

function btnStop() {
  document.getElementById('textBtn').innerHTML = "Stop"
  $("#textBtn").fadeIn(500);
  btnToggle = true;
};

function btnRestart() {
  document.getElementById('textBtn').innerHTML = "Start"
  $("#textBtn").fadeIn(500);
  btnToggle = false;
};

var particleLoadTrigger;
var particleFadeTrigger;
var particleSwitch = false;

function particleLoad() {
  if (particleSwitch == false) {
    particlesJS.load('particles-js', 'https://dl.dropboxusercontent.com/s/3kf5ky6xek6jxgy/particlesjs-config.json?dl=0', function() {
      console.log('callback - particles.js config loaded');
    });
  particleSwitch = true;
  }
}

function particleStart() {
  particleTrigger = setTimeout(particleFade, 500);
};

function particleFade() {
    $("#blackOut").fadeOut(2000);
};
