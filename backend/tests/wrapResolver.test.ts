import { wrapResolver } from "../src/utils/resolverWrapper";
import { GraphQLError } from "graphql";

describe("wrapResolver()", () => {
  it("deve retornar valor normalmente", async () => {
    const resolver = wrapResolver(async () => "ok");
    const result = await resolver(null, {}, { ip: "127.0.0.1" });
    expect(result).toBe("ok");
  });

  it("deve lançar erro de rate limit se exceder", async () => {
    const context = { ip: "9.9.9.9" };
    const resolver = wrapResolver(async () => "ok", 5);

    const calls = Array.from({ length: 10 }, () =>
      resolver(null, {}, context)
    );
    const results = await Promise.allSettled(calls);

    const rejected = results.filter(
      (r) => r.status === "rejected" && r.reason instanceof GraphQLError
    );
    expect(rejected.length).toBeGreaterThan(0);
  });
});
