"use server";

import { Resend } from 'resend';

// NOTE: You must add RESEND_API_KEY to your .env.local
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReceiptEmail({
  email,
  orderId,
  customerName,
  items,
  total,
  restaurantName
}: {
  email: string;
  orderId: string;
  customerName: string;
  items: any[];
  total: number;
  restaurantName: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is missing in environment variables!");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Bhojan POS <onboarding@resend.dev>', // You can change this to your verified domain later
      to: [email],
      subject: `Your Receipt from ${restaurantName} - #${orderId.slice(0, 8)}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h1 style="color: #000; margin-bottom: 0;">${restaurantName}</h1>
          <p style="color: #666; font-size: 14px; margin-top: 5px;">Digital Receipt</p>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          
          <div style="margin-bottom: 20px;">
            <p><strong>Hi ${customerName},</strong></p>
            <p>Thank you for dining with us! Here is your bill summary:</p>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 10px; border-bottom: 1px solid #eee;">Item</th>
                <th style="text-align: center; padding: 10px; border-bottom: 1px solid #eee;">Qty</th>
                <th style="text-align: right; padding: 10px; border-bottom: 1px solid #eee;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #f9f9f9;">${item.menu_items?.name || 'Dish'}</td>
                  <td style="padding: 10px; border-bottom: 1px solid #f9f9f9; text-align: center;">${item.quantity}</td>
                  <td style="padding: 10px; border-bottom: 1px solid #f9f9f9; text-align: right;">₹${item.total_price}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="text-align: right; margin-top: 20px;">
            <p style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">Total Paid: ₹${total}</p>
            <p style="color: #888; font-size: 12px;">Order ID: ${orderId}</p>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          
          <p style="text-align: center; color: #aaa; font-size: 12px;">
            Powered by Bhojan POS Suite
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("RESEND ERROR:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error("EMAIL SEND FATAL ERROR:", err);
    return { success: false, error: err.message };
  }
}
