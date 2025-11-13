#!/usr/bin/env python3
"""
Generate placeholder images for grid visualization.
Creates 24x24px PNG files with different colors for each layer.
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Image definitions: (filename, color, label)
images = [
    # Process images
    ('email_questions.png', '#FF6B6B', 'E'),
    ('one-sided_interview.png', '#4ECDC4', 'O'),
    ('behavioural_interview.png', '#45B7D1', 'B'),
    ('portfolio_walkthrough.png', '#96CEB4', 'P'),
    ('take-home_challenge.png', '#FFEAA7', 'T'),
    ('recruiter_call.png', '#DDA0DD', 'R'),
    # Status images
    ('rejected.png', '#FF4757', 'X'),
    ('accepted.png', '#2ED573', '✓'),
    ('no_answer_ongoing.png', '#FFA502', '?'),
    # Other attributes
    ('design_related.png', '#A29BFE', 'D'),
    ('referred.png', '#FD79A8', '★'),
]

size = 24
for filename, color, label in images:
    # Create image with solid color background
    img = Image.new('RGB', (size, size), color)
    draw = ImageDraw.Draw(img)
    
    # Add label text (simple single character in white)
    # Using default font since we can't rely on specific fonts being available
    bbox = draw.textbbox((0, 0), label)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (size - text_width) // 2
    y = (size - text_height) // 2
    
    draw.text((x, y), label, fill='white')
    
    # Save as PNG
    img.save(filename)
    print(f"Created {filename}")

print("\nAll placeholder images created successfully!")
