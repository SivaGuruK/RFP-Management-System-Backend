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

interface ProposalParseResult {
  price: number;
  deliveryTime: string;
  warranty: string;
  terms: string;
  extracted: any;
}

interface ProposalScore {
  proposalId: string;
  vendorId: string;
  vendorName: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  priceScore: number;
  deliveryScore: number;
  warrantyScore: number;
  valueScore: number;
}

interface ComparisonResult {
  topVendor: string;
  topVendorId: string;
  reasoning: string;
  scores: ProposalScore[];
}

class AIService {
  // Generate RFP from natural language description

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

  // Parse vendor email response into structured proposal

  async parseProposal(emailBody: string, rfpContext: any): Promise<ProposalParseResult> {
    try {
      const prompt = `
You are parsing a vendor's email response to an RFP. 

RFP Context:
- Title: ${rfpContext.title}
- Budget: $${rfpContext.budget}
- Items: ${JSON.stringify(rfpContext.items)}
- Required Delivery: ${rfpContext.deliveryTimeline}
- Required Warranty: ${rfpContext.warrantyRequired}

Vendor's Email Response:
"${emailBody}"

Extract and return JSON with:
- price: number (total price quoted, extract from email)
- deliveryTime: string (e.g., "25 days", "3 weeks")
- warranty: string (warranty terms offered)
- terms: string (any additional terms or conditions mentioned)
- extracted: object (any other relevant details like item breakdown, special offers, etc.)

IMPORTANT:
- If price is not clearly stated, try to calculate from item breakdowns
- If information is missing, use "Not specified" for strings and 0 for price
- Be precise with numbers
- Return ONLY valid JSON, no explanation or markdown
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

      const result: ProposalParseResult = JSON.parse(content);
      logger.info("Proposal parsed successfully via AI");
      return result;
    } catch (error: any) {
      logger.error("Error parsing proposal:", error.message || error);
      throw new Error("Failed to parse proposal with AI");
    }
  }

  // Compare proposals and generate recommendations with scores

  async compareProposals(rfp: any, proposals: any[]): Promise<ComparisonResult> {
    try {
      const proposalsData = proposals.map((p) => ({
        proposalId: p._id,
        vendorId: p.vendorId._id || p.vendorId,
        vendorName: p.vendorId.name || "Unknown",
        price: p.price,
        delivery: p.deliveryTime,
        warranty: p.warranty,
        terms: p.terms || "Not specified",
      }));

      const prompt = `
You are evaluating vendor proposals for an RFP. Provide detailed analysis and scoring.

RFP Details:
- Title: ${rfp.title}
- Budget: $${rfp.budget}
- Required Delivery: ${rfp.deliveryTimeline}
- Required Warranty: ${rfp.warrantyRequired}

Proposals:
${JSON.stringify(proposalsData, null, 2)}

Analyze and return JSON with:
{
  "topVendor": "vendor name of best choice",
  "topVendorId": "vendorId of best choice",
  "reasoning": "2-3 sentence explanation of why this vendor is recommended",
  "scores": [
    {
      "proposalId": "proposal ID",
      "vendorId": "vendor ID",
      "vendorName": "vendor name",
      "score": number (0-100),
      "strengths": ["strength 1", "strength 2", "strength 3"],
      "weaknesses": ["weakness 1", "weakness 2"],
      "priceScore": number (0-40),
      "deliveryScore": number (0-30),
      "warrantyScore": number (0-20),
      "valueScore": number (0-10)
    }
  ]
}

Scoring criteria:
- Price competitiveness (40 points): How close to budget, value for money
- Delivery time (30 points): Meets timeline, faster is better
- Warranty terms (20 points): Exceeds requirements, longer is better
- Overall value (10 points): Additional benefits, terms, reliability

Be objective and data-driven in your analysis.
Return ONLY valid JSON, no explanation or markdown.
`;

      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "amazon/nova-2-lite-v1:free",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
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

      const result: ComparisonResult = JSON.parse(content);
      logger.info("Proposals compared successfully via AI");
      return result;
    } catch (error: any) {
      logger.error("Error comparing proposals:", error.message || error);
      throw new Error("Failed to compare proposals with AI");
    }
  }
}

export default new AIService();