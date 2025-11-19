# Converting SVG Images to PNG

The app includes SVG placeholder images that need to be converted to PNG for full compatibility.

## Quick Conversion Methods

### Method 1: Online Converter (Easiest)
1. Visit https://cloudconvert.com/svg-to-png
2. Upload the SVG files from this folder
3. Set the output dimensions:
   - `og-image.svg` → 1200x630px
   - `icon.svg` → 192x192px and 512x512px
4. Download and rename:
   - `og-image.png`
   - `icon-192.png`
   - `icon-512.png`

### Method 2: Using ImageMagick (Command Line)
```bash
# Install ImageMagick first:
# macOS: brew install imagemagick
# Ubuntu: sudo apt-get install imagemagick
# Windows: choco install imagemagick

# Convert OG image
convert -background none -density 300 og-image.svg -resize 1200x630 og-image.png

# Convert icons
convert -background none -density 300 icon.svg -resize 192x192 icon-192.png
convert -background none -density 300 icon.svg -resize 512x512 icon-512.png
```

### Method 3: Using Inkscape
```bash
# Install Inkscape: https://inkscape.org/

# Convert OG image
inkscape og-image.svg --export-filename=og-image.png --export-width=1200 --export-height=630

# Convert icons
inkscape icon.svg --export-filename=icon-192.png --export-width=192 --export-height=192
inkscape icon.svg --export-filename=icon-512.png --export-width=512 --export-height=512
```

### Method 4: Using Node.js (sharp package)
```bash
npm install -g sharp-cli

# Convert OG image
sharp -i og-image.svg -o og-image.png resize 1200 630

# Convert icons
sharp -i icon.svg -o icon-192.png resize 192 192
sharp -i icon.svg -o icon-512.png resize 512 512
```

## After Conversion

1. Delete or keep the SVG files (optional - they're just placeholders)
2. Make sure these PNG files exist in the `public/` folder:
   - `og-image.png` (1200x630)
   - `icon-192.png` (192x192)
   - `icon-512.png` (512x512)

3. Test your images:
   - OG Image: https://www.opengraph.xyz/url/ (paste your deployed URL)
   - Icons: Install the PWA on a mobile device

## Creating Screenshots

For `screenshot-1.png` and `screenshot-2.png`:

1. Run the app: `npm run dev`
2. Open in browser
3. Open DevTools (F12)
4. Click device toolbar icon
5. Set custom dimensions: 1280 x 720
6. Navigate to gameplay or tutorial screen
7. Take screenshot (use browser extension or OS screenshot tool)
8. Save as `screenshot-1.png` and `screenshot-2.png` in public folder

## Need Better Images?

See `../IMAGE_GUIDE.md` for detailed instructions on creating professional-quality images for your game!
