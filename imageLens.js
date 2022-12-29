// Imagelens Marius Morhard 2017

// Configuration:
// * set filename of your image (filename variable)
// * if you want use different image as as lens, set its filename to lensfilename variable
//   or null if image to process and lens shoud be the same
// * other variables:
//    - bendx, bendy: curvature factor for x and y
//    - types: lens types (experiment, just few different algorithms, list below)
//    - channels: RGB, HSB + negatives - what channels use as a lens curvature, list below
// Always put 2 values (one for x and one for y)

// Usage:
//   SPACE - to save
//   ENTER - go into interactive mode, move mouse to change bendx, bendy
//   Click - to make random change
//   c - to change colourlovers pattern (if enabled)

// hint: if you work on some channel only (leaving rest untouched)
//       find line with fill(n) - there are hidden other options as a comments

// filename
String filename = "BG"; // image to process
String fileext = ".jpg";
String foldername = "./";

String lensfilename = "BG_edit";// "YK_AnimLens_"; 
String lensfileext = ".jpg";
String lensfoldername = "./";//YK_AnimLens/";// use different image to use as lens (null = use same as image to process), full path please!
String animFrames = "0000";
int animIndex = 0;
int animStart = 10;
int animEnd = 450;
//String lensfilename = "./lens1.jpg"; 
String maskfilename= "BG.jpg"; 

int max_display_size = 800; // viewing window size (regardless image size)

// set to true to use colour lovers random pattern
// http://www.colourlovers.com/patterns
boolean use_clpattern = false;

// <1.0 bigger pattern, >1.0 smaller pattern
float pattern_factor = 1.0;

// parameters
float bendx = 0.01; // from 0 to 1
float bendy =0.01; // from 0 to 1
float[] power_vals = { 
  1, 1
}; // two values of power from 0.1 to 10, one for x and second for y
int[] types = { 
  POWER, SINUSOIDAL
}; // always to types one for x second for y
int[] channels = { 
  BRIGHTNESS, BRIGHTNESS
}; // as above

// config ends

// lens type
final static int LINEAR = 0;
final static int POWER = 1;
final static int POLAR = 2;
final static int SINUSOIDAL = 3;



// channels to work with
final static int RED = 0;
final static int GREEN = 1;
final static int BLUE = 2;
final static int HUE = 3;
final static int SATURATION = 4;
final static int BRIGHTNESS = 5;
final static int NRED = 6;
final static int NGREEN = 7;
final static int NBLUE = 8;
final static int NHUE = 9;
final static int NSATURATION = 10;
final static int NBRIGHTNESS = 11;

//////////////

PImage img;
PImage limg;
PImage mimg;
PImage nimg;


boolean interactive = false; // move mouse to set bend when active, ENTER to activate
boolean useMask = true;
boolean filter_lum =false;
boolean usePaint = true;
boolean paintingStart = false;
boolean paintingEnd = false;
boolean painting  = false;

float[] facts = new float[2];
float opacity  = 30;
float brushSize = 50;
boolean shiftMod = false;
boolean pShiftMod = true;
boolean keepMask = true;
boolean erase = false;
float pOpacity;

boolean animateLens = false;
boolean animateBend = false;

float lerpValX = 0;
float lerpValY = 0;
float lerpSpeedX = 0.01;
float lerpSpeedY = 0.01;
int lerpDirX = 1;
int lerpDirY = 1;
int bendDirX = 1;
int bendDirY = 1;
float bendStartX = 0.0;
float bendEndX = 0.15;
float bendStartY = 0.0;
float bendEndY = 0.25;
int switchThreshold =   int(random(30, 90));

boolean animateNoiseLens = true;
boolean NoiseLens = true;
boolean mixLens = true;
PVector noiseDelta = new PVector();
PVector noiseSpeed = new PVector(-0.005, 0.005, 0.005); 


boolean drawImage = false;


// working buffer
PGraphics buffer;
PGraphics bufferMask;

String sessionid;

