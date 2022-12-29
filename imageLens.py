from PIL import Image
import pygame
import random
import math
import colorsys


# filename
filename = "33_test_close"  # image to process
fileext = ".png"
foldername = "./"

lensfilename = "BG_edit"

lensfileext = ".jpg"
lensfoldername = "./"
# use different image to use as lens(null=use same as image to process), full path please!
animFrames = "0000"
global animIndex
animIndex = 0
animStart = 10
animEnd = 450
maskfilename = "BG.jpg"

max_display_size = 1200
# viewing window size(regardless image size)

# set to True to use colour lovers random pattern
# http: // www.colourlovers.com/patterns
use_clpattern = False

# < 1.0 bigger pattern, > 1.0 smaller pattern
pattern_factor = 1.0

# parameters
bendx = 0.01
# from 0 to 1
bendy = 0.01
# from 0 to 1

power_vals = [
    1, 1
]
# two values of power from 0.1 to 10, one for x and second for y

types = [
    'POWER', 'SINUSOIDAL'
]
# always to types one for x second for y

channels = [
    'BRIGHTNESS', 'BRIGHTNESS'
]
# as above

# config ends

# lens type
lenses = {
'LINEAR': 0,
'POWER': 1,
'POLAR': 2,
'SINUSOIDAL': 3
}

# channels to work with
channelDict = {
'RED': 0,
'GREEN': 1,
'BLUE': 2,
'HUE': 3,
'SATURATION': 4,
'BRIGHTNESS': 5,
'NRED': 6,
'NGREEN': 7,
'NBLUE': 8,
'NHUE': 9,
'NSATURATION': 10,
'NBRIGHTNESS': 11

}


###############################

# img
# limg
# mimg
# nimg

interactive = False
# move mouse to set bend when active, ENTER to activate
useMask = True
filter_lum = False
usePaint = True
paintingStart = False
paintingEnd = False
painting = False
global facts
facts = [0.0, 0.0]
opacity = 30
brushSize = 50
shiftMod = False
pShiftMod = True
keepMask = True
erase = False
pOpacity = 0.0

animateLens = False
animateBend = False

lerpValX = 0
lerpValY = 0
lerpSpeedX = 0.01
lerpSpeedY = 0.01
lerpDirX = 1
lerpDirY = 1
bendDirX = 1
bendDirY = 1
bendStartX = 0.0
bendEndX = 0.15
bendStartY = 0.0
bendEndY = 0.25
switchThreshold = random.randrange(30, 90)

animateNoiseLens = False
NoiseLens = False
mixLens = False
noiseDelta = (0, 0, 0)
noiseSpeed = (-0.005, 0.005, 0.005)

drawImage = False


# working buffer
# buffer
# bufferMask

# sessionid

def mapRange(value, inMin, inMax, outMin, outMax):
    return outMin + (((value - inMin) / (inMax - inMin)) * (outMax - outMin))


def clamp(a, minVal, maxVal):
    return max(min(a, maxVal), minVal)

def get_key_from_value(d, val):
    keys = [k for k, v in d.items() if v == val]
    if keys:
        return keys[0]
    return None


def setup():
    # sessionid = hex((int)random(0xffff), 4)
    global img, limg, mimg, nimg, animIndex, facts

    img = Image.open(foldername+filename+fileext).convert('RGBA')
    img.load()

    if animateLens:
        if NoiseLens:

            limg = Image.open(lensfoldername+lensfilename +
                              lensfileext).convert('RGBA')
            limg.load()
        else:
            animIndex = animStart
            animateImageLens(animIndex)

    else:
        if (NoiseLens):

            if (mixLens):

                if lensfilename is not None:
                    limg = Image.open(
                        lensfoldername+lensfilename+lensfileext).convert('RGBA')
                    limg.load()
                else:
                    limg = img

                    # nimg = createNoiseTex(limg.width, limg.height, 0.05)
                    nimg = createNoiseTex(1024, 1024, 0.05)
                    nimg.load()
            else:
                # limg = createNoiseTex(img.width, img.height, 0.025)
                limg = createNoiseTex(1024, 1024, 0.05)
                # limg.load()
        else:
            if lensfilename is not None:
                limg = Image.open(lensfoldername+lensfilename +
                                  lensfileext).convert('RGBA')
                limg.load()
            else:
                limg = img

    if maskfilename is not None:
        mimg = Image.open(maskfilename).convert('RGBA')
        mimg.load()
        useMask = True

    global buffer, bufferMask
    buffer = Image.new('RGBA', (img.width, img.height))

    # calculate window size
    ratio = img.width/img.height
    global neww, newh
    if (ratio < 1.0):
        neww = (int)(max_display_size * ratio)
        newh = max_display_size
    else:
        neww = max_display_size
        newh = (int)(max_display_size / ratio)

    bufferMask = Image.new('RGBA', (neww, newh))
    # set up the window
    global display
    display = pygame.display.set_mode((neww, newh), 0, 32)
    pygame.display.set_caption('GlicthApp')

    if useMask is not True:
        mimg = bufferMask.get()

    if use_clpattern:
        getCLPattern()

    facts[0] = bendx * img.width
    facts[1] = bendy * img.height
    


