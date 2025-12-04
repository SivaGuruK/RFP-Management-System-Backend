import axios from "axios";
import logger from "@/utils/logger";

interface RFPItem {
  name: string;
  quantity: number;
  specifications: string;
}

interface RFPResponse {
  title: string;
  budget: number;
  items: RFPItem[];
  deliveryTimeline: string;
  paymentTerms: string;
  warrantyRequired: string;
}

class AIService {
  async generateRFP(description: string): Promise<RFPResponse> {
    try {
      const prompt = `
You are an RFP expert. Convert the following procurement requirement
into a clean JSON structure. Return ONLY valid JSON — no explanation.

Description:
"${description}"

JSON structure:
{
  "title": "",
  "budget": number,
  "items": [
    { "name": "", "quantity": number, "specifications": "" }
  ],
  "deliveryTimeline": "",
  "paymentTerms": "",
  "warrantyRequired": ""
}
`;

      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "amazon/nova-2-lite-v1:free",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      let content = response.data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("Empty response from model");
      }
      content = content.replace(/```(json)?/g, "").trim();

      const parsed: RFPResponse = JSON.parse(content);

      logger.info("RFP generated successfully");
      return parsed;

    } catch (error: any) {
      logger.error("Error generating RFP:", error.message || error);
      throw new Error("Failed to generate RFP with AI");
    }
  }
}

export default new AIService();