void setup() {
  sessionid = hex((int)random(0xffff), 4);

  img = loadImage(foldername+filename+fileext);
  img.loadPixels();
  if (animateLens) {
    if (NoiseLens) {
      limg = loadImage(lensfoldername+lensfilename+lensfileext);
      limg.loadPixels();
    } else {
      animIndex = animStart;
      animateImageLens(animIndex);
    }
  } else {
    if (NoiseLens) {

      if (mixLens) {
       
        if (lensfilename != null) {
          limg = loadImage(lensfoldername+lensfilename+lensfileext);
          limg.loadPixels();
        } else limg=img;
        
         //nimg = createNoiseTex(limg.width, limg.height, 0.05);
          nimg = createNoiseTex(1024, 1024, 0.05);
        nimg.loadPixels();
      } else {
        //limg = createNoiseTex(img.width, img.height, 0.025);
        limg = createNoiseTex(1024, 1024, 0.05);
        limg.loadPixels();
      }
    } else {
      if (lensfilename != null) {
        limg = loadImage(lensfoldername+lensfilename+lensfileext);
        limg.loadPixels();
      } else limg=img;
    }
  }




  if (maskfilename != null) {
    mimg = loadImage(maskfilename);
    mimg.loadPixels();
    useMask = true;
  } 


  buffer = createGraphics(img.width, img.height);
  buffer.beginDraw();
  buffer.noStroke();
  buffer.endDraw(); 




  // calculate window size
  float ratio = (float)img.width/(float)img.height;
  int neww, newh;
  if (ratio < 1.0) {
    neww = (int)(max_display_size * ratio);
    newh = max_display_size;
  } else {
    neww = max_display_size;
    newh = (int)(max_display_size / ratio);
  }

  size(neww, newh);
  print(neww, newh +"\n");

  bufferMask = createGraphics(neww, newh);
  bufferMask.beginDraw();
  bufferMask.noStroke();
  bufferMask.endDraw(); 
  if (!useMask) {
    mimg = bufferMask.get();
  }


  if (use_clpattern) getCLPattern();

  facts[0] = bendx * img.width;
  facts[1] = bendy * img.height;

  drawMe();
}

float getChannel(color c, int channel) {
  int ch = channel>5?channel-6:channel;
  float cc;

  switch(ch) {
  case RED: 
    cc = red(c); 
    break;
  case GREEN: 
    cc = green(c); 
    break;
  case BLUE: 
    cc = blue(c); 
    break;
  case HUE: 
    cc = hue(c); 
    break;
  case SATURATION: 
    cc = saturation(c); 
    break;
  default: 
    cc= brightness(c); 
    break;
  }

  return channel>5?255-cc:cc;
}



int getShift(color c, int idx, float[] Facts, int dir) {
  float cc = getChannel(c, channels[idx]);

  switch(types[idx]) {
  case LINEAR:
    return (int)(Facts[idx] * cc/255.0);
  case POWER:
    return (int)(Facts[idx]*map(pow(cc/255.0, power_vals[idx]), 0, 1, -1, 1))*dir;
  case SINUSOIDAL:
    return (int)(Facts[idx]*sin(map(cc, 0, 255, -PI, PI)))*dir;
  default: 
    { // POLAR
      float c1 = idx==0?cc:getChannel(c, channels[1]);
      float c2 = idx==1?cc:getChannel(c, channels[0]);
      float ang = map(c1, 0, 255, 0, TWO_PI);
      float r = map(c2, 0, 255, 0, Facts[0]);
      return (int)(idx==0?r*cos(ang):r*sin(ang));
    }
  }
}

void animateImageLens(int index) {

  String newLensFile = lensfoldername+lensfilename+nf(index, 5)+lensfileext;
  loadImageLens(newLensFile);
}

PImage updateNoiseTex( PImage noiseImg, PVector speed, float scale) {
  PImage noiseTex = noiseImg;
  noiseDelta.add(noiseSpeed);
  noiseTex.loadPixels();
  for (int x = 0; x < noiseTex.width; x++) {
    for (int y = 0; y < noiseTex.height; y++) {

      int loc = x + y * noiseTex.width;
      float n = noise(x*scale+noiseDelta.x, y*scale+noiseDelta.y, noiseDelta.z)*255;
      color c = color(n, n, n, 1);
      noiseTex.pixels[loc] = c;
    }
  }
  noiseTex.updatePixels();
  // println("updated");
  return noiseTex;
}

