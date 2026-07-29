const pptxgen = require('pptxgenjs');
const pptx = new pptxgen();

pptx.defineSlideMaster({
  title: 'MASTER',
  objects: [
    { text: { text: "Link to last", options: { x: 1, y: 1, hyperlink: { slide: 'last' } } } },
    { text: { text: "Link to slide 3", options: { x: 1, y: 2, hyperlink: { slide: 3 } } } }
  ]
});

pptx.addSlide({ masterName: 'MASTER' });
pptx.addSlide({ masterName: 'MASTER' });
let slide3 = pptx.addSlide({ masterName: 'MASTER' });
slide3.name = "FeedbackSlide";

pptx.writeFile({ fileName: 'test-link.pptx' }).then(() => console.log('Done')).catch(e => console.error(e));
