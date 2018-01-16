////////////////////////////////////////////////////////////////////////////////
// utils

// give a list of things to mix between and an index to pick.
// ex:
//    mix([-10,0,100],1.5) =>50
//    mix([-10,0,100],1) =>0
//    mix([-10,0,100],0.5) =>-5

function mix(inputs,amnt){
  var amnt = Math.min((inputs.length-1),amnt);
  amnt = Math.max(amnt,0);

  var val1 = inputs[Math.floor(amnt)];
  var val2 = inputs[Math.ceil(amnt)];
  var idxAmnt = amnt % 1;

  // mix inputs by amnt
  if (Array.isArray(val1)){
    var ret = [];
    for (var i = 0; i < val1.length; i ++){
      ret.push(mixValues(val1[i],val2[i],idxAmnt));
    }
    return ret;
  }else{
    return mixValues(val1,val2,idxAmnt);
  }

}
function mixValues(a,b,amnt){
  return a*(1-amnt) + b*amnt;
}

// truncate a number to a certain number of decimal places
function truncate(number,places){
  var fac = Math.pow(10,places);
  return Math.round(number * fac) /fac;
}

// get a matrix to colorize
// strength = how much the multiplication does
//
function colorize(hexColor,strength,lighten){
  var strength = (typeof strength == 'number')?strength:1;
  var lighten = (typeof lighten == 'number')?lighten:0;

  var r = ( (hexColor & 0xff0000) >> 16)/255;
  var g = ( (hexColor & 0x00ff00) >> 8)/255;
  var b = (hexColor & 0x0000ff)/255;

  // mix with white for lower strength
  r = mixValues(r,1,lighten);
  g = mixValues(g,1,lighten);
  b = mixValues(b,1,lighten);

  /*
  ITU BT.709:

  Y = 0.2126 R + 0.7152 G + 0.0722 B
  */

  return mix (
    [
      [// identity
        1,0,0,0,0,
        0,1,0,0,0,
        0,0,1,0,0,
        0,0,0,1,0
      ],
      [// the tone matrix: lightness * color => value
        r*0.2126,r*0.7152,r*0.0722,0,0,
        g*0.2126,g*0.7152,g*0.0722,0,0,
        b*0.2126,b*0.7152,b*0.0722,0,0,

        0,   0,    0,       1,0
      ]
    ]
    ,strength
  );


}

// quarterize a Number -
function quarterize(n){
  var floor = Math.floor(n)||'';
  var remainder = n % 1;

  // most common case
  if (remainder == 0){
    return n.toString();
  }

  if (remainder > 1/8 && remainder <= 3/8){
    return floor+'¼';
  } else if (remainder > 3/8 && remainder <= 5/8){
    return floor+'½';
  } else if (remainder > 5/8 && remainder <= 7/8){
    return floor+'¾';
  }

  //less than an eighth or more than 7 eighths

  return Math.round(n);
}


////////////////////////////////////////////////////////////////////////////////
// renderer

var worldSize = 64/1.1;
var duckSize = 32;
var animatables = [];
var bgColor = 0x1099bb;

var app = new PIXI.Application(worldSize, worldSize, {backgroundColor : bgColor});
document.body.appendChild(app.view);

var container = new PIXI.Container();
app.stage.addChild(container);

// global filters
var toneFilter = new PIXI.filters.ColorMatrixFilter();
var splitFilter = new PIXI.filters.RGBSplitFilter();
splitFilter.red.y = splitFilter.green.x = splitFilter.blue.y = 0;

var bloomFilter = new PIXI.filters.AdvancedBloomFilter({
  bloomScale:0.2,
  blur:1,
  quality:8
});
var crtFilter = new PIXI.filters.CRTFilter({
  noise:0.07,
  seed:1,
  noiseSize:5,
  vignettingAlpha:0.45,
  lineContrast:0.15
});

container.filters = [toneFilter,bloomFilter,crtFilter,splitFilter];

var background = new PIXI.Graphics();
background.width = 2048;
background.height = 2048;
background.x = background.y = -1024;

function setBackgroundColor(backgroundColor){// set a fill and a line style again and draw a rectangle
  background.beginFill(backgroundColor, 1);
  background.drawRect(0,0,2048,2048);
  background.endFill();

  // change the tone filter
  toneFilter.matrix = colorize(backgroundColor,0.2,-0.1)
}

function setFilterColor(color,strength,brightness){
  var strength = typeof strength == 'number'?strength:0.2;
  var brightness = typeof brightness == 'number'?brightness:-0.1;

  toneFilter.matrix = colorize(color,strength,brightness);
}

setBackgroundColor(0x1099bb);

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
duk.name = "DUK";
animatables.push(duk);
var clothes = new PIXI.extras.AnimatedSprite(textureSets.scarf);
animatables.push(clothes);

