#!/bin/bash

# Create placeholder images using ImageMagick
# Each is a 24x24px square with a label

cd "$(dirname "$0")"

# Process images
convert -size 24x24 xc:'#FF6B6B' -pointsize 8 -fill white -gravity center -annotate +0+0 'E' email_questions.png
convert -size 24x24 xc:'#4ECDC4' -pointsize 8 -fill white -gravity center -annotate +0+0 'O' one-sided_interview.png
convert -size 24x24 xc:'#45B7D1' -pointsize 8 -fill white -gravity center -annotate +0+0 'B' behavioural_interview.png
convert -size 24x24 xc:'#96CEB4' -pointsize 8 -fill white -gravity center -annotate +0+0 'P' portfolio_walkthrough.png
convert -size 24x24 xc:'#FFEAA7' -pointsize 8 -fill black -gravity center -annotate +0+0 'T' take-home_challenge.png
convert -size 24x24 xc:'#DDA0DD' -pointsize 8 -fill white -gravity center -annotate +0+0 'R' recruiter_call.png

# Status images
convert -size 24x24 xc:'#FF4757' -pointsize 8 -fill white -gravity center -annotate +0+0 'X' rejected.png
convert -size 24x24 xc:'#2ED573' -pointsize 8 -fill white -gravity center -annotate +0+0 '✓' accepted.png
convert -size 24x24 xc:'#FFA502' -pointsize 8 -fill white -gravity center -annotate +0+0 '?' no_answer_ongoing.png

# Other attributes
convert -size 24x24 xc:'#A29BFE' -pointsize 8 -fill white -gravity center -annotate +0+0 'D' design_related.png
convert -size 24x24 xc:'#FD79A8' -pointsize 8 -fill white -gravity center -annotate +0+0 '★' referred.png

echo "Placeholder images created successfully!"
