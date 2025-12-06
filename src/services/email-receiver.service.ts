import Imap from 'imap';
import { simpleParser } from 'mailparser';
import logger from '@/utils/logger';
import parserService from './parser.service';

class EmailReceiverService {
  private imap: Imap | null = null;
  private isConnected = false;
  private pollInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private processedMessageIds: Set<string> = new Set();

  constructor() {
    this.initIMAP();
  }

  private initIMAP() {
    this.imap = new Imap({
      user: process.env.IMAP_USER || process.env.SMTP_USER || '',
      password: process.env.IMAP_PASS || process.env.SMTP_PASS || '',
      host: process.env.IMAP_HOST || 'imap.gmail.com',
      port: parseInt(process.env.IMAP_PORT || '993'),
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.imap) return;

    this.imap.once('ready', () => {
      logger.info('IMAP connected');
      this.isConnected = true;
      this.openInbox();
    });

    this.imap.once('error', (err: any) => {
      logger.error('IMAP error:', err);
      this.isConnected = false;
      this.safeDisconnect();
      this.scheduleReconnect();
    });

    this.imap.once('end', () => {
      logger.warn('IMAP ended');
      this.isConnected = false;
      this.scheduleReconnect();
    });
  }

  private scheduleReconnect(delay = 5000) {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = setTimeout(() => {
      logger.info('Reconnecting IMAP...');
      this.reconnectTimeout = null;
      this.connect();
    }, delay);
  }

  private openInbox() {
    if (!this.imap) return;

    this.imap.openBox('INBOX', false, (err) => {
      if (err) logger.error('Inbox open error:', err);
      else logger.info('Inbox opened');
    });
  }

  startPolling(intervalMs: number = 30000) {
    if (this.pollInterval) return;
    logger.info(`Polling emails every ${intervalMs / 1000}s`);

    this.checkForNewEmails();
    this.pollInterval = setInterval(() => this.checkForNewEmails(), intervalMs);
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      logger.info('Polling stopped');
    }
  }

  connect() {
    if (!this.imap || this.isConnected) return;
    logger.info('Connecting IMAP...');
    this.imap.connect();
  }

  disconnect() {
    this.stopPolling();
    this.safeDisconnect();
  }

  private safeDisconnect() {
    try {
      if (this.imap && this.isConnected) {
        this.imap.closeBox(true, () => {
          this.imap?.end();
          this.isConnected = false;
          logger.info('IMAP disconnected cleanly');
        });
      }
    } catch (err) {
      logger.error('Error during IMAP disconnect:', err);
    }
  }

  private extractAddress(field: any): string {
    if (!field) return '';
    if (field.text) return field.text;
    if (field.value && Array.isArray(field.value) && field.value.length > 0) {
      return field.value[0].address || '';
    }
    if (Array.isArray(field) && field.length > 0) {
      return field[0].address || field[0].text || '';
    }
    return '';
  }

  private async checkForNewEmails() {
    if (!this.imap || !this.isConnected) {
      logger.warn('IMAP not connected — will reconnect');
      this.connect();
      return;
    }

    try {
      const sinceDate = new Date('2025-12-05');
      const day = sinceDate.getDate();
      const month = sinceDate.getMonth();
      const year = sinceDate.getFullYear();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const imapDateStr = `${day}-${monthNames[month]}-${year}`;

      this.imap.search([['SINCE', imapDateStr]], (err: Error | null, results: number[]) => {
        if (err) return logger.error('Search error:', err);
        if (!results || results.length === 0) {
          return logger.debug('No emails since Dec 5, 2025');
        }

        logger.info(`Found ${results.length} email(s) since ${imapDateStr}`);

        const fetch = this.imap!.fetch(results, {
          bodies: ['HEADER.FIELDS (MESSAGE-ID)', ''],
          markSeen: false
        });

        fetch.on('message', (msg: any, seqno: number) => {
          let messageId = '';
          let bodyStream: any = null;

          msg.on('body', (stream: any, info: any) => {
            if (info.which === 'HEADER.FIELDS (MESSAGE-ID)') {
              let buffer = '';
              stream.on('data', (chunk: any) => {
                buffer += chunk.toString('utf8');
              });
              stream.once('end', () => {
                const match = buffer.match(/Message-ID:\s*<?([^>\s]+)>?/i);
                if (match) {
                  messageId = match[1].trim();
                }
              });
            } else {
              bodyStream = stream;
            }
          });

          msg.once('end', async () => {
            if (messageId && this.processedMessageIds.has(messageId)) {
              logger.debug(`Skipping already processed email: ${messageId}`);
              return;
            }
            if (bodyStream) {
              await this.processEmailStream(bodyStream, messageId);
            }
          });
        });

        fetch.once('error', (err: Error) => logger.error('Fetch error:', err));
        fetch.once('end', () => logger.info('Finished checking emails'));
      });
    } catch (error) {
      logger.error('checkForNewEmails error:', error);
    }
  }

  private async processEmailStream(stream: any, messageId: string) {
    try {
      const parsed = await simpleParser(stream);
      
      const finalMessageId = messageId || parsed.messageId || '';
      
      if (finalMessageId && this.processedMessageIds.has(finalMessageId)) {
        logger.debug(`Email already processed: ${finalMessageId}`);
        return;
      }

      const emailData = {
        from: this.extractAddress(parsed.from),
        to: this.extractAddress(parsed.to),
        subject: parsed.subject || 'No Subject',
        body: parsed.text || parsed.html || '',
        receivedAt: parsed.date || new Date(),
        messageId: finalMessageId,
      };

      const cutoffDate = new Date('2025-12-05T00:00:00');
      const emailDate = new Date(emailData.receivedAt);
      
      if (emailDate < cutoffDate) {
        logger.debug(`Skipping email from before Dec 5, 2025: ${emailData.subject}`);
        return;
      }

      logger.info(`Email received → From: ${emailData.from} | Sub: ${emailData.subject}`);

      if (this.isVendorResponse(emailData.subject)) {
        await parserService.parseEmailAndCreateProposal(emailData);
        logger.info(`Vendor response processed (${emailData.from})`);
        
        if (finalMessageId) {
          this.processedMessageIds.add(finalMessageId);
          logger.debug(`Marked as processed: ${finalMessageId}`);
        }
      } else {
        logger.info('Ignoring non-RFP email');
        if (finalMessageId) {
          this.processedMessageIds.add(finalMessageId);
        }
      }
    } catch (error) {
      logger.error('processEmailStream error:', error);
    }
  }

  private isVendorResponse(subject: string) {
    const patterns = [/rfp/i, /re:/i, /proposal/i, /quote/i, /response/i];
    return patterns.some((p) => p.test(subject));
  }

  async checkNow() {
    logger.info('Manual check triggered');
    if (!this.isConnected) this.connect();
    setTimeout(() => this.checkForNewEmails(), 3000);
  }

  clearProcessedIds() {
    this.processedMessageIds.clear();
    logger.info('Cleared processed message IDs');
  }
}

export default new EmailReceiverService();