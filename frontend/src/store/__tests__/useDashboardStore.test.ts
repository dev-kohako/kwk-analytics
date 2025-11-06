import { act } from "@testing-library/react";
import { useDashboardStore } from "../useDashboardStore";

describe("useDashboardStore", () => {
  beforeEach(() => {
    useDashboardStore.setState({ filters: {} });
  });

  it("sets filters correctly", () => {
    act(() => {
      useDashboardStore.getState().setFilters({ channel: "iFood" });
    });
    expect(useDashboardStore.getState().filters.channel).toBe("iFood");
  });

  it("merges filters instead of replacing them", () => {
    act(() => {
      useDashboardStore.getState().setFilters({ channel: "iFood" });
      useDashboardStore.getState().setFilters({ dow: 5 });
    });
    expect(useDashboardStore.getState().filters).toEqual({
      channel: "iFood",
      dow: 5,
    });
  });

  it("clears filters correctly", () => {
    act(() => {
      useDashboardStore.getState().setFilters({ channel: "Rappi" });
      useDashboardStore.getState().clearFilters();
    });
    expect(useDashboardStore.getState().filters).toEqual({});
  });
});
