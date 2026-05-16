import React from 'react';
import renderer from 'react-test-renderer';
import App from '../App';

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

test('PocketVault AI renders', () => {
  const tree = renderer.create(<App />).toJSON();
  expect(tree).toBeTruthy();
});
