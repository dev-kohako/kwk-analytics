import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "../use-mobile";

describe("useIsMobile", () => {
  beforeEach(() => {
    (window as any).matchMedia = jest.fn().mockImplementation(() => ({
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
  });

  it("returns true when window width < 768", () => {
    (window as any).innerWidth = 500;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("returns false when window width >= 768", () => {
    (window as any).innerWidth = 1024;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("updates on resize event", () => {
    const listeners: Record<string, any> = {};
    (window as any).matchMedia = jest.fn().mockImplementation(() => ({
      addEventListener: (_: string, cb: any) => (listeners.change = cb),
      removeEventListener: jest.fn(),
    }));

    (window as any).innerWidth = 800;
    const { result } = renderHook(() => useIsMobile());

    act(() => {
      (window as any).innerWidth = 600;
      listeners.change();
    });

    expect(result.current).toBe(true);
  });
});
