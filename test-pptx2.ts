import pptxgen from 'pptxgenjs';
const pptx = new pptxgen();
pptx.addSlide();
pptx.addSlide();
const totalSlides = (pptx as any)._slides.length;
console.log("Total slides:", totalSlides);
(pptx as any)._slides.forEach((slideObj: any, index: number) => {
  slideObj.addText("Hello on slide " + (index + 1), { x: 1, y: 1, w: 2, h: 1 });
});
pptx.writeFile({ fileName: 'test2.pptx' });
