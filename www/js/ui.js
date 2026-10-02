// Shared control-panel wiring for the dashboard and example pages.

// The panel's header button collapses everything but the title.
export function setupPanel(){
  document.getElementById("collapse").addEventListener('click', function(){
    var collapsed = document.getElementById("menu").classList.toggle("collapsed");
    this.textContent = collapsed ? '+' : '–';
    this.title = collapsed ? 'expand' : 'minimize';
  });
}

// keys maps KeyboardEvent.key to a handler. Ignored while typing in a
// form field or holding a modifier, so browser shortcuts still work.
export function bindKeys(keys){
  document.addEventListener('keydown', function(e){
    if (e.metaKey || e.ctrlKey || e.altKey || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') { return; }
    var handler = keys[e.key];
    if (handler) { e.preventDefault(); handler(); }
  });
}

// Calls onChange with the #speed slider's value and mirrors it in the label.
export function bindSpeed(onChange){
  var speed = document.getElementById("speed");
  var label = document.getElementById("speed-value");
  speed.addEventListener('input', function(){
    label.textContent = speed.value + '/s';
    onChange(Number(speed.value));
  });
}

// Mirrors play state on the primary button.
export function setPlayButton(playing){
  var btn = document.getElementById("play");
  btn.textContent = playing ? 'Pause' : 'Play';
  btn.classList.toggle('playing', playing);
}
