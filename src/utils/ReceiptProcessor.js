/**
 * Receipt Processor Simulation
 * In a real app, this would call an AI API like Gemini.
 */

export const analyzeReceipt = async (imageFile) => {
    // Simulate AI Processing Delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // For the test case requested by user:
    // 2026-02-02 카페지오 245,000원
    return {
        store: '카페지오',
        amount: 245000,
        date: '2026-02-02',
        confidence: 0.99
    };
};