clothes.animationSpeed = duk.animationSpeed = 1.5;


// text
var ts = 0.05;
var fontSize = 40;
var style = new PIXI.TextStyle({
    fontFamily: ['Press Start 2P','cursive'],
    fontSize: fontSize,
    lineHeight:fontSize,
    //fontStyle: 'italic',
    fontWeight: 'bold',
    fill: ['#fff8db'], // gradient
    stroke: '#000000',
    strokeThickness: fontSize / 6,
    align:"left",
    dropShadow: true,
    dropShadowColor: '#000000',
    dropShadowBlur: 0,
    dropShadowAngle: Math.PI / 4,
    dropShadowDistance: fontSize/6,// 1/6 of fontsize I guess ???
    wordWrap: true,
    wordWrapWidth: worldSize*(14/16)/ts
});

var text = new PIXI.Text('Rich text with a lot of options and across multiple lines', style);
text.scale.set(ts)


/*
ASSEMBLE THE SCENE
*/

container.addChild(background);
container.addChild(text);
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

  //update filter
  crtFilter.time = window.animClock;
  crtFilter.seed = window.animClock*Math.PI % 1;

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
    filter:{
      color:0xaaaaaa,
      amount:0.7,
      brightness:0
    },
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
      .52, 0.6, .69, 0, 0,
      .77, 0.7, .85, 0, 0,
      .77, 0.7, .85, 0, 0,
      0, 0, 0, 1, 0
    ]
  },
  grass:{
    colorMatrix:[
      .3451, .3451, .4, 0, 0,
      .6745, .6745, .8039, 0, 0,
      .3215, .3215, .4, 0, 0,
      0,  0,  0,  1, 0
    ]
  },
  fall:{
    colorMatrix:[
      .878, .878, .921,   0, 0,
      .400, .400, .521,  0, 0,
      .125, .125, .043,  0, 0,
      0,    0,    0,  1, 0
    ]
  },
  sand:{
    colorMatrix:[
      200,   252,   230,   0,0,
      188,   228,   208,   0,0,
       90,   132,   120,   0,0,
      0,      0,  0,  255,  0
    ].map(n=>n/255)
  }
};

var groundMatrices = [
  groundDetails.grass.colorMatrix,
  groundDetails.grass.colorMatrix,
  groundDetails.fall.colorMatrix,
  groundDetails.snow.colorMatrix,
  groundDetails.grass.colorMatrix // loop around
]

function setGround(type){
  if (typeof type == 'string'){
    groundFilter.matrix = groundDetails[type].colorMatrix;
  }else if (typeof type == 'number'){
    groundFilter.matrix = mix(groundMatrices,type);
  }
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

  setBackgroundColor(details.backgroundColor);
  if (details.filter){
    setFilterColor(details.filter.color,details.filter.amount,details.filter.brightness);
  }
  splashes.alpha = details.splash?1:0;

}

function setClothes(type){
  //
  clothes.textures = window.clothesDetails[type].textureSet;
  clothes.alpha = window.clothesDetails[type].alpha;
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

  // update screenspace filters
  splitFilter.red.x=sc*-0.17;
  splitFilter.green.y=sc*0.07;
  splitFilter.blue.x=sc*0.17;

  crtFilter.lineWidth=sc/4;

  // move text to center of screen
  moveText();

}

function moveText(){
  text.x = worldSize*(8.7/32) - text.width/2;
  text.y = -container.y*0.7;
}

function setText(s){
  text.text = s;
  moveText()
}

function say(text){
  if (window.location.search && window.location.search.toLowerCase().indexOf('mute') > -1){
    return;
  }
  if (!'speechSynthesis' in window){
    console.warn('no speech synthesis available');
    return;
  }
  text = text
    .replace(/</g,' less than ')



  var msg = new SpeechSynthesisUtterance(text);

  // this is a boy duck
  var v = _.sortBy(speechSynthesis.getVoices(),function(voice) {
      var l = voice.name.toLowerCase()
      if (l.indexOf('male') > -1){
        return -2
      }
      if (l.indexOf('david') > -1){
        return -1;
      }
      return 0;
   });

  if (v.length > 0){
    msg.voice = v[0];
  }

  window.speechSynthesis.speak(msg);
}

window.addEventListener('resize',onResize);
onResize();

/*
initial values
*/

setGround('grass');
setPrecipitation('none');
setClothes('none');

////////////////////////////////////////////////////////////////////////////////
// weather application


function grabWeatherAndRun(){
  setText('Fetching the weather...');

  getLatLon((latlon)=>{
    console.log(latlon);
    getWeather(latlon[0],latlon[1],function(er,weather){
      if(er){
        return console.log(er);
      }
      setEnvironmentForForecast(weather);
    });
  });
}
grabWeatherAndRun();
setInterval(grabWeatherAndRun,1000*60*15);// check every 15 minutes

