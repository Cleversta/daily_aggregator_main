// Crop coordinates refer to the original image; rotation happens after cropping.
export function cropRectangle(width, height, aspect = 'original', zoom = 100, x = 50, y = 50) {
  const ratio = aspect === 'original' ? width / height : Number(aspect);
  let cropWidth = Math.min(width, height * ratio);
  let cropHeight = cropWidth / ratio;
  const scale = Math.max(10, Math.min(100, Number(zoom))) / 100;
  cropWidth = Math.max(1, Math.floor(cropWidth * scale));
  cropHeight = Math.max(1, Math.floor(cropHeight * scale));
  return {
    x: Math.round((width - cropWidth) * Math.max(0, Math.min(100, x)) / 100),
    y: Math.round((height - cropHeight) * Math.max(0, Math.min(100, y)) / 100),
    width: cropWidth,
    height: cropHeight,
  };
}
export function outputHeight(width, crop, rotation) {
  return Math.max(1, Math.round(width * (rotation % 180 === 0 ? crop.height / crop.width : crop.width / crop.height)));
}
