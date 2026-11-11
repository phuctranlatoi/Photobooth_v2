import { afterEach, describe, expect, test } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react';

afterEach(cleanup);

describe('Basic scaffold test', () => {
  test('renders a minimal React element', () => {
    render(<div>Hello scaffold</div>);

    expect(screen.getByText('Hello scaffold').tagName).toBe('DIV');
    console.log('Basic scaffold test discovered and executed');
  });
});
