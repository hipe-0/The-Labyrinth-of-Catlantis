import { fireEvent, render } from '@testing-library/react';
import { StartScreen } from './StartScreen';

describe('StartScreen', () => {
  it('starts the game on Enter or Space', () => {
    const onStart = jest.fn();
    render(<StartScreen onStart={onStart} />);

    fireEvent.keyDown(window, { key: 'Enter' });
    fireEvent.keyDown(window, { key: ' ' });

    expect(onStart).toHaveBeenCalledTimes(2);
  });

  it('ignores unrelated keys', () => {
    const onStart = jest.fn();
    render(<StartScreen onStart={onStart} />);

    fireEvent.keyDown(window, { key: 'a' });

    expect(onStart).not.toHaveBeenCalled();
  });
});
