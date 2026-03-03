import OpenAI from 'openai';
import dotenv from 'dotenv';
import NodeCache from 'node-cache';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.BASE_URL
});

// Cache for storing processed content
const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

export class ContentProcessor {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is required');
    }

    this.gptClient = openai;

    this.perplexityClient = openai;
  }

  /**
   * Process content through custom GPT API
   * @param {string} prompt - Formatted prompt for GPT
   * @returns {Promise<string>} - Enhanced content
   */
  async processWithGPT(prompt, role = "initial") {
    try {
      const systemMessages = {
        initial: "You are an expert at converting presentation content into engaging, natural-sounding discussions. Your output should be conversational yet professional, including relevant examples and clear explanations.",
        enhance: "You are an expert at enhancing content with additional context, examples, and deeper insights. Maintain the conversational tone while adding valuable information and making the content more engaging."
      };

      const response = await this.gptClient.chat.completions.create({
        model: process.env.MODEL || "provider-3/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemMessages[role]
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('GPT API Error:', error.response?.data || error.message);
      throw new Error(`GPT processing failed: ${error.message}`);
    }
  }

  /**
   * Process content through Perplexity API
   * @param {string} content - Content to enhance
   * @returns {Promise<string>} - Enhanced content
   */
  async processWithPerplexity(content) {
    try {
      const response = await this.perplexityClient.chat.completions.create({
        model: "pplx-7b-online",
        messages: [
          {
            role: "system",
            content: "You are an expert at enhancing content with real-world examples, additional context, and making complex topics engaging and easy to understand."
          },
          {
            role: "user",
            content: `Please enhance this content with additional context, examples, and make it more engaging while maintaining its conversational tone: ${content}`
          }
        ],
        temperature: 0.7
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Perplexity API Error:', error.response?.data || error.message);
      // Fallback to GPT if Perplexity fails
      console.log('Falling back to GPT for enhancement...');
      return content;
    }
  }

  /**
   * Enhance content using both GPT and Perplexity
   * @param {string} content - Initial processed content
   * @returns {Promise<string>} - Further enhanced content
   */
  async enhanceContent(content) {
    // First enhance with GPT
    const gptEnhanced = await this.processWithGPT(content, "enhance");
    
    try {
      // Then try to further enhance with Perplexity
      return await this.processWithPerplexity(gptEnhanced);
    } catch (error) {
      // If Perplexity fails, return GPT-enhanced content
      console.log('Perplexity enhancement failed, using GPT-enhanced content');
      return gptEnhanced;
    }
  }

  /**
   * Process presentation content in different modes
   * @param {Object} data - Extracted presentation data
   * @param {string} mode - Processing mode (overview, per-slide, summary)
   * @returns {Promise<Object>} - Processed content
   */
  async process(data, mode) {
    const cacheKey = `${data.metadata.title}_${mode}`;
    const cachedResult = cache.get(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }

    try {
      let result;
      
      switch (mode) {
        case 'overview':
          // Deep dive overview of the entire presentation
          const overviewPrompt = this.generateOverviewPrompt(data.slides);
          const gptOverview = await this.processWithGPT(overviewPrompt);
          result = await this.enhanceContent(gptOverview);
          break;

        case 'per-slide':
          // Process each slide individually
          result = await Promise.all(data.slides.map(async (slide) => {
            const slidePrompt = this.generateSlidePrompt(slide);
            const gptContent = await this.processWithGPT(slidePrompt);
            const enhanced = await this.enhanceContent(gptContent);
            return {
              slideNumber: slide.number,
              content: enhanced
            };
          }));
          break;

        case 'summary':
          // Generate concise summary
          const summaryPrompt = this.generateSummaryPrompt(data.slides);
          const gptSummary = await this.processWithGPT(summaryPrompt);
          result = await this.enhanceContent(gptSummary);
          break;

        case 'dual':
          result = await this.generateDualNarration(data);
          break;

        default:
          throw new Error(`Invalid processing mode: ${mode}`);
      }

      // Cache the result
      cache.set(cacheKey, result);
      return result;

    } catch (error) {
      throw new Error(`Content processing failed: ${error.message}`);
    }
  }

  /**
   * Generate prompts for different processing modes
   */
  generateOverviewPrompt(slides) {
    return `Create an engaging deep-dive discussion covering this presentation:
${JSON.stringify(slides, null, 2)}

Focus on:
1. Natural conversational flow
2. Clear explanations with examples
3. Logical transitions between topics
4. Engaging delivery style
5. Key insights and takeaways`;
  }

  generateSlidePrompt(slide) {
    return `Convert this slide into an engaging spoken explanation:
${JSON.stringify(slide, null, 2)}

Include:
1. Natural introduction
2. Clear explanation of concepts
3. Relevant examples
4. Connection to overall context
5. Key points to remember`;
  }

  generateSummaryPrompt(slides) {
    return `Create a concise summary of this presentation:
${JSON.stringify(slides, null, 2)}

Include:
1. Brief overview (2-3 sentences)
2. Main topics covered
3. Key takeaways
4. Essential points for quick review`;
  }

  async generateOverview(content) {
    const prompt = `Create an engaging audio overview of this presentation:

Title: ${content.metadata.title}
Total Slides: ${content.metadata.totalSlides}

Content:
${content.slides.map(slide => `Slide ${slide.slideNumber}:
${slide.content}`).join('\n\n')}

Please create a natural, conversational overview that:
1. Introduces the topic engagingly
2. Covers the main points in a logical flow
3. Provides relevant examples and context
4. Concludes with key takeaways
5. Uses clear language suitable for audio narration`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: "You are an expert at creating engaging audio content from presentations. Your output should be natural and conversational, perfect for text-to-speech narration." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    return response.choices[0].message.content;
  }

  async generatePerSlideContent(content) {
    const processedSlides = await Promise.all(content.slides.map(async (slide) => {
      const prompt = `Create an engaging audio narration for this presentation slide:

Slide ${slide.slideNumber}:
${slide.content}

Please create:
1. A natural, conversational explanation
2. Include relevant examples or context
3. Make it engaging and easy to follow
4. Use clear language suitable for audio narration
5. Keep it concise but informative`;

      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: "You are an expert at creating engaging audio content from presentation slides. Your output should be natural and conversational, perfect for text-to-speech narration." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return {
        slideNumber: slide.slideNumber,
        content: response.choices[0].message.content
      };
    }));

    return processedSlides;
  }

  async generateDualNarration(content) {
    const prompt = `Create a dual-narrator script for this presentation:

Title: ${content.metadata.title}
Total Slides: ${content.metadata.totalSlides}

Content:
${content.slides.map(slide => `Slide ${slide.slideNumber}:
${slide.content}`).join('\n\n')}

Create a conversational script between a Narrator and an Expert that:
1. Flows naturally like a discussion
2. Narrator introduces topics and guides the conversation
3. Expert provides deeper insights and explanations
4. Includes clear speaker labels (Narrator: or Expert:)
5. Makes complex topics accessible and engaging

Format the output as:
Narrator: [Introduction]
Expert: [Response/Insight]
[Continue alternating throughout]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: "You are an expert at creating engaging dual-narrator scripts from presentations. Your output should be a natural conversation between a narrator and an expert, perfect for text-to-speech narration." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2500
    });

    return response.choices[0].message.content;
  }
}
