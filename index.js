var worldSize = 64;
var duckSize = 32;
var animatables = [];

var app = new PIXI.Application(worldSize, worldSize, {backgroundColor : 0x1099bb});
document.body.appendChild(app.view);

var container = new PIXI.Container();
app.stage.addChild(container);

/*
PRECIPITATION
*/
var precipitationFilter = new PIXI.filters.ColorMatrixFilter();
var precipitation = new PIXI.extras.TilingSprite(textures.snow,2048,2048);
var precipitation2 = new PIXI.extras.TilingSprite(textures.snow,2048,2048);
precipitation.x = precipitation2.x = -1024;
precipitation.y = precipitation2.y = -1024;
precipitation.filters =  precipitation2.filters = [precipitationFilter];

/*
GROUND
*/

var floor = new PIXI.extras.TilingSprite(textures.bg,2048,32);
floor.position.set(-1024,0);
var groundFilter = new PIXI.filters.ColorMatrixFilter();
floor.filters = [groundFilter];

var splashes = new PIXI.Container();

for (var i = -10; i < 10; i ++){
  var splash = new PIXI.extras.AnimatedSprite(textureSets.splash);
  splash.position.set(32*i,0);
  splash.filters = [precipitationFilter];
  splash.animationSpeed = 10;
  animatables.push(splash);
  splashes.addChild(splash);
}

/*
DUCK
*/
var duk = new PIXI.extras.AnimatedSprite(textureSets.duk);
duk.x = 0;
duk.y = 0;
duk.animationSpeed = 1;
duk.name = "DUK";
animatables.push(duk);
var clothes = new PIXI.extras.AnimatedSprite(textureSets.scarf);
animatables.push(clothes);

/*
ASSEMBLE THE SCENE
*/

container.addChild(precipitation);
container.addChild(floor);
container.addChild(splashes);
container.addChild(duk);
container.addChild(clothes);
container.addChild(precipitation2);


// Listen for animate update
app.ticker.add(function(delta) {
  // animate
  window.animClock = window.animClock || 0;
  window.animClock += delta;

  animatables.forEach(a=>{
    a.frame = Math.floor(window.animClock* 1/60 *a.animationSpeed);
    a.texture = a.textures[a.frame % a.textures.length];
  });

});

// move rain
var sway = 2;
var precipitationType = 'snow';
var swaySpeed = 0.01;
var precipitationDetails = {
  snow:{
    speed:1,
    scale:[1,1],
    backgroundColor:0x77aaff,
    colorMatrix:[
      1, 0, 0, 0, 0,
      0, 1, 0, 0, 0,
      0, 0, 1, 0, 0,
      0, 0, 0, .7, 0
    ],
    splash:false
  },
  rain:{
    speed:2,
    scale:[0.55,2],
    backgroundColor:0x888888,
    colorMatrix:[
      .7, 0, 0, 0, 0,
      0, .8, 0, 0, 0,
      0, 0, .8, 0, 0,
      0, 0, 0, .7, 0
    ],
    splash:true
  },
  none:{
    speed:1,
    scale:[1,1],
    backgroundColor:0x77aaff,
    colorMatrix:[
      0, 0, 0, 0, 0,
      0, 0, 0, 0, 0,
      0, 0, 0, 0, 0,
      0, 0, 0, 0, 0
    ],
    splash:true
  }
}

var groundDetails = {
  snow:{
    colorMatrix:[
      .52, 0, .69, 0, 0,
      .77, 1, .85, 0, 0,
      .77, 0, .85, 0, 0,
      0, 0, 0, 1, 0
    ]
  },
  grass:{
    colorMatrix:[
      .3451,  0, .4, 0, 0,
      .6745,  0, .8039, 0, 0,
      .3215, 0, .4, 0, 0,
      0,  0,  0,  1, 0
    ]
  },
  fall:{
    colorMatrix:[
      .878, 0, .921,   0, 0,
      .400, 0, .521,  0, 0,
      .125, 0, .043,  0, 0,
      0,    0,    0,  1, 0
    ]
  }
};
var groundType = 'grass';
function setGround(type){
  groundType=type;
  groundFilter.matrix = groundDetails[type].colorMatrix;
}

function setPrecipitation(type){
  precipitationType = type;
  var details = precipitationDetails[type];
  precipitationFilter.matrix = details.colorMatrix;

  precipitation.scale.set(
    details.scale[0],
    details.scale[1]
  );
  precipitation2.scale.set(
    1.5*details.scale[0],
    1.5*details.scale[1]
  );

  app.renderer.backgroundColor = details.backgroundColor;
  splashes.alpha = details.splash?1:0;

}

var clothesDetails = {
  scarf:{
    textureSet:window.textureSets.scarf,
    alpha:1
  },
  none:{
    textureSet:window.textureSets.scarf,
    alpha:0
  }
}

function setClothes(type){
  //
  clothes.textures = clothesDetails[type].textureSet;
  clothes.alpha =clothesDetails[type].alpha;
}

app.ticker.add(function(delta){
  precipitation.tilePosition.set(
    sway * Math.sin(swaySpeed*animClock),
    animClock*0.35*precipitationDetails[precipitationType].speed
  );
  precipitation2.tilePosition.set(
    8.5+sway * Math.cos(swaySpeed*animClock),
    animClock*0.3*precipitationDetails[precipitationType].speed
  );
});

// on resize
var sc;

function onResize(){
  var size = {width:window.innerWidth,height:window.innerHeight};
  app.renderer.resize(size.width,size.height);
  sc = Math.min(size.width,size.height)/worldSize;
  app.stage.scale.set(sc);
  // drive the world so it's centered in X dir and at the bottom in Y dir
  // todo: this doesn't work all the time
  container.y = Math.max(1,size.height / size.width)*worldSize - duckSize;
  container.x = worldSize*Math.max(1,size.width / size.height)/2 - duckSize/2;

}

window.addEventListener('resize',onResize);
onResize();

/*
RUN THIS MAFF
*/
setGround('snow');
setPrecipitation('snow');
setClothes('scarf');
