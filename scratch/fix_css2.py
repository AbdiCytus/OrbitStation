import re

with open(r'd:\Documents\Ngoding\Proyek\OrbStation\OrbitStation\app\badges.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the two SVG strings using regex
svg1_match = re.search(r'url\("data:image/svg\+xml,[^"]+bh-glow[^"]+"\)', content)
svg2_match = re.search(r'\.chat-mention-modal\.badge-zodiac\s*\{\s*background-image:\s*(url\("data:image/svg\+xml,[^"]+"\))', content)

if svg1_match and svg2_match:
    svg1 = svg1_match.group(0)
    svg2 = svg2_match.group(1)
    
    correct_css = f""".badge-zodiac {{
  --creator-angle: 0deg;
  overflow: visible !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  background-image:
    {svg1},
    linear-gradient(135deg, #0a1128 0%, #101b3d 40%, #1b263b 80%, #0d1b2a 100%) !important;
  background-size: 100% 100%, 100% 100% !important;
  border-color: rgba(255, 204, 0, 0.7) !important;
  color: #e0f7fa;
  box-shadow: 
    0 0 15px rgba(0, 229, 255, 0.5),
    0 0 30px rgba(192, 38, 211, 0.5),
    inset 0 0 15px rgba(255, 204, 0, 0.2) !important;
  animation: zodiac-shadow-spin 4s linear infinite;
  position: relative;
  z-index: auto !important;
}}

/* Override for the modal so it uses the SVG WITHOUT the black hole to avoid double blackholes */
.chat-mention-modal.badge-zodiac {{
  background-image: 
    {svg2},
    linear-gradient(135deg, #0a1128 0%, #101b3d 40%, #1b263b 80%, #0d1b2a 100%) !important;
}}
"""
    
    start_idx = content.find(".badge-zodiac {")
    end_idx = content.find(".badge-zodiac::before {")
    
    if start_idx != -1 and end_idx != -1:
        new_content = content[:start_idx] + correct_css + "\n" + content[end_idx:]
        with open(r'd:\Documents\Ngoding\Proyek\OrbStation\OrbitStation\app\badges.css', 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Success!")
    else:
        print("Could not find start or end index.")
else:
    print("Could not find SVGs")
