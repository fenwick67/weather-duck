// load sprites
var textures = {};
window.textures = textures;

// animated texture sets
var textureSets = {};
window.textureSets = textureSets;

function loadImage(name){
  textures[name] = PIXI.Texture.fromImage('./textures/'+name+'.png',true, PIXI.scaleModes.NEAREST);
}

['bg','snow'].forEach(loadImage);

[['duk',2],['scarf',2],['splash',4]].forEach(function(kv){
  var numNames = [];
  for (var i = 1; i <= kv[1]; i ++){
    // load em
    numNames.push(kv[0]+'_'+i);
  }
  numNames.forEach(loadImage);

  var texArray = numNames.map(n=>textures[n]);
  textureSets[kv[0]] = texArray;
});
