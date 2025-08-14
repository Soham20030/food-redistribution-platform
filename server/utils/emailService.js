// server/utils/emailService.js
import { sendEmail, emailTemplates } from '../config/email.js';
import pool from '../config/database.js';

export const notifyFoodClaimed = async (claimId) => {
    try {
        // Get claim details with restaurant and organization info
        const result = await pool.query(`
            SELECT fc.*, fl.title, fl.unit,
                   r.name as restaurant_name, r.address as restaurant_address, r.phone as restaurant_phone,
                   ru.email as restaurant_email, ru.first_name as restaurant_first_name,
                   o.name as organization_name,
                   ou.email as organization_email, ou.first_name as organization_first_name
            FROM food_claims fc
            JOIN food_listings fl ON fc.food_listing_id = fl.id
            JOIN restaurants r ON fl.restaurant_id = r.id
            JOIN users ru ON r.user_id = ru.id
            JOIN organizations o ON fc.organization_id = o.id
            JOIN users ou ON o.user_id = ou.id
            WHERE fc.id = $1
        `, [claimId]);

        if (result.rows.length === 0) return;

        const claim = result.rows[0];
        
        const template = emailTemplates.foodClaimed(
            claim.restaurant_name,
            claim.organization_name,
            claim.title,
            {
                claimed_quantity: claim.claimed_quantity,
                unit: claim.unit,
                pickup_scheduled_time: claim.pickup_scheduled_time,
                notes: claim.notes
            }
        );

        await sendEmail(claim.restaurant_email, template);
        
    } catch (error) {
        console.error('Error sending food claimed notification:', error);
    }
};

export const notifyClaimStatusUpdate = async (claimId, status, notes) => {
    try {
        const result = await pool.query(`
            SELECT fc.*, fl.title, fl.unit,
                   r.name as restaurant_name, r.address as restaurant_address, r.phone as restaurant_phone,
                   ru.email as restaurant_email,
                   o.name as organization_name,
                   ou.email as organization_email
            FROM food_claims fc
            JOIN food_listings fl ON fc.food_listing_id = fl.id
            JOIN restaurants r ON fl.restaurant_id = r.id
            JOIN users ru ON r.user_id = ru.id
            JOIN organizations o ON fc.organization_id = o.id
            JOIN users ou ON o.user_id = ou.id
            WHERE fc.id = $1
        `, [claimId]);

        if (result.rows.length === 0) return;

        const claim = result.rows[0];
        let template;

        if (status === 'approved') {
            template = emailTemplates.claimApproved(
                claim.organization_name,
                claim.restaurant_name,
                claim.title,
                {
                    claimed_quantity: claim.claimed_quantity,
                    unit: claim.unit,
                    pickup_scheduled_time: claim.pickup_scheduled_time,
                    restaurant_address: claim.restaurant_address,
                    restaurant_phone: claim.restaurant_phone
                }
            );
        } else if (status === 'rejected') {
            template = emailTemplates.claimRejected(
                claim.organization_name,
                claim.restaurant_name,
                claim.title,
                notes
            );
        }

        if (template) {
            await sendEmail(claim.organization_email, template);
        }
        
    } catch (error) {
        console.error('Error sending claim status update notification:', error);
    }
};
