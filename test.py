from PIL import Image
import colorsys
import pygame
import math

# channels to work with
channelDict = {
'RED' : 0,
'GREEN' : 1,
'BLUE' : 2,
'HUE' : 3,
'SATURATION' : 4,
'BRIGHTNESS' : 5,
'NRED' : 6,
'NGREEN' : 7,
'NBLUE' : 8,
'NHUE' : 9,
'NSATURATION' : 10,
'NBRIGHTNESS' : 11

}


# two values of power from 0.1 to 10, one for x and second for y
types = ( 'POLAR', 'SINUSOIDAL')
 

# always to types one for x second for y
channels = ('BRIGHTNESS', 'HUE')
    


# parameters
bendx = 0.01
# from 0 to 1
bendy = 0.01
# from 0 to 1
power_vals = (  1, 1)
  


# parameters
bendx = 0.01
# from 0 to 1
bendy = 0.01

bendDirX = 1
bendDirY = 1


facts = [370, 400]

def mapRange(value, inMin, inMax, outMin, outMax):
    return outMin + (((value - inMin) / (inMax - inMin)) * (outMax - outMin))

def clamp (a, min, max) :
    return max(min(a, max), min)

def getShift( c,  idx,  Facts,  dir) :
    channelVals = getChannelVal (channels)
    print(channelVals)
    cc = getChannel(c, channelVals[idx])
    print(cc)
    lensType = types[idx]
    print(lensType)
    fact = Facts[idx]
    print(fact)
    power_val = power_vals[idx]
    print(power_val)

    match lensType :
        case 'LINEAR':
            print('REEE')
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
            return int((r*math.cos(ang) if idx==0 else r*math.cossin(ang)))


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

def draw() :
    nuImage = img.copy()
    for x in range(0, img.width):
        for y in range(0, img.height):
            nuImage.putpixel((x,y),(0,0,0))
    
    return nuImage

def showImg(image):
    # Convert PIL image to pygame surface image
    global imgNew

    global mode, size, data 
    imgNew = image.resize((img.width, img.height), Image.NONE)
    # Calculate mode, size and data
    mode = imgNew.mode
    size = imgNew.size
  
    data = imgNew.tobytes()
    py_image = pygame.image.fromstring(data, size, mode)
    display.blit(py_image, (0, 0))
    pygame.display.update()

global img
img = Image.open('BG.jpg').convert('RGBA')
global display

display = pygame.display.set_mode((img.width, img.height), 0, 32)
pygame.display.set_caption('GlicthApp')
image = img
showImg(image)
while 1:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_RETURN:
                print('drawing')
                image = draw()
                showImg(image)
    
  

        
        

