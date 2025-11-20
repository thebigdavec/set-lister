export function autoScaleText(element, targetHeight, targetWidth) {
  if (!element) return;

  // Reset styles to measure natural size
  element.style.fontSize = '';
  element.style.lineHeight = '0.3'; // Start with very tight line height as requested

  // We measure the element's scrollHeight. 
  // Since we are passing the inner content element which has no fixed height,
  // scrollHeight will be the natural height of the text.
  
  let minSize = 10;
  let maxSize = 200;
  let optimalSize = minSize;

  // Binary search for font size
  while (minSize <= maxSize) {
    const midSize = Math.floor((minSize + maxSize) / 2);
    element.style.fontSize = `${midSize}px`;

    // Check if it fits
    const fitsHeight = element.scrollHeight <= targetHeight;
    const fitsWidth = element.scrollWidth <= targetWidth;

    if (fitsHeight && fitsWidth) {
      optimalSize = midSize;
      minSize = midSize + 1;
    } else {
      maxSize = midSize - 1;
    }
  }

  element.style.fontSize = `${optimalSize}px`;
  
  // Now try to expand line-height to fill vertical space
  // Only do this if we have some content and space left
  if (element.scrollHeight < targetHeight) {
    let minLH = 1.1; 
    let maxLH = 2.5; // Don't go too crazy with spacing
    let optimalLH = minLH;
    
    let steps = 10; 
    let low = minLH;
    let high = maxLH;
    
    while (steps > 0) {
      const midLH = (low + high) / 2;
      element.style.lineHeight = midLH;
      
      if (element.scrollHeight <= targetHeight) {
        optimalLH = midLH;
        low = midLH; 
      } else {
        high = midLH; 
      }
      steps--;
    }
    
    element.style.lineHeight = optimalLH;
  }
}
