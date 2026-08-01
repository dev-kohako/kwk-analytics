import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

export function createApolloClient(token?: string | null) {
  return new ApolloClient({
    link: new HttpLink({
      uri: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/",
    }),
    cache: new InMemoryCache(),
  });
}
