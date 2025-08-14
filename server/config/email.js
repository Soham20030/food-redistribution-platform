// server/config/email.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter for sending emails - FIX: Use createTransport (not createTransporter)
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use other services like Outlook, Yahoo, etc.
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // Use App Password for Gmail
    }
});

// Email templates
export const emailTemplates = {
    // When organization claims food
    foodClaimed: (restaurantName, organizationName, foodTitle, claimDetails) => ({
        subject: `🍽️ New Food Claim - ${foodTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c5282;">New Food Claim Received!</h2>
                <p>Hello <strong>${restaurantName}</strong>,</p>
                <p><strong>${organizationName}</strong> has claimed your food listing:</p>
                
                <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #2d3748; margin-top: 0;">${foodTitle}</h3>
                    <p><strong>Quantity Claimed:</strong> ${claimDetails.claimed_quantity} ${claimDetails.unit}</p>
                    <p><strong>Pickup Time:</strong> ${new Date(claimDetails.pickup_scheduled_time).toLocaleString()}</p>
                    ${claimDetails.notes ? `<p><strong>Notes:</strong> ${claimDetails.notes}</p>` : ''}
                </div>
                
                <p>Please log in to your dashboard to approve or reject this claim.</p>
                <p style="color: #718096; font-size: 14px;">Thank you for helping reduce food waste! 🌱</p>
            </div>
        `
    }),

    // When restaurant approves claim
    claimApproved: (organizationName, restaurantName, foodTitle, claimDetails) => ({
        subject: `✅ Food Claim Approved - ${foodTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #38a169;">Claim Approved! 🎉</h2>
                <p>Hello <strong>${organizationName}</strong>,</p>
                <p>Great news! <strong>${restaurantName}</strong> has approved your food claim:</p>
                
                <div style="background-color: #f0fff4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #38a169;">
                    <h3 style="color: #2d3748; margin-top: 0;">${foodTitle}</h3>
                    <p><strong>Pickup Time:</strong> ${new Date(claimDetails.pickup_scheduled_time).toLocaleString()}</p>
                    <p><strong>Quantity:</strong> ${claimDetails.claimed_quantity} ${claimDetails.unit}</p>
                    <p><strong>Restaurant Address:</strong> ${claimDetails.restaurant_address}</p>
                    <p><strong>Restaurant Phone:</strong> ${claimDetails.restaurant_phone}</p>
                </div>
                
                <p>Please arrive at the scheduled pickup time. Contact the restaurant if you need to make any changes.</p>
                <p style="color: #718096; font-size: 14px;">Together, we're making a difference! 🌱</p>
            </div>
        `
    }),

    // When restaurant rejects claim
    claimRejected: (organizationName, restaurantName, foodTitle, reason) => ({
        subject: `❌ Food Claim Update - ${foodTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #e53e3e;">Claim Update</h2>
                <p>Hello <strong>${organizationName}</strong>,</p>
                <p>Unfortunately, <strong>${restaurantName}</strong> was unable to approve your claim for:</p>
                
                <div style="background-color: #fed7d7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e53e3e;">
                    <h3 style="color: #2d3748; margin-top: 0;">${foodTitle}</h3>
                    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
                </div>
                
                <p>Don't worry! There are many other food listings available. Check out our platform for more opportunities.</p>
                <p style="color: #718096; font-size: 14px;">Keep up the great work! 🌱</p>
            </div>
        `
    })
};

// Function to send email
export const sendEmail = async (to, template) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: template.subject,
            html: template.html
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('📧 Email sent successfully:', result.messageId);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        return { success: false, error: error.message };
    }
};

export default transporter;