PImage createNoiseTex(int imgWidth, int imgHeight, float scale) {

  PImage noiseTex =  createImage(imgWidth, imgHeight, ARGB);

  noiseTex.loadPixels();
  for (int x = 0; x < noiseTex.width; x++) {
    for (int y = 0; y < noiseTex.height; y++) {

      int loc = x + y * noiseTex.width;
      float n = noise(x*scale, y*scale)*255;
      color c = color(n, n, n, 1);
      noiseTex.pixels[loc] = c;
    }
  }
  noiseTex.updatePixels();
  return noiseTex;
}


void loadImageLens(String lensfileName) {

  limg = loadImage(lensfileName);
  limg.loadPixels();
}

void animateBend() {

  if (lerpValX <=0 || lerpValX > 1 ) {
    lerpValX = (lerpValX >0 ) ? 1 : 0;
    lerpDirX *=-1; 
    if (lerpValX ==0) {
      newBend(true);
      switchDir(1);
    }
  }


  if (lerpValY <=0 || lerpValY > 1 ) {
    lerpValY = (lerpValY >0 ) ? 1 : 0;
    lerpDirY *=-1; 
    if (lerpValY ==0) {
      newBend(false);
      switchDir(-1);
    }
  }
  bendx = lerp(bendStartX, bendEndX, lerpValX);
  bendy = lerp(bendStartY, bendEndY, lerpValY);
  facts[0] = bendx * img.width;
  facts[1] = bendy * img.height;

  lerpValX += lerpSpeedX * lerpDirX;
  lerpValY += lerpSpeedY * lerpDirY;
  //println(lerpValX);
  //println(lerpValY);
}

void switchDir(int XorY) {
  if (XorY>0) {
    bendDirX *= -1;
  } else  bendDirY *= -1;
  switchThreshold   = int(random(30, 90));
  println("switchedDir");
}

