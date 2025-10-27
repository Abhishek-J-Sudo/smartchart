# Library Dependencies

## PptxGenJS

To enable PowerPoint export functionality, you need to download the PptxGenJS library.

### Installation

Download the library from:
```
https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.min.js
```

Save it as `pptxgen.min.js` in this folder.

### Alternative CDN

If you prefer, you can also update the script tag in `index.html` to use the CDN directly:
```html
<script src="https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.min.js"></script>
```

### Why not included?

The library file is quite large (~500KB), so it's not included in the repository to keep it lightweight. The application will work without it, but PowerPoint export will show an error message with download instructions.
