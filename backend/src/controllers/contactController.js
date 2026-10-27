import { sendContactMessage, validateContactMessage } from '../services/contactMail.js';

export async function submitContact(req, res, next) {
    const result = validateContactMessage(req.body || {});
    if (!result.ok) {
        return res.status(400).json({ message: result.message });
    }

    if (result.honeypotFilled) {
        return res.status(202).json({ ok: true, message: 'Recibimos tu consulta.' });
    }

    try {
        await sendContactMessage(result.message);
        return res.status(202).json({ ok: true, message: 'Recibimos tu consulta. Gracias por escribir.' });
    } catch (error) {
        return next(error);
    }
}