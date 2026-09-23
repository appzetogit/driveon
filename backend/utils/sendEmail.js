import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    // Create a transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail', // You can use other services
        auth: {
            user: 'sagar.kiaan12@gmail.com', // Dynamic credentials as requested
            pass: 'rovf rizp xpyu izhr',    // App Password
        },
        tls: {
            rejectUnauthorized: false // Fix for "self-signed certificate" error
        }
    });

    // Define email options
    const mailOptions = {
        from: '"DriveOn Support" <sagar.kiaan12@gmail.com>',
        to: options.email,
        subject: options.subject,
        html: options.html || options.message, // Support HTML or text
    };

    // Send email
    await transporter.sendMail(mailOptions);
};

export default sendEmail;
