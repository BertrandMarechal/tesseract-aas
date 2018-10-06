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
ap.add_argument("-s", "--show", required=False, action='store_true',
    help="show images")
ap.add_argument("-x", "--xray", required=False, action='store_true',
    help="show all images")
args = vars(ap.parse_args())

# load the image from disk
image = cv2.imread(args["image"])

if args["show"]:
    cv2.imshow("Input", image)

# convert the image to grayscale and flip the foreground
# and background to ensure foreground is now "white" and
# the background is "black"
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
gray = cv2.bitwise_not(gray)

# threshold the image, setting all foreground pixels to
# 255 and all background pixels to 0
thresh = cv2.threshold(gray, 0, 255,
	cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]

# grab the (x, y) coordinates of all pixel values that
# are greater than zero, then use these coordinates to
# compute a rotated bounding box that contains all
# coordinates
coords = np.column_stack(np.where(thresh > 0))
angle = cv2.minAreaRect(coords)[-1]

# the `cv2.minAreaRect` function returns values in the
# range [-90, 0); as the rectangle rotates clockwise the
# returned angle trends to 0 -- in this special case we
# need to add 90 degrees to the angle
if angle < -45:
	angle = -(90 + angle)

# otherwise, just take the inverse of the angle to make
# it positive
else:
	angle = -angle

# rotate the image to deskew it
(h, w) = image.shape[:2]
center = (w // 2, h // 2)
M = cv2.getRotationMatrix2D(center, angle, 1.0)
rotated = cv2.warpAffine(image, M, (w, h),
	flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

# draw the correction angle on the image so we can validate it
# cv2.putText(rotated, "Angle: {:.2f} degrees".format(angle),
	# (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

# show the output image
print("[INFO] angle: {:.3f}".format(angle))
if args["show"]:
    cv2.imshow("Rotated", rotated)

image = rotated

# ####### MRZ identification

# image = cv2.imread(args["image"])
# image = imutils.resize(image, height=600)
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

# initialize a rectangular and square structuring kernel
rectKernel = cv2.getStructuringElement(cv2.MORPH_RECT, (13, 5))
sqKernel = cv2.getStructuringElement(cv2.MORPH_RECT, (30, 30)) #21, 21



# smooth the image using a 3x3 Gaussian, then apply the blackhat
# morphological operator to find dark regions on a light background
gray = cv2.GaussianBlur(gray, (3, 3), 0)
blackhat = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, rectKernel)

# compute the Scharr gradient of the blackhat image and scale the
# result into the range [0, 255]
gradX = cv2.Sobel(blackhat, ddepth=cv2.CV_32F, dx=1, dy=0, ksize=-1)
gradX = np.absolute(gradX)
(minVal, maxVal) = (np.min(gradX), np.max(gradX))
gradX = (255 * ((gradX - minVal) / (maxVal - minVal))).astype("uint8")

# apply a closing operation using the rectangular kernel to close
# gaps in between letters -- then apply Otsu's thresholding method
gradX = cv2.morphologyEx(gradX, cv2.MORPH_CLOSE, rectKernel)
thresh = cv2.threshold(gradX, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]

# perform another closing operation, this time using the square
# kernel to close gaps between lines of the MRZ, then perform a
# serieso of erosions to break apart connected components
thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, sqKernel)
thresh = cv2.erode(thresh, None, iterations=6)

# during thresholding, it's possible that border pixels were
# included in the thresholding, so let's set 5% of the left and
# right borders to zero
#p = int(image.shape[1] * 0.05)
#thresh[:, 0:p] = 0
#thresh[:, image.shape[1] - p:] = 0

if args["show"]:
    cv2.imshow("thresh", thresh)

# find contours in the thresholded image and sort them by their
# size
cnts = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL,
    cv2.CHAIN_APPROX_SIMPLE)[-2]
cnts = sorted(cnts, key=cv2.contourArea, reverse=True)

roiDone = False

# loop over the contours
for c in cnts:
    # compute the bounding box of the contour and use the contour to
    # compute the aspect ratio and coverage ratio of the bounding box
    # width to the width of the image
    (x, y, w, h) = cv2.boundingRect(c)
    ar = w / float(h)
    crWidth = w / float(gray.shape[1])

    # check to see if the aspect ratio and coverage width are within
    # acceptable criteria

    print("[INFO] ar: {:.3f}".format(ar))
    print("[INFO] crWidth: {:.3f}".format(crWidth))
    if ar > 5 and crWidth > 0.57:
        # pad the bounding box since we applied erosions and now need
        # to re-grow it
        pX = int((x + w) * 0.03)
        pY = int((y + h) * 0.03)
        (x, y) = (x - pX, y - pY)
        (w, h) = (w + (pX * 2), h + (pY * 2))

        # extract the ROI from the image and draw a bounding box
        # surrounding the MRZ
        roi = image[y:y + h, x:x + w].copy()
        roiDone = True
        cv2.rectangle(image, (x, y), (x + w, y + h), (0, 255, 0), 2)
        break

# show the output images
if roiDone:
    cv2.imwrite(args["output"], roi)
    if args["xray"]:
        cv2.imshow("output", roi)
else:
    cv2.imwrite(args["output"], image)



cv2.waitKey(0)