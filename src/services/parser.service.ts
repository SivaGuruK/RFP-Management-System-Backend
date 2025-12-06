import aiService from './ai.service';
import RFPModel from '../models/RFP.model';
import VendorModel from '../models/Vendor.model';
import EmailModel from '../models/Email.model';
import logger from '../utils/logger';
import ProposalModel from '@/models/Proposal.model';

class ParserService {

  // CLEAN EMAIL

  private cleanEmail(raw: string): string {
    if (!raw) return "";
    const match = raw.match(/<([^>]+)>/);
    if (match) return match[1].toLowerCase().trim();
    return raw.toLowerCase().trim();
  }

  //  CLEAN SUBJECT TO EXTRACT TITLE

  private extractTitleFromSubject(subject: string): string {
    if (!subject) return "";

    return subject
      .replace(/re:/gi, "")
      .replace(/fw:/gi, "")
      .replace(/fwd:/gi, "")
      .replace(/proposal/gi, "")
      .replace(/quote/gi, "")
      .replace(/response/gi, "")
      .replace(/rfp/gi, "")
      .replace(/[-–_|]/g, " ")
      .trim();
  }

  //  Main parser entry

  async parseEmailAndCreateProposal(emailData: {
    from: string;
    to: string;
    subject: string;
    body: string;
    receivedAt: Date;
  }) {
    let vendor = null;
    let rfp = null;
    let proposal = null;

    try {
      // FIND VENDOR
 
      const cleanVendorEmail = this.cleanEmail(emailData.from);

      vendor = await VendorModel.findOne({ email: cleanVendorEmail });
      if (!vendor) {
        logger.warn(`Unknown vendor email → ${cleanVendorEmail}`);
      }

      // FIND RELATED RFP
      if (vendor) {
        rfp = await this.findRelatedRFP(emailData.subject, vendor._id.toString());

        if (!rfp) {
          logger.warn(`NO RFP matched for vendor ${vendor.email} | subject: ${emailData.subject}`);
        }
      }

      // PARSE PROPOSAL 

      let parsedData = null;

      if (vendor && rfp) {
        parsedData = await aiService.parseProposal(emailData.body, rfp);

        const existingProposal = await ProposalModel.findOne({
          rfpId: rfp._id,
          vendorId: vendor._id
        });

        if (existingProposal) {
          existingProposal.price = parsedData.price;
          existingProposal.deliveryTime = parsedData.deliveryTime;
          existingProposal.warranty = parsedData.warranty;
          existingProposal.terms = parsedData.terms;
          existingProposal.parsedData = parsedData.extracted;
          existingProposal.status = "parsed";
          existingProposal.receivedDate = emailData.receivedAt;
          proposal = await existingProposal.save();

          logger.info(`✔ Updated existing proposal ${proposal._id}`);
        } else {
          proposal = new ProposalModel({
            rfpId: rfp._id,
            vendorId: vendor._id,
            price: parsedData.price,
            deliveryTime: parsedData.deliveryTime,
            warranty: parsedData.warranty,
            terms: parsedData.terms,
            parsedData: parsedData.extracted,
            status: "parsed",
            receivedDate: emailData.receivedAt
          });

          await proposal.save();
          logger.info(`✔ Created new proposal ${proposal._id}`);
        }

        // Mark RFP as "responses"
        if (rfp.status === "sent") {
          rfp.status = "responses";
          await rfp.save();
        }

        // Track vendor usage
        vendor.responsesReceived += 1;
        await vendor.save();
      }

      // SAVE EMAIL ALWAYS
      const email = new EmailModel({
        rfpId: rfp?._id || null,
        vendorId: vendor?._id || null,
        from: this.cleanEmail(emailData.from),
        to: this.cleanEmail(emailData.to),
        subject: emailData.subject,
        body: emailData.body,
        direction: "inbound",
        status: parsedData ? "parsed" : "received",
        parsedProposalId: proposal?._id || null,
        receivedAt: emailData.receivedAt
      });

      await email.save();

      logger.info(
        `Email saved | vendor: ${vendor ? vendor.email : "UNKNOWN"} | rfp: ${rfp ? rfp.title : "NONE"}`
      );

      return proposal;
    } catch (error) {
      logger.error("Error in parseEmailAndCreateProposal:", error);
      return null;
    }
  }

  //Match Email Subject → RFP
  private async findRelatedRFP(subject: string, vendorId: string) {
    try {
      const cleaned = this.extractTitleFromSubject(subject);

      if (cleaned.length > 2) {
        const rfp = await RFPModel.findOne({
          title: { $regex: cleaned, $options: "i" },
          vendorsSent: vendorId,
          status: { $in: ["sent", "responses"] }
        });

        if (rfp) return rfp;
      }

      return await RFPModel.findOne({
        vendorsSent: vendorId,
        status: { $in: ["sent", "responses"] }
      }).sort({ updatedAt: -1 });

    } catch (error) {
      logger.error("❌ Error finding related RFP:", error);
      return null;
    }
  }

  //  Manual email -> parse again
  
  async manuallyParseEmail(emailId: string) {
    const email = await EmailModel.findById(emailId)
      .populate("rfpId")
      .populate("vendorId");

    if (!email) throw new Error("Email not found");
    if (email.direction !== "inbound") throw new Error("Can only parse inbound emails");

    const emailData = {
      from: email.from,
      to: email.to,
      subject: email.subject,
      body: email.body,
      receivedAt: email.receivedAt || new Date()
    };

    return await this.parseEmailAndCreateProposal(emailData);
  }
}

export default new ParserService();
