
import { VoiceLiveChat } from "@components/VoiceLiveChat";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-4">Azure Voice Live Chat Example</h1>
        <VoiceLiveChat apiKey={'8OUHmxYdk5lsyRl6VpOQ15ROMcbdLYuRtEyh1N8NUbAyu9ZT922HJQQJ99BEACHYHv6XJ3w3AAAAACOGoNYD'} endpoint={'https://sc-ai-agent-resource.openai.azure.com'} model={'gpt-4o-mini-realtime-preview'} userId={"123456"} />
      </main>
    </div>
  );
}