def showImg(image):
    # Convert PIL image to pygame surface image
    global imgNew

    global mode, size, data 
    imgNew = image.resize((neww, newh), Image.NONE)
    # Calculate mode, size and data
    mode = imgNew.mode
    size = imgNew.size
  
    data = imgNew.tobytes()
    py_image = pygame.image.fromstring(data, size, mode)
    display.blit(py_image, (0, 0))
    pygame.display.update()

def drawMe():
    global animIndex, NoiseLens, animateNoiseLens, nimg, limg, mimg, facts, img
  
    editImage = img.copy()

    if animateLens:
        if animIndex > animEnd: exit()
        animateImageLens(animIndex)
        animIndex += 1

    if animateBend:
        animIndex += 1
        animateBend()
    #if animIndex % switchThreshold == 0:
        #switchDir(int(random.randrange(-1, 1)))

    if NoiseLens and animateNoiseLens:
        noiseTex = nimg if mixLens else limg
        noiseTex = updateNoiseTex(noiseTex, noiseSpeed, 0.025)
        noiseTex.load()
    if not animateBend:  animIndex += 1

    mimg.resize((img.width, img.height), Image.NONE)
    # bufferMask.clear();

    # println(mimg.pixels[0]);
    pixelsImg = list(img.getdata())
    if NoiseLens :
        pixelsNImg = list(nimg.getdata())
    pixelsMImg = list(mimg.getdata())
    pixelsLImg = list(limg.getdata())
    pixelsEdit = pixelsImg

    for x in range(0, img.width):

    # lx
    # nx
        if use_clpattern: lx = int(x*pattern_factor) % limg.width
        else:            lx = int(mapRange(x, 0, img.width-1, 0, limg.width-1))

        if NoiseLens : nx = int(mapRange(x, 0, img.width-1, 0, nimg.width-1))

        for y in range(0, img.height):

        # ly
        # ny
            if use_clpattern: ly = int(y*pattern_factor) % limg.height
            else:            ly = int(mapRange(y, 0, img.height-1, 0, limg.height-1))

            if NoiseLens : ny = int(mapRange(y, 0, img.height-1, 0, nimg.height-1))

            colorImg = pixelsImg[x+y*img.width]
            if NoiseLens : colorNImg = pixelsNImg[nx+ny*nimg.width]
            colorLimg = pixelsLImg[lx+ly*limg.width]
            colorMimg = pixelsMImg[lx+ly*mimg.width]
      
            if mixLens:
                r = colorImg[0]* colorNImg[0]/255
                g = colorImg[1]* colorNImg[1]/255
                b = colorImg[2]* colorNImg[2]/255
    
                c =  (r, g, b)
            else  :  
                c =  colorLimg

    


        factsCurrent = [0.0,0.0]
        factsCurrent[0] = facts[0]
        factsCurrent[1] = facts[1]

        if useMask :
            maskColAlpha = colorMimg[3]
            factsCurrent[0] = clamp(facts[0]* (maskColAlpha/255), 0, img.width)
            factsCurrent[1]  = clamp(facts[1]* (maskColAlpha/255), 0, img.height)
            #if (maskColAlpha >0) : print("facts: "+factsCurrent[0] +"  "+ factsCurrent[1] +"\n")
            
        

        xShift = getShift(c, 0, factsCurrent, bendDirX )
        yShift = getShift(c, 1, factsCurrent, bendDirY)
       # println(xShift);
        #println(yShift);
        posx = (x+xShift+2*img.width)%img.width
        posy = (y+yShift+2*img.height)%img.height



        n = pixelsImg[posx+posy*img.width]
        z = pixelsImg[x+y*img.width]

        #editPixels[x,y]= (255,0,0)
        #pixelsEdit[x+y*img.width] = (255,0,0,255)
        editImage.putpixel((x,y), (255,0,0,255))
        
       

 
    return editImage

