import { renderHook, act } from "@testing-library/react";
import { useFilterOptions } from "../useFilterOptions";
import { useLazyQuery } from "@apollo/client/react";

jest.mock("@apollo/client/react", () => ({
  useLazyQuery: jest.fn(),
}));

describe("useFilterOptions", () => {
  const run = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    (useLazyQuery as unknown as jest.Mock).mockReturnValue([
      run,
      { loading: false, data: { pivotFieldValues: ["A", "B"] } },
    ]);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("loads and sets options", async () => {
    const { result } = renderHook(() => useFilterOptions("region"));
    await act(async () => {
      await result.current.load();
    });
    jest.advanceTimersByTime(250);
    expect(run).toHaveBeenCalled();
    expect(run).toHaveBeenCalled();
  });
});
