import { renderHook, act } from "@testing-library/react";
import { useDashboards } from "../useDashboards";
import { useQuery } from "@apollo/client/react";
import { toast } from "sonner";

jest.mock("@apollo/client/react", () => ({ useQuery: jest.fn() }));
jest.mock("sonner", () => ({
  toast: { promise: jest.fn() },
}));

describe("useDashboards", () => {
  beforeEach(() => {
    (useQuery as unknown as jest.Mock).mockReturnValue({
      data: { dashboards: [{ id: 1 }, { id: 2 }, { id: 3 }] },
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it("returns paginated dashboards", () => {
    const { result } = renderHook(() => useDashboards());
    expect(result.current.dashboards.length).toBe(3);
    expect(result.current.totalPages).toBeGreaterThan(0);
  });

  it("triggers handleRefetch correctly", async () => {
    const { result } = renderHook(() => useDashboards());
    await act(async () => {
      await result.current.handleRefetch();
    });
    expect(toast.promise).toHaveBeenCalled();
  });
});
