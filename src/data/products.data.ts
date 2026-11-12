export const concurrentProducts = {
    priceA: 100,
    priceB: 200,
    nameFor: (session: 'A' | 'B') => `Concurrent_${session}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
};
