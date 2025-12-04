import nodemailer from 'nodemailer';
import logger from '@/utils/logger';
import { IRFP, IVendor } from '../types';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    this.transporter.verify((error) => {
      if (error) {
        logger.error('SMTP connection error:', error);
      } else {
        logger.info('SMTP server is ready to send emails');
      }
    });
  }

  //Send RFP to vendor via email

  async sendRFP(rfp: IRFP, vendor: IVendor): Promise<boolean> {
    try {
      const emailBody = this.formatRFPEmail(rfp);

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: vendor.email,
        subject: `RFP: ${rfp.title}`,
        html: emailBody,
        text: this.stripHtml(emailBody)
      });

      logger.info(`RFP sent to ${vendor.email}, MessageID: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error(`Error sending RFP to ${vendor.email}:`, error);
      return false;
    }
  }

  // Send RFP to multiple vendors

  async sendRFPToMultipleVendors(rfp: IRFP, vendors: IVendor[]): Promise<{
    success: string[];
    failed: string[];
  }> {
    const results = {
      success: [] as string[],
      failed: [] as string[]
    };

    for (const vendor of vendors) {
      const sent = await this.sendRFP(rfp, vendor);
      if (sent) {
        results.success.push(vendor.email);
      } else {
        results.failed.push(vendor.email);
      }
    }

    return results;
  }

  // Format RFP as HTML email

  private formatRFPEmail(rfp: IRFP): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .item { background-color: white; padding: 12px; margin: 8px 0; border-radius: 4px; border-left: 4px solid #2563eb; }
          .terms { background-color: white; padding: 15px; margin-top: 20px; border-radius: 4px; }
          .footer { background-color: #374151; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; }
          h2 { margin: 0; }
          .label { font-weight: bold; color: #1f2937; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Request for Proposal</h2>
            <p style="margin: 5px 0 0 0;">${rfp.title}</p>
          </div>
          
          <div class="content">
            <p><strong>Description:</strong></p>
            <p>${rfp.description}</p>
            
            <h3 style="color: #1f2937; margin-top: 25px;">Requirements:</h3>
            ${rfp.items.map(item => `
              <div class="item">
                <div><span class="label">Item:</span> ${item.name}</div>
                <div><span class="label">Quantity:</span> ${item.quantity}</div>
                <div><span class="label">Specifications:</span> ${item.specifications}</div>
              </div>
            `).join('')}
            
            <div class="terms">
              <h3 style="color: #1f2937; margin-top: 0;">Terms & Conditions:</h3>
              <p><span class="label">Total Budget:</span> $${rfp.budget.toLocaleString()}</p>
              <p><span class="label">Delivery Timeline:</span> ${rfp.deliveryTimeline}</p>
              <p><span class="label">Payment Terms:</span> ${rfp.paymentTerms}</p>
              <p><span class="label">Warranty Required:</span> ${rfp.warrantyRequired}</p>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background-color: #dbeafe; border-radius: 4px;">
              <p style="margin: 0;"><strong>How to Respond:</strong></p>
              <p style="margin: 5px 0 0 0;">Please reply to this email with your proposal including:</p>
              <ul style="margin: 10px 0 0 0;">
                <li>Total pricing breakdown</li>
                <li>Delivery timeline</li>
                <li>Warranty terms</li>
                <li>Any additional terms or conditions</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p style="margin: 0;">RFP Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Strip HTML tags for plain text version

  private stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gs, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export default new EmailService();