def draw() :
    global img, mimg,limg, nimg
    nuImage = img.copy()
    mimg.resize((img.width, img.height), Image.NONE)
    # bufferMask.clear();

    # println(mimg.pixels[0]);
    pixelsImg = list(img.getdata())
    if NoiseLens :
        pixelsNImg = list(nimg.getdata())
    pixelsMImg = list(mimg.getdata())
    pixelsLImg = list(limg.getdata())
    pixelsEdit = pixelsImg

    for x in range(0, img.width):

        lx = int(mapRange(x, 0, img.width-1, 0, limg.width-1))

        if NoiseLens : nx = int(mapRange(x, 0, img.width-1, 0, nimg.width-1))

        for y in range(0, img.height):

            ly = int(mapRange(y, 0, img.height-1, 0, limg.height-1))

            if NoiseLens : ny = int(mapRange(y, 0, img.height-1, 0, nimg.height-1))

            
            colorImg = pixelsImg[x+y*img.width]
            if NoiseLens : colorNImg = pixelsNImg[nx+ny*nimg.width]
            colorLimg = pixelsLImg[lx+ly*limg.width]
            colorMimg = pixelsMImg[lx+ly*mimg.width]
      
            if mixLens:
                r = colorImg[0]* colorNImg[0]/255
                g = colorImg[1]* colorNImg[1]/255
                b = colorImg[2]* colorNImg[2]/255
    
                c =  (r, g, b)
            else  :  
                c =  colorLimg

    


            factsCurrent = [0.0,0.0]
            factsCurrent[0] = facts[0]
            factsCurrent[1] = facts[1]

            
            xShift = getShift(c, 0, factsCurrent, bendDirX )
            yShift = getShift(c, 1, factsCurrent, bendDirY)
        # println(xShift);
            #println(yShift);
            posx = (x+xShift+2*img.width)%img.width
            posy = (y+yShift+2*img.height)%img.height



            n = pixelsImg[posx+posy*img.width]
            z = pixelsImg[x+y*img.width]

            nuImage.putpixel((x,y),n)    

    print('done')
    return nuImage

def getShift( c,  idx,  Facts,  dir) :
    channelVals = getChannelVal (channels)

    cc = getChannel(c, channelVals[idx])

    lensType = types[idx]

    fact = Facts[idx]
  
    power_val = power_vals[idx]
   

    match lensType :
        case 'LINEAR':
           
            return int((fact * cc/255.0))
        case 'POWER':
            return int((fact*mapRange(pow(cc/255.0, power_val), 0, 1, -1, 1))*dir)
        case 'SINUSOIDAL':
            return int((fact*math.sin(mapRange(cc, 0, 255, -math.pi, math.pi)))*dir)
        case 'POLAR' : 
            # POLARs 
            c1 = cc if idx==0 else getChannel(c, channelVals[1])
            c2 = cc if idx==1 else getChannel(c, channelVals[0])
            ang = mapRange(c1, 0, 255, 0, 2*math.pi)
            r = mapRange(c2, 0, 255, 0, Facts[0])
            return int((r*math.cos(ang) if idx==0 else r*math.cos(ang)))


def getChannel( c,  channel) :

    ch = channel-6 if channel>5 else channel
    h,s,v = colorsys.rgb_to_hsv((c[0]/255),(c[1]/255),(c[2]/255))

    match ch :
        case 0: 
            cc = c[0]
            
        case 1 : 
            cc = c[1]
           
        case  2 : 
            cc = c[2]
          
        case 3: 
            cc = h*255.0
         
        case 4: 
            cc = s*255.0
            
        case 5: 
            cc= v*255.0
           
        
    return 255-cc if channel>5 else cc
  

def getChannelVal(channels) : 
    vals = []
    for channel in channels :
        vals.append(channelDict.get(channel))

    
    return vals

def randVals() :
    global power_vals , channels, types , facts
    power_vals[0] = random.uniform(0.0,8)
    power_vals[1] = random.uniform(0,8)
    channels[0] = get_key_from_value(channelDict,  random.randrange(0,12))
    channels[1] = get_key_from_value(channelDict,  random.randrange(0,12))
    print(channels)
    types[0] = get_key_from_value(lenses,  random.randrange(0,4))
    types[1] = get_key_from_value(lenses,  random.randrange(0,4))
    facts[0] =   0.05* img.width if animateLens else random.uniform(0.01, 0.05)* img.width
    facts[1] =   0.05* img.height if animateLens else random.uniform(0.01, 0.05)* img.height


setup()
image = img
showImg(image)


while 1:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_RETURN:
                print('drawing')
                randVals()
                image = draw()#drawMe(image)
                showImg(image)
    mousePos = pygame.mouse.get_pos()
 
    if interactive:
        facts[0] = int(mapRange(mousePos[0], 0, neww, 0, img.width))
        facts[1] = int(mapRange(mousePos[1], 0, newh, 0, img.height))
        image = drawMe()
        showImg(image)

    if animateLens or animateBend or animateNoiseLens:
        image = drawMe()
        showImg(image)

    if paintingStart:

        # bufferMask.beginDraw();
        painting = True
        # bufferMask.clear();
        paintingStart = False

  # if(painting) drawGradient(mouseX,mouseY);
    if paintingEnd:
        # bufferMask.endDraw();

        paintingEnd = False
        # mimg = bufferMask.get();
        # clear();
        # image(img, 0, 0, width, height);
        # image(bufferMask, 0, 0, width, height);
    if not useMask:
        mimg = bufferMask

    painting = False

    # print(mimg.width, mimg.height +"\n");







       
  
