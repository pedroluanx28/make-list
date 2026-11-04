import { hasClock, startClock, stopClock } from '../../src/utils/pokerClock';

const GROUP = 'group@g.us';

const handlers = () => ({ onWarning: jest.fn(), onExpire: jest.fn() });

describe('pokerClock', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2026-10-28T12:00:00Z') });
  });

  afterEach(() => {
    stopClock(GROUP);
    stopClock('other@g.us');
    jest.useRealTimers();
  });

  it('should warn when 10 seconds are left and expire after 30 seconds', async () => {
    const clock = handlers();
    startClock(GROUP, clock);

    await jest.advanceTimersByTimeAsync(19999);
    expect(clock.onWarning).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(1);
    expect(clock.onWarning).toHaveBeenCalledTimes(1);
    expect(clock.onExpire).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(10000);
    expect(clock.onExpire).toHaveBeenCalledTimes(1);
    expect(hasClock(GROUP)).toBe(false);
  });

  it('should start over and drop the previous clock when started again', async () => {
    const first = handlers();
    const second = handlers();
    startClock(GROUP, first);
    await jest.advanceTimersByTimeAsync(25000);

    startClock(GROUP, second);
    await jest.advanceTimersByTimeAsync(25000);

    expect(first.onExpire).not.toHaveBeenCalled();
    expect(second.onWarning).toHaveBeenCalledTimes(1);
    expect(second.onExpire).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(5000);
    expect(second.onExpire).toHaveBeenCalledTimes(1);
  });

  it('should never fire after being stopped', async () => {
    const clock = handlers();
    startClock(GROUP, clock);

    stopClock(GROUP);
    await jest.advanceTimersByTimeAsync(60000);

    expect(clock.onWarning).not.toHaveBeenCalled();
    expect(clock.onExpire).not.toHaveBeenCalled();
    expect(hasClock(GROUP)).toBe(false);
  });

  it('should keep the clocks of different groups apart', async () => {
    const group = handlers();
    const other = handlers();
    startClock(GROUP, group);
    startClock('other@g.us', other);

    stopClock(GROUP);
    await jest.advanceTimersByTimeAsync(30000);

    expect(group.onExpire).not.toHaveBeenCalled();
    expect(other.onExpire).toHaveBeenCalledTimes(1);
  });

  it('should log an error thrown by a handler instead of crashing', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    startClock(GROUP, {
      onWarning: jest.fn().mockRejectedValue(new Error('send failed')),
      onExpire: jest.fn(() => {
        throw new Error('boom');
      }),
    });

    await jest.advanceTimersByTimeAsync(30000);

    expect(errorSpy).toHaveBeenCalledTimes(2);
    expect(errorSpy.mock.calls[1][1]).toEqual(new Error('boom'));
    errorSpy.mockRestore();
  });
});
