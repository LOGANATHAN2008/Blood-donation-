import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      retry: 2,
      refetchOnWindowFocus: true,
    },
    mutations: {
      onError: (err) => {
        console.error('Mutation error:', err);
      },
    },
  },
});

export default queryClient;
