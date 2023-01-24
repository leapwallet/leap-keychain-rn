describe('textencoder', () => {
  const string = 'hello world';
  const textEncodedStr = new TextEncoder().encode(string);
  const textEncodedStr11 = Buffer.from(string).toString('utf8');
  console.log('textEncodedStr: ', textEncodedStr);
  console.log('textEncodedStr11: ', textEncodedStr11);

  expect(textEncodedStr).toEqual(textEncodedStr11);
});
