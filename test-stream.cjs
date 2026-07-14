const { streamText } = require('ai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const { db } = require('./src/db/index.js');
const { messages } = require('./src/db/schema.js');

async function test() {
  try {
    const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = google('gemini-1.5-flash');
    
    console.log('Starting streamText...');
    const result = await streamText({
      model,
      messages: [{ role: 'user', content: 'Say hi' }],
      onFinish: ({ text }) => {
        console.log('onFinish called with text:', text);
        try {
          db.insert(messages).values({
            id: 'test-id-' + Date.now(),
            chatId: '5551a4b6-0a6f-4cd6-b905-2e3cb36ce1ac', // use existing chatId
            role: 'assistant',
            content: text,
            createdAt: Date.now()
          }).run();
          console.log('Successfully inserted assistant message!');
        } catch (err) {
          console.error('Error inserting message inside onFinish:', err);
        }
      }
    });

    // We must consume the stream or pipe it, otherwise onFinish is never called!
    console.log('Consuming stream...');
    for await (const chunk of result.textStream) {
      // do nothing
    }
    console.log('Finished consuming stream.');
  } catch (e) {
    console.error('Test failed:', e);
  }
}

test();