void newBend(boolean XorY) {
  if (XorY) {
    bendEndX = random(0.1, 0.15);
    lerpSpeedX = random(0.005, 0.01);
    randomParams(0);
    println("New End X : " +bendEndX+ "\n");
    println("New Speed X : " +lerpSpeedX+ "\n");
  } else {
    bendEndY = random(0.1, 0.15);
    lerpSpeedY = random(0.005, 0.01);
    randomParams(1);
    println("New End Y : " +bendEndY+ "\n");
    println("New Speed Y : " +lerpSpeedY+ "\n");
  }
}
void randomParams(int XorY) {
  power_vals[XorY] = random(8);

  channels[XorY] = (int)random(12);

  types[XorY] = (int)random(4);
}
void drawMe() {


  if (animateLens) {
    if ( animIndex > animEnd) exit();
    animateImageLens(animIndex);
    animIndex++;
  }
  if (animateBend) {
    animIndex++;
    animateBend();
    if (animIndex%switchThreshold==0) {
      //switchDir((int)random(-1, 1));
    }
  }
  if (NoiseLens && animateNoiseLens) {
    PImage noiseTex = (mixLens) ? nimg: limg;
    noiseTex = updateNoiseTex(noiseTex, noiseSpeed, 0.025);
    noiseTex.loadPixels();
    if(!animateBend)  animIndex++;
  
  }
  mimg.resize(img.width, img.height);
  //  bufferMask.clear();
  if ( drawImage) {
    buffer.beginDraw();
    buffer.background(0);
  }
  //println(mimg.pixels[0]);
  //print("facts: "+facts[0] +"  "+ facts[1] +"\n");
  for (int x=0; x<img.width; x++) {

    int lx;
    int nx;
    if (use_clpattern) lx = ((int)(x*pattern_factor))%limg.width;
    else              lx = (int)map(x, 0, img.width-1, 0, limg.width-1);
    
    nx = (int)map(x, 0, img.width-1, 0, nimg.width-1);

    for (int y=0; y<img.height; y++) {

      int ly;
      int ny;
      if (use_clpattern) ly = ((int)(y*pattern_factor))%limg.height;
      else              ly = (int)map(y, 0, img.height-1, 0, limg.height-1);
       ny = (int)map(y, 0, img.height-1, 0, nimg.height-1);
       
       color c;
       if ( mixLens ){
        float r = red(limg.pixels[lx+ly*limg.width])* (red(nimg.pixels[nx+ny*nimg.width])/255);
      float g = green(limg.pixels[lx+ly*limg.width]) *(green(nimg.pixels[nx+ny*nimg.width])/255);
      float b = blue(limg.pixels[lx+ly*limg.width]) *(blue(nimg.pixels[nx+ny*nimg.width])/255);
        c =  color(r, g, b);
       }else    c =  limg.pixels[lx+ly*limg.width];

   


      float[] factsCurrent = new float[2];
      factsCurrent[0] = facts[0];
      factsCurrent[1] = facts[1];
      if (useMask) {
        color maskCol = mimg.pixels[x+y*mimg.width];
        factsCurrent[0] = constrain (facts[0]* (alpha(maskCol)/255), 0, img.width);
        factsCurrent[1]  = constrain (facts[1]* (alpha(maskCol)/255), 0, img.height);
        if (alpha(maskCol) >0) {
          //  print("facts: "+factsCurrent[0] +"  "+ factsCurrent[1] +"\n");
        }
      }

      int xShift = getShift(c, 0, factsCurrent, bendDirX );
      int yShift = getShift(c, 1, factsCurrent, bendDirY);
      println(xShift);
      println(yShift);
      int posx = (x+xShift+2*img.width)%img.width;
      int posy = (y+yShift+2*img.height)%img.height;



      color n = img.pixels[posx+posy*img.width];
      color z = img.pixels[x+y*img.width];


      /* if (useMask){       
       if(red(maskCol) > 0){
       // println(lum);
       buffer.fill(n);
       }else{
       buffer.fill(z);
       }
       }*/


      float lum = 0.2126*red(z) + 0.7152*blue(z)+0.0722*green(z);
      if (filter_lum) {
        if (lum > 200) {
          // println(lum);
          buffer.fill(n);
        } else {
          buffer.fill(z);
        }
      }
      if (!filter_lum) {
        buffer.fill(n);
      }

      //buffer.fill(red(z),green(n),blue(z)); // work only on blue channel
      // buffer.fill(red(n), abs(green(c)-green(n)), blue(n)); // green channel is blended using difference method 




      buffer.rect(x, y, 1, 1);
    }
  }

  if ( drawImage)  buffer.endDraw(); 
  if (!keepMask)  bufferMask.clear();

  clear();
  image(buffer, 0, 0, width, height);
  //image(mimg,0,0,width,height);
  //  print("finished draw\n");
  //  print(width, height +"\n");
  if (animateLens|| animateBend || animateNoiseLens) saveImageAnim();
}
void reset() {


  bufferMask.clear();
  clear();
  image(img, 0, 0, width, height);
}

void drawGradient(float x, float y) {

  int radius = 50;
  for (int r = radius; r > 0; --r) {
    float strength = opacity;
    int alpha = ceil(strength-((((float)r)/((float)radius))*strength));
    print("alpha: " + alpha +"\n");
    bufferMask.noStroke();
    bufferMask.fill(255, 255, 255, alpha);

    bufferMask.ellipse(x, y, r, r);
  }
}

void draw() {

  if (interactive) {
    facts[0] = (int)map(mouseX, 0, width, 0, img.width);
    facts[1] = (int)map(mouseY, 0, height, 0, img.height);

    drawMe();
  }  
  if (animateLens || animateBend || animateNoiseLens) drawMe();

  if (paintingStart) {

    bufferMask.beginDraw();
    painting = true;
    // bufferMask.clear();
    //bufferMask.clear();
    paintingStart = false;
  }
  //if(painting) drawGradient(mouseX,mouseY);
  if (paintingEnd) {
    bufferMask.endDraw();

    paintingEnd = false;
    //  mimg = bufferMask.get();
    clear();
    image(img, 0, 0, width, height);
    image(bufferMask, 0, 0, width, height);
    if (!useMask) {
      mimg = bufferMask.get();
    }
    painting = false;
    //  print(mimg.width, mimg.height +"\n");
  }
}

