import { ApolloClient, InMemoryCache} from '@apollo/client';

const createClient = (port) => {
  return new ApolloClient({
    uri: `http://localhost:${port}/`,
    cache: new InMemoryCache(),
  })
};

export const sessionClient = createClient(3002);
export const profileClient = createClient(3003);
export const matchingClient = createClient(3005);
