import Groq, { APIError } from 'groq-sdk';
import { ChatCompletion, ChatCompletionMessageParam, ChatCompletionTool } from 'groq-sdk/resources/chat/completions';
import { ExploreContext, ExploreTool, ProposedSelector } from '../../types/healing';
import { LLMProvider, ProviderUnavailableError, SYSTEM_PROMPT } from './LLMProvider';

export class GroqProvider implements LLMProvider {
  readonly name = 'groq';
  private readonly client: Groq | null;

  constructor(private readonly apiKey: string, private readonly model: string) {
    this.client = apiKey ? new Groq({ apiKey }) : null;
  }

  isConfigured(): boolean {
    return !!this.client;
  }

  async runExploreLoop(
    context: ExploreContext,
    tools: ExploreTool[],
    executeTool: (name: string, args: Record<string, unknown>) => Promise<unknown>,
    maxRounds: number,
  ): Promise<ProposedSelector | null> {
    if (!this.client) throw new ProviderUnavailableError(this.name, 'Groq API key not configured');

    const chatTools: ChatCompletionTool[] = tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters as unknown as Record<string, unknown>,
      },
    }));

    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Original selector: ${context.originalSelector}\nDescription: ${context.description}\nAction: ${context.action}`,
      },
    ];

    for (let round = 0; round < maxRounds; round++) {
      const response = await this.createWithRetry(messages, chatTools);

      const message = response.choices[0]?.message;
      const toolCalls = message?.tool_calls;
      if (!message || !toolCalls || toolCalls.length === 0) return null;

      const proposeCall = toolCalls.find((c) => c.function.name === 'propose_selector');
      if (proposeCall) {
        const args = JSON.parse(proposeCall.function.arguments || '{}');
        return {
          ref: String(args.ref ?? ''),
          confidence: Number(args.confidence ?? 0),
          reasoning: String(args.reasoning ?? ''),
        };
      }

      messages.push({ role: 'assistant', content: message.content, tool_calls: toolCalls });
      for (const call of toolCalls) {
        const args = JSON.parse(call.function.arguments || '{}');
        const result = await executeTool(call.function.name, args);
        messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
      }
    }

    return null;
  }

  /**
   * Llama-family models occasionally emit a malformed text-based tool call
   * (`<function=name>{args}</function>`) instead of a structured tool_calls
   * entry, which Groq rejects with a 400 tool_use_failed error. This is a
   * transient model quirk, not a request-format bug - retrying the same
   * turn (unmodified) resolves it in practice. Bounded to avoid masking a
   * genuine persistent failure as an infinite retry.
   */
  private async createWithRetry(
    messages: ChatCompletionMessageParam[],
    tools: ChatCompletionTool[],
    attemptsLeft = 2,
  ): Promise<ChatCompletion> {
    try {
      return await this.client!.chat.completions.create({
        model: this.model,
        messages,
        tools,
        tool_choice: 'auto',
      });
    } catch (err) {
      if (err instanceof APIError && (err.status === 429 || err.status === 401 || err.status === 403)) {
        throw new ProviderUnavailableError(this.name, err.message);
      }
      if (err instanceof APIError && err.status === 400 && attemptsLeft > 1) {
        return this.createWithRetry(messages, tools, attemptsLeft - 1);
      }
      throw err;
    }
  }
}