void mouseReleased() {

  paintingEnd = true;
  //bufferMask.endDraw();
  //image(bufferMask,0,0,img.width,img.height);
}

void mousePressed() {
  //bufferMask.beginDraw();
  paintingStart = true;
}

void mouseWheel(MouseEvent event) {
  float e = event.getCount();
  if (!shiftMod) {
    opacity = constrain(opacity-(e*2), 1, 30);
    pOpacity = opacity;
    println(opacity);
  } else {
    brushSize = constrain(brushSize-(e*5), 5, 100);
    println(brushSize);
  }
}
void mouseDragged() {
  if (mouseButton == LEFT) {
    //bufferMask.fill(255,255,255,10);
    bufferMask.stroke(255, 255, 255, opacity);
    bufferMask.strokeWeight(brushSize);
    bufferMask.line(pmouseX, pmouseY, mouseX, mouseY);
    // bufferMask.noStroke();
    // bufferMask.ellipse(mouseX,mouseY, 50, 50);
    //drawGradient(mouseX,mouseY);
  }
}

//void slowSearch
/*void mouseClicked() {
 power_vals[0] = random(8);
 power_vals[1] = random(8);
 channels[0] = (int)random(12);
 channels[1] = (int)random(12);
 types[0] = (int)random(4);
 types[1] = (int)random(4);
 facts[0] = (int)map(mouseX,0,width,0,img.width);
 facts[1] = (int)map(mouseY,0,height,0,img.height);
 
 drawMe();
 }*/

void saveImageAnim() {
  String newLensFile = foldername + filename + "/res_" +filename+ "Glitch" +nf(animIndex, 5)+fileext;
  //println(newLensFile);
  buffer.save(newLensFile);
}

void keyPressed() {
  if (keyCode == ENTER || keyCode == RETURN) {
    //interactive = !interactive;
    //println("interactive mode: " + (interactive?"on":"off"));
    drawMe();
  }

  if (keyCode == 32) {
    buffer.save(foldername + filename + "/res_" + sessionid + hex((int)random(0xffff), 4)+"_"+filename+fileext);
    println("image saved");
  }

  if (keyCode == SHIFT) {

    shiftMod = !shiftMod;

    print(shiftMod);
  }

  if (keyCode == CONTROL) {
    reset();
  }

  if (key == 'v') {
    power_vals[0] = random(8);
    power_vals[1] = random(8);
    channels[0] = (int)random(12);
    channels[1] = (int)random(12);
    types[0] = (int)random(4);
    types[1] = (int)random(4);
    facts[0] =  (animateLens) ? 0.05* img.width: random(0.01, 0.05)* img.width;
    facts[1] =   (animateLens) ? 0.05* img.height: random(0.01, 0.05)* img.height;
    drawMe();
  }

  if (key == 'e') {
    erase = !erase; 
    if (erase) {
      opacity = 0;
    } else {
      opacity = pOpacity;
    }
  }

  if (key == 'c' && use_clpattern) {
    getCLPattern();
    println("pattern changed");
    drawMe();
  }
}

void getCLPattern() {
  int n = (int)random(1, 4719052);
  print("Loading pattern from ColourLovers number: "+n+"...");

  String pad="";
  if (n<1000) pad = "0";
  else {
    String nn = ""+n;
    pad = nn.substring(0, nn.length()-3);
  }

  String clname = "http://colourlovers.com.s3.amazonaws.com/images/patterns/"+pad+"/"+n+".png";
  try {
    limg = loadImage(clname, "png");
  } 
  catch(Exception e) {
    getCLPattern();
  }

  if (limg.width <=0) getCLPattern();

  println(" done");
}
