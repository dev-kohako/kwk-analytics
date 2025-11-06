export type GraphQLContext = Record<string, never>;
export const createContext = async (): Promise<GraphQLContext> => ({});