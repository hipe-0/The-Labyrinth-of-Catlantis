import { fireEvent, render, screen } from '@testing-library/react';
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

  it('renders custom level-complete copy', () => {
    render(
      <StartScreen
        onStart={jest.fn()}
        title="Labyrinth cleared"
        subtitle="Labyrinth 2 awaits"
        buttonLabel="Start"
        hint="Press Enter or Space to continue"
        controlsHint=""
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Labyrinth cleared' })
    ).toBeInTheDocument();
    expect(screen.getByText('Labyrinth 2 awaits')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Start' })
    ).toBeInTheDocument();
  });
});
