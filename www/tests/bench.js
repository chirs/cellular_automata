// Engine benchmark: node src/tests/bench.js
import { Board, neighborhoods, rules } from '../js/automata.js';

var bench = function(label, board, gens){
  for (var i = 0; i < 5; i++) board.next(); // warmup
  var t0 = performance.now();
  for (var i = 0; i < gens; i++){ board.next(); board.diff(); }
  var ms = (performance.now() - t0) / gens;
  console.log(label + ': ' + ms.toFixed(2) + ' ms/gen (' + (1000 / ms).toFixed(0) + ' gens/sec)');
};

var life = new Board([960, 540], 2, neighborhoods.moore, [0.6, 0.4]).setRule(rules.gameOfLife);
bench('life 960x540 (518k cells)', life, 50);

var cyclic = new Board([200, 200], 12, neighborhoods.moore, 12).setRule(rules.makeCyclic(12));
bench('cyclic 200x200 (12 states)', cyclic, 50);

var fire = new Board([900, 400], 3, neighborhoods.moore, [0.7, 0.3, 0]).setRule(rules.makeTree(0.05, 0.003));
bench('forest fire 900x400', fire, 50);
