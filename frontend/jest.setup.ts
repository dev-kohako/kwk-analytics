import "@testing-library/jest-dom";

export const asMock = <T extends (...args: any) => any>(fn: T) =>
  fn as unknown as jest.MockedFunction<T>;