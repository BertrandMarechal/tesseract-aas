# USAGE
# python correct_skew.py --image images/neg_28.png

# import the necessary packages
from imutils import paths
import numpy as np
import argparse
import cv2

# construct the argument parse and parse the arguments
ap = argparse.ArgumentParser()
ap.add_argument("-i", "--image", required=True,
	help="path to input image file")
ap.add_argument("-o", "--output", required=False,
    help="path to output")
ap.add_argument("-x", "--xray", required=False, action='store_true',
    help="show all images")
args = vars(ap.parse_args())

# load the image from disk
image = cv2.imread(args["image"])


# ###### DOC contour
invGamma = 1.0 / 0.3
# gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
# gray = cv2.bitwise_not(gray)
# edged = cv2.Canny(gray, 50, 100)
edged = cv2.Canny(image, 50, 100)
gray = edged
# edged = cv2.Canny(gray, 50, 100)
table = np.array([((i / 255.0) ** invGamma) * 255
for i in np.arange(0, 256)]).astype("uint8")

# apply gamma correction using the lookup table
# gray = cv2.LUT(gray, table)

if args["xray"]:
    cv2.imshow("gray", gray)
ret,thresh1 = cv2.threshold(gray,80,255,cv2.THRESH_BINARY)

im3, contours, hierarchy = cv2.findContours(thresh1,cv2.RETR_TREE,cv2.CHAIN_APPROX_SIMPLE)
im2 = cv2.drawContours(gray, contours, 0, (0,255,0), 3)

if args["xray"]:
    cv2.imshow("thresh", im2)

def biggestRectangle(contours):
    biggest = None
    max_area = 0
    indexReturn = -1
    for index in range(len(contours)):
            i = contours[index]
            area = cv2.contourArea(i)
            if area > 100:
                peri = cv2.arcLength(i,True)
                approx = cv2.approxPolyDP(i,0.1*peri,True)
                if area > max_area: #and len(approx)==4:
                        biggest = approx
                        max_area = area
                        indexReturn = index
    return indexReturn

indexReturn = biggestRectangle(contours)
print("[INFO] indexReturn: {:.3f}".format(indexReturn))
hull = cv2.convexHull(contours[indexReturn])
# cv2.imwrite('hello.png',cv2.drawContours(image, [hull], 0, (0,255,0),3))
if args["xray"]:
    cv2.imshow("4", cv2.drawContours(image, [hull], 0, (0,255,0),3))
#
# # apply gamma correction using the lookup table
# gray = cv2.LUT(gray, table)
#
# # show the output images
# if roiDone:
#     cv2.imwrite(args["output"], roi)
# else:
#     cv2.imwrite(args["output"], image)


cv2.waitKey(0)