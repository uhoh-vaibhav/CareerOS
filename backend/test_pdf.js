async function test() {
  try {
    const pdfParseModule = await import("pdf-parse");
    console.log(pdfParseModule);
  } catch(e) {
    console.error(e);
  }
}
test();
