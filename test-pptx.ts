import pptxgen from 'pptxgenjs';
const pptx = new pptxgen();
pptx.addSlide();
console.log(Object.keys(pptx));
