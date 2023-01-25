describe('textencoder', () => {
  test('text encoder', () => {
    const string = 'hello world';
    const textEncodedStr = new TextEncoder().encode(string);
    const textEncodedStr11 = new Uint8Array(Buffer.from(string));

    expect(textEncodedStr).toEqual(textEncodedStr11);
  });
});