function getWeather(lat,lon,done){
  var k = '5a4265668150c35b1544e45fee5cf3ec';
  var url = `//api.openweathermap.org/data/2.5/forecast/daily?lat=${lat}&lon=${lon}&appid=${k}&cnt=1&units=imperial&mode=xml`;

  // grab from OWM

  var spent = false;
  var _done = function(er,result){
    if(!spent){
      spent = true;
      return done(er,result);
    }
  }

  fetch(url).then(function(response){
    return response.text();
  })
  .then(function(result){
    var parser = new DOMParser();
    var doc = parser.parseFromString(result, "text/xml");
    return _done(null,doc.children[0]);
  })
  .catch(e=>{
    console.error(e);
    return _done(e);
  });

}


function getLatLon(done){
  if (window.location.search && window.location.search.indexOf('location') > -1){
    var latlon = window.location.search.split(',').map(g=>
      Number(g.replace(/[^\d-]/g,''))
    );
    return done( latlon );
  }
  if ('geolocation' in navigator){
    navigator.geolocation.getCurrentPosition(function(position) {
      return done([position.coords.latitude, position.coords.longitude]);
    });
  }else{
    return done([-10,0]);
  }
}

function setEnvironmentForForecast(resultDoc){

  console.log(resultDoc);

  var tempEl = resultDoc.getElementsByTagName('temperature')[0];

  var tempKeys = ['min','max','night','day','eve','morn'];
  var tempDescriptions = {
    'night':'tonight',
    'day':'at midday',
    'eve':'this evening',
    'morn':'this morning'
  };

  var temperatures = {};
  ['min','max','night','day','eve','morn'].map(function(s){
    temperatures[s] = Math.round(Number(tempEl.getAttribute(s)))
  })

  var highTime = '';
  var highTemp = -10000;
  var lowTime = '';
  var lowTemp = 10000;

  ['night','day','eve','morn'].forEach(function(tod){
    if (temperatures[tod] < lowTemp){
      lowTime = tempDescriptions[tod];
      lowTemp = temperatures[tod];
    }
    if (temperatures[tod] > highTemp){
      highTime = tempDescriptions[tod];
      highTemp = temperatures[tod];
    }
  })

  var generalDescription = resultDoc.getElementsByTagName('symbol')[0].getAttribute('name')||'';

  var cloudText='';
  var cloudPercent = 0;
  var cloudEl = resultDoc.getElementsByTagName('clouds');
  if (cloudEl.length > 0){
    cloudPercent = Number(cloudEl[0].getAttribute('all'))/100;
  }

  if (cloudPercent){
   cloudText=`\n\nClouds: ${Math.round(cloudPercent*100)}%`;
 }

  var fullText = `Currently: ${generalDescription}${cloudText}

High: ${highTemp}° ${highTime}

Low: ${lowTemp}° ${lowTime}`;

  var precipEl = resultDoc.getElementsByTagName('precipitation')[0];

  var isRaining = false;
  var isSnowing = false;
  var precipType=null;

  if (true){

    var numAmnt = Number(precipEl.getAttribute('value')) * 0.03937008;// sent in mm, converted to inches
    var amnt = '';
    if (numAmnt < 0.25){
      amnt = '<¼ inch';
    }else{
      amnt = quarterize(numAmnt);
      amnt+=(numAmnt<1.125?' inch':' inches')
    }

    // check the general description for current conditions first
    if (generalDescription.indexOf('snow') > -1){
      precipType='snow';
    }else if (generalDescription.indexOf('rain') > -1){
      precipType='rain';
    }else{
      precipType = precipEl.getAttribute('type');// "snow" or "rain"
    }

    setPrecipitation(precipType||'none');
    if (precipType == 'snow'){
      isSnowing = true;
      setGround('snow');
    }else if (precipType == 'rain'){
      isRaining = true;
      setClothes('raincoat')
    }
    if (precipType){
      fullText+='\n\n'
      fullText+=`${amnt} of ${precipType} expected`
    }
  }

  // set clothes
  if (highTemp < 32){
    setClothes('coat');
  }else if (highTemp < 50 && !isRaining){
    setClothes('scarf');
  }else if (highTemp < 80 && !isRaining){
    setClothes('none');
  }else if (highTemp > 80 && !isRaining){
    setClothes('sunglasses');
    setGround('sand');
  }

  if (lowTemp < 32){
    setGround('snow');
  }

  // if it's not raining, set color filter based on cloud cover
  if (!precipType){
    setFilterColor(0xaaaaaa,cloudPercent*0.8,0.1)
  }

  console.log(fullText);

  setText(fullText);
  say(fullText);
}
