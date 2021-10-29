import {resolve, filePath} from './utils.js'

test('resolve, absolute', () => {
  expect(resolve('https://caca.ca', '/pipi#cul')).toBe('https://caca.ca/pipi#cul');
});
test('resolve, relative', () => {
  expect(resolve('https://nodejs.org/api', 'assets/style.css')).toBe('https://nodejs.org/api/assets/style.css')
});
test('resolve, domain', () => {
  expect(resolve('https://caca.ca', 'https://crotte.ca#col')).toBe('https://crotte.ca#col');
});
test('resolve', () => {
  expect(filePath('https://v8.dev/')).toBe('v8.dev/index.html');
})
test('resolve', () => {
 expect(filePath('https://www.nodejs.org/api/#')).toBe('nodejs.org/api/index.html');
})
test('resolve', () => {
 expect(filePath('https://www.nodejs.org/api/')).toBe('nodejs.org/api/index.html');
})